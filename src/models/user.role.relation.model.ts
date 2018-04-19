import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class UserRoleRelation extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM user_role_relation WHERE user_role_relation_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length) {
                    reject('No role found');
                }else {
                    this.dbData = results[0];
                    this.setID(results[0]['user_role_relation_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    /**
     *
     * @param user_id
     * @param highest_rank
     * @param location
     * @description
     * Gets the highest ACCOUNT ROLE of a particular user
     */
    public getByUserId(user_id, highest_rank: boolean = false, location: number = 0): Promise<any> {
      return new Promise((resolve, reject) => {
          let sql_load = '', param = [];
          sql_load = 'SELECT * FROM user_role_relation WHERE user_id = ?';
          param = [user_id];
          if (location) {
            sql_load = `SELECT
                          *
                        FROM
                          user_role_relation
                        INNER JOIN
                          location_account_user
                        ON
                          user_role_relation.user_id = location_account_user.user_id
                        WHERE
                          location_account_user.user_id = ?
                        AND
                          location_account_user.location_id = ?`;
            param.push(location);

          }
          const connection = db.createConnection(dbconfig);
          connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                  return console.log('user.role.relation.model.getByUserId', error, sql_load);
              }
              if (!results.length) {
                  reject('No role found');
              } else {
                  if (highest_rank) {
                      let r = 100;
                      for (let i = 0; i < results.length; i++) {
                          if (r > parseInt(results[i]['role_id'], 10)) {
                              r = results[i]['role_id'];
                          }
                      }
                      resolve(r);
                  } else {
                      resolve(results);
                  }
              }
          });
          connection.end();
      });
  }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO user_role_relation (
            user_id,
            role_id
            ) VALUES (?, ?)
            `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : null
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
            const sql_update = `UPDATE user_role_relation SET user_id = ?, role_id = ? WHERE user_role_relation_id = ? `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : null,
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
            if ('user_role_relation_id' in createData) {
                this.id = createData.user_role_relation_id;
            }
            resolve(this.write());
        });
    }

    public getManyByUserIds(userIds) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM user_role_relation WHERE user_id IN ('+userIds+')';
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
