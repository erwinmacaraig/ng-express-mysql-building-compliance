import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class ComplianceNotesModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM compliance_notes WHERE compliance_notes_id = ?';
            const uid = [this.id];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql_load, uid, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    if (!results.length){
                        reject('Compliance note not found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['compliance_notes_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
            
        });
    }

    public getWhere(arrWhere){
        return new Promise((resolve) => {

            let sql = `SELECT * FROM compliance_notes`;
            for(let i in arrWhere){
                if(parseInt(i) == 0){
                    sql += ` WHERE `;
                }else{
                    sql += ` AND `;
                }
                sql += arrWhere[i];
            }
            sql += ` ORDER BY compliance_notes_id DESC `;
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }

                    this.dbData = results;
                    resolve(results);
                });
                connection.release();
            });
            

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE compliance_notes SET
            account_id = ?, building_id = ?, note = ?, account_role = ?, include_in_report = ?
            WHERE compliance_notes_id = ? `;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('note' in this.dbData) ? this.dbData['note'] : null,
            ('account_role' in this.dbData) ? this.dbData['account_role'] : null,
            ('include_in_report' in this.dbData) ? this.dbData['include_in_report'] : null,
            this.ID() ? this.ID() : 0
            ];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

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
            const sql_update = `INSERT INTO compliance_notes 
            ( account_id, building_id, note, account_role, include_in_report )
            VALUES ( ?, ?, ?, ?, ? )`;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('note' in this.dbData) ? this.dbData['note'] : null,
            ('account_role' in this.dbData) ? this.dbData['account_role'] : null,
            ('include_in_report' in this.dbData) ? this.dbData['include_in_report'] : null,
            this.ID() ? this.ID() : 0
            ];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

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

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('compliance_notes_id' in createData) {
              this.id = createData.compliance_notes_id;
            }
            resolve(this.write());
        });
    }



}
