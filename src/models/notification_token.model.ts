
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
        location_id,
        role_text,
        dtExpiration,
        strStatus,
        responded,
        dtResponded,
        completed,
        dtCompleted,
        strResponse,
        training_reminder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        strToken = ?,
        location_id = ?,
        role_text = ?,
        dtExpiration = ?,
        strStatus = ?,
        responded = ?,
        dtResponded = ?,
        completed = ?,
        dtCompleted = ?,
        strResponse = ?,
        dtLastSent = ?,
        manually_validated_by = ?,
        training_reminder = ?
      `;
      const param = [
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
        ('notification_config_id' in this.dbData) ? this.dbData['notification_config_id'] : 0,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('role_text' in this.dbData) ? this.dbData['role_text'] : '',
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('strStatus' in this.dbData) ? this.dbData['strStatus'] : 'Pending',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',        
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('role_text' in this.dbData) ? this.dbData['role_text'] : '',
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('strStatus' in this.dbData) ? this.dbData['strStatus'] : 'Pending',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',
        ('dtLastSent' in this.dbData) ? this.dbData['dtLastSent'] : '0000-00-00',
        ('manually_validated_by' in this.dbData) ? this.dbData['manually_validated_by'] : 0,
        ('training_reminder' in this.dbData) ? this.dbData['training_reminder'] : 0
      ];

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_insert, param, (err, results) => {
          if (err) {
            console.log('Cannot create record NotificationToken', err, sql_insert, param);
            throw new Error(err);
          }
          this.id = results.insertId;
          this.dbData['notification_token_id'] = this.id;
          resolve(true);
        });
        connection.release();

      });

      

    });

  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE notification_token SET
          strToken = ?,
          user_id = ?,
          notification_config_id = ?,
          location_id = ?,
          role_text = ?,
          dtExpiration = ?,
          strStatus = ?,
          responded = ?,
          dtResponded = ?,
          completed = ?,
          dtCompleted = ?,
          strResponse = ?,
          dtLastSent = ?,
          manually_validated_by = ?,
          training_reminder = ?
        WHERE notification_token_id = ?
      `;
      const param = [
        ('strToken' in this.dbData) ? this.dbData['strToken'] : '',
        ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
        ('notification_config_id' in this.dbData) ? this.dbData['notification_config_id'] : 0,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('role_text' in this.dbData) ? this.dbData['role_text'] : '',
        ('dtExpiration' in this.dbData) ? this.dbData['dtExpiration'] : '0000-00-00',
        ('strStatus' in this.dbData) ? this.dbData['strStatus'] : 'Pending',
        ('responded' in this.dbData) ? this.dbData['responded'] : 0,
        ('dtResponded' in this.dbData) ? this.dbData['dtResponded'] : '0000-00-00',
        ('completed' in this.dbData) ? this.dbData['completed'] : 0,
        ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : '0000-00-00',
        ('strResponse' in this.dbData) ? this.dbData['strResponse'] : '',
        ('dtLastSent' in this.dbData) ? this.dbData['dtLastSent'] : '0000-00-00',
        ('manually_validated_by' in this.dbData) ? this.dbData['manually_validated_by'] : 0,
        ('training_reminder' in this.dbData) ? this.dbData['training_reminder'] : 0,
        this.ID() ? this.ID() : 0
      ];
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_update, param, (err, results) => {
          if (err) {
            console.log('Cannot update record NotificationToken');
            throw Error(err);
          }
          resolve(true);

        });
        connection.release();

      });
      
    });
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM notification_token WHERE notification_token_id = ?`;
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [this.id], (error, results) => {
          if (error) {
            console.log('Cannot load record NotificationToken', sql_load);
            throw Error(error);
          }        
          if (results.length > 0) {
            this.dbData = results[0];
            this.setID(results[0]['notification_token_id']);          
          }        
          resolve(this.dbData);
        });
        connection.release();

      });
      
    });
  }


  public loadByContraintKeys(userId = 0, configId = 0): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT *, IF(dtExpiration < NOW(), 'expired', 'active') as expiration_status FROM notification_token
        WHERE user_id = ? AND notification_config_id = ?`;

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [userId, configId], (error, results) => {
          if (error) {
            console.log('NotificationToken.loadByContraintKeys', error, sql_load);
            throw Error(error);
          }
          if (results.length) {
            this.dbData = results[0];
            this.setID(results[0]['notification_token_id']);
            resolve(this.dbData);
          } else {
            resolve({});
          }
        });
        connection.release();

      });
      

    });
  }

  public getByUserId(userId = 0): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT *, IF(dtExpiration < NOW(), 'expired', 'active') as expiration_status FROM notification_token
        WHERE user_id = ?  `;

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [userId], (error, results) => {
          if (error) {
            console.log('NotificationToken.loadByContraintKeys', error, sql_load);
            throw Error(error);
          }
          this.dbData = results;
          resolve(this.dbData);
        });
        connection.release();

      });
      

    });
  }

  public getTokensByConfigId(configId = 0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT notification_token.*, users.email, users.first_name, users.last_name FROM notification_token
      INNER JOIN users ON notification_token.user_id = users.user_id
              WHERE notification_config_id = ?`;

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [configId], (error, results) => {
          if (error) {
            console.log('NotificationToken.getTokensByConfigId', error, sql_load);
            throw Error(error);
          }
          resolve(results);
        });
        connection.release();

      });
    });
  }

  public generateNotifiedUsers(config = 0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT
                  users.user_id,
                  users.first_name,
                  users.last_name,
                  users.email,
                  users.mobile_number,
                  accounts.account_name,
                  notification_token.notification_token_id,                  
                  notification_token.role_text,
                  notification_token.dtLastSent,
                  users.last_login, parent_loctions.name as parent, locations.name, notification_token.strStatus
               FROM
                 users
               INNER JOIN
                 notification_token
               ON
                 users.user_id = notification_token.user_id
               INNER JOIN
				         accounts
			         ON
                 accounts.account_id = users.account_id
               INNER JOIN
                 notification_config
               ON
                 notification_token.notification_config_id = notification_config.notification_config_id
               INNER JOIN
                 locations ON locations.location_id = notification_token.location_id
               LEFT JOIN
                 locations as parent_loctions ON locations.parent_id = parent_loctions.location_id
               WHERE
                 notification_token.notification_config_id = ?
               ORDER BY accounts.account_name, users.user_id`;

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql, [config], (error, results) => {
         if (error) {
           console.log('NotificationToken.generateNotifiedUsers', sql, error, config);
           throw Error(error);
         }
         resolve(results);
        });
        connection.release();

      });
      
    });
  }

}
