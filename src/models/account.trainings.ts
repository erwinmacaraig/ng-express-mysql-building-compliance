import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');
import * as moment from 'moment';

import * as Promise from 'promise';
export class AccountTrainingsModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM account_trainings WHERE account_training_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length){
                reject('Account training not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['account_training_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `
                UPDATE account_trainings SET
                    account_id = ?,
                    course_id = ?,
                    role = ?,
                    training_requirement_id = ?,
                    datetime_added = ?
                WHERE account_training_id = ? `;
            const param = [
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('course_id' in this.dbData) ? this.dbData['course_id'] : 0,
                ('role' in this.dbData) ? this.dbData['role'] : 0,
                ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                ('datetime_added' in this.dbData) ? this.dbData['datetime_added'] : moment().format('YYYY-MM-DD HH-mm-ss'),
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
            const sql_insert = `
                INSERT INTO account_trainings (
                  account_id,
                  course_id,
                  role,
                  training_requirement_id,
                  datetime_added
                ) VALUES (
                  ?, ?, ?, ?, ?
                )
            `;
            const param = [
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('course_id' in this.dbData) ? this.dbData['course_id'] : 0,
                ('role' in this.dbData) ? this.dbData['role'] : 0,
                ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                ('datetime_added' in this.dbData) ? this.dbData['datetime_added'] : moment().format('YYYY-MM-DD HH-mm-ss'),
            ];
            const connection = db.createConnection(dbconfig);

            connection.query(sql_insert, param, (err, results, fields) => {
                if (err) {
                    reject(err);
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['account_training_id'] = this.id;
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
            if ('account_training_id' in createData) {
              this.id = createData.account_training_id;
            }
            resolve(this.write());
        });
    }

    public getAccountTrainings(accountId, filter = {}): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let filterClause = '';
            if ('role' in filter) {
              filterClause = `AND atr.role = ${filter['role']}`;
            }
            const sql_load = `
                SELECT
                    atr.account_training_id,
                    atr.role as role_id,
                    IF( atr.role = 1, 'Building Manager', IF( atr.role = 2, 'Tenant Responsible Person', em.role_name ) ) as role_name,
                    tr.training_requirement_id,
                    tr.training_requirement_name,
                    atr.role,
                    em.role_name,
                    tr.num_months_valid,
                    tr.description,
                    sc.course_id,
                    sc.course_name,
                    sc.course_launcher,
                    DATE_FORMAT(atr.datetime_added, "%d/%m/%Y %l:%i%p") as datetime_added
                FROM account_trainings atr
                INNER JOIN scorm_course sc ON sc.course_id = atr.course_id
                INNER JOIN training_requirement tr ON tr.training_requirement_id = atr.training_requirement_id
                LEFT JOIN em_roles em ON em.em_roles_id = atr.role
                WHERE atr.account_id = ${accountId} ${filterClause}
            `;

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
                if (error) {
                  return console.log('account.trainings.getAccount', error, sql_load);
                }

                this.dbData = results;
                resolve(results);
            });
            connection.end();
        });
    }

    public assignAccountUserTraining(userId: number = 0,
                                     course_id: number = 0,
                                     training_requirement_id: number = 0,
                                     disabled: number = 0) {
      return new Promise((resolve, reject) => {
        const disabledClause = `ON DUPLICATE KEY UPDATE disabled = ${disabled}`;

        const assign_sql = `INSERT IGNORE INTO course_user_relation (
                              user_id,
                              course_id,
                              training_requirement_id
                            ) VALUES (
                              ?, ?, ?
                            ) ${disabledClause}`;
        const connection = db.createConnection(dbconfig);
        const params = [userId, course_id, training_requirement_id];
        connection.query(assign_sql, params, (error, results) => {
          if (error) {
            console.log('AccountTrainingsModel.assignAccountUserTraining()', assign_sql, error);
            throw Error('Unable to assign training to user');
          }
          resolve(true);
        });
        connection.end();
      });
    }

    public assignAccountRoleTraining(accountId: number = 0, courseId: number = 0,
                                     trid: number = 0, role: number = 0, disable: number = 0) {
      return new Promise((resolve, reject) => {
        let sql;
        let params = [];
        if (disable) {
          sql = `UPDATE
                  course_user_relation
                INNER JOIN
                  users
                ON
                  users.user_id = course_user_relation.user_id
                SET
                  course_user_relation.disabled = 1
                WHERE
              users.account_id = ?;`;
          params = [accountId];

        } else {
          const disabledClause = `ON DUPLICATE KEY UPDATE disabled = ${disable}`;
          sql = `INSERT IGNORE INTO course_user_relation (user_id, course_id, training_requirement_id)
            SELECT DISTINCT users.user_id, ${courseId}, ${trid}
            FROM users
            INNER JOIN
            user_em_roles_relation ON users.user_id = user_em_roles_relation.user_id
            INNER JOIN em_roles
            ON em_roles.em_roles_id = user_em_roles_relation.em_role_id
            INNER JOIN accounts
            ON accounts.account_id = users.account_id
            WHERE user_em_roles_relation.em_role_id = ? AND
            users.account_id = ? ${disabledClause};`;

          params = [role, accountId];
        }
        const connection = db.createConnection(dbconfig);

        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('account.trainings.assignAccountRoleTraining', error, sql);
            throw Error('Cannot assign training to roles');
          }
          resolve(true);
        });
        connection.end();
      });
    }

    public checkAssignedTrainingOnAccount(account_id = 0, course_id = 0, role = 0, trid = 0) {
      return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM account_trainings
                     WHERE
                       account_id = ?
                     AND
                       course_id = ?
                     AND
                       role = ?
                    AND
                      training_requirement_id = ?`;
        const connection = db.createConnection(dbconfig);
        const params = [account_id, course_id, role, trid];
        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('account.trainings.checkAssignedTrainingOnAccount', error, sql);
            throw Error('Cannot set up training');
          }
          if (results.length > 0) {
            resolve(results);
          } else {
            reject('Training record exists');
          }
        });
        connection.end();
      });
    }

    public removeAssignedTrainingOnAccount(account_id = 0) {
      return new Promise((resolve, reject) => {
        const sql = `DELETE
                     FROM account_trainings
                     WHERE
                       account_id = ?
                     `;
        const connection = db.createConnection(dbconfig);
        const params = [account_id];
        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('account.trainings.checkAssignedTrainingOnAccount', error, sql);
            throw Error('Cannot set up training');
          }
          resolve(true);
        });
        connection.end();
      });
    }

}
