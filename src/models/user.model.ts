

import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { UtilsSync } from './util.sync';

const dbconfig = require('../config/db');

import * as Promise from 'promise';
import * as validator from 'validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';

export class User extends BaseClass {

    public static getByToken(token: string) {
        return new Promise((resolve, reject) => {
            const parts = token.split(' ');

            if (parts.length === 2 && parts[0] === 'Bearer') {
                try {
                    const decoded = jwt.verify(parts[1], process.env.KEY);
                    console.log(decoded);
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

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE user_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    console.log(`${error} and sql is ${sql_load}`);
                    throw error;
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
            connection.end();
        });
    }

    public getByEmail(email: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE email = ?';
            const param = [email];
            const connection = db.createConnection(dbconfig);
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
            connection.end();
        });
    }

    public getByUsername(username: String) {
        console.log(username);
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE user_name = ?';
            const param = [username];
            const connection = db.createConnection(dbconfig);
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
            connection.end();
        });
    }

    loadByCredentials(username: string, passwd: string) {
        return new Promise((resolve, reject) => {
            let whereClause = '';
            if (validator.isEmail(username)) {
                whereClause = 'WHERE email = ?';
            } else {
                whereClause = 'WHERE user_name = ?';
            }
            const sql_user = `SELECT users.*, token.verified, token.expiration_date, token.action, token.token_id FROM users
                              LEFT JOIN token ON users.user_id = token.id `
                              + whereClause + ` AND password = ?`;
            // const sql_user = `SELECT * FROM users `+ whereClause + ` AND password = ? `;

            console.log('sql_user', sql_user);
            const newPasswd = md5('Ideation' + passwd + 'Max');
            const credential = [username, newPasswd];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_user, credential, (error, results, fields) => {
                if (error) {
                    console.log(sql_user);
                    throw error;
                }
                if (!results.length) {
                    reject('Invalid user');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0].user_id);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
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
            user_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const user = [
            ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
            ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
            ('email' in this.dbData) ? this.dbData['email'].toLowerCase() : '',
            ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
            ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : ' ',
            ('occupation' in this.dbData) ? this.dbData['occupation'] : '',
            ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : '0',
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('can_login' in this.dbData) ? this.dbData['can_login'] : '0',
            ('password' in this.dbData) ? this.dbData['password'] : '',
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
            ('user_name' in this.dbData) ? this.dbData['user_name'] : null
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['user_id'] = this.id;
                resolve(true);
            });
            connection.end();

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
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
            user_name = ?
            WHERE user_id = ?
            `;
            const user = [
            ('first_name' in this.dbData) ? this.dbData['first_name'] : null,
            ('last_name' in this.dbData) ? this.dbData['last_name'] : null,
            ('email' in this.dbData) ? this.dbData['email'].toLowerCase() : '',
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
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err + ' ' + sql_update);
                }
                resolve(true);
            });
            connection.end();
        }); // end Promise
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
                this.dbData[key] = createData[key];
            }
            if ('user_id' in createData) {
                this.id = createData.user_id;
            }
            resolve(this.write());
        });
    }

    public getAll(limit:number, orderBy:String, order:String){
        return new Promise((resolve, reject) => {
            limit = (limit) ? limit : 25;
            orderBy = (orderBy) ? orderBy : 'user_id';
            order = (order) ? order : 'DESC';
            const sql_load = "SELECT * FROM users ORDER BY "+orderBy+" "+order+" LIMIT "+limit+"";
            const param = [ ];
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

    public getAdmins(limit?){
        return new Promise((resolve, reject) => {
            let sql_load = "SELECT * FROM users WHERE evac_role = 'admin' AND archived = 0";
            if(limit){
                sql_load += " LIMIT "+limit;
            }
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

    public getByAccountId(accountId, archived?, search?): any {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM users WHERE account_id = ? AND archived = ? ';
            if(search){
                sql_load += ' AND CONCAT(first_name, " ", last_name) LIKE "%'+search+'%" ';
            }
            if(!archived){
                archived = 0;
            }
            const param = [accountId, archived];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                this.dbData = results;
                resolve(results);
            });
            connection.end();
        });
    }

    public getImpairedByAccountId(accountId, archived?) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM users WHERE account_id = ? AND archived = ? AND mobility_impaired = 1';
            if(!archived){
                archived = 0;
            }
            const param = [accountId, archived];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                this.dbData = results;
                resolve(results);
            });
            connection.end();
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
          certifications.user_id = ? ${filterStr}`;


      const connection = db.createConnection(dbconfig);
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
      connection.end();
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

            const connection = db.createConnection(dbconfig);
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
        });
    }

    public getWithoutToken() {
        return new Promise((resolve, reject) => {
            const sql = ` SELECT * FROM users WHERE user_id NOT IN (SELECT id FROM token WHERE id_type = 'user_id' AND verified = 0) `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql,  (error, results, fields) => {

                resolve(results);

            });
        });
    }

    public query(queries){
        return new Promise((resolve, reject) => {
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
            // console.log(sql_load);
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    console.log(sql_load);
                    return console.log(error);
                }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getAllActive(accountId?, count?){
        return new Promise((resolve, reject) => {
            let accntWhere = (accountId) ? ' AND users.account_id = '+accountId : '';
            let sql_load =  ` 
                SELECT users.*, accounts.account_name FROM users INNER JOIN accounts ON users.account_id = accounts.account_id 
                WHERE users.archived = 0 ${accntWhere} `;
            if(count){
                sql_load =  ` SELECT COUNT(users.user_id) as count FROM users INNER JOIN accounts ON users.account_id = accounts.account_id 
                WHERE users.archived = 0 ${accntWhere} `;
            }
            const param = [ ];
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

    public getSpliceUsers(accountId: number = 0, filter = {}): Promise<Array<number>> {
      return new Promise((resolve, reject) => {
        let page = 0;
        const resultSet = [];
        let sql;
        if ('page' in filter) {
          page = Math.abs(parseInt(filter['page'], 10)) * 10;
          sql = `SELECT user_id FROM users WHERE account_id = ? LIMIT 10 OFFSET ${page}`;
        }
        if ('query' in filter && filter['query'].length > 0) {
          sql = `SELECT user_id FROM users WHERE account_id = ? AND
          first_name LIKE '%${filter['query']}%' OR last_name LIKE '%${filter['query']}%'
          OR email like '%${filter['query']}%'
          LIMIT 10`;
        }
        if ('query' in filter && filter['query'] == 'all') {
          sql = `SELECT user_id FROM users WHERE account_id = ? AND archived = 0`;
        }
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [accountId], (error, results) => {
          if (error) {
            console.log('user.model.getSpliceUsers', error, sql);
            throw Error('Internal server error. Cannot get users for the account');
          }
          for (const r of results) {
            resultSet.push(r['user_id']);
          }
          resolve(resultSet);
        });
        connection.end();
      });
    }

    public getIsFrpTrp(accountId?, count?, limit?, locationIds?){
        return new Promise((resolve, reject) => {
            let select = `
                users.user_id, users.first_name, users.last_name, users.email, users.account_id, users.mobility_impaired,
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
            
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    console.log('sql_load', sql_load);
                    return console.log(error);
                }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getIsEm(accountId?, count?, limit?, locationIds?){
        return new Promise((resolve, reject) => {
            let select = `
                users.user_id, users.first_name, users.last_name, users.email, users.account_id, users.mobility_impaired,
                users.last_login, users.mobile_number, users.phone_number, 
                DATE_FORMAT(users.last_login, '%d/%m/%Y') as last_login_formatted, accounts.account_name
            `;
            if(count){
                select = ' COUNT(users.user_id) as count '
            }
            
            let where = '';
            if(accountId){
                where += ` AND users.account_id IN (${accountId})  `;
            }

            let whereLocations = (locationIds) ? ` WHERE location_id IN (${locationIds}) ` : '';
            where += ` AND users.user_id IN (SELECT user_id FROM user_em_roles_relation ${whereLocations} )  `;

            let offsetLimit = (limit) ? ' LIMIT '+limit : '';

            let sql_load = `SELECT ${select} FROM users INNER JOIN accounts ON users.account_id = accounts.account_id WHERE users.archived = 0 ${where} ${offsetLimit} `;

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    console.log('sql_load', sql_load);
                    return console.log(error);
                }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();
        });
    }

}