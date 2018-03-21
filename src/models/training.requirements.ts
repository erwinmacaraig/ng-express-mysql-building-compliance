import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
import * as moment from 'moment';

export class TrainingRequirements extends BaseClass {

    constructor(id: number = 0) {
        super();
        if (id) {
            this.id = id;
        }
    }
    public load(): Promise<object> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM training_requirement`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql, [this.id], (error, results, fields) => {
                if (error) {
                    throw new Error('Error loading training requirements.');
                } else {
                    if (results.length > 0) {
                        this.dbData = results[0];
                        this.setID(results[0]['training_requirement_id']);
                        resolve(this.dbData);
                    } else {
                        reject('No training requirement found.');
                    }
                }
            });
            connection.end();
        });
    }

    public getWhere(arrWhere): Promise<object> {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM training_requirement `,
                count = 0;
            for(let i in arrWhere){
                if( count == 0 ){
                    sql += ' WHERE '+arrWhere[i];
                }else{
                    sql += ' AND '+arrWhere[i];
                }

                count++;
            }


            const connection = db.createConnection(dbconfig);
            connection.query(sql, [this.id], (error, results, fields) => {
                if (error) {
                    throw new Error('Error loading training requirements.');
                } else {
                    this.dbData = results;
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbInsert(): Promise <boolean> {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO training_requirement (
            training_requirement_name,
            num_months_valid,
            scorm_course_id,
            description
            ) VALUES (?, ?, ?, ?)`;

            const connection = db.createConnection(dbconfig);
            const values = [
            ('training_requirement_name' in this.dbData) ? this.dbData['training_requirement_name'] : null,
            ('num_months_valid' in this.dbData) ? this.dbData['num_months_valid'] : null,
            ('scorm_course_id' in this.dbData) ? this.dbData['scorm_course_id'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null
            ];
            connection.query(sql_insert, values, (error, results, fields) => {
                if (error) {
                    throw new Error('Error inserting training requirements.');
                }
                this.id = results.insertId;
                this.dbData['training_requirement_id'] = this.id;
                resolve(true);
            });
            connection.end();

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE training_requirement SET
            training_requirement_name = ?,
            num_months_valid = ?,
            scorm_course_id = ?,
            description = ?
            WHERE
            training_requirement_id = ?
            `;
            const values = [
            ('training_requirement_name' in this.dbData) ? this.dbData['training_requirement_name'] : null,
            ('num_months_valid' in this.dbData) ? this.dbData['num_months_valid'] : null,
            ('scorm_course_id' in this.dbData) ? this.dbData['scorm_course_id'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null,
            this.id
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, values, (error, results, fields) => {
                if (error) {
                    throw new Error('Error inserting updating requirements.');
                }
                resolve(true);
            });
            connection.end();
        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            Object.keys(createData).forEach((key) => {
                this.dbData[key] = createData[key];
                if ('training_requirement_id' in createData) {
                    this.id = createData['training_requirement_id'];
                }
            });
            resolve(this.write());
        });
    }


}