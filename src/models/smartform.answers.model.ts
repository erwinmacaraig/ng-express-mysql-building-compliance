import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class SmartFormAnswersModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = 'SELECT *, DATE_FORMAT(date_created, "%b. %e, %Y") as date_created_formatted FROM smart_form_answers WHERE smart_form_answers_id = ?';
                const uid = [this.id];
                connection.query(sql_load, uid, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  if (!results.length){
                    reject('Smart form asnwer not found');
                  } else {
                    this.dbData = results[0];
                    this.setID(results[0]['smart_form_answers_id']);
                    resolve(this.dbData);
                  }
                });
                connection.release();
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                
                const sql_update = `UPDATE smart_form_answers SET
                    smart_form_id = ?,
                    answers = ?,
                    user_id = ?,
                    location_id = ?,
                    account_id = ?,
                    date_created = ?
                    WHERE smart_form_answers_id = ? `;
                const param = [
                    ('smart_form_id' in this.dbData) ? this.dbData['smart_form_id'] : 0,
                    ('answers' in this.dbData) ? this.dbData['answers'] : '',
                    ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
                    ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                    ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                    ('date_created' in this.dbData) ? this.dbData['date_created'] : '',
                    this.ID() ? this.ID() : 0
                ];
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
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                const sql_insert = `INSERT INTO smart_form_answers (
                    smart_form_id,
                    answers,
                    user_id,
                    location_id,
                    account_id,
                    date_created
                    ) VALUES (?,?,?,?,?,?)
                `;

                const param = [
                    ('smart_form_id' in this.dbData) ? this.dbData['smart_form_id'] : 0,
                    ('answers' in this.dbData) ? this.dbData['answers'] : '',
                    ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
                    ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                    ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                    ('date_created' in this.dbData) ? this.dbData['date_created'] : ''
                ];

                connection.query(sql_insert, param, (err, results, fields) => {
                    if (err) {
                        reject(err);
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['smart_form_answers_id'] = this.id;
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
            if ('smart_form_answers_id' in createData) {
              this.id = createData.account_id;
            }
            resolve(this.write());
        });
    }

}
