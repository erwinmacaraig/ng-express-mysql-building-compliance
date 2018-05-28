import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class ComplianceKpisModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public getAllKPIs(raw: boolean = false): Promise<object> | Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const sql_load = 'SELECT * FROM compliance_kpis';
        const uid = [this.id];
        const connection = db.createConnection(dbconfig);
        const resultSetObj: {[key: number]: {}} = {};
        connection.query(sql_load, uid, (error, results, fields) => {
            if (error) {
                return console.log(error);            }
            if (!results.length){
                reject('Compliance kpis not found');
            } else {
                if (!raw) {
                  for (const r of results) {
                    resultSetObj[r['compliance_kpis_id']] = {
                      name: r['name'],
                      directory_name: r['directory_name'],
                      required: r['required'],
                      validity_in_months: r['validity_in_months'],
                      measurement: r['measurement'],
                      order: r['order'],
                      has_primary_document: r['has_primary_document'],
                      description: r['description'],
                      ER_id: r['ER_id']
                    };
                  }
                  resolve(resultSetObj);
                } else {
                  resolve(results);
                }

            }
        });
        connection.end();
    });

    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM compliance_kpis WHERE compliance_kpis_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            const resultSetObj: {[key: number]: {}} = {};
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length){
                    reject('Compliance kpis not found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['compliance_kpis_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getWhere(arrWhere){
        return new Promise((resolve) => {

            let sql = `SELECT * FROM compliance_kpis`;

            for(let i in arrWhere){
                if(parseInt(i) == 0){
                    sql += ` WHERE `;
                }else{
                    sql += ` AND `;
                }
                sql += arrWhere[i];
            }
            sql += ` ORDER BY compliance_kpis_id ASC `;

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
        return false;
    }

    public dbInsert() {
        return false;
    }

    public create(createData) {
        return false;
    }



}
