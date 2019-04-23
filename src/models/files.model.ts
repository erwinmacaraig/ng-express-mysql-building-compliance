import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as moment from 'moment';
import * as Promise from 'promise';
import * as validator from 'validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';

export class Files extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT f.*, fu.type FROM 
                            files f LEFT JOIN file_user fu WHERE f.file_id = ?`;
            const param = [this.id];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        throw error;
                    }
                    if (!results.length) {
                        reject('No file found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['file_id']);
                        resolve(this.dbData);
                    }
                    connection.release();
                });
                
            });
            
        });
    }

    public getByUserIdAndType(userId, type){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT f.*, fu.type FROM files f LEFT JOIN file_user fu ON f.file_id = fu.file_id WHERE fu.user_id = ? AND fu.type = ? ORDER BY fu.file_user_id DESC`;
            const param = [userId, type];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        throw error;
                    }
                    if (!results.length) {
                        reject('No record found');
                    } else {
                        this.dbData = results;
                        resolve(this.dbData);
                    }
                    connection.release();
                });
                
            });
            
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO files (file_name, url, directory, uploaded_by, datetime) VALUES (?, ?, ?, ?, ?);`;
            const fileparam = [
            ('file_name' in this.dbData) ? this.dbData['file_name'] : '',
            ('url' in this.dbData) ? this.dbData['url'] : '',
            ('directory' in this.dbData) ? this.dbData['directory'] : '',
            ('uploaded_by' in this.dbData) ? this.dbData['uploaded_by'] : '',
            ('datetime' in this.dbData) ? this.dbData['datetime'] : moment().format('YYYY-MM-DD HH:mm:ss')
            ];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql_insert, fileparam, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['file_id'] = this.id;
                    resolve(true);
                    connection.release();
                });
                
            });
            

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE files SET
            file_name = ?,
            url = ?,
            directory = ?,
            uploaded_by = ?,
            datetime = ?
            WHERE file_id = ?
            `;
            const fileparam = [
            ('file_name' in this.dbData) ? this.dbData['file_name'] : '',
            ('url' in this.dbData) ? this.dbData['url'] : '',
            ('directory' in this.dbData) ? this.dbData['directory'] : '',
            ('uploaded_by' in this.dbData) ? this.dbData['uploaded_by'] : '',
            ('datetime' in this.dbData) ? this.dbData['datetime'] : moment().format('YYYY-MM-DD HH:mm:ss'),
            this.ID() ? this.ID() : 0
            ];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql_update, fileparam, (err, results, fields) => {
                    if (err) {
                        throw new Error(err + ' ' + sql_update);
                    }
                    resolve(true);
                    connection.release();
                });
                
            });
            
        }); // end Promise
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
                this.dbData[key] = createData[key];
            }
            if ('file_id' in createData) {
                this.id = createData.file_id;
            }
            resolve(this.write());
        });
    }

}
