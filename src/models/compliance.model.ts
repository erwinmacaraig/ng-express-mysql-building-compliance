import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class ComplianceModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM compliance WHERE compliance_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length){
                    reject('Compliance not found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['compliance_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getWhere(arrWhere){
        return new Promise((resolve) => {

            let sql = `SELECT * FROM compliance`;
            for(let i in arrWhere){
                if(parseInt(i) == 0){
                    sql += ` WHERE `;
                }else{
                    sql += ` AND `;
                }
                sql += arrWhere[i];
            }
            sql += ` ORDER BY compliance_id DESC `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                this.dbData = results;
                resolve(results);
            });
            connection.end();

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE compliance SET
            compliance_kpis_id = ?, compliance_status = ?,
            building_id = ?, account_id = ?,
            valid_till = ?, required = ?,
            account_role = ?, override_by_evac = ?
            WHERE compliance_id = ? `;
            const param = [
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : null,
            ('compliance_status' in this.dbData) ? this.dbData['compliance_status'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('valid_till' in this.dbData) ? this.dbData['valid_till'] : null,
            ('required' in this.dbData) ? this.dbData['required'] : null,
            ('account_role' in this.dbData) ? this.dbData['account_role'] : null,
            ('override_by_evac' in this.dbData) ? this.dbData['override_by_evac'] : 0,
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
            const sql = `INSERT INTO compliance 
            ( compliance_kpis_id, compliance_status, building_id, account_id, valid_till, required, account_role, override_by_evac )
            VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )`;
            const param = [
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : null,
            ('compliance_status' in this.dbData) ? this.dbData['compliance_status'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('valid_till' in this.dbData) ? this.dbData['valid_till'] : null,
            ('required' in this.dbData) ? this.dbData['required'] : null,
            ('account_role' in this.dbData) ? this.dbData['account_role'] : null,
            ('override_by_evac' in this.dbData) ? this.dbData['override_by_evac'] : 0,
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql, param, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                this.id = results.insertId;
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
            if ('compliance_id' in createData) {
              this.id = createData.compliance_id;
            }
            resolve(this.write());
        });
    }



}
