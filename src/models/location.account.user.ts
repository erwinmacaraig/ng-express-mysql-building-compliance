import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class LocationAccountUser extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_account_user_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('Record not found');
                }else{
                    this.dbData = results[0];
                    this.setID(results[0]['location_account_user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM location_account_user WHERE location_account_user_id = ? LIMIT 1`;
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

    public getLocationsByUserIdAndAccountId(userId, accntId){
        return new Promise((resolve) => {

            let sql = `
            SELECT
                lau.location_account_user_id, l.formatted_address, l.name, l.location_id, l.parent_id, l.is_building, lp.name as parent_name
            FROM location_account_user lau
            INNER JOIN locations l ON lau.location_id = l.location_id
            LEFT JOIN locations lp ON lp.location_id = l.parent_id
            WHERE lau.user_id = ${userId} AND lau.account_id = ${accntId} AND l.archived = 0
            `;

            const connection = db.createConnection(dbconfig);
            connection.query(sql, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();


        });
    }

    public getMany(arrWhere){
        return new Promise((resolve, reject) => {
            let sql_load = '',
            sqlWhere = '',
            count = 0;

            sql_load = ` SELECT l.formatted_address, l.name, l.location_id, l.parent_id, l.is_building,
            lau.user_id, lau.account_id, urr.role_id, lau.location_account_user_id, lau.archived,
            er.role_name as er_role_name, DATEDIFF(NOW(), u.last_login) AS days,
            u.last_login, er.em_roles_id, u.mobility_impaired, lp.name as parent_name
            FROM location_account_user lau
            INNER JOIN locations l ON l.location_id = lau.location_id
            INNER JOIN users u ON lau.user_id = u.user_id
            LEFT JOIN user_role_relation urr ON urr.user_id = u.user_id
            LEFT JOIN user_em_roles_relation uer ON uer.user_id = lau.user_id AND uer.location_id = lau.location_id
            LEFT JOIN em_roles er ON er.em_roles_id = uer.em_role_id
            LEFT JOIN locations lp ON lp.location_id = l.parent_id
            `;

            for(let i in arrWhere){
                if(count == 0){
                    sqlWhere += ' WHERE ';
                }else{
                    sqlWhere += ' AND ';
                }
                if(arrWhere[i][0].indexOf('.') > 0){
                    sqlWhere += arrWhere[i][0]+' ';
                }else{
                    sqlWhere += 'lau.'+arrWhere[i][0]+' ';
                }

                count++;
            }

            if(arrWhere.length > 0){
                sqlWhere += ' AND l.archived = 0 ';
            }else{
                sqlWhere += ' WHERE l.archived = 0 ';
            }

            sql_load += sqlWhere + ' GROUP BY lau.location_account_user_id ';

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    console.log(sql_load);
                    reject(error);
                    return console.log(error);
                }
                this.dbData = results;
                resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id = ?';
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length) {
                    reject('Record not found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['location_account_user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE account_id = ?';
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('Record not found');
                }else{
                    this.dbData = results[0];
                    this.setID(results[0]['location_account_user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getManyLocationsByAccountIdAndUserIds(accountId, userIds) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE account_id = ? AND user_id IN ('+userIds+')';
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

    public getByLocationIdAndUserId(locationIds, userId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id IN ('+locationIds+') AND user_id = ?';
            const param = [userId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                if (!results.length) {
                    reject('No record found');
                } else {
                    this.dbData = results;
                    resolve(this.dbData);
                }

            });
            connection.end();
        });
    }

    public getUsersInLocationId(locationIds) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT lau.*, u.first_name, u.last_name, u.email FROM location_account_user lau INNER JOIN users u ON lau.user_id = u.user_id WHERE lau.location_id IN ('+locationIds+') ';
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

    public getByLocationIdAndAccountId(locationIds, accntId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id IN ('+locationIds+') AND account_id IN (?)';
            const param = [accntId];
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

    public getWardensByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, lau.location_id, er.em_roles_id, er.is_warden_role
            FROM users u
            LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
            LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
            LEFT JOIN location_account_user lau ON lau.user_id = u.user_id
            WHERE u.account_id = ? AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('Record not found');
                }else{
                    this.dbData = results;
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getWardensByAccountIdLocationId(accountId, locId){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, lau.location_id, er.em_roles_id, er.is_warden_role
            FROM users u
            LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
            LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
            LEFT JOIN location_account_user lau ON lau.user_id = u.user_id
            WHERE u.account_id = ? AND lau.location_id = ? AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId, locId];
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

    public getWardensByAccountIdWhereInLocationId(accountId, locIds){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, uem.location_id, er.em_roles_id, er.is_warden_role
            FROM users u
            LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
            LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
            WHERE u.account_id = ? AND uem.location_id IN (`+locIds+`) AND u.archived = 0 GROUP BY u.user_id`;
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

    public getFrpTrpByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT ur.role_id, u.*, lau.location_id
            FROM location_account_user lau
            INNER JOIN users u
            ON lau.user_id = u.user_id
            INNER JOIN user_role_relation ur
            ON ur.user_id = u.user_id
            WHERE lau.account_id = ? AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('Record not found');
                }else{
                    this.dbData = results;
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getByUserId(UserId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE user_id = ?';
            const param = [UserId];
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

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE location_account_user SET
            location_id = ?, account_id = ?, user_id = ?, archived = ?
            WHERE location_account_user_id = ? `;
            const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
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
            const sql_insert = `INSERT INTO location_account_user (
            location_id,
            account_id,
            user_id
            ) VALUES (?,?,?)
            `;
            const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, param, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['location_account_user_id'] = this.id;
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
            if ('location_account_user_id' in createData) {
                this.id = createData.location_account_user_id;
            }
            resolve(this.write());
        });
    }

    public getManyByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id = ?';
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

    public listRolesOnLocation(role: number = 0, location_id: number = 0) {
      return new Promise((resolve, reject) => {
        const resultSetObj = {};
        let role_filter = '';
        const seenAccountsArr = [];
        if (role) {
           role_filter = ` AND user_role_relation.role_id = ${role}`;
        }
        if (!location_id) {
          reject('Cannot get info without location id');
        }
        const sql_get_list = `SELECT
        accounts.account_name,
                      users.first_name,
                      users.last_name,
                      location_account_user.*
         from location_account_user
        INNER JOIN user_role_relation ON user_role_relation.user_id = location_account_user.user_id
        INNER JOIN users ON users.user_id = location_account_user.user_id
        INNER JOIN accounts ON accounts.account_id = users.account_id
          WHERE
          location_account_user.location_id = ?
          ${role_filter}
            `;
        // console.log(sql_get_list);
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_list, [location_id], (error, results, fields) => {
          if (error) {
            console.log('location.account.user.listRolesOnLocation', error, sql_get_list);
            throw new Error('Cannot generate list');
          }
          if (!results.length) {
            reject('There are no role(s) for this location');
          } else {
            for (let i = 0; i < results.length; i++) {
              if (results[i]['account_id'] in resultSetObj) {
                (resultSetObj[results[i]['account_id']]['trp']).push(results[i]['first_name'] + ' ' + results[i]['last_name']);
                (resultSetObj[results[i]['account_id']]['user_id']).push(results[i]['user_id']);
              } else {
                resultSetObj[results[i]['account_id']] = {
                  'account_name': results[i]['account_name'],
                  'trp': [results[i]['first_name'] + ' ' + results[i]['last_name'] ],
                  'user_id': [results[i]['user_id']],
                  'account_id': results[i]['account_id'],
                  'location_id': results[i]['location_id']
                };
              }
              if (seenAccountsArr.indexOf(results[i]['account_id']) === -1) {
                seenAccountsArr.push(results[i]['account_id']);
              }
            }
            resolve(resultSetObj);
          }
        });
        connection.end();
      });
    }

    /**
     * @method getAllAccountsInSublocations
     * @param locations
     * retrieve all accounts under the given list of
     * sub locations on which the roles are TRP ONLY
     */
  public getAllAccountsInSublocations(locations = []) {
    return new Promise((resolve, reject) => {
      const locationsStr = locations.join(',');
      const sql = `SELECT
        accounts.account_id,
        accounts.account_name,
        locations.location_id,
        locations.name,
        locations.formatted_address,
        locations.is_building,
        LAU.user_id,
        users.first_name,
        users.last_name,
        users.phone_number,
        users.mobile_number,
        users.email
      FROM
        location_account_user LAU
      INNER JOIN
        accounts
      ON
        accounts.account_id = LAU.account_id
      INNER JOIN
        locations
      ON
        locations.location_id = LAU.location_id
      INNER JOIN
        users
      ON
        users.user_id = LAU.user_id
      WHERE
        locations.location_id IN (${locationsStr})
      ORDER BY
        accounts.account_name`;

    const connection = db.createConnection(dbconfig);
    connection.query(sql, [], (error, results, fields) => {
      if (error) {
        console.log('location.account.user.model.getAllAccountsInSublocations', error, sql);
        throw Error('Cannot process request');
      }
      if (results.length > 0) {
        resolve(results);
      } else {
        reject('There are no records to be retrieve');
      }
    });
  });
  }


}
