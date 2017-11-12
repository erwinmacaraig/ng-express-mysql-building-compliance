import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as moment from 'moment';
import * as Promise from 'promise';
import * as validator from 'validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';

export class FileUser extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM file_user WHERE file_user_id = ?`;
            const param = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    throw error;
                }
                if (!results.length) {
                    reject('No file user found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['file_user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO file_user (user_id, file_id, type) VALUES (?, ?, ?);`;
            const fileparam = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : '',
            ('file_id' in this.dbData) ? this.dbData['file_id'] : '',
            ('type' in this.dbData) ? this.dbData['type'] : ''
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, fileparam, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['file_user_id'] = this.id;
                resolve(true);
            });
            connection.end();

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE file_user SET
            user_id = ?,
            file_id = ?,
            type = ?
            WHERE file_user_id = ?
            `;
            const fileparam = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : '',
            ('file_id' in this.dbData) ? this.dbData['file_id'] : '',
            ('type' in this.dbData) ? this.dbData['type'] : '',
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, fileparam, (err, results, fields) => {
                if (err) {
                    throw new Error(err + ' ' + sql_update);
                }
                resolve(true);
            });
            connection.end();
        }); // end Promise
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
                this.dbData[key] = createData[key];
            }
            if ('file_user_id' in createData) {
                this.id = createData.file_user_id;
            }
            resolve(this.write());
        });
    }

}
