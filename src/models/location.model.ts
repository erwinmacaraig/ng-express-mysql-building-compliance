
import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
const defs = require('../config/defs.json');

import * as Promise from 'promise';

export class Location extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `
                SELECT 
                l.*,
                IF(p.is_building = 1, 1, 0) parent_is_building,
                IF( ( SELECT COUNT(c.location_id) as count FROM locations c WHERE c.parent_id = l.location_id AND c.is_building = 1  ) > 0, 1, 0 ) as has_child_building
                FROM locations l 
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE l.location_id = ? `; 
            const uid = [this.id];
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, uid, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    if(!results.length){
                        reject('Location not found');
                    }else{
                        this.dbData = results[0];
                        this.setID(results[0]['location_id']);
                        resolve(this.dbData);
                    }
                });

                connection.release();
            });
        });
    }

    public getAllLocations(){
        return new Promise((resolve) => {
            const sql_load = `SELECT * FROM locations WHERE archived = 0 `;
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public getChildren(parentId, call?): Promise<Array<object>> {
        return new Promise((resolve) => {
            const sql_load = `SELECT * FROM locations WHERE parent_id = ? AND archived = 0 `;
            const param = [parentId];
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public getChildrenTenantRelated(parentId, accountId, responsibility?){
        return new Promise((resolve) => {
            let responsibilitSql = (responsibility) ? (responsibility == 'Manager') ? '' : ` AND lar.account_id = ${accountId} AND lar.responsibility = "Tenant" ` : '';
            const sql_load = `
                SELECT
                    l.*
                FROM locations l
                LEFT JOIN location_account_relation lar ON l.location_id = lar.location_id
                WHERE l.parent_id = ${parentId} AND l.archived = 0 ${responsibilitSql} GROUP BY l.location_id
            `;
            const param = [parentId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public countSubLocations(parentId){
        return new Promise((resolve) => {
            const sql_load = `SELECT COUNT(location_id) as count FROM locations WHERE parent_id = ? AND archived = 0 `;
            const param = [parentId];
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }

                    resolve( results[0]['count'] );
                });

                connection.release();
            });
        });
    }

    public getWhere(arrWhere, limit?, count?){
        return new Promise((resolve, reject) => {
            let sql_load = `SELECT * FROM locations `;
            if(count){
                sql_load = 'SELECT COUNT(location_id) as count FROM locations '
            }
            let c = 0;
            for(let i in arrWhere){
                if(c == 0){
                    sql_load += ' WHERE ';
                }else{
                    sql_load += ' AND ';
                }

                sql_load += arrWhere[i];
            }

            if(limit && !count){
                sql_load += ' LIMIT '+limit;
            }

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log(error, sql_load);
                        return false;
                    }
                    for(let i in results){
                        results[i]['sublocations'] = [];
                    }

                    this.dbData = results;
                    resolve(this.dbData);

                });

                connection.release();
            });
        });
    }

    public getParentLocationByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `
            SELECT * FROM locations
            WHERE location_id IN (SELECT location_id FROM location_account_relation WHERE account_id = ?)
            AND archived = 0 AND parent_id = -1
            ORDER BY location_id ASC
            `;
            const param = [accountId];
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    if(!results.length){
                        reject('Location not found');
                    }else{

                        for(let i in results){
                            results[i]['sublocations'] = [];
                        }

                        this.dbData = results;
                        resolve(this.dbData);
                    }

                });

                connection.release();
            });
        });
    }

    public getManyByAccountId(accountId: Number, getChild: Boolean = false) {
        return new Promise((resolve, reject) => {
            const sql_load = `
            SELECT * FROM locations
            WHERE location_id IN (SELECT location_id FROM location_account_relation WHERE account_id = ?)
            AND archived = 0
            ORDER BY location_id ASC
            `;
            const param = [accountId];

            this.pool.getConnection((err, connection) => {

                if(err){
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    for(let i in results){
                        results[i]['sublocations'] = [];
                        if(getChild){
                            this.getChildren(results[i]['location_id']).then(
                                (child) => {
                                    results[i]['sublocations'] = child;
                                    this.dbData = results;
                                    resolve(this.dbData);
                                }
                                );
                        }else{
                            this.dbData = results;
                            resolve(this.dbData);
                        }
                    }

                    this.dbData = results;
                    resolve(this.dbData);
                });

                connection.release();

            });
        });
    }

    public getByInIds(ids, archived?){
        return new Promise((resolve) => {
            if(archived == undefined){
                archived = 0;
            }

            const sql_load = `SELECT * FROM locations WHERE location_id IN (`+ids+`) AND archived = `+archived + ` ORDER BY location_id ASC `;
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public getByUserId(userId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = `
            SELECT
            lau.location_account_user_id,
            l.*
            FROM locations l
            LEFT JOIN location_account_user lau
            ON l.location_id = lau.location_id
            WHERE lau.user_id = ? AND l.archived = 0
            ORDER BY l.location_id ASC
            `;
            const param = [userId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    if(!results.length){
                        reject('Location not found');
                    }else{
                        this.dbData = results;
                        resolve(this.dbData);
                    }
                });

                connection.release();
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {

            const sql_update = `UPDATE locations SET
            parent_id = ?, name = ?, unit = ?, street = ?, city = ?, state = ?,
            postal_code = ?, country = ?, formatted_address = ?,
            lat = ?, lng = ?,time_zone = ?, \`order\` = ?,
            is_building = ?, location_directory_name = ?, archived = ?,
            google_place_id = ?, google_photo_url = ?, admin_verified = ?, admin_verified_date = ?, admin_id = ?,
            online_training = ?
            WHERE location_id = ?`;
            const param = [
            ('parent_id' in this.dbData) ? this.dbData['parent_id'] : 0,
            ('name' in this.dbData) ? this.dbData['name'] : '',
            ('unit' in this.dbData) ? this.dbData['unit'] : ' ',
            ('street' in this.dbData) ? this.dbData['street'] : '',
            ('city' in this.dbData) ? this.dbData['city'] : '',
            ('state' in this.dbData) ? this.dbData['state'] : '',
            ('postal_code' in this.dbData) ? this.dbData['postal_code'] : '',
            ('country' in this.dbData) ? this.dbData['country'] : '',
            ('formatted_address' in this.dbData) ? this.dbData['formatted_address'] : null,
            ('lat' in this.dbData) ? this.dbData['lat'] : null,
            ('lng' in this.dbData) ? this.dbData['lng'] : null,
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('order' in this.dbData) ? this.dbData['order'] : null,
            ('is_building' in this.dbData) ? this.dbData['is_building'] : 0,
            ('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : (this.dbData['name']).replace(/\s/g, ''),
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
            ('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null,
            ('admin_verified' in this.dbData) ? this.dbData['admin_verified'] : 0,
            ('admin_verified_date' in this.dbData) ? this.dbData['admin_verified_date'] : null,
            ('admin_id' in this.dbData) ? this.dbData['admin_id'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            this.ID() ? this.ID() : 0
            ];

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_update, param, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    resolve(true);
                });

                connection.release();
            });

        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO locations (
            parent_id,
            name,
            unit,
            street,
            city,
            state,
            postal_code,
            country,
            formatted_address,
            lat,
            lng,
            time_zone,
            \`order\`,
            is_building,
            location_directory_name,
            archived,
            google_place_id,
            google_photo_url,
            admin_verified,
            admin_verified_date,
            admin_id,
            online_training)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const param = [
            ('parent_id' in this.dbData) ? this.dbData['parent_id'] : 0,
            ('name' in this.dbData) ? this.dbData['name'] : '',
            ('unit' in this.dbData) ? this.dbData['unit'] : '',
            ('street' in this.dbData) ? this.dbData['street'] : '',
            ('city' in this.dbData) ? this.dbData['city'] : '',
            ('state' in this.dbData) ? this.dbData['state'] : '',
            ('postal_code' in this.dbData) ? this.dbData['postal_code'] : '',
            ('country' in this.dbData) ? this.dbData['country'] : '',
            ('formatted_address' in this.dbData) ? this.dbData['formatted_address'] : null,
            ('lat' in this.dbData) ? this.dbData['lat'] : null,
            ('lng' in this.dbData) ? this.dbData['lng'] : null,
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('order' in this.dbData) ? this.dbData['order'] : null,
              ('is_building' in this.dbData) ? this.dbData['is_building'] : 1,
              ('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : (this.dbData['name']).replace(/\s/g, ''),
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
            ('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null,
            ('admin_verified' in this.dbData) ? this.dbData['admin_verified'] : 0,
            ('admin_verified_date' in this.dbData) ? this.dbData['admin_verified_date'] : null,
            ('admin_id' in this.dbData) ? this.dbData['admin_id'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            ];
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_insert, param, (err, results, fields) => {
                    if (err) {
                        console.log(sql_insert);
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['location_id'] = this.id;
                    resolve(true);
                });

                connection.release();
            });
        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
                this.dbData[key] = createData[key];
            }
            if ('location_id' in createData) {
                this.id = createData.location_id;
            }
            resolve(this.write());
        });
    }

    public search(address: string, place_id: string ): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const arrResults = [];
            const sql_search = `SELECT
            parent_id,
            location_id,
            name,
            unit,
            formatted_address,
            google_photo_url,
            is_building
            FROM
            locations
            WHERE
            parent_id = -1
            AND
            formatted_address LIKE '${address}%'
            AND archived = 0
            OR
            google_place_id = ?
            AND archived = 0
            LIMIT 5`;

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_search, [place_id], (err, results, fields) => {
                    if (err) {
                        reject('There was problem processing SQL');
                        console.log(sql_search);
                        throw new Error('Internal Error. Unable to execute query.');
                    }
                    for (let ref of results) {
                        // console.log(ref);
                        if (ref['parent_id'] === -1) {
                            arrResults.push(ref);
                        }
                    }
                    resolve(arrResults);
                });

                connection.release();
            });
        });
    }

    public getDeepLocationsByParentId(parentId){
        return new Promise((resolve) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    console.log('Error gettting pool connection ' + err);
                    throw err;
                }

                const sql_load = `SELECT *
                FROM (SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id) sublocations,
                (SELECT @pi := ('${parentId}')) initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public getDeepLocationsMinimizedDataByParentId(parentId){
        return new Promise((resolve) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    console.log('Error gettting pool connection ' + err);
                    throw err;
                }

                const sql_load = `SELECT location_id, parent_id, name
                FROM (SELECT location_id, parent_id, name FROM locations WHERE archived = 0 ORDER BY parent_id, location_id) sublocations,
                (SELECT @pi := '${parentId}') initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    resolve(results);
                });

                connection.release();
            });
        });
    }

    public getSublocations(user_id?: number, role_id?: number) {
        return new Promise((resolve, reject) => {
            const location: {[key: number]: Array<Object>} = {};
            let parentId = 0;
            let tempArr = [];
            let parents = [];

            let sublocationQuery;
            if (user_id) {
                sublocationQuery = `
                    SELECT locations.* FROM locations
                    INNER JOIN location_account_user ON location_account_user.location_id = locations.location_id
                    AND location_account_user.user_id = ${user_id} AND locations.archived = 0 `;
                if (role_id) {
                    // sublocationQuery = sublocationQuery + `AND location_account_user.role_id = ${role_id}`;
                }
            } else {
                sublocationQuery = `SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id  DESC`;
            }

            // sublocationQuery = `SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id  DESC`;
            const sql_get_subloc = `
            SELECT location_id, name, parent_id, is_building FROM (${sublocationQuery}) sublocations, (SELECT @pv := ?)
            initialisation WHERE find_in_set(parent_id, @pv) > 0 AND @pv := concat(@pv, ',', location_id) ORDER BY location_id;`;

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql_get_subloc, [this.ID()], (err, results, fields) => {
                    if (err) {
                        console.log(sql_get_subloc);
                        throw new Error('Internal error. There was a problem processing your query');
                    }
                    if (results.length) {
                        let newResults = [],
                            unassignedResults = [];

                        for (let i = 0; i < results.length; i++) {
                            unassignedResults.push({
                                'location_id' : results[i]['location_id'],
                                'name' : results[i]['name'],
                                'parent_id' : results[i]['parent_id'],
                                'is_building' : results[i]['is_building'],
                                'children' : []
                            });
                        }

                        for(let i in unassignedResults){
                            for(let x in unassignedResults){
                                if(unassignedResults[i]['parent_id'] == unassignedResults[x]['location_id']){
                                    unassignedResults[x]['children'].push(unassignedResults[i]);
                                }
                            }
                        }

                        for(let i in unassignedResults){
                            if(unassignedResults[i]['parent_id'] == this.ID()){
                                newResults.push(unassignedResults[i]);
                            }
                        }

                        resolve(newResults);
                    } else {
                        resolve([]);
                    }

                });

                connection.release();
            });
        });
    }

    public getParentsChildren(parentId, raw = 1, buildings_only:boolean = false, archived?): any {
        return new Promise((resolve) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    console.log('Error gettting pool connection ' + err);
                    throw err;
                }

                let archiveStr = (archived) ? archived : '0';
                let locationIds = [];
                let sql = `SELECT *
                FROM (SELECT l.*, p.name as parent_name FROM locations l LEFT JOIN locations p ON l.parent_id = p.location_id WHERE l.archived = ${archiveStr} ORDER BY l.parent_id, l.location_id) sublocations,
                (SELECT @pi := ('${parentId}')) initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    if (raw) {
                        resolve(results);
                    } else if (buildings_only) {
                        for (const r of results) {
                            if (parseInt(r['is_building'], 10) === 1) {
                                locationIds.push(r['location_id']);
                            }
                        }
                        resolve(locationIds);
                    } else {
                        for (const r of results) {
                            locationIds.push(r['location_id']);
                        }
                        resolve(locationIds);
                    }
                });

                connection.release();
            });
        });
    }

    public getAncestryIds(sublocId){

        return new Promise((resolve) => {
            let sql = `SELECT @pi as ids FROM ( SELECT * FROM locations WHERE archived = 0 AND location_id <= ${sublocId} ) sublocations ,
                        (SELECT @pi := parent_id FROM locations WHERE location_id = ${sublocId} ) parent
                        WHERE FIND_IN_SET(location_id, @pi) > 0 AND @pi := concat(@pi, ',', parent_id)
                        ORDER BY location_id DESC`;

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                connection.query(sql, (err, results, fields) => {
                    if (err) {
                        console.log(err);
                        throw new Error(err);
                    }

                    if(results.length > 0){
                        resolve([
                            {
                                ids : results[ results.length - 1 ]['ids']
                            }
                        ]);
                    }else{
                        resolve([ {
                            ids : '0'
                        } ]);
                    }
                });

                connection.release();
            });
        });
    }

    public getAncestries(sublocId){

        return new Promise( (resolve) => {
            this.getAncestryIds(sublocId).then((resultsIds) => {

                if(sublocId.length == 0){
                    sublocId = '0';
                }

                let sql = `
                SELECT 
                l.*, 
                IF(p.is_building = 1, 1, 0) parent_is_building,
                IF( ( SELECT COUNT(c.location_id) as count FROM locations c WHERE c.parent_id = l.location_id AND c.is_building = 1  ) > 0, 1, 0 ) as has_child_building 
                FROM locations l 
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE l.location_id IN (` + sublocId + `)`;

                if( resultsIds[0]['ids'].length > 0 ){
                    sql = `
                    SELECT
                    l.*, 
                    IF(p.is_building = 1, 1, 0) parent_is_building,
                    IF( ( SELECT COUNT(c.location_id) as count FROM locations c WHERE c.parent_id = l.location_id AND c.is_building = 1  ) > 0, 1, 0 ) as has_child_building 
                    FROM locations l 
                    LEFT JOIN locations p ON l.parent_id = p.location_id
                    WHERE l.location_id IN (` + sublocId + `,` + resultsIds[0]['ids'] + `)
                    `;
                }

                this.pool.getConnection((err, connection) => {
                    if (err) {                    
                        throw new Error(err);
                    }

                    connection.query(sql, (err, results, fields) => {
                        if (err) {
                            console.log(sql);
                            throw new Error('Internal error. There was a problem processing your query');
                        }

                        resolve(results);
                    });

                    connection.release();
                });
            });
        });
    }

    /**
    *
    * @param em_role_id
    * @param location_id
    * @param role_id
    * the ACCOUNT ROLE ID of the user logged in to the system
    */
    public getEMRolesForThisLocation(em_role_id: number = 0, location_id?: any, role_id: number = 0, isAllLocationIds?, accountId?) {
        return new Promise((resolve, reject) => {
            let location = this.ID();

            let em_role_filter = '';
            let connection;
            let sql;
            let accountClause = '';

            if (location_id) {
              location = location_id;
            }
            if (em_role_id > 0) {
              em_role_filter = ` AND user_em_roles_relation.em_role_id = ${em_role_id}`;
            }
            if (accountId) {
              accountClause = ` AND users.account_id = ${accountId}`;
            }
            let location_em_roles = {};
            let subLocToEmRoles:{[key: number]: {}} = {};
            let resultModification = (results) => {
                for (let i = 0; i < results.length; i++) {
                    if (results[i]['em_role_id'] in location_em_roles) {
                      location_em_roles[results[i]['em_role_id']]['count'] = location_em_roles[results[i]['em_role_id']]['count'] + 1;
                      (location_em_roles[results[i]['em_role_id']]['users']).push(results[i]['user_id']);
                      if ((location_em_roles[results[i]['em_role_id']]['location']).indexOf(results[i]['location_id']) == -1) {
                        (location_em_roles[results[i]['em_role_id']]['location']).push(results[i]['location_id']);
                      }
                      // (location_em_roles[results[i]['em_role_id']][results[i]['location_id']]).push(results[i]['user_id']);
                      let loc = results[i]['location_id'];
                      loc = loc.toString();

                      if (loc in  location_em_roles[results[i]['em_role_id']]) {
                        (location_em_roles[results[i]['em_role_id']][loc]['users']).push(results[i]['user_id']);
                      } else {
                        location_em_roles[results[i]['em_role_id']][loc] = {
                          'users': [],
                          'name': ''
                        }
                        location_em_roles[results[i]['em_role_id']][loc]['users'].push(results[i]['user_id']);
                        location_em_roles[results[i]['em_role_id']][loc]['name'] = results[i]['name']
                      }
                    }
                    else {
                      let keyIndex = results[i]['em_role_id'];
                      let loc = results[i]['location_id'].toString();
                      location_em_roles[keyIndex] = {
                        'name': results[i]['role_name'],
                        'count': 1,
                        'users': [results[i]['user_id']],
                        'location': [results[i]['location_id']]
                      };
                      location_em_roles[results[i]['em_role_id']][loc] = {
                        'users': [],
                        'name': ''
                      }
                      location_em_roles[keyIndex][loc]['users'].push(results[i]['user_id']);
                      location_em_roles[keyIndex][loc]['name'] = results[i]['name']
                    }
                  }
            };

            if (role_id === parseInt(defs['Manager'], 10) ) {
                // FRP SECTION
                if(!isAllLocationIds){
                    this.getParentsChildren(location).then((sublocations) => {

                      this.pool.getConnection((err, connection) => {
                        if (err) {
                            console.log('Error gettting pool connection ' + err);
                            throw err;
                        }

                        const subIds = [location_id];
                        Object.keys(sublocations).forEach((key) => {
                          subIds.push(sublocations[key]['location_id']);
                        });
                        let subIdstring = subIds.join(',');
                        subIdstring = (subIdstring.length == 0) ? '0' : subIdstring;

                        sql = `SELECT
                                user_em_roles_relation.*,
                                em_roles.role_name,
                                locations.name,
                                locations.is_building
                              FROM
                                user_em_roles_relation
                              INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                              INNER JOIN
                                em_roles
                              ON
                                em_roles.em_roles_id = user_em_roles_relation.em_role_id
                              INNER JOIN
                                locations
                              ON
                                locations.location_id = user_em_roles_relation.location_id
                              WHERE
                              users.archived = 0
                              AND user_em_roles_relation.location_id IN (${subIdstring}) ${em_role_filter}
                              ${accountClause}
                              ORDER BY em_role_id
                              `;
                        
                        connection.query(sql, (error, results, fields) => {
                            if (error) {
                                return console.log(error);
                            }
                            if (error) {
                              console.log('location.model.getEMRolesForThisLocation', error, sql);
                              throw new Error('There was an error getting the EM Roles for this location');
                            }
                            if (!results.length) {
                              reject('There are no EM Roles for this location id - ' + location);
                            } else {
                              resultModification(results);
                              resolve(location_em_roles);
                            }
                        });

                        connection.release();
                      });
                    });
                }else{
                    let subIdstring = location_id;
                    sql = `SELECT
                              user_em_roles_relation.*,
                              em_roles.role_name,
                              locations.name,
                              locations.is_building
                            FROM
                              user_em_roles_relation
                            INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                            INNER JOIN
                              em_roles
                            ON
                              em_roles.em_roles_id = user_em_roles_relation.em_role_id
                            INNER JOIN
                              locations
                            ON
                              locations.location_id = user_em_roles_relation.location_id
                            WHERE
                            users.archived = 0
                            AND user_em_roles_relation.location_id IN (${subIdstring}) ${em_role_filter}
                            ${accountClause}
                            ORDER BY em_role_id
                            `;

                    connection = db.createConnection(dbconfig);
                    connection.query(sql, [], (error, results, fields) => {
                    if (error) {
                      console.log('location.model.getEMRolesForThisLocation', error, sql);
                      throw new Error('There was an error getting the EM Roles for this location');
                    }
                    if (!results.length) {
                      reject('There are no EM Roles for this location id - ' + location);
                    } else {
                      resultModification(results);
                      resolve(location_em_roles);
                    }
                    });
                    connection.end();
                }
            } else if(role_id === parseInt(defs['Tenant'], 10) ) {
              sql = `SELECT
                      user_em_roles_relation.*,
                      em_roles.role_name,
                      locations.name,
                      locations.is_building
                    FROM
                      user_em_roles_relation
                    INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                    INNER JOIN
                      em_roles
                    ON
                      em_roles.em_roles_id = user_em_roles_relation.em_role_id
                    INNER JOIN
                      locations
                    ON
                      locations.location_id = user_em_roles_relation.location_id
                    WHERE
                      user_em_roles_relation.location_id IN (${location}) ${em_role_filter}
                    AND users.archived = 0 ${accountClause}
                    ORDER BY em_role_id
                    `;
              connection = db.createConnection(dbconfig);
              connection.query(sql, [], (error, results) => {
                if (error) {
                  return console.log('location.model.getEMRolesForThisLocation', error, sql);
                }
                if (!results.length) {
                  reject('There are no EM Roles for this location id - ' + location);
                } else {

                  resultModification(results);
                  resolve(location_em_roles);
                }
              });
              connection.end();
            } else {
              resolve({});
            }

        });
    }

    /**
    *
    * @param location_id
    * @param role
    * @description
    * get Tenant Responsible Persons(s) given a location
    */
    public getTRPOnLocation(locations = [], role = 0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
          const r = [];
          if (!locations.length) {
            resolve([]);
            return;
          }
          const locationStr = locations.join(',');
          let locId = this.ID();

          const sql = `SELECT
            location_account_user.location_id,
            accounts.account_id,
            user_role_relation.role_id,
            users.first_name,
            users.last_name,
            users.email
          FROM
            location_account_user
          INNER JOIN
            user_role_relation
          ON
            user_role_relation.user_id = location_account_user.user_id
          INNER JOIN
            users
          ON
            users.user_id = location_account_user.user_id
          INNER JOIN accounts ON accounts.account_id = users.account_id
          WHERE
            location_account_user.location_id IN (${locationStr})
          AND
            role_id = ?`;

          const connection = db.createConnection(dbconfig);
          connection.query(sql, [role], (error, results) => {
            if (error) {
              console.log('location.model.getTRPOnLocation',error, sql);
              throw Error('Cannot perform query');
            }
            if (!results.length) {
              resolve([]);
            } else {
              for (let res of results) {
                r.push(res);
              }
              resolve(r);
            }
          });
          connection.end();
        });
    }

    public getTenantAccounts(location = 0): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let locId = this.ID();
        const resultSet = [];
        if (location) {
          locId = location;
        }
        const sql_get_tenant_accounts = `
          SELECT * FROM location_account_relation WHERE location_id = ? AND responsibility = 'Tenant' GROUP BY account_id;
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_tenant_accounts, [locId], (error, results) => {
          if (error) {
            console.log('location.model.getTenantAccouts', error, sql_get_tenant_accounts);
            throw Error('Internal error: Cannot obtain tenant accounts on this location ' + locId);
          }
          for (let r of results) {
            resultSet.push(r);
          }
          resolve(resultSet);
        });
        connection.end();
      });
    }

    public bulkLocationDetails(locations = [], filter = <any> {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        if (locations.length === 0) {
          resolve([]);
          return;
        }
        let offsetLimit = '';

        if ('limit' in filter){
          offsetLimit = 'LIMIT '+filter['limit'];
        }

        if('offset' in filter && 'limit' in filter){
          offsetLimit = 'LIMIT '+filter['offset']+','+filter['limit'];
        }
        let nameSearch = '';
        if('name' in filter && filter['name'].length > 0){
            nameSearch = `AND locations.name LIKE '%${filter['name']}%' `;
        }

        let archivedStr = '';
        if('archived' in filter){
            archivedStr += ` AND locations.archived = ${filter['archived']}`;
        }

        let orderBy = '';
        if('sort' in filter){
            if(filter['sort'] == 'name-asc'){
                orderBy = ' ORDER BY name ASC ';
            }else if(filter['sort'] == 'name-desc'){
                orderBy = ' ORDER BY name DESC ';
            }

        }

        const myLocations = [];
        const locationStr = locations.join(',');
        let sql_details = `SELECT * FROM locations WHERE location_id IN (${locationStr}) ${nameSearch} ${archivedStr} ${orderBy} ${offsetLimit}`;
        if ('count' in filter) {
          sql_details = `SELECT COUNT(location_id) as count FROM locations WHERE location_id IN (${locationStr}) ${nameSearch} ${archivedStr} ${orderBy} `;
        }
        const connection = db.createConnection(dbconfig);
        connection.query(sql_details, [], (error, results) => {
          if (error) {
            console.log('location.model.bulkLocationDetails', error, sql_details);
            throw Error('Cannot get locations');
          }
          resolve(results);
        });
        connection.end();

      });
    }

    public getLocationDetailsUsingName(name: string = '', parentId?): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let sql_get = '';
        let parentIdClause = '';
        sql_get = `SELECT * FROM locations WHERE name  LIKE '%${name}%' LIMIT 1;`;
        if (parentId) {
          sql_get = `SELECT * FROM locations WHERE name LIKE '%${name}%' AND parent_id = ${parentId} LIMIT 1;`;
        }

        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [], (error, results) => {
          if (error) {
            console.log('location.model.getLocationDetailsUsingName', error, sql_get);
            throw Error('Internal error. Cannot get location details');
          }
          resolve(results);
        });
      });
    }

    public locationHierarchy(location_id: number = 0, filter: object = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let theLocation = this.id;
        if (location_id) {
          theLocation = location_id;
        }
        const sql = `SELECT
          locations.parent_id,
          locations.location_id,
          locations.is_building,
          locations.name,
          locations.formatted_address,
          p1.name as p1_name,
          p1.location_id as p1_location_id,
          p1.is_building as p1_is_building,
          p2.name as p2_name,
          p2.location_id as p2_location_id,
          p3.name as p3_name,
          p3.location_id as p3_location_id,
          p4.name as p4_name,
          p4.location_id as p4_location_id,
          p5.name as p5_name,
          p5.location_id as p5_location_id
        FROM locations
        LEFT JOIN locations as p1 ON p1.location_id = locations.parent_id
        LEFT JOIN locations as p2 ON p2.location_id = p1.parent_id
        LEFT JOIN locations as p3 ON p3.location_id = p2.parent_id
        LEFT JOIN locations as p4 ON p4.location_id = p3.parent_id
        LEFT JOIN locations as p5 ON p5.location_id = p4.parent_id
        WHERE locations.location_id = ? ORDER BY locations.location_id`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [theLocation], (error, results) => {
          if (error) {
            console.log(`location.model.locationHierarchy`, error, sql);
            throw Error('Cannot generate location hierarchy');
          }
          resolve(results);
        });
      });
    }

    public getTheParentOrBuiling(id) {
        return new Promise((resolve, reject) => {
            const
            connection = db.createConnection(dbconfig),
            locId = (id) ? id : this.ID(),
            sql = `
            SELECT
            *
            FROM locations
            WHERE location_id IN (
                SELECT
                IF(l.is_building = 1, l.location_id,
                   IF(p1.is_building = 1, p1.location_id,
                      IF(p1.parent_id = -1, p1.location_id,
                         IF(p2.is_building = 1, p2.location_id,
                            IF(p2.parent_id = -1, p2.location_id,
                               IF(p3.is_building = 1, p3.location_id,
                                  IF(p3.parent_id = -1, p3.location_id,
                                     IF(p4.is_building = 1, p4.location_id,
                                        IF(p4.parent_id = -1, p4.location_id,
                                           0
                                          ) )
                                    ) )
                              ) )
                        ) )
                  )
                as location_id
                FROM locations l
                LEFT JOIN locations p1 ON l.parent_id = p1.location_id
                LEFT JOIN locations p2 ON p1.parent_id = p2.location_id
                LEFT JOIN locations p3 ON p2.parent_id = p3.location_id
                LEFT JOIN locations p4 ON p3.parent_id = p4.location_id
                WHERE l.location_id = ${locId}
            )`;

            connection.query(sql, (error, results) => {
                if (error) {
                    console.log('location.model.getTheParentORBuiling',error, sql);
                    throw Error('Cannot perform query');
                }

                if(results.length > 0){
                    this.dbData = results;
                    resolve(results[0]);
                }else{
                    reject();
                }

            });

            connection.end();
        });
    }

    public searchLocation(searchCriteria: object = {}, limit?, accountId?, searchBuildings?): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let joins = '';
            if(accountId){
                joins = `INNER JOIN location_account_relation lar ON l.location_id = lar.location_id`;
            }

            let sql_search = `SELECT l.*, IF(p.name IS NOT NULL, CONCAT(p.name,', ',l.name), l.name) as location_name FROM locations l LEFT JOIN locations p ON l.parent_id = p.location_id ${joins} WHERE l.archived = 0`;
            if ('name' in searchCriteria) {
                sql_search += ` AND l.name LIKE '%${searchCriteria['name']}%'`;
            }
            if ('location_id' in searchCriteria) {
                sql_search += ` AND l.location_id = ${searchCriteria['location_id']}`;
            }
            if ('parent_id' in searchCriteria) {
                sql_search += ` AND l.parent_id = ${searchCriteria['parent_id']}`;
            }

            console.log(searchBuildings);
            if(searchBuildings !== undefined){
                let building = (searchBuildings) ? searchBuildings : 0;
                sql_search += ` AND l.is_building = `+building;
            }

            if(accountId){
                sql_search += ` AND lar.account_id = ${accountId} `;
            }

            if(limit){
                sql_search += ` LIMIT ${limit}`;
            }
            const connection = db.createConnection(dbconfig);
            connection.query(sql_search, [], (error, results) => {
                if (error) {
                    console.log('location.model.searchLocation', error, sql_search);
                    throw Error('There was an error getting the location details');
                }
                resolve(results);
            });
            connection.end();
        });
    }

    public toggleBulkOnlineTrainingAccess(locations = [], online_training = 0) {
        return new Promise((resolve, reject) => {
          if (locations.length == 0) {
            resolve(false);
            return;
          }
          const locationIds = locations.join(',');
          const sql_update = `UPDATE locations SET online_training = ?
                              WHERE location_id IN (${locationIds});`;
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, [online_training], (error, results) => {
              if (error) {
                console.log('location.model.toggleBulkOnlineTrainingAccess', error, sql_update);
                throw Error('cannot update');
              }
              resolve(true);
          });

          connection.end();
        });
    }

    public searchBuildings(key = '', accountId?){
        return new Promise((resolve, reject) => {
            let sqlRelated = '';
            if(accountId){
                sqlRelated = `
                    AND (
                        l.location_id IN (
                            SELECT
                            location_id
                            FROM location_account_relation
                            WHERE location_account_relation.account_id = ${accountId} 
                        )
                        OR
                        l.location_id IN (
                            SELECT
                            location_id
                            FROM location_account_user
                            WHERE location_account_user.account_id = ${accountId}
                        )

                    )
                `;
            }

            let sql_search = `
                SELECT
                l.location_id,
                l.parent_id,
                l.formatted_address,
                l.is_building,
                IF(p.name IS NOT NULL AND TRIM(p.name) != '', CONCAT(p.name, ', ', l.name), l.name ) as name
                FROM locations l 
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE l.archived = 0 AND l.is_building = 1 AND 
                ( l.name LIKE "%${key}%" OR l.formatted_address LIKE "%${key}%" OR p.name LIKE "%${key}%" OR IF(p.name IS NOT NULL OR TRIM(p.name) != '', CONCAT(p.name, ' ', l.name), l.name ) LIKE "%${key}%" )
                ${sqlRelated}
                GROUP BY l.location_id
                LIMIT 10
            `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_search, [], (error, results) => {
                if (error) {
                    console.log('location.model.searchBuildings', error, sql_search);
                    throw Error('There was an error searchBuildings');
                }
                resolve(results);
            });
            connection.end();
        });
    }

    public searchLevels(key = ''){
        return new Promise((resolve, reject) => {
            let sql_search = `
                SELECT
                l.location_id,
                l.parent_id,
                l.formatted_address,
                l.is_building,
                IF(p.name IS NOT NULL AND TRIM(p.name) != '', CONCAT(p.name, ', ', l.name), l.name ) as name
                FROM locations l 
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE p.archived = 0 AND p.is_building = 1 AND 
                ( l.name LIKE "%${key}%" OR l.formatted_address LIKE "%${key}%" OR p.name LIKE "%${key}%" OR IF(p.name IS NOT NULL OR TRIM(p.name) != '', CONCAT(p.name, ', ', l.name), l.name ) LIKE "%${key}%" )
                LIMIT 10
            `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_search, [], (error, results) => {
                if (error) {
                    console.log('location.model.searchLevels', error, sql_search);
                    throw Error('There was an error seasearchLevelsrchBuildings');
                }
                resolve(results);
            });
            connection.end();
        });
    }

}
