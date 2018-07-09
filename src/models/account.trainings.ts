import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');

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
                    account_id = ?, course_id = ?, training_requirement_id = ?, datetime_addded = ?
                WHERE account_training_id = ? `;
            const param = [
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('course_id' in this.dbData) ? this.dbData['course_id'] : 0,
                ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                ('datetime_addded' in this.dbData) ? this.dbData['datetime_addded'] : 'NOW()',
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
                INSERT INTO account_trainings () VALUES ()
            `;
            const param = [
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('course_id' in this.dbData) ? this.dbData['course_id'] : 0,
                ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                ('datetime_addded' in this.dbData) ? this.dbData['datetime_addded'] : 'NOW()',
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

    public getAccountTainings(accountId) {
        return new Promise((resolve, reject) => {
            const sql_load = `
                SELECT
                    atr.account_training_id,
                    tr.training_requirement_id,
                    tr.training_requirement_name,
                    em_roles.role_name,
                    tr.num_months_valid,
                    tr.description,
                    sc.course_id,
                    sc.course_name,
                    sc.course_launcher,
                    DATE_FORMAT(atr.datetime_added, "%d/%m/%Y %l:%i%p") as datetime_added
                FROM account_trainings atr
                INNER JOIN scorm_course sc ON sc.course_id = atr.course_id
                INNER JOIN training_requirement tr ON tr.training_requirement_id = atr.training_requirement_id
                INNER JOIN em_roles ON em_roles.em_roles_id = atr.role
                WHERE atr.account_id = ${accountId}
            `;

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

    public assignAccountUserTraining(userId: number = 0, course_id: number = 0, training_requirement_id: number = 0) {
      return new Promise((resolve, reject) => {
        const assign_sql = `INSERT IGNORE INTO course_user_relation (
                              user_id,
                              course_id,
                              training_requirement_id
                            ) VALUES (
                              ?, ?, ?
                            )`;
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

}
