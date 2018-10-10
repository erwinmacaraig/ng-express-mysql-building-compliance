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

    public getWhere(arrWhere): Promise<Array<object>> {
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

            // console.log(sql);
            const connection = db.createConnection(dbconfig);
            connection.query(sql, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }


                if (results.length === 1) {
                  this.dbData = results[0];
                  this.id = results[0]['compliance_id'];
                }
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
            account_role = ?, override_by_evac = ?,
            note = ?,
            dtLastUpdated = ?
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
            ('note' in this.dbData) ? this.dbData['note'] : null,
            ('dtLastUpdated' in this.dbData) ? this.dbData['dtLastUpdated'] : null,
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
            ( compliance_kpis_id, compliance_status, building_id, account_id, valid_till, required, account_role, override_by_evac,
              note, dtLastUpdated )
            VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const param = [
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : null,
            ('compliance_status' in this.dbData) ? this.dbData['compliance_status'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('valid_till' in this.dbData) ? this.dbData['valid_till'] : null,
            ('required' in this.dbData) ? this.dbData['required'] : null,
            ('account_role' in this.dbData) ? this.dbData['account_role'] : null,
            ('override_by_evac' in this.dbData) ? this.dbData['override_by_evac'] : 0,
            ('note' in this.dbData) ? this.dbData['note'] : null,
            ('dtLastUpdated' in this.dbData) ? this.dbData['dtLastUpdated'] : null
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

    public getLocationCompliance(locId, accntId, roles?) {
        return new Promise((resolve) => {
            if(roles == 'undefined'){
                roles = 'Manager, Tenant';
            }
            let sql = `
                SELECT
                  c.compliance_id,
                  c.compliance_kpis_id,
                  c.compliance_status,
                  c.building_id,
                  c.account_id,
                  c.valid_till,
                  c.required,
                  c.account_role,
                  ck.name,
                  ck.directory_name,
                  ck.measurement,
                  ck.validity_in_months,
                  ck.has_primary_document,
                  ck.ER_id,
                  ck.training_id,
                  c.override_by_evac
                FROM compliance_kpis ck
                INNER JOIN compliance c ON ck.compliance_kpis_id = c.compliance_kpis_id
                WHERE c.building_id = ?
                AND c.account_id = ?
                AND c.account_role IN (?)
                AND ck.description IS NOT NULL
                ORDER BY c.compliance_id DESC
            `;

            let param = [locId, accntId, roles];

            const connection = db.createConnection(dbconfig);
            connection.query(sql, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                this.dbData = results;
                resolve(results);
            });
            connection.end();
        });
    }

    public getComplianceRecord(kpi, building_id, account_id): Promise<object> {
      return new Promise((resolve, reject) => {
          this.pool.getConnection((err, connection) => {
            if (err) {                    
                console.log('Error gettting pool connection ' + err);
                throw err;
            }
            const sql = `SELECT * FROM compliance
                     WHERE compliance_kpis_id = ?
                     AND building_id = ?
                     AND account_id = ?
                     ORDER BY compliance_id
                     LIMIT 1`;
            connection.query(sql, [kpi, building_id, account_id], (error, results) => {
                if (error) {
                    console.log('compliance.model.getComplianceRecord', error, sql);
                    throw Error('Cannot get compliance status');
                }
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    reject('No record can be found.');
                }
                
            });
            connection.release();
          });
        

          
         
          
      });
    }
    public setComplianceRecordStatus(kpi, building_id, account_id, stat: number = 1): Promise<boolean> {
      return new Promise((resolve, reject) => {
        this.pool.getConnection((err, connection) => {
            if (err) {                    
                console.log('Error gettting pool connection ' + err);
                throw err;
            }
            const sql_update = `UPDATE compliance
                            SET compliance_status = ?
                            WHERE compliance_kpis_id = ?
                            AND building_id = ?
                            AND account_id = ?`;
            connection.query(sql_update, [stat, kpi, building_id, account_id], (error, results) => {
                if (error) {
                    console.log('compliance.model.getComplianceRecord', error, sql_update);
                    throw Error('Cannot get compliance status');
                }
                const status = (stat === 1) ? true : false;
                resolve(status);
            });
            connection.release();
        });
      });
    }

    FSATrainingByEvac(accountId = 0, buildings = [], status = 0) {
        return new Promise((resolve, reject) => {
            if (buildings.length == 0) {
                reject('No locations supplied');
                return;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    console.log('Error gettting pool connection ' + err);
                    throw err;
                }
                const locations = buildings.join(',');
                const sql = `UPDATE compliance SET
                                compliance_status = ?,
                                note = 'FSA Training by Evac',
                                dtLastUpdated = NOW()
                            WHERE
                                compliance_kpis_id = 3
                            AND
                                account_id = ?
                            AND
                                building_id IN (${locations})`;
                connection.query(sql, [status, accountId], (error, results) => {
                    if (error) {
                        console.log('Cannot update FSA record', error, sql);
                        throw Error(error.toString());
                    }
                    resolve(true); 
                });
                connection.release();
            });
        });
    }



}
