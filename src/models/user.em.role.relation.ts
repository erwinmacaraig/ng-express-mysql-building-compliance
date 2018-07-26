import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class UserEmRoleRelation extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM user_em_roles_relation WHERE user_em_roles_relation_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('No role found');
                }else{
                    this.dbData = results[0];
                    this.setID(results[0]['user_em_roles_relation_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getEmRolesByUserId(userId, archived?) {
        archived = (archived) ? archived : 0;
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT
                      uer.user_em_roles_relation_id,
                      er.role_name,
                      er.is_warden_role,
                      uer.location_id,
                      er.em_roles_id,
                      l.name as location_name,
                      l.name,
                      l.parent_id,
                      l.location_id,
                      l.formatted_address,
                      l.google_place_id,
                      l.google_photo_url,
                      l.is_building,
                      l.admin_verified,
                      l.archived
                    FROM em_roles er
                    INNER JOIN user_em_roles_relation uer ON er.em_roles_id = uer.em_role_id
                    LEFT JOIN locations l ON l.location_id = uer.location_id
                    WHERE uer.user_id = ? AND l.archived = ${archived}`;
            const uid = [userId];
            const connection = db.createConnection(dbconfig);

            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('No role found');
                }else{
                    this.dbData = results;
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getUserLocationByAccountIdAndLocationIds(accountId, locIds, archived = 0) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT
                      uer.user_em_roles_relation_id,
                      er.role_name,
                      er.is_warden_role,
                      uer.location_id,
                      er.em_roles_id,
                      l.name as location_name,
                      l.parent_id,
                      l.formatted_address,
                      l.google_place_id,
                      l.google_photo_url,
                      l.admin_verified,
                      l.is_building,
                      l.archived,
                      u.first_name,
                      u.last_name,
                      u.user_id,
                      u.email
                    FROM em_roles er
                    INNER JOIN user_em_roles_relation uer ON er.em_roles_id = uer.em_role_id
                    INNER JOIN users u ON u.user_id = uer.user_id
                    LEFT JOIN locations l ON l.location_id = uer.location_id
                    WHERE u.account_id = ${accountId} AND l.location_id IN (${locIds}) AND l.archived = ${archived} AND u.archived = 0`;

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

    public getEmRoles() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM em_roles`;
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

    public getEmRolesFilterBy(filter: object = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const em_roles = [];
        const user_ids = [];
        const location_ids = [];
        let whereClause = 'WHERE 1=1';
        if ('user_id' in filter) {
          whereClause += ` AND user_id = ${filter['user_id']}`;
        }
        if ('location_id' in  filter) {
          whereClause += ` AND location_id = ${filter['location_id']}`;
        }
        if ('distinct' in filter) {
          whereClause += ` GROUP BY ${filter['distinct']}`;
        }
        const sql_get_roles = `SELECT em_role_id, location_id, user_id FROM user_em_roles_relation ${whereClause}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_roles, [], (error, results, fields) => {
          if (error) {
            console.log('user.em.role.relation.getEmRolesFilterBy', error, sql_get_roles);
            throw new Error('Cannot get roles');
          }
          if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
              em_roles.push(results[i]['em_role_id']);
              user_ids.push(results[i]['user_id']);
              location_ids.push(results[i]['location_id']);
            }
            resolve([em_roles, location_ids, user_ids]);
          } else {
            reject('Cannot get emergency roles');
          }
        });
        connection.end();
      });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO user_em_roles_relation (
            user_id,
            em_role_id,
            location_id
            ) VALUES (?, ?, ?)
            `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('em_role_id' in this.dbData) ? this.dbData['em_role_id'] : null,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : null
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                resolve(true);
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE user_em_roles_relation SET user_id = ?, em_role_id = ?, location_id = ? WHERE user_em_roles_relation_id = ? `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('em_role_id' in this.dbData) ? this.dbData['em_role_id'] : null,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : null,
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
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
            if ('user_em_roles_relation_id' in createData) {
                this.id = createData.user_em_roles_relation_id;
            }
            resolve(this.write());
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM user_em_roles_relation WHERE user_em_roles_relation_id = ? LIMIT 1`;
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

    public getEMRolesOnAccountOnLocation(em_role: number = 0, account_id: number = 0, location_id: number = 0) {
      return new Promise((resolve, reject) => {
        let role_filter = '';
        if (em_role) {
          role_filter = ` AND em_role_id = ${em_role}`;
        }
        if (!account_id || !location_id) {
          reject('Missing data to retrieve record (account id or location id)');
        }
        const sql = `SELECT
                    users.user_id,
                    location_id,
                    em_role_id,
                    users.first_name,
                    users.last_name
                FROM
                  user_em_roles_relation
                INNER JOIN
                  users
                ON
                  user_em_roles_relation.user_id = users.user_id
                WHERE
                  users.account_id = ?
                AND
                  location_id = ? AND users.archived = 0
                ${role_filter}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [account_id, location_id], (error, results, fields) => {
          if (error) {
            console.log('user.em.role.relation.getEMRolesOnAccountOnLocation', sql, error);
            throw new Error('Cannot retrieve the role(s) on location');
          }
          const users = [];
          if (results.length > 0) {
            for (let i = 0; i < results.length; i++) {
              users.push(results[i]['user_id']);
            }
            resolve({
              'raw': Object.keys(results).map((key) =>  { return results[key]; }),
              'users': users
            });
          } else {
            resolve({
              'raw': [],
              'users': []
            });
          }
        });
        connection.end();
      });
    }

    public getUsersByAccountId(accountId, archived?){
        archived = (archived) ? archived : 0;

        return new Promise((resolve, reject) => {
            let sql_load = `
                SELECT
                    u.*, em.em_role_id, em.location_id, er.role_name
                FROM user_em_roles_relation em
                INNER JOIN users u ON em.user_id = u.user_id
                INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id
                WHERE u.account_id = ? AND u.archived = ?
            `;
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

    public getUsersInLocationIds(locationIds, archived?, config = {}): Promise<Array<object>> {
        archived = (archived) ? archived : 0;

        return new Promise((resolve, reject) => {
          let configFilter = '';
          if ('searchKey' in config && config['searchKey'].length > 0) {
            configFilter += `AND CONCAT(u.first_name, ' ', u.last_name) LIKE "%${config['searchKey']}%" `;
          }
          if('account_id' in config){
              configFilter += ` AND u.account_id = ${config['account_id']} `;
          }

          if(locationIds.length > 0){
              configFilter += ` AND l.location_id IN (${locationIds}) `;
          }

          let 
          limitQuery = ('limit' in config) ? ' LIMIT '+config['limit'] : '',
          selectQuery = ('count' in config) ? ' COUNT(u.user_id) as count ' : `
                    u.*, em.em_role_id,
                    er.role_name,
                    accounts.account_name,
                    l.name,
                    IF(p.name IS NOT NULL, CONCAT(p.name, ' ', l.name), l.name) as location_name,
                    l.location_id`;

            const sql_load = `
                SELECT ${selectQuery}
                FROM user_em_roles_relation em
                INNER JOIN users u ON em.user_id = u.user_id
                INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id
                INNER JOIN locations l ON l.location_id = em.location_id
                INNER JOIN locations p ON p.location_id = l.parent_id
                INNER JOIN accounts ON accounts.account_id = u.account_id
                WHERE u.archived = ${archived} ${configFilter} ${limitQuery}`;

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                resolve(results);
            });
            connection.end();
        });
    }

    public getWardensInLocationIds(locationIds, archived?, accountid?){
        archived = (archived) ? archived : 0;

        return new Promise((resolve, reject) => {
            let sql_load = `
                SELECT
                    u.*, em.em_role_id, er.role_name
                FROM user_em_roles_relation em
                INNER JOIN users u ON em.user_id = u.user_id
                INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id
                INNER JOIN locations l ON l.location_id = em.location_id
                WHERE u.archived = `+archived+` AND er.em_roles_id IN (9,10)
            `;
            if(accountid){
                sql_load += ` AND u.account_id = `+accountid;
            }

            if(locationIds){
                sql_load += ` AND l.location_id IN (${locationIds}) `;
            }

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                this.dbData = results;
                resolve(results);
            });
            connection.end();
        });
    }

    public getCountWardensInLocationIds(locationIds, archived?){
        archived = (archived) ? archived : 0;

        return new Promise((resolve, reject) => {
            let sql_load = `
                SELECT
                    COUNT(em.user_em_roles_relation_id) as count
                FROM user_em_roles_relation em
                INNER JOIN users u ON em.user_id = u.user_id
                INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id
                INNER JOIN locations l ON l.location_id = em.location_id
                WHERE u.archived = `+archived+` AND er.is_warden_role = 1
            `;

            if(locationIds.length > 0){
                sql_load += ` AND em.location_id IN (${locationIds}) `;
            }

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
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
     * @param users
     * array of user ids
     * @param location
     * array of location ids
     * @description
     * return an object that has the location_id as the key and data as an array that holds user id, em role id and role name
     * hence r[location_id] = {data[{user_id: 0, em_role_id: 9, 'em_role_name': 'Warden'}]}
     *
     * This does not handle reject, only resolve that is why you do not have to have it in try-catch clause
     */
    public getEmergencyRolesOfUsersInLocations(users = [],  location = []) {
      return new Promise((resolve, reject) => {
        let usersStr = '';
        let locationStr = '';
        const r = {};
        if (!users.length) {
          resolve({});
          return;
        }
        if (!location.length) {
          resolve({});
          return;
        }
        usersStr = users.join(',');
        locationStr = location.join(',');

        const sql = `SELECT
                      user_id,
                      em_role_id,
                      location_id,
                      role_name
                    FROM
                      user_em_roles_relation
                    INNER JOIN
                      em_roles
                    ON
                      user_em_roles_relation.em_role_id = em_roles.em_roles_id
                    WHERE location_id IN (${locationStr}) AND user_id IN (${usersStr});`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [], (error, results, fields) => {
          if (error) {
            console.log(error, 'user.em.role.relation.getEmergencyRolesOfUsersInLocations', sql);
            throw Error('Cannot perform query');
          }
          if (!results.length) {
            resolve({});
          } else {
            for (let i = 0; i <  results.length; i++) {
              if (results[i]['location_id'] in r) {
                (r[results[i]['user_id']]['data']).push({
                  'em_role_id': results[i]['em_role_id'],
                  'user_id': results[i]['user_id'],
                  'em_role_name': results[i]['role_name']
                });
              } else {
                r[results[i]['location_id']] = {
                  'data': [{
                    'em_role_id': results[i]['em_role_id'],
                    'user_id': results[i]['user_id'],
                    'em_role_name': results[i]['role_name']
                  }]
                };
              }
            }
            resolve(r);
          }
        });
        connection.end();
      });

    }

    public getManyByUserIds(userIds) {
      return new Promise((resolve, reject) => {
          const sql_load = 'SELECT em.*, er.role_name  FROM user_em_roles_relation em INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id WHERE em.user_id IN ('+userIds+')';
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

    public getLocationsByUserIds(userIds, locId?) {
        return new Promise((resolve, reject) => {
            let whereLoc = (locId) ? ` AND uemr.location_id = ${locId} ` : '';

            const sql_load = `SELECT
                    uemr.user_id,
                    uemr.em_role_id as role_id,
                    er.role_name,
                    l.name,
                    l.parent_id,
                    l.location_id,
                    l.formatted_address,
                    l.google_place_id,
                    l.google_photo_url,
                    l.is_building,
                    IF(ploc.name IS NOT NULL, CONCAT( IF(TRIM(ploc.name) <> '', CONCAT(ploc.name, ', '), ''), l.name), l.name) as name,
                    ploc.name as parent_name
                    FROM user_em_roles_relation uemr
                    INNER JOIN locations l ON l.location_id = uemr.location_id
                    LEFT JOIN locations ploc ON ploc.location_id = l.parent_id
                    INNER JOIN em_roles er ON er.em_roles_id = uemr.em_role_id
                    WHERE uemr.user_id IN (`+userIds+`) ${whereLoc} `;

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

    public getWhere(where) {
        return new Promise((resolve, reject) => {
            let whereSql = '',
                count = 0;
            for(let w of where){
                if(count == 0){
                    whereSql += ' WHERE ';
                }else{
                    whereSql += ' AND ';
                }

                whereSql += w;
                count++;
            }

            const sql_load = 'SELECT em.*, er.role_name  FROM user_em_roles_relation em INNER JOIN em_roles er ON em.em_role_id = er.em_roles_id '+whereSql;
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
}
