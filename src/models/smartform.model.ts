import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class SmartFormModel extends BaseClass {

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
                const sql_load = 'SELECT *, DATE_FORMAT(date_created, "%b. %e, %Y") as date_created_formatted FROM smart_form WHERE smart_form_id = ?';
                const uid = [this.id];
                connection.query(sql_load, uid, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  if (!results.length){
                    reject('Smart form not found');
                  } else {
                    this.dbData = results[0];
                    this.setID(results[0]['smart_form_id']);
                    resolve(this.dbData);
                  }
                });
                connection.release();
            });
        });
    }

    public all() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql = 'SELECT *, DATE_FORMAT(date_created, "%b. %e, %Y") as date_created_formatted FROM smart_form WHERE is_deleted = 0 ORDER BY date_created DESC';
                connection.query(sql, (error, results, fields) => {
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

    public getWhere(whereParam=[]) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                let where = '';
                for(let i in whereParam){
                    if(parseInt(i) == 0){
                        where += ' WHERE ';
                    }else{
                        where += ' AND ';
                    }

                    where += whereParam[i];
                }

                const sql = `SELECT *, DATE_FORMAT(date_created, "%b. %e, %Y") as date_created_formatted FROM smart_form ${where} ORDER BY date_created DESC`;

                connection.query(sql, (error, results, fields) => {
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

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                
                const sql_update = `UPDATE smart_form SET
                    name = ?,
                    compliance_kpis_id = ?,
                    type = ?,
                    data = ?,
                    is_deleted = ?,
                    date_created = ?
                    WHERE smart_form_id = ? `;
                const param = [
                    ('name' in this.dbData) ? this.dbData['name'] : '',
                    ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : 0,
                    ('type' in this.dbData) ? this.dbData['type'] : '',
                    ('data' in this.dbData) ? this.dbData['data'] : '',
                    ('is_deleted' in this.dbData) ? this.dbData['is_deleted'] : 0,
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

                const sql_insert = `INSERT INTO smart_form (
                    name,
                    compliance_kpis_id,
                    type,
                    data,
                    is_deleted,
                    date_created
                    ) VALUES (?,?,?,?,?,?)
                `;

                const param = [
                    ('name' in this.dbData) ? this.dbData['name'] : '',
                    ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : 0,
                    ('type' in this.dbData) ? this.dbData['type'] : '',
                    ('data' in this.dbData) ? this.dbData['data'] : '',
                    ('is_deleted' in this.dbData) ? this.dbData['is_deleted'] : 0,
                    ('date_created' in this.dbData) ? this.dbData['date_created'] : '',
                ];

                connection.query(sql_insert, param, (err, results, fields) => {
                    if (err) {
                        reject(err);
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['smart_form_id'] = this.id;
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
            if ('smart_form_id' in createData) {
              this.id = createData.account_id;
            }
            resolve(this.write());
        });
    }

    public delete(id = 0) {
        return new Promise((resolve, reject) => {
            let smartId = this.ID();
            if (id) {
                smartId = id;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error('Cannot get connection');
                }
                const sql = `DELETE FROM smart_form WHERE smart_form_id = ?`;
                const params = [smartId];
                connection.query(sql, params, (error, results) => {
                    if (error) {
                        console.log(sql, params);
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();
            });
        });
    }

}
