import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { UtilsSync } from './util.sync';

const dbconfig = require('../config/db');

import * as Promise from 'promise';
import * as validator from 'validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';
const defs = require('./../config/defs.json');

export class User extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public static getByToken(token: string) {
        return new Promise((resolve, reject) => {
            const parts = token.split(' ');

            if (parts.length === 2 && parts[0] === 'Bearer') {
                try {
                    const decoded = jwt.verify(parts[1], process.env.KEY);
                    const sql_load = 'SELECT * FROM users WHERE user_id = ? AND token = ?';
                    const val = [decoded.user, decoded.user_db_token];
                    const connection = db.createConnection(dbconfig);
                    connection.query(sql_load, val, (error, results, fields) => {
                        if (error) {
                            throw error;
                        }
                        if (!results.length) {
                            reject('No user found');
                        } else {
                            resolve(results[0]);
                        }
                    });
                    connection.end();
                } catch (e) {
                    return reject('Not Authenticated');
                }
            }
        });
    }

    public load() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                const sql_load = 'SELECT * FROM users WHERE user_id = ?';
                const uid = [this.id];
                connection.query(sql_load, uid, (error, results, fields) => {
                    if (error) {
                        console.log(`${error} and sql is ${sql_load}`);
                        throw Error(error);
                    }
                    if (!results.length) {
                        console.log('User not found');
                        reject('No user found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['user_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
        });
    }

    public getByEmail(email: String) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                const sql_load = 'SELECT * FROM users WHERE email = ?';
                const param = [email];
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }

                    if (!results.length) {
                        console.log('Call to user.model.getByEmail - No email found.');
                        reject('No user found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['user_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
        });
    }

    public getByUsername(username: String) {
        console.log(username);
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                const sql_load = 'SELECT * FROM users WHERE user_name = ?';
                const param = [username];
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }

                    if (!results.length) {
                        reject('No user found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['user_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
        });
    }

    loadByCredentials(username: string, passwd: string) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                let whereClause = '';
                if (validator.isEmail(username)) {
                    whereClause = 'WHERE email = ?';
                } else {
                    whereClause = 'WHERE user_name = ?';
                }
                const sql_user = `SELECT users.*, token.verified, token.expiration_date, token.action, token.token_id FROM users
                                  LEFT JOIN token ON users.user_id = token.id `
                                  + whereClause + ` AND password = ? AND archived = 0 `;
                // const sql_user = `SELECT * FROM users `+ whereClause + ` AND password = ? `;
                const newPasswd = md5('Ideation' + passwd + 'Max');
                const credential = [username, newPasswd];
                connection.query(sql_user, credential, (error, results, fields) => {
                    if (error) {
                        console.log(sql_user);
                        throw error;
                    }
                    if (!results.length) {
                        reject('Invalid user');
                    } else {
                        let user = <any> {
                            'action' : false
                        };
                        for(let res of results){
                            if(res['action'] == 'verify' && res['id_type'] == 'user_id'){
                                user = res;
                                break;
                            }
                        }
                        if(!user['action']){
                            user = results[0];
                            user['token_id'] = null;
                        }

                        this.dbData = user;
                        this.setID(user.user_id);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                let defaultPassword = '';
                if (('password' in this.dbData) && (this.dbData['password'] as String).length > 5) {
                    defaultPassword = md5('Ideation' + this.dbData['password'] + 'Max')
                } else {
                    defaultPassword  = md5('Ideation' + defs['DEFAULT_USER_PASSWORD'] + 'Max');                    
                }
                const sql_insert = `INSERT INTO users (
                    first_name,
                    last_name,
                    email,
                    phone_number,
                    mobile_number,
                    occupation,
                    mobility_impaired,
                    time_zone,
                    can_login,
                    password,
                    invited_by_user,
                    account_id,
                    last_login,
                    evac_role,
                    invitation_date,
                    add_to_location,
                    token,
                    approved_license_agreement,
                    logged_in,
                    archived,
                    must_change_password,
                    user_name,
                    profile_completion
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                let email = this.dbData['email'];
                const user = [
                    ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
                    ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
                    ('email' in this.dbData) ? email.toLowerCase() : '',
                    ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
                    ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : ' ',
                    ('occupation' in this.dbData) ? this.dbData['occupation'] : '',
                    ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : '0',
                    ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
                    ('can_login' in this.dbData) ? this.dbData['can_login'] : '0',
                    defaultPassword,
                    ('invited_by_user' in this.dbData) ? this.dbData['invited_by_user'] : 0,
                    ('account_id' in this.dbData) ? this.dbData['account_id'] : '0',
                    ('last_login' in this.dbData) ? this.dbData['last_login'] : null,
                    ('evac_role' in this.dbData) ? this.dbData['evac_role'] : 'Client',
                    ('invitation_date' in this.dbData) ? this.dbData['invitation_date'] : null,
                    ('add_to_location' in this.dbData) ? this.dbData['add_to_location'] : '0',
                    ('token' in this.dbData) ? this.dbData['token'] : null,
                    ('approved_license_agreement' in this.dbData) ? this.dbData['approved_license_agreement'] : '0',
                    ('logged_in' in this.dbData) ? this.dbData['logged_in'] : '0',
                    ('archived' in this.dbData) ? this.dbData['archived'] : '0',
                    ('must_change_password' in this.dbData) ? this.dbData['must_change_password'] : '0',
                    ('user_name' in this.dbData) ? this.dbData['user_name'] : null,
                    ('profile_completion' in this.dbData) ? this.dbData['profile_completion'] : 1,

                ];
                connection.query(sql_insert, user, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['user_id'] = this.id;
                    resolve(true);
                });
                connection.release();
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                const sql_update = `UPDATE users SET
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone_number = ?,
                    mobile_number = ?,
                    occupation = ?,
                    mobility_impaired = ?,
                    time_zone = ?,
                    can_login = ?,
                    password = ?,
                    invited_by_user = ?,
                    account_id = ?,
                    last_login = ?,
                    evac_role = ?,
                    invitation_date = ?,
                    add_to_location = ?,
                    token = ?,
                    approved_license_agreement = ?,
                    logged_in = ?,
                    archived = ?,
                    must_change_password = ?,
                    user_name = ?,
                    profile_completion = ?
                    WHERE user_id = ?
                    `;
                const user = [
                    ('first_name' in this.dbData) ? this.dbData['first_name'] : null,
                    ('last_name' in this.dbData) ? this.dbData['last_name'] : null,
                    ('email' in this.dbData) ? <string>this.dbData['email'].toLowerCase() : '',
                    ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
                    ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : '',
                    ('occupation' in this.dbData) ? this.dbData['occupation'] : '',
                    ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : '0',
                    ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
                    ('can_login' in this.dbData) ? this.dbData['can_login'] : '0',
                    ('password' in this.dbData) ? this.dbData['password'] : null,
                    ('invited_by_user' in this.dbData) ? this.dbData['invited_by_user'] : 0,
                    ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                    ('last_login' in this.dbData) ? this.dbData['last_login'] : null,
                    ('evac_role' in this.dbData) ? this.dbData['evac_role'] : 'Client',
                    ('invitation_date' in this.dbData) ? this.dbData['invitation_date'] : null,
                    ('add_to_location' in this.dbData) ? this.dbData['add_to_location'] : null,
                    ('token' in this.dbData) ? this.dbData['token'] : null,
                    ('approved_license_agreement' in this.dbData) ? this.dbData['approved_license_agreement'] : null,
                    ('logged_in' in this.dbData) ? this.dbData['logged_in'] : '0',
                    ('archived' in this.dbData) ? this.dbData['archived'] : '0',
                    ('must_change_password' in this.dbData) ? this.dbData['must_change_password'] : '0',
                    ('user_name' in this.dbData) ? this.dbData['user_name'] : null,
                    ('profile_completion' in this.dbData) ? this.dbData['profile_completion'] : 1,
                    this.ID() ? this.ID() : 0
                ];
                connection.query(sql_update, user, (err, results, fields) => {
                    if (err) {
                        throw new Error(err + ' ' + sql_update);
                    }
                    resolve(true);
                });
                connection.release();
            });
        }); // end Promise
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                for (let key in createData ) {
                    this.dbData[key] = createData[key];
                }
                if ('user_id' in createData) {
                    this.id = createData.user_id;
                }
                resolve(this.write());

                connection.release();
            });
        });
    }

    public getAll(limit:number, orderBy:String, order:String){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                limit = (limit) ? limit : 25;
                orderBy = (orderBy) ? orderBy : 'user_id';
                order = (order) ? order : 'DESC';
                const sql_load = "SELECT * FROM users ORDER BY "+orderBy+" "+order+" LIMIT "+limit+"";
                const param = [ ];
                
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                });

                connection.release();
            });
        });
    }

    public getAdmins(limit?){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let sql_load = "SELECT * FROM users WHERE evac_role = 'admin' AND archived = 0";
                if(limit){
                    sql_load += " LIMIT "+limit;
                }

                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                });

                connection.release();
            });
        });
    }

    public getByAccountId(accountId, archived?, search?): any {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                let sql_load = 'SELECT * FROM users WHERE account_id = ? AND archived = ? ';
                if(search){
                    sql_load += ' AND CONCAT(first_name, " ", last_name) LIKE "%'+search+'%" ';
                }
                if(!archived){
                    archived = 0;
                }
                const param = [accountId, archived];
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(results);
                });
                connection.release();
            });
        });
    }

    public getImpairedByAccountId(accountId, archived?) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                let sql_load = 'SELECT * FROM users WHERE account_id = ? AND archived = ? AND mobility_impaired = 1';
                if(!archived){
                    archived = 0;
                }
                const param = [accountId, archived];
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(results);
                });
                connection.release();
            });
        });
    }
  /**
   * @author Erwin Macaraig
   *
   * @param filter
   * Object filter wherein keys are the filter
   * @param user_id
   * User id on which to get all certifications based on the filter
   */
    public getAllCertifications(filter: object = {}, user_id: number = 0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let uid = this.ID();
                if (user_id) {
                    uid = user_id;
                }
                let filterStr = '';
                Object.keys(filter).forEach((key) => {
                    switch (key) {
                        case 'pass':
                        filterStr += ` AND certifications.pass = ${filter[key]}`;
                        break;
                        case 'training_requirement_id':
                        const trainingRequirementIds = (filter['training_requirement_id']).join(',');
                        if (trainingRequirementIds.length > 0 ) {
                            filterStr += ` AND certifications.training_requirement_id IN (${trainingRequirementIds}) `;
                        }
                        break;
                        case 'certifications_id':
                        filterStr += ` AND certifications.certifications_id = ${filter[key]}`;
                        break;
                        case 'current':
                        filterStr += ` AND DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()`;
                        break;
                        case 'em_roles':
                        if (filter['em_roles'].length > 0) {
                            const em_roles = (filter['em_roles']).join(',');
                            filterStr += ` AND em_role_training_requirements.em_role_id IN (${em_roles})`;
                        }

                        break;
                    }
                });
                const sql_certifications = `SELECT
                    training_requirement.training_requirement_name,
                    em_roles.role_name,
                    training_requirement.scorm_course_id,
                    certifications.*,
                    training_requirement.num_months_valid,
                    DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date,
                    IF (DATE_ADD(certifications.certification_date,
                    INTERVAL training_requirement.num_months_valid MONTH) > NOW(), 'valid', 'expired') as status
                    FROM
                    certifications
                    INNER JOIN
                    training_requirement
                    ON
                    training_requirement.training_requirement_id = certifications.training_requirement_id
                    INNER JOIN
                    em_role_training_requirements
                    ON
                    em_role_training_requirements.training_requirement_id = training_requirement.training_requirement_id
                    INNER JOIN
                    em_roles
                    ON
                    em_roles.em_roles_id = em_role_training_requirements.em_role_id
                    WHERE
                    certifications.user_id = ? ${filterStr}  GROUP BY certifications.certifications_id ORDER BY certifications.certification_date DESC`;

                connection.query(sql_certifications, [uid], (error, results, fields) => {
                    if (error) {
                        console.log('user.model.getAllCertifications',  error, sql_certifications);
                        throw Error('There was a problem with getting the certification records for this user');
                    }
                    if (results.length > 0) {
                        resolve(results);
                    } else {
                        reject('There are no certifications for this user');
                    }
                });
                
                connection.release();
            });
        });
    }
    /**
    * @author Erwin Macaraig
    * @description
    * Get all EM locations tag to this user
    * @param user_id
    * @returns array
    */
    public getAllMyEMLocations(user_id: number = 0): Promise<Array<Object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let userId = this.ID();
                if (user_id) {
                    userId = user_id;
                }
                const sql = `SELECT
                  users.user_id,
                  user_em_roles_relation.user_em_roles_relation_id,
                  user_em_roles_relation.em_role_id,
                  user_em_roles_relation.em_role_id as role_id,
                  em_roles.role_name,
                  locations.location_id,
                  locations.parent_id,
                  locations.is_building,
                  lp.name as parent_name,
                  IF(lp.name IS NOT NULL, CONCAT( IF(TRIM(lp.name) <> '', CONCAT(lp.name, ', '), ''), locations.name), locations.name) as name
                  FROM
                  users
                  INNER JOIN
                  user_em_roles_relation ON users.user_id = user_em_roles_relation.user_id
                  INNER JOIN locations ON user_em_roles_relation.location_id = locations.location_id
                  INNER JOIN em_roles ON em_roles.em_roles_id = user_em_roles_relation.em_role_id
                  LEFT JOIN locations lp ON lp.location_id = locations.parent_id
                  WHERE users.user_id = ?`;
                connection.query(sql, [userId], (error, results, fields) => {
                    if (error) {
                        console.log('user.model.getAllMyLocations', error, sql, userId);
                        throw Error('Internal error. Cannot retrieve records');
                    }
                    if (results.length > 0) {
                        /*console.log(results);*/
                        const utils = new UtilsSync();
                        utils.getRootParent(results).then((set) => {
                            /*console.log(set);*/
                            resolve(set);
                        });
                    } else {
                        resolve([]);
                    }
                });
                connection.release();
            });

            
        });
    }

    public getWithoutToken() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                const sql = ` SELECT * FROM users WHERE user_id NOT IN (SELECT id FROM token WHERE id_type = 'user_id' AND verified = 0) `;
                connection.query(sql,  (error, results, fields) => {
                    resolve(results);
                });
                connection.release();
            });
            
        });
    }

    public query(queries): Promise<Array<Object>>{
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let selectQuery = 'users.*';
                if(queries.select){
                    if( Object.keys(queries.select).length > 0 ){
                        selectQuery = '';

                        for(let i in queries.select){
                            let arrSel = queries.select[i];
                            let c = 0;
                            for(let n in arrSel){
                                if(c > 0 || selectQuery.trim().length > 0){
                                    selectQuery += ', ';
                                }

                                if(i !== 'custom'){
                                    selectQuery += i + '.' + arrSel[n] +' ';
                                }else{
                                    selectQuery += arrSel[n]+' ';
                                }

                                c++;
                            }
                        }

                    }

                }
                
                if(queries.select.count){
                    selectQuery = ' COUNT(users.user_id) as count';
                    selectQuery = ' users.user_id ';
                }
                

                let whereQuery = '',
                    whereCount = 0;
                if(queries.where){
                    for(let i in queries.where){
                        if(whereCount == 0){
                            whereQuery += ' WHERE '+queries.where[i];
                        }else{
                            whereQuery += ' AND '+queries.where[i];
                        }
                        whereCount++;
                    }
                }

                if(queries.orWhere){
                    for(let i in queries.orWhere){
                        whereQuery += ' '+queries.orWhere[i]+' ';
                    }
                }

                let joinsQuery = '';
                if(queries.where){
                    for(let i in queries.joins){
                       joinsQuery += ' '+queries.joins[i]+' ';
                    }
                }

                let limitQuery = '';
                if(queries.limit && ('count' in queries.select == false) ){
                    limitQuery = 'LIMIT '+queries.limit;
                }

                let orderQuery = '';
                if(queries.order){
                    orderQuery = 'ORDER BY '+queries.order;
                }

                let groupQuery = '';
                if(queries.group){
                    groupQuery = 'GROUP BY '+queries.group;
                }

                let sql_load = 'SELECT '+selectQuery+' FROM users '+joinsQuery+' '+whereQuery+' '+groupQuery+' '+orderQuery+' '+limitQuery;
                
                //if(queries.select.count) {
                    // console.log('========= ', sql_load, " =========", "\r\n");
                //}
                
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log(sql_load);
                        return console.log(error);
                    }
                    if(queries.select.count) {
                        resolve([{
                            count: results.length
                        }])
                    } else {
                        resolve(results);
                    }
                    
                });
                connection.release();
            });
        });
    }

    public getAllActive(accountId?, count?, offLimit?){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                let accntWhere = (accountId) ? ' AND users.account_id = '+accountId : '';
                let sql_load =  ` 
                    SELECT users.*, accounts.account_name FROM users INNER JOIN accounts ON users.account_id = accounts.account_id 
                    WHERE users.archived = 0 ${accntWhere} GROUP BY users.user_id `;
                if(count){
                    sql_load =  ` SELECT COUNT(users.user_id) as count FROM users INNER JOIN accounts ON users.account_id = accounts.account_id 
                    WHERE users.archived = 0 ${accntWhere} `;
                }else{
                    if(offLimit){
                        sql_load += ' LIMIT  '+offLimit;
                    }
                }
                const param = [ ];
                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                });
                connection.release();
            });
        });
    }

    public getSpliceUsers(accountId: number = 0, filter:any = {}): Promise<Array<number>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }
                let 
                page = 0,
                sql = 'SELECT user_id FROM users WHERE ', 
                where = '  ',
                limit = 10,
                resultSet = [];

                if ('page' in filter) {
                    page = ( typeof filter['page'] == 'string'  ) ? (isNaN(parseInt(filter['page']))) ? 0 : parseInt(filter['page']) : filter['page'];
                    page = page * limit; 
                }

                if ('query' in filter && filter['query'].length > 0 && filter['query'] != 'all') {
                    where += ` account_id = ${accountId} AND CONCAT(first_name,' ',last_name) LIKE '%${filter['query']}%' AND archived = 0 OR account_id = ${accountId} AND email like '%${filter['query']}%' AND archived = 0 `;
                }else{
                    where += ` account_id = ${accountId} AND archived = 0 `;
                }

                if('count' in filter) {
                    sql = `SELECT COUNT(user_id) as count FROM users WHERE `+where;
                } 
                else {
                    sql += where;
                    let limitClause = ` LIMIT ${page}, ${limit} `;
                    if ('query' in filter && filter['query'].length > 0 && filter['query'] == 'all') {
                        limitClause = '';
                    }
                    sql += limitClause;                    
                }             
                connection.query(sql, (error, results) => {
                    if (error) {
                        console.log('user.model.getSpliceUsers', error, sql);
                        throw Error('Internal server error. Cannot get users for the account');
                    }

                    if('count' in filter){
                        resolve(results);
                    }else{
                        for (const r of results) {
                            resultSet.push(r['user_id']);
                        }
                        resolve(resultSet);
                    }

                });

                connection.release();
            });
        });
    }

    public getIsFrpTrp(accountId?, count?, limit?, locationIds?){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let select = `
                    users.user_id, users.first_name, users.last_name, users.email, users.account_id, users.mobility_impaired, users.archived,
                    users.last_login, users.mobile_number, users.phone_number, 
                    DATE_FORMAT(users.last_login, '%d/%m/%Y') as last_login_formatted, accounts.account_name
                `;
                if(count){
                    select = ' COUNT(users.user_id) as count '
                }
                
                let where = '';
                if(accountId){
                    where += ` AND users.account_id IN (${accountId}) `;
                }

                where += ' AND users.user_id IN (SELECT user_id FROM user_role_relation ) ';

                if(locationIds){
                    where += ` AND users.user_id IN (SELECT user_id FROM location_account_user WHERE location_id IN (${locationIds}) ) `;
                }

                let offsetLimit = (limit) ? ' LIMIT '+limit : '';

                let sql_load = `SELECT ${select} FROM users INNER JOIN accounts ON users.account_id = accounts.account_id WHERE users.archived = 0 ${where} ${offsetLimit} `;
                
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log('sql_load', sql_load);
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                });
                connection.release();
            });
        });
    }

    public getIsEm(accountId?, count?, limit?, locationIds?){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if(err){ 
                    throw err 
                }

                let select = `
                    users.user_id, users.first_name, users.last_name, users.email, users.account_id, users.mobility_impaired, users.archived,
                    users.last_login, users.mobile_number, users.phone_number, 
                    DATE_FORMAT(users.last_login, '%d/%m/%Y') as last_login_formatted, accounts.account_name
                `;
                select += (locationIds) ? ` ,em_role_training_requirements.training_requirement_id, user_em_roles_relation.em_role_id` : '';
                if(count){
                    select = ' COUNT(users.user_id) as count '
                }
                
                let where = '', join_training = '';
                if(accountId){
                    where += ` AND users.account_id IN (${accountId})  `;
                }

                let whereLocations = (locationIds) ? ` WHERE location_id IN (${locationIds}) ` : '';
                where += ` AND users.user_id IN (SELECT user_id FROM user_em_roles_relation ${whereLocations} )  `;
                join_training = (locationIds) ?
                ` INNER JOIN user_em_roles_relation ON users.user_id = user_em_roles_relation.user_id
                  INNER JOIN em_role_training_requirements ON user_em_roles_relation.em_role_id = em_role_training_requirements.em_role_id` : '';
                let offsetLimit = (limit) ? ' LIMIT '+limit : '';

                let sql_load = `SELECT ${select} FROM users INNER JOIN accounts ON users.account_id = accounts.account_id ${join_training} WHERE users.archived = 0 ${where} ORDER BY users.user_id ${offsetLimit} `;
                
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log('sql_load', sql_load);
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                });
                connection.release();
            });
        });
    }

    public getAccountRoles(): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }
                const sql = `SELECT
                                users.user_id,
                                users.first_name,
                                users.last_name,
                                users.email,
                                accounts.account_name,
                                user_role_relation.role_id,
                                locations.name,
                                locations.location_id,
                                locations.is_building AS locationIsAlreadyABuilding,
                                parent.name as building_name,
                                parent.location_id as building_id
                            FROM
                                users
                            INNER JOIN
                                accounts
                            ON users.account_id = accounts.account_id
                            INNER JOIN
                                location_account_user
                            ON users.user_id = location_account_user.user_id
                            INNER JOIN
                                user_role_relation
                            ON
                                location_account_user.user_id = user_role_relation.user_id
                            INNER JOIN
                                locations
                            ON locations.location_id = location_account_user.location_id
                            LEFT JOIN
                                locations as parent
                            ON
                                locations.parent_id = parent.location_id
                            WHERE users.user_id = ?`;
                connection.query(sql, [this.ID()], (error, results) => {
                    if (error) {
                        console.log('User object - cannot get account roles', sql, error, this.id);
                        throw Error(error.toString());
                    }
                    resolve(JSON.parse(JSON.stringify(results)));
                });
                connection.release();
            });         

        });
    }

    public searchUsersLocationsAndAccount(keyword = '', filter = ''){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }

                let sqlUsers = `
                    SELECT 
                    users.user_id as id, CONCAT(users.first_name,' ',users.last_name) as name, @type := 'user' as type, @extra := users.email as extra
                    FROM users
                    WHERE users.archived = 0 AND CONCAT(first_name,' ',last_name) LIKE "%${keyword}%" OR users.archived = 0 AND email LIKE "%${keyword}%" 
                `;

                let sqlLocations = `
                    SELECT
                    l.location_id as id, IF(p.name IS NOT NULL AND p.name > '', CONCAT(p.name, ',', l.name), l.name ) as name, @type := 'location' as type, @extra := '' as extra
                    FROM locations l LEFT JOIN locations p ON l.parent_id = p.location_id
                    WHERE l.archived = 0 AND IF(p.name IS NOT NULL AND p.name > '', CONCAT(p.name, ',', l.name), l.name  ) LIKE "%${keyword}%" ORDER BY IF(p.name IS NULL, l.name, CONCAT(p.name, ',', l.name)  ) ASC 
                `;

                let sqlAccounts = `
                    SELECT account_id as id, account_name as name, @type := 'account' as type, @extra := '' as extra
                    FROM accounts WHERE account_name LIKE "%${keyword}%"
                `;

                let arr = [];
                switch (filter) {
                    case "user":
                        sqlUsers += ' LIMIT 15 ';
                        arr.push(sqlUsers);
                        break;
                    case "account":
                        sqlAccounts += ' LIMIT 15 ';
                        arr.push(sqlAccounts);
                        break;
                    case "location":
                        sqlLocations += ' LIMIT 15 ';
                        arr.push(sqlLocations);
                        break;
                    
                    default:
                        sqlUsers += ' LIMIT 5 ';
                        sqlLocations += ' LIMIT 5 ';
                        sqlAccounts += ' LIMIT 5 ';
                        arr.push(sqlUsers);
                        arr.push(sqlLocations);
                        arr.push(sqlAccounts);
                        break;
                }

                let sql_load = '';
                for(let i in arr){
                    if(parseInt(i) > 0){
                        sql_load += ' UNION ';
                    }

                    sql_load += ' ('+arr[i]+') ';
                }

                sql_load += ' ORDER BY name ASC ';

                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log('sql_load', sql_load);
                        return console.log(error);
                    }                    
                    resolve(results);
                });
                connection.release();
            });
        });
    }

    public getAllRoles(userId){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }
                const sql_load = `
                    SELECT 
                    urr.role_id,
                    IF(urr.role_id = 1, 'FRP', 'TRP') as role
                    FROM user_role_relation urr WHERE urr.user_id = ${userId}
                    UNION
                    SELECT
                    emr.em_role_id as role_id,
                    em.role_name as role
                    FROM user_em_roles_relation emr INNER JOIN em_roles em ON emr.em_role_id = em.em_roles_id
                    WHERE emr.user_id = ${userId}
                `;

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

    public getAllRolesInLocationIds(locationIds = '', config = <any>{}){

        return new Promise((resolve, reject) => {
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }
                let configFilter = '';
                if ('searchKey' in config && config['searchKey'].length > 0) {
                    configFilter += `AND CONCAT(u.first_name, ' ', u.last_name) LIKE "%${config['searchKey']}%" `;
                }
                if('account_id' in config){
                    configFilter += ` AND u.account_id = ${config['account_id']} `;
                }
                if('order_account_name' in config){
                    configFilter += ` ORDER BY TRIM(a.account_name) ASC `;
                }

                let archived = ('archived' in config) ? config['archived'] : '0';

                let ecoRoleIdsSql = '';
                if('eco_role_ids' in config){
                    ecoRoleIdsSql = ' AND em.em_roles_id IN ('+config['eco_role_ids']+') ';
                }
                let innerSqlEm = `
                    SELECT
                    emr.user_id,
                    emr.em_role_id as role_id,
                    em.role_name as role_name,
                    emr.location_id
                    FROM user_em_roles_relation emr 
                    INNER JOIN em_roles em ON emr.em_role_id = em.em_roles_id 
                    WHERE emr.location_id IN (${locationIds})
                    ${ecoRoleIdsSql}
                    GROUP BY emr.user_id, emr.em_role_id
                `;
                let innerSqlFrpTrp = `
                    UNION
                    SELECT 
                    lau.user_id,
                    urr.role_id,
                    IF(urr.role_id = 1, 'FRP', 'TRP') as role_name,
                    lau.location_id
                    FROM user_role_relation urr 
                    INNER JOIN location_account_user lau ON urr.user_id = lau.user_id
                    WHERE  lau.location_id IN (${locationIds})
                `;
                innerSqlFrpTrp = `
                    UNION
                    
                    SELECT
                    users.user_id,
                    IF(location_account_relation.responsibility='Manager', 1, 2) AS role_id,
                    IF(location_account_relation.responsibility='Manager', 'FRP', 'TRP') AS role_name,
                    location_account_user.location_id
                    FROM users INNER JOIN location_account_user
                    ON users.user_id = location_account_user.user_id
                    INNER JOIN location_account_relation
                    ON location_account_relation.account_id = users.account_id
                    WHERE location_account_user.location_id IN (${locationIds})
                    GROUP BY location_account_user.location_account_user_id
                    `;
                // console.log(innerSqlFrpTrp);
                if(config['eco_only']){ innerSqlFrpTrp = ''; }

                let select = `
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.account_id,
                    userolelocation.role_id,
                    userolelocation.role_name,
                    userolelocation.location_id,
                    a.account_name,
                    l.name,
                    l.is_building,
                    IF(p.name IS NOT NULL, CONCAT(p.name, ' ', l.name), l.name) as location_name,
                    IF(l.parent_id = -1,  userolelocation.location_id, l.parent_id ) AS parent_id,
                    p.is_building as parent_is_building,
                    IF(p.location_id IS NOT NULL, p.name, '') as parent_location_name,
                    p2.is_building as parent2_is_building,
                    IF(p2.location_id IS NOT NULL, p2.name, '') as parent2_location_name
                `;
                if('count' in config){
                    select = 'COUNT(u.user_id) as count';
                }

                let limitSql = '';
                if('limit' in config){
                    if(config['limit'] && ('count' in config) == false){
                        limitSql = ' LIMIT '+config['limit'];
                    }
                }

                if('eco_order' in config){
                    let txtORder = '';
                    let ind = 0;
                    for(let order of config['eco_order']){
                        txtORder += order;
                        ind++;
                        if(config['eco_order'][ind]){
                            txtORder += ',';
                        }
                    }
                    txtORder += ' ) ASC ';
                    configFilter += ` ORDER BY FIELD(userolelocation.role_id, ${txtORder} `;
                }

                const sql_load = `
                SELECT 
                ${select}
                FROM ( ${innerSqlEm}  ${innerSqlFrpTrp} ) userolelocation
                INNER JOIN users u ON userolelocation.user_id = u.user_id
                INNER JOIN locations l ON l.location_id = userolelocation.location_id
                LEFT JOIN locations p ON p.location_id = l.parent_id
                LEFT JOIN locations p2 ON p2.location_id = p.parent_id
                INNER JOIN accounts a ON a.account_id = u.account_id
                WHERE u.archived = ${archived}
                ${configFilter}
                ${limitSql}
                `;
                
                //console.log(sql_load);
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        console.log(sql_load);
                        return console.log(error);
                    }
                    this.dbData = results;
                    resolve(results);
                });
                connection.release();

            });

        });
    }

    public getAllRolesAndLocations(userId): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }
                const sql_load = `
                SELECT
                lau.location_account_user_id as id,
                lau.location_id,
                IF(p.name IS NOT NULL AND p.name > '', CONCAT(p.name, ',', l.name), l.name ) as name,
                urr.role_id,
                'location_account_user_id' as tbl_id,
                IF(urr.role_id = 1, 'FRP', 'TRP') as role
                FROM location_account_user lau
                INNER JOIN locations l ON lau.location_id = l.location_id
                LEFT JOIN locations p ON l.parent_id = p.location_id
                RIGHT JOIN user_role_relation urr ON lau.user_id = urr.user_id
                WHERE lau.user_id = ${userId} GROUP BY urr.role_id

                UNION

                SELECT 
                uer.user_em_roles_relation_id as id,
                uer.location_id,
                IF(p.name IS NOT NULL AND p.name > '', CONCAT(p.name, ',', l.name), l.name ) as name,
                uer.em_role_id as role_id,
                'user_em_roles_relation_id' as tbl_id,
                em.role_name as role
                FROM user_em_roles_relation uer
                INNER JOIN em_roles em ON uer.em_role_id = em.em_roles_id
                INNER JOIN locations l ON uer.location_id = l.location_id
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE uer.user_id = ${userId} `;
           
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

    public getUserInLocationByRole(roleId=0, accountId=0, userId?): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }                
                let id = this.ID();
                if (userId) {
                    id = userId;
                }
                const sql = `SELECT
                                users.first_name,
                                users.last_name,
                                users.email,
                                location_account_user.location_id,
                                locations.name,
                                IF (parent.name IS NULL, '', parent.name) as Building,
                                accounts.account_name,
                                IF (locations.is_building = 1, locations.location_id, locations.parent_id) as building_id
                            FROM
                                users
                            INNER JOIN
                                location_account_user
                            ON ( 
                                users.user_id = location_account_user.user_id
                                AND users.account_id = location_account_user.account_id
                            )
                            INNER JOIN
                                user_role_relation ON users.user_id = user_role_relation.user_id
                            INNER JOIN
                                accounts
                            ON
                                accounts.account_id = users.account_id
                            INNER JOIN
                                locations
                            ON
                                location_account_user.location_id = locations.location_id
                            LEFT JOIN
                                locations as parent
                            ON
                                locations.parent_id = parent.location_id
                            WHERE
                                user_role_relation.role_id = ?
                            AND
                                users.user_id = ?
                            AND
                            location_account_user.account_id = ?
                `;
                connection.query(sql, [roleId, id, accountId], (error, results) => {
                    if (error) {
                        return console.log(error);
                    }                
                    resolve(results);

                });
                connection.release();
            });
        });
    }

}