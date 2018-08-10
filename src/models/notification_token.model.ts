
import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';


export class NotificationToken extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public create(createData): Promise<any> {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
      });
      if ('notification_token_id' in createData) {
        this.id = createData['notification_token_id'];
      }
      resolve(this.write());
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO notification_token (
        strToken,
        user_id,
        notification_config_id,
        dtExpiration,
        responded,
        dtResponded,
        completed,
        dtCompleted,
        strResponse
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        strToken = ?,
        dtExpiration = ?,
        responded = ?,
        dtResponded = ?,
        completed = ?,
        dtCompleted = ?,
        strResponse = ?
      `;
      const param = [
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
        ('notification_config_id' in this.dbData) ? this.dbData['notification_config_id'] : 0,
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_insert, param, (err, results) => {
        if (err) {
          console.log('Cannot create record NotificationToken', err, sql_insert);
          throw new Error(err);
        }
        this.id = results.insertId;
        this.dbData['notification_token_id'] = this.id;
        resolve(true);
      });
      connection.end();
    });

  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE notification_token SET
          strToken = ?,
          user_id = ?,
          notification_config_id = ?,
          dtExpiration = ?,
          responded = ?,
          dtResponded = ?,
          completed = ?,
          dtCompleted = ?,
          strResponse = ?
        WHERE notification_token_id = ?
      `;
      const param = [
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
        ('notification_config_id' in this.dbData) ? this.dbData['notification_config_id'] : 0,
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',
        this.ID() ? this.ID() : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, param, (err, results) => {
        if (err) {
          console.log('Cannot update record NotificationToken');
          throw Error(err);
        }
        resolve(true);

      });
      connection.end();
    });
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM notification_token WHERE notification_token_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [this.id], (error, results) => {
        if (error) {
          console.log('Cannot load record NotificationToken', sql_load);
          throw Error(error);
        }
        this.dbData = results[0];
        this.setID(results[0]['notification_token_id']);
        resolve(this.dbData);
      });
      connection.end();
    });
  }


  public loadByContraintKeys(userId = 0, configId = 0) {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM notification_token
        WHERE user_id = ? AND notification_config_id = ?`;

      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [userId, configId], (error, results) => {
        if (error) {
          console.log('NotificationToken.loadByContraintKeys', error, sql_load);
          throw Error(error);
        }
        this.dbData = results[0];
        this.setID(results[0]['notification_token_id']);
        resolve(this.dbData);
      });
      connection.end();

    });
  }

  public getTokensByConfigId(configId = 0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT notification_token.*, users.email, users.first_name, users.last_name FROM notification_token
      INNER JOIN users ON notification_token.user_id = users.user_id
              WHERE notification_config_id = ?`;

      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [configId], (error, results) => {
        if (error) {
          console.log('NotificationToken.getTokensByConfigId', error, sql_load);
          throw Error(error);
        }
        resolve(results);
      });
      connection.end();

    });
  }

}