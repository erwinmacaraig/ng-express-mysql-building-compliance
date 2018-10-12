
import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');
const defs = require('../config/defs.json');

import * as Promise from 'promise';
export class LocationAccountRelation extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_account_relation_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length) {
                reject('Record not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_account_relation_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByLocationId(locationId: Number, include_account: boolean = false): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let sql_load = '';
            sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ?';
            if (include_account) {
              sql_load = `SELECT * FROM location_account_relation
                INNER JOIN accounts
                ON location_account_relation.account_id = accounts.account_id
                WHERE location_account_relation.location_id = ?`;
            }
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              resolve(results);
            });
            connection.end();
        });
    }

    public getByAccountIdAndLocationId(accountId, locationId): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM location_account_relation WHERE account_id = ?
            AND location_id = ? ORDER BY location_account_relation_id DESC`;
            const param = [accountId, locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                console.log('location.account.relation.getByAccountIdAndLocationId', error);
                throw Error('Internal Server Error');
              }
              resolve(results);
            });
            connection.end();
        });
    }

    public getByWhereInLocationIds(locationIds: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id IN ('+locationIds+')';

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getManyByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ?';
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getTenantsOfLocationId(locationId){
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ? AND responsibility IN ("Tenant", "tenant") ';
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE account_id = ?';
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getLocationAccountRelation(filter: object) {
      return new Promise((resolve, reject) => {
        const val = [];
        let whereClause = '';
        if ('location_id' in filter) {
          whereClause += `AND location_id = ? `;
          val.push(filter['location_id']);
        }
        if ('account_id' in filter) {
          whereClause += `AND account_id = ? `;
          val.push(filter['account_id']);
        }
        if ('responsibility' in filter) {
          whereClause += `AND responsibility = ?`;
          val.push(filter['responsibility']);
        }
        const sql = `SELECT * FROM location_account_relation WHERE 1=1 ${whereClause}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, val, (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('Record not found '+JSON.stringify(filter));
          } else {
            resolve(results);
          }
        });
        connection.end();
      });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE location_account_relation SET
                location_id = ?, account_id = ?, responsibility = ?
                WHERE location_account_relation_id = ? `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('responsibility' in this.dbData) ? this.dbData['responsibility'] : "",
            this.ID() ? this.ID() : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            resolve(true);
          });
          connection.end();

        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
          const sql_insert = `INSERT INTO location_account_relation (
            location_id,
            account_id,
            responsibility
          ) VALUES (?,?,?)
          `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('responsibility' in this.dbData) ? this.dbData['responsibility'] : ""
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['location_account_relation_id'] = this.id;
            resolve(true);
          });
          connection.end();

        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('location_account_relation_id' in createData) {
              this.id = createData.location_account_relation_id;
            }
            resolve(this.write());
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM location_account_relation WHERE location_account_relation_id = ? LIMIT 1`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_del, [this.ID()], (error, results, fields) => {
                if (error) {
                    console.log(error);
                    reject('Error deleting record');

                } else {
                    resolve(true);
                }

            });
            connection.end();
        });
    }

    /**
     * @description
     * Retrieve a list of all locations for an account with the necessary filters supplied
     * Mainly used in listing all the locations for a user under an account
     * @param accountId
     * required parameter
     * @param filter
     */
    public listAllLocationsOnAccount(accountId = 0, filter = <any> {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const resultSet = [];
        let filterStr = '';
        
        if ('responsibility' in filter) {
          if (filter['responsibility'] === defs['Tenant']) {
            // filterStr += ` AND lar.responsibility = 'Tenant'`;
            filterStr += ` AND l.is_building = 0`;

          }
          if (filter['responsibility'] === defs['Manager']) {
            // filterStr += ` AND lar.responsibility = 'Manager'`;
            filter['is_building'] = 1;
          }
          if(filter['responsibility'] === 'both'){
              filterStr += ` AND lar.responsibility IN ('Manager', 'Tenant')`;
          }
        }
        
        if ('is_building' in filter) {
          filterStr += ` AND l.is_building = ${filter['is_building']}`;
        }

        if('location_id' in filter){
            filterStr += ` AND l.location_id = ${filter['location_id']}`;
        }

        let offsetLimit = ``;

        if('limit' in filter){
            offsetLimit = ' LIMIT '+filter['limit'];
        }

        if('offset' in filter && 'limit' in filter){
            offsetLimit = ' LIMIT '+filter['offset']+','+filter['limit'];
        }

        let nameSearchForTRP = '';
        // if('name' in filter && filter['name'].length > 0 && ('responsibility' in filter && filter['responsibility'] === defs['Tenant'])){
        if('name' in filter){
            nameSearchForTRP = (filter['name'].length > 0) ? ` AND IF (p1.name IS NULL, l.name, IF (CHAR_LENGTH(p1.name) = 0,  l.name, CONCAT(p1.name, ', ', l.name))) LIKE '%${filter['name']}%'` : '  ';
        }

        let orderBy = '';
        if('sort' in filter){
            if(filter['sort'] == 'name-asc'){
                orderBy = ' ORDER BY name ASC ';
            }else if(filter['sort'] == 'name-desc'){
                orderBy = ' ORDER BY name DESC ';
            }
        }

        let selectParentName = ('no_parent_name' in filter) ? 'l.name,' : `IF (p1.name IS NULL, l.name, IF (CHAR_LENGTH(p1.name) = 0,  l.name, CONCAT(p1.name, ', ', l.name))) as name,`;

        let isPortfolio = (filter['isPortfolio']) ? filter['isPortfolio'] : false;

        let sqlJoinLAU = '';
        if(!isPortfolio && filter['userId']){
            sqlJoinLAU = ' INNER JOIN location_account_user lau ON lau.location_id = l.location_id ';
            filterStr = ' AND lau.user_id = '+filter['userId'];
            if ('responsibility' in filter) {
                if(filter['responsibility'] == 1){
                    filterStr += ` AND true = (l.is_building = 1  OR l.parent_id = -1)`;
                }
            }
        }

        if('archived' in filter){
            filterStr += ` AND l.archived = ${filter['archived']}`;
        }

        let sql_get_locations = `
            SELECT
            l.location_id,
            ${selectParentName}
            l.is_building,
            l.parent_id,
            l.google_photo_url,
            l.admin_verified,
            l.location_directory_name,
            l.archived,
            l.google_place_id,
            l.google_photo_url,
            l.admin_verified,
            l.formatted_address,
            lar.responsibility,
            lar.location_account_relation_id,
            lar.account_id,
            p1.is_building as parent_is_building,
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

            as building_id

            FROM locations l
            LEFT JOIN locations p1 ON l.parent_id = p1.location_id
            LEFT JOIN locations p2 ON p1.parent_id = p2.location_id
            LEFT JOIN locations p3 ON p2.parent_id = p3.location_id
            LEFT JOIN locations p4 ON p3.parent_id = p4.location_id

            LEFT JOIN  location_account_relation lar
            ON lar.location_id = l.location_id
            OR p1.location_id = lar.location_id
            OR p2.location_id = lar.location_id
            OR p3.location_id = lar.location_id
            OR p4.location_id = lar.location_id

            ${sqlJoinLAU}

            WHERE
            lar.account_id = ?
            ${filterStr}
            ${nameSearchForTRP}
            GROUP BY l.location_id
            ${orderBy}
        `;

        if('count' in filter){
            sql_get_locations = `
                SELECT SUM(count) as count FROM (
                    SELECT
                    ${selectParentName}
                    @c := 1 as count

                    FROM locations l
                    LEFT JOIN locations p1 ON l.parent_id = p1.location_id
                    LEFT JOIN locations p2 ON p1.parent_id = p2.location_id
                    LEFT JOIN locations p3 ON p2.parent_id = p3.location_id
                    LEFT JOIN locations p4 ON p3.parent_id = p4.location_id

                    LEFT JOIN  location_account_relation lar
                    ON lar.location_id = l.location_id
                    OR p1.location_id = lar.location_id
                    OR p2.location_id = lar.location_id
                    OR p3.location_id = lar.location_id
                    OR p4.location_id = lar.location_id

                    ${sqlJoinLAU}

                    WHERE
                    lar.account_id = ?
                    ${filterStr}
                    ${nameSearchForTRP}

                    GROUP BY l.location_id
                ) src
            `;
        }else if('locationIdOnly' in filter){
            sql_get_locations = `
                SELECT
                l.location_id

                FROM locations l
                LEFT JOIN locations p1 ON l.parent_id = p1.location_id
                LEFT JOIN locations p2 ON p1.parent_id = p2.location_id
                LEFT JOIN locations p3 ON p2.parent_id = p3.location_id
                LEFT JOIN locations p4 ON p3.parent_id = p4.location_id

                LEFT JOIN  location_account_relation lar
                ON lar.location_id = l.location_id
                OR p1.location_id = lar.location_id
                OR p2.location_id = lar.location_id
                OR p3.location_id = lar.location_id
                OR p4.location_id = lar.location_id

                ${sqlJoinLAU}

                WHERE
                lar.account_id = ?
                ${filterStr}
                ${nameSearchForTRP}
                GROUP BY l.location_id
                ${orderBy} ${offsetLimit}
            `;
        }else{
            sql_get_locations += ` ${offsetLimit}`;
        }

        // console.log('sql_get_locations', sql_get_locations);

        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_locations, [accountId], (error, results) => {
            if (error) {
                console.log('location.account.relation.listAllLocationsOnAccount', error, sql_get_locations);
                throw Error('Cannot get all locations for this account');
            }

            if('count' in filter){
                if(results[0]['count'] == null){
                    resolve([{ count : 0 }]);
                }else{
                    resolve(results);
                }
            }else{
                resolve(results);
            }
            
        });
        connection.end();

      });
    }

    public getLoctionSiblingsOfTenantRealtedToAccountAndLocation(accountId, locationId, count?){
        return new Promise((resolve, reject) => {
            const select = (count) ? 'COUNT(siblings.location_id) as count' : 'siblings.*';
            const sql_load = `
                SELECT ${select}
                FROM locations siblings
                INNER JOIN locations location ON siblings.parent_id = location.parent_id
                INNER JOIN location_account_relation lar ON siblings.location_id = lar.location_id

                WHERE  lar.account_id = ${accountId} AND lar.responsibility = 'Tenant' AND location.location_id = ${locationId} AND siblings.location_id != ${locationId} AND siblings.archived = 0
            `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load,  (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getTaggedLocationsOfAccount(accountId = 0){
        return new Promise((resolve, reject) => {
            const sql_load = `
                SELECT 
                   l.*, 
                   IF(p.name IS NOT NULL, CONCAT(p.name,', ',l.name), l.name) as location_name
                FROM location_account_relation lar
                INNER JOIN locations l ON lar.location_id = l.location_id
                LEFT JOIN locations p ON l.parent_id = p.location_id

                WHERE lar.account_id = ? AND l.archived = 0
            `;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

}
