import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class Translog extends BaseClass {

  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }

  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM gateway_translog WHERE translog_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [this.id], (error, results, fields) => {
        if (error) {
          console.log('translog.model load', error);
          throw new Error(error);
        }
        if (!results.length) {
          reject(`Cannot find transaction logs for id ${this.id}`);
        } else {
          this.dbData = results[0];
          this.setID(results[0]['translog_id']);
          resolve(this.dbData);
        }
      });
      connection.end();
    });
  }
  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE
                            gateway_translog
                          SET
                            gateway_response_payment_id = ?,
                            gateway_response_amount = ?,
                            gateway_response_state = ?,
                            gateway_response_token = ?,
                            payment_gateway = ?,
                            sent_to_gateway = ?,
                            status = ?
                          WHERE
                            translog_id = ?`;
      const translog = [
        ('gateway_response_payment_id' in this.dbData ) ? this.dbData['gateway_response_payment_id'] : null,
        ('gateway_response_amount' in this.dbData ) ? this.dbData['gateway_response_amount'] : 0.00,
        ('gateway_response_state' in this.dbData ) ? this.dbData['gateway_response_state'] : null,
        ('gateway_response_token' in this.dbData) ? this.dbData['gateway_response_token'] : null,
        ('payment_gateway' in this.dbData ) ? this.dbData['payment_gateway'] : null,
        ('sent_to_gateway' in this.dbData ) ? this.dbData['sent_to_gateway'] : 0,
        ('status' in this.dbData ) ? this.dbData['status'] : 0,
        this.ID() ? this.ID() : 0
      ];

      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, translog, (error, results, fields) => {
        if (error) {
          console.log('translog.model update', error, sql_update);
          throw new Error(error);
        }
        resolve(true);
      });
      connection.end();
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const insert_sql = `INSERT INTO gateway_translog (
        gateway_response_payment_id,
        gateway_response_amount,
        gateway_response_state,
        gateway_response_token,
        payment_gateway,
        sent_to_gateway,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const translog = [
        ('gateway_response_payment_id' in this.dbData ) ? this.dbData['gateway_response_payment_id'] : null,
        ('gateway_response_amount' in this.dbData ) ? this.dbData['gateway_response_amount'] : 0.00,
        ('gateway_response_state' in this.dbData ) ? this.dbData['gateway_response_state'] : null,
        ('gateway_response_token' in this.dbData) ? this.dbData['gateway_response_token'] : null,
        ('payment_gateway' in this.dbData ) ? this.dbData['payment_gateway'] : null,
        ('sent_to_gateway' in this.dbData ) ? this.dbData['sent_to_gateway'] : 0,
        ('status' in this.dbData ) ? this.dbData['status'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(insert_sql, translog, (error, results, fields) => {
        if (error) {
          console.log('translog.model insert', error);
          throw new Error(error);
        }
        this.id = results.insertId;
        this.dbData['translog_id'] = results.insertId;
        resolve(this.id);
      });
      connection.end();
    });
  }

  public create(createData) {
    return new Promise((resolve, reject) => {
      for (const key in createData) {
        this.dbData[key] = createData[key];
      }
      if ('translog_id' in createData) {
        this.id = createData['translog_id'];
      }
      resolve(this.write());
    });
  }

}
