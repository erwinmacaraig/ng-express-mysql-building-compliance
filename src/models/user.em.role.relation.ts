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

    public getEmRolesByUserId(userId) {
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
                      l.google_photo_url
                    FROM em_roles er
                    INNER JOIN user_em_roles_relation uer ON er.em_roles_id = uer.em_role_id
                    LEFT JOIN locations l ON l.location_id = uer.location_id
                    WHERE uer.user_id = ?`;
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

    public getUserLocationByAccountIdAndLocationIds(accountId, locIds) {
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
                      u.first_name,
                      u.last_name,
                      u.user_id,
                      u.email
                    FROM em_roles er
                    INNER JOIN user_em_roles_relation uer ON er.em_roles_id = uer.em_role_id
                    INNER JOIN users u ON u.user_id = uer.user_id
                    LEFT JOIN locations l ON l.location_id = uer.location_id
                    WHERE u.account_id = ${accountId} AND l.location_id IN (${locIds})`;

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
        let whereClause = 'WHERE 1=1';
        if ('user_id' in filter) {
          whereClause += ` AND user_id = ${filter['user_id']}`;
        }
        if ('location_id' in  filter) {
          whereClause += ` AND location_id = ${filter['location_id']}`;

        }
        const sql_get_roles = `SELECT em_role_id FROM user_em_roles_relation ${whereClause}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_roles, [], (error, results, fields) => {
          if (error) {
            console.log('user.em.role.relation.getEmRolesFilterBy', error, sql_get_roles);
            throw new Error('Cannot get roles');
          }
          if (results.length > 0) {
            resolve(results);
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
                  location_id = ?
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
              users.push(results[0]['user_id']);
            }
            resolve({
              'raw': results,
              'users': users
            });
          } else {
            reject('No records can be retrieve.');
          }
        });
        connection.end();
      });
    }
}
