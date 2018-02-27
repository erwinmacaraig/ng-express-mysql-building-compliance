import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class Transaction extends BaseClass {

  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM transactions WHERE transaction_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [this.id], (error, results, fields) => {
        if (error) {
          console.log('transaction.model load', error);
          throw new Error(error);
        }
        if (!results.length) {
          reject(`Cannot find transaction for id ${this.id}`);
        } else {
          this.dbData = results[0];
          this.setID(results[0]['transaction_id']);
          resolve(this.dbData);
        }
      });
      connection.end();
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE
                            transactions
                          SET
                            user_id = ?,
                            translog_id = ?,
                            product_id = ?,
                            quantity = ?,
                            amount = ?,
                            status = ?,
                            transaction_date = ?,
                            date_paid = ?,
                            expiration_date = ?,
                            location_id = ?,
                            account_id = ?
                          WHERE
                            transaction_id = ?`;
      const transaction = [
        ('user_id' in this.dbData ) ? this.dbData['user_id'] : 0,
        ('translog_id' in this.dbData ) ? this.dbData['translog_id'] : 0,
        ('product_id' in this.dbData ) ? this.dbData['product_id'] : 0,
        ('quantity' in this.dbData ) ? this.dbData['quantity'] : 0,
        ('amount' in this.dbData ) ? this.dbData['amount'] : 0.00,
        ('status' in this.dbData ) ? this.dbData['status'] : 0,
        ('transaction_date' in this.dbData) ? this.dbData['transaction_date'] : null,
        ('date_paid' in this.dbData) ? this.dbData['date_paid'] : null,
        ('expiration_date' in this.dbData) ? this.dbData['expiration_date'] : null,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
        this.ID() ? this.ID() : 0
      ];

      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, transaction, (error, results, fields) => {
        if (error) {
          console.log('transaction.model update', error);
          throw new Error(error);
        }
        resolve(true);
      });
      connection.end();
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const insert_sql = `INSERT INTO transactions (
                          user_id,
                          translog_id,
                          product_id,
                          quantity,
                          amount,
                          status,
                          date_paid,
                          expiration_date,
                          location_id,
                          account_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const transaction = [
        ('user_id' in this.dbData ) ? this.dbData['user_id'] : 0,
        ('translog_id' in this.dbData ) ? this.dbData['translog_id'] : 0,
        ('product_id' in this.dbData ) ? this.dbData['product_id'] : 0,
        ('quantity' in this.dbData ) ? this.dbData['quantity'] : 0,
        ('amount' in this.dbData ) ? this.dbData['amount'] : 0.00,
        ('status' in this.dbData ) ? this.dbData['status'] : 0,
        ('date_paid' in this.dbData) ? this.dbData['date_paid'] : null,
        ('expiration_date' in this.dbData) ? this.dbData['expiration_date'] : null,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('account_id' in this.dbData) ? this.dbData['account_id'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(insert_sql, transaction, (error, results, fields) => {
        if (error) {
          console.log('transaction.model insert', error);
          throw new Error(error);
        }
        this.id = results.insertId;
        this.dbData['transaction_id'] = results.insertId;
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
      if ('transaction_id' in createData) {
        this.id = createData['transaction_id'];
      }
      resolve(this.write());
    });
  }


  public markTransactionAsPaid(translog: number = 0, status: number = 1) {
    return new Promise((resolve, reject) => {
      /*
      Object.keys(dbData).forEach((key) => {
          switch (key) {
            case 'user_id':
              setData += `user_id = ?,`;
              values.push(dbData['user_id']);
            break;
            case 'status':
              setData += `status = ?,`;
              values.push(dbData['status']);
            break;
            case 'date_paid':
              setData += `date_paid = ?,`;
              values.push(dbData['date_paid']);
            break;
          }
      });
      setData = setData.slice(0, -1);
      const sql_update = `UPDATE transaction SET ${setData} WHERE translog_id = ${translog}`;
      */
      const sql_update = `UPDATE
                            transactions
                          SET
                            date_paid = NOW(),
                            status = ?
                          WHERE
                            translog_id = ?`;
      const values = [status, translog];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, values, (error, results, fields) => {
        if (error) {
          console.log('transaction.markTransactionAsPaid', error);
          throw new Error(error);
        } else {
          resolve(true);
        }
      });
      connection.end();
    });

  }
}
