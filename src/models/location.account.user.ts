import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');
const defs = require('../config/defs');

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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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

              connection.release();
            });
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM location_account_user WHERE location_account_user_id = ? LIMIT 1`;
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_del, [this.ID()], (error, results, fields) => {
                if (error) {
                    console.log(error);
                    reject('Error deleting record');

                } else {
                    resolve(true);
                }
              });
                 
              connection.release();
            });
            
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

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql, (error, results, fields) => {
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

    public getLocationsByUserIds(userIds, locId?, roleIds?) {
        return new Promise((resolve, reject) => {
            let whereLoc = (locId) ? ` AND lau.location_id IN (${locId}) ` : '';
            let whereRoles = (locId && locId.length > 0 && roleIds) ? ` AND urr.role_id IN ${roleIds} ` : '';

            const sql_load = `SELECT
                    lau.location_account_user_id,
                    lau.user_id,
                    IF(urr.role_id IS NOT NULL, IF(urr.role_id = 1, 'FRP', 'TRP'), '') as role_name,
                    IF(urr.role_id IS NOT NULL, urr.role_id, '') as role_id,
                    l.parent_id,
                    l.location_id,
                    l.formatted_address,
                    l.google_place_id,
                    l.google_photo_url,
                    l.is_building,
                    IF(ploc.name IS NOT NULL, CONCAT( IF(TRIM(ploc.name) <> '', CONCAT(ploc.name, ', '), ''), l.name), l.name) as name,
                    ploc.name as parent_name
                    FROM location_account_user lau
                    INNER JOIN locations l ON l.location_id = lau.location_id
                    LEFT JOIN locations ploc ON ploc.location_id = l.parent_id
                    INNER JOIN user_role_relation urr ON urr.user_id = lau.user_id
                    WHERE lau.user_id IN (`+userIds+`) ${whereLoc} ${whereRoles} `;

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
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

    public getByUserIds(userIds = ''){
        return new Promise((resolve, reject) => {
             
            const sql_load = `SELECT * FROM location_account_user WHERE user_id IN (${userIds}) `;

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
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

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_load, (error, results, fields) => {
                  if (error) {
                      console.log(sql_load);
                      reject(error);
                      return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
              });
                 
              connection.release();
            });
        });
    }

    public getByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id = ?';
            const param = [locationId];
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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
                 
              connection.release();
            });
        });
    }

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE account_id = ?';
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
                      reject('Record not found');
                  }else{
                      this.dbData = results[0];
                      this.setID(results[0]['location_account_user_id']);
                      resolve(this.dbData);
                  }
              });
                 
              connection.release();
            });
        });
    }

    public getManyLocationsByAccountIdAndUserIds(accountId, userIds) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE account_id = ? AND user_id IN ('+userIds+')';
            const param = [accountId];
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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

    public getByLocationIdAndUserId(locationIds, userId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id IN ('+locationIds+') AND user_id = ?';
            const param = [userId];
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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
                 
              connection.release();
            });
        });
    }

    public getUsersInLocationId(locationIds = []): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const ids = locationIds.join(',');
            const sql_load =
            `SELECT
                user_role_relation.role_id,
                user_role_relation.user_role_relation_id,
                IF (user_role_relation.role_id = 1, 'Facility Responsible Person', 'Tenancy Responsible Person') as role_name,
                lau.*,
                u.first_name,
                u.last_name,
                u.email,
                accounts.account_name,
                locations.name
              FROM
                  location_account_user lau
              INNER JOIN
                  users u
              ON
                  lau.user_id = u.user_id
              INNER JOIN
                  user_role_relation
              ON
                  u.user_id = user_role_relation.user_id
              INNER JOIN
                locations
              ON
                locations.location_id = lau.location_id
              INNER JOIN accounts
              ON
                accounts.account_id = u.account_id
              WHERE
                  lau.location_id IN (${ids})`;
            
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

    public getByLocationIdAndAccountId(locationIds, accntId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id IN ('+locationIds+') AND account_id IN (?)';
            const param = [accntId];
            
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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

    public getWardensByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, lau.location_id, er.em_roles_id, er.is_warden_role
            FROM users u
            LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
            LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
            LEFT JOIN location_account_user lau ON lau.user_id = u.user_id
            WHERE u.account_id = ? AND u.archived = 0 GROUP BY u.user_id`;
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
                      reject('Record not found');
                  }else{
                      this.dbData = results;
                      resolve(this.dbData);
                  }
              });
                 
              connection.release();
            });
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
             
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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

    public getWardensByAccountIdWhereInLocationId(accountId, locIds){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, uem.location_id, er.em_roles_id, er.is_warden_role
            FROM users u
            LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
            LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
            WHERE u.account_id = ? AND uem.location_id IN (`+locIds+`) AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId];
            
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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
                 
              connection.release();
            });

        });
    }

    public getTrpByLocationIds(locationIds){
        return new Promise((resolve, reject) => {
            const sql_load = `
            SELECT ur.role_id, lau.location_id, a.account_name,
                u.first_name,
                u.last_name,
                u.email,
                IF(u.phone_number IS NOT NULL, u.phone_number, '') as phone_number,
                IF(u.mobile_number IS NOT NULL, u.mobile_number, '') as mobile_number,
                u.occupation,
                u.mobility_impaired,
                u.time_zone,
                u.can_login,
                u.account_id,
                u.evac_role,
                u.user_id
            FROM location_account_user lau
            INNER JOIN users u
            ON lau.user_id = u.user_id
            INNER JOIN accounts a
            ON a.account_id = u.account_id
            INNER JOIN user_role_relation ur
            ON ur.user_id = u.user_id
            WHERE u.archived = 0 AND ur.role_id = 2 AND lau.location_id IN (${locationIds})  GROUP BY u.user_id`;

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
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

    public getByUserId(UserId: Number, getLocationDetails?) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM location_account_user WHERE user_id = ?';
            if(getLocationDetails){
                sql_load = `
                SELECT l.*, lau.location_account_user_id, lau.account_id,
                IF(p.name IS NOT NULL, CONCAT(p.name, ' ', l.name), l.name) as location_name
                FROM location_account_user lau
                INNER JOIN locations l ON lau.location_id = l.location_id
                LEFT JOIN locations p ON l.parent_id = p.location_id
                WHERE user_id = ?
                `;
            }
            const param = [UserId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_insert, param, (err, results, fields) => {
                  if (err) {
                      throw new Error(err);
                  }
                  this.id = results.insertId;
                  this.dbData['location_account_user_id'] = this.id;
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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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
        this.pool.getConnection((err, connection) => {
          if (err) {                    
              throw new Error(err);
          }

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
              // console.log(resultSetObj);
              resolve(resultSetObj);
            }
          });
          connection.release();
        });
         
      });
    }

    /**
     * @method getAllAccountsInSublocations
     * @param locations
     * retrieve all accounts under the given list of
     * sub locations on which the roles are TRP ONLY
     */
    public getAllAccountsInSublocations(locations = []){

        return new Promise((resolve, reject) => {
          this.getLocationDetails(locations).then((sublocations) => {
            for (const sub of sublocations) {
              sub['trp'] = [];
            }
            const locationsStr = locations.join(',');
            const sql_get_tenants = `SELECT
                  accounts.account_name,
                  users.first_name,
                  users.last_name,
                  users.phone_number,
                  users.mobile_number,
                  users.email,
                  locations.name,
                  location_account_user.*
              FROM location_account_user
              INNER JOIN user_role_relation ON user_role_relation.user_id = location_account_user.user_id
              INNER JOIN users ON users.user_id = location_account_user.user_id
              INNER JOIN accounts ON accounts.account_id = users.account_id
              INNER JOIN locations ON locations.location_id = location_account_user.location_id
              WHERE
                location_account_user.location_id IN (${locationsStr})
              AND
                user_role_relation.role_id = ${defs['Tenant']}
              ORDER BY
                accounts.account_name`;

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_get_tenants, [], (error, results, fields) => {
                if (error) {
                  console.log('location.account.user.model.getAllAccountsInSublocations', error, sql_get_tenants);
                  throw Error('Cannot process request');
                }
                for (const s of sublocations) {
                  for (const r of results) {
                    if (s['location_id'] === r['location_id']) {
                      (s['trp']).push(r);
                    }
                  }
                }
                resolve(sublocations);
              });
              connection.release();
            });
            
          });
        });
    }

    private getLocationDetails (locations = []): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
          const foundLocations = [];
          if (locations.length === 0) {
            resolve(foundLocations);
            return;
          }
          const locationsStr = locations.join(',');
          const sql_get_locations = `
            SELECT
              location_id,
              name
            FROM
              locations
            WHERE location_id IN (${locationsStr})
          `;
          
          this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_get_locations, [], (error, results) => {
                if (error) {
                  console.log('location.account.user.getLocationDetails', error, sql_get_locations);
                  throw Error('Internal problem');
                }
                for (const r of results) {
                  foundLocations.push(r);
                }
                resolve(foundLocations);
              });
              connection.release();
          });
        });
    }

    public TRPUsersForNotification(locations = []): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        if (!locations.length) {
          resolve([]);
          return;
        }
        const locationStr = locations.join(',');
        const sql = `SELECT
                        users.user_id,
                        users.first_name,
                        users.last_name,
                        users.email,
                        location_account_user.location_id,
                        'TRP' as role_name,
                        accounts.account_name,
                        parent_location.name as parent_location,
                        locations.name
                      FROM
                        users
                      INNER JOIN
                        location_account_user
                      ON
                        users.user_id = location_account_user.user_id
                      INNER JOIN
                        user_role_relation
                      ON
                        users.user_id = user_role_relation.user_id
                      INNER JOIN
                          accounts
                      ON
                        accounts.account_id = users.account_id
                      INNER JOIN
                        locations
                      ON
                        locations.location_id = location_account_user.location_id
                      LEFT JOIN
                        locations parent_location
                      ON
                        locations.parent_id = parent_location.location_id
                      WHERE
                        location_account_user.location_id IN (${locationStr})
                    AND
                      user_role_relation.role_id = 2`;
                      
        this.pool.getConnection((err, connection) => {
            if (err) {                    
                throw new Error(err);
            }

            connection.query(sql, [], (error, results) => {
              if (error) {
                console.log('Cannot retrieve a record - TRPUsersForNotification');
                throw Error(error);
              }
              resolve(results);
            });
            connection.release();
        });
        
      });
    }

    public getFRPinBuilding(buildingId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw Error(error);
                }
                const sql = `
                SELECT
                    users.user_id,
                    users.first_name,
                    users.last_name,
                    users.email,
                    accounts.account_name,
                    location_account_user.location_id,
                    'FRP' as role_name                   
                FROM
                    users
                INNER JOIN
                    location_account_user
                ON
                    users.user_id = location_account_user.user_id
                INNER JOIN
                    accounts
                ON
                  accounts.account_id = users.account_id
                INNER JOIN
                    user_role_relation
                ON
                    users.user_id = user_role_relation.user_id                
                WHERE
                    location_account_user.location_id = ?
                AND
                    user_role_relation.role_id = 1
                `;
                connection.query(sql, [buildingId],(err, results) => {
                    if (err) {
                        console.log('location_account_user.getFRPinBuilding', err, sql);
                        throw Error(err);                        
                    }
                    resolve(results);
                });
                connection.release();
            });
        });
    }



}
