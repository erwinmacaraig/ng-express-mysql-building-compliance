import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');
import * as moment from 'moment';
import * as Promise from 'promise';

export class UserRequest extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM user_requests WHERE user_requests_id = ?`;
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
                        reject('No request found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['user_requests_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
                
            });

        });
    }

    public getWhere(arrWhere){

        return new Promise((resolve, reject) => {
            let sql_load = `SELECT * FROM user_requests`,
                count = 0,
                whereString = '';
            for(let i in arrWhere){
                   
                if(count == 0){
                    whereString += ' WHERE ';
                }else{
                    whereString += ' AND ';
                }

                whereString += arrWhere[i];
                count++;
            }

            sql_load += ' '+whereString;

            this.pool.getConnection((err, connection) => {

                if(err){
                    throw new Error(err);
                    
                }
                connection.query(sql_load, (error, results, fields) => {
                    if (error) {
                        throw error;
                    }
                    this.dbData = results
                    resolve(this.dbData);
                });
                connection.release();

            });
        });

    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = "INSERT INTO user_requests (user_id, requested_role_id, location_id, approver_id, status, date_created, date_responded, viewed) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
            const param = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('requested_role_id' in this.dbData) ? this.dbData['requested_role_id'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('approver_id' in this.dbData) ? this.dbData['approver_id'] : 0,
            ('status' in this.dbData) ? this.dbData['status'] : 0,
            ('date_created' in this.dbData) ? this.dbData['date_created'] : moment().format('YYYY-MM-DD HH:mm:ss'),
            ('date_responded' in this.dbData) ? this.dbData['date_responded'] : null,
            ('viewed' in this.dbData) ? this.dbData['viewed'] : 0
            ];
            this.pool.getConnection((err, connection) => {

                if(err){
                    throw new Error(err);
                    
                }
                connection.query(sql_insert, param, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['user_requests_id'] = this.id;
                    resolve(true);
                });
                connection.release();

            });
            

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE user_requests SET
            user_id = ?,
            requested_role_id = ?,
            location_id =  ?,
            approver_id = ?,
            status = ?,
            date_created = ?,
            date_responded = ?,
            viewed = ?
            WHERE user_requests_id = ?
            `;
            const param = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('requested_role_id' in this.dbData) ? this.dbData['requested_role_id'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('approver_id' in this.dbData) ? this.dbData['approver_id'] : 0,
            ('status' in this.dbData) ? this.dbData['status'] : 0,
            ('date_created' in this.dbData) ? this.dbData['date_created'] : moment().format('YYYY-MM-DD HH:mm:ss'),
            ('date_responded' in this.dbData) ? this.dbData['date_responded'] : null,
            ('viewed' in this.dbData) ? this.dbData['viewed'] : 0,
            this.ID() ? this.ID() : 0
            ];
            this.pool.getConnection((err, connection) => {

                if(err){
                    throw new Error(err);
                    
                }
                connection.query(sql_update, param, (err, results, fields) => {
                    if (err) {
                        throw new Error(err + ' ' + sql_update);
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
            if ('user_requests_id' in createData) {
                this.id = createData.user_requests_id;
            }
            resolve(this.write());
        });
    }

}
