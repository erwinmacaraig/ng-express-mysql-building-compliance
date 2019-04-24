
import { BaseClass } from './base.model';
import * as Promise from 'promise';
export class EpcMinutesMeeting extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM epc_meeting_minutes WHERE epc_meeting_minutes_id = ?';
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
                        reject('EPC Meeting record not found');
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['epc_meeting_minutes_id']);
                        resolve(this.dbData);
                    }
                    connection.release();
                });
                
            });
            
        });
    }

    public getWhere(arrWhere): Promise<Array<object>> {
        return new Promise((resolve) => {

            let sql = `SELECT * FROM epc_meeting_minutes`;
            for(let i in arrWhere){
                if(parseInt(i) == 0){
                    sql += ` WHERE `;
                }else{
                    sql += ` AND `;
                }
                sql += arrWhere[i];
            }


            sql += ` ORDER BY date_updated DESC `;

            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }
                    this.dbData = results
                    resolve(results);
                    connection.release();
                });
                
            });
            

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE epc_meeting_minutes SET
            account_id = ?, location_id = ?, data = ?, date_updated = ?, updated_by = ?
            WHERE epc_meeting_minutes_id = ? `;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('data' in this.dbData) ? this.dbData['data'] : null,
            ('date_updated' in this.dbData) ? this.dbData['date_updated'] : null,
            ('updated_by' in this.dbData) ? this.dbData['updated_by'] : null,
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
                    connection.release();
                });
                
            });

            
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO epc_meeting_minutes
            ( account_id, location_id, data, date_created, created_by, date_updated, updated_by )
            VALUES ( ?, ?, ?, ?, ?, ?, ? )`;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('data' in this.dbData) ? this.dbData['data'] : null,
            ('date_created' in this.dbData) ? this.dbData['date_created'] : null,
            ('created_by' in this.dbData) ? this.dbData['created_by'] : null,
            ('date_updated' in this.dbData) ? this.dbData['date_updated'] : null,
            ('updated_by' in this.dbData) ? this.dbData['updated_by'] : null
            ];
            
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }

                connection.query(sql, param, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    resolve(true);
                    connection.release();
                });
                
            });
            
            
        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('epc_meeting_minutes_id' in createData) {
              this.id = createData.epc_meeting_minutes_id;
            }
            resolve(this.write());
        });
    }

}
