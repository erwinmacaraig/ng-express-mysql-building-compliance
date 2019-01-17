
import { BaseClass } from './base.model';
import * as Promise from 'promise';
import { LocationAccountRelation } from './location.account.relation';

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
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

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

                connection.release();
            });
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
          this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

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

              connection.release();
          });
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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_insert, user, (err, results, fields) => {
                  if (err) {
                      throw new Error(err);
                  }
                  resolve(true);
              });

              connection.release();
            });

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
            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql_update, user, (err, results, fields) => {
                  if (err) {
                      throw new Error(err);
                  }
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
            if ('user_role_relation_id' in createData) {
                this.id = createData.user_role_relation_id;
            }
            resolve(this.write());
        });
    }

    public getManyByUserIds(userIds, roleIds?) {
        return new Promise((resolve, reject) => {
            const
            roleidsQ = (roleIds) ? ' AND role_id IN ('+roleIds+') ' : '',
            sql_load = 'SELECT * FROM user_role_relation WHERE user_id IN ('+userIds+') ' + roleidsQ;

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

    public getUserRoleRelationId(whereConfig = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
       let whereClause = `WHERE 1=1`;
       if ('user_id' in whereConfig) {
         whereClause += ` AND user_id = ${whereConfig['user_id']}`;
       }
       if ('role_id' in whereConfig) {
         whereClause += ` AND role_id = ${whereConfig['role_id']}`;
       }
        const sql = `SELECT * FROM user_role_relation ${whereClause}`;
        
        this.pool.getConnection((err, connection) => {
          if (err) {                    
              throw new Error(err);
          }

          connection.query(sql, [], (error, results) => {
            if (error) {
              console.log('user.role.relation.model.getUserRoleRelationId', sql, error);
              throw Error('Cannot get user role relation');
            }
            resolve(results);
          });

          connection.release();
        });
      });
    }

    public getAccountRoleInLocation(accountId=0): Promise<Object> {
        const locationAccountRelationObj = new LocationAccountRelation();        
        return new Promise((resolve, reject) => {
            if (!accountId) {
                console.log('user role relation model getAccountRoleInLocation() called without account id');
                reject(false);
                return;
            }
            locationAccountRelationObj.getByAccountId(accountId)
            .then((roleOfAccountInLocationArr: Array<object>) => {
                let roleOfAccountInLocationObj = {};
                for (let role of roleOfAccountInLocationArr) {
                    let account_role = '';
                    let role_id = 0;
                    if (role['responsibility'] == 'Manager') {
                      role_id = 1;
                      account_role = 'FRP';
                    } else if (role['responsibility'] == 'Tenant') {
                      role_id = 2;
                      account_role = 'TRP';
                    }
                    roleOfAccountInLocationObj[role['location_id']] = {
                      role_id: role_id,
                      account_role: account_role
                    };
                }
                resolve(roleOfAccountInLocationObj);
            })
            .catch((locAcctRelObjError) => {
                console.log('user role relation model getAccountRoleInLocation()', locAcctRelObjError);
                reject(false);
            });
            
        });


        
    }

}
