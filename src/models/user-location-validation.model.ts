import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class UserLocationValidation extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }

  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = 'SELECT * FROM user_location_validation WHERE user_location_validation_id = ?';
      const uid = [this.id];
      const connection = db.createConnection(dbconfig);
      connection.query(
        sql_load,
        uid,
        (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('No record found');
          } else {
            this.dbData = results[0];
            this.setID(results[0]['user_location_validation_id']);
            resolve(this.dbData);
          }
        }
      );
      connection.end();
    });
  }

  public getByToken(token: String, status: String = 'PENDING') {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT *
                      FROM
                        user_location_validation
                      INNER JOIN
                        token
                      ON
                        user_location_validation.token_id = token.token_id
                      WHERE
                        token.token = ?
                      AND
                        user_location_validation.status = ?
      `;
      const param = [token, status];
      const connection = db.createConnection(dbconfig);
      connection.query(
        sql_load,
        param,
        (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('Record not found');
          } else {
            this.dbData = results[0];
            this.setID(results[0]['user_location_validation_id']);
            resolve(this.dbData);
          }
        }
      );
      connection.end();
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE
                              user_location_validation
                          SET
                            user_id = ?,
                            approver_id = ?,
                            role_id = ?,
                            location_id = ?,
                            status = ?,
                            token_id = ?,
                            request_date = ?
                          WHERE
                          user_location_validation_id = ?`;
      const connection = db.createConnection(dbconfig);
      const token = [
          'user_id' in this.dbData ? this.dbData['user_id'] : 0,
          'approver_id' in this.dbData ? this.dbData['approver_id'] : 0,
          'role_id' in this.dbData ? this.dbData['role_id'] : 0,
          'location_id' in this.dbData ? this.dbData['location_id'] : 0,
          'status' in this.dbData ? this.dbData['status'] : 'PENDING',
          'token_id' in this.dbData ? this.dbData['token_id'] : 0,
          'request_date' in this.dbData ? this.dbData['request_date'] : connection.escape(new Date()),
          this.ID() ? this.ID() : 0];
      connection.query(
        sql_update,
        token,
        (err, results, fields) => {
          if (err) {
            throw new Error(err);
          }
          resolve(true);
        }
      );
      connection.end();
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO
          user_location_validation (
            user_id,
            approver_id,
            role_id,
            location_id,
            status,
            token_id
          ) VALUES (?, ?, ?, ?, ?, ?)
  `;
      const token = [
        'user_id' in this.dbData ? this.dbData['user_id'] : 0,
        'approver_id' in this.dbData ? this.dbData['approver_id'] : 0,
        'role_id' in this.dbData ? this.dbData['role_id'] : 0,
        'location_id' in this.dbData ? this.dbData['location_id'] : 0,
        'status' in this.dbData ? this.dbData['status'] : 'PENDING',
        'token_id' in this.dbData ? this.dbData['token_id'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(
        sql_insert,
        token,
        (err, results, fields) => {
          if (err) {
            throw new Error(err);
          }
          this.id = results.insertId;
          this.dbData['user_location_validation_id'] = this.id;
          resolve(true);
        }
      );
      connection.end();
    });
  }

  public create(createData) {
    return new Promise((resolve, reject) => {
      for (let key in createData) {
        this.dbData[key] = createData[key];
      }
      if ('user_location_validation_id' in createData) {
        this.id = createData.user_location_validation_id;
      }
      resolve(this.write());
    });
  }

}
