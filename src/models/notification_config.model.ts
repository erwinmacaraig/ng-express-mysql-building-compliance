
import { BaseClass } from './base.model';
import * as Promise from 'promise';


export class NotificationConfiguration extends BaseClass {
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
      if ('notification_config_id' in createData) {
        this.id = createData['notification_config_id'];
      }
      resolve(this.write());
    });
  }

  public loadByBuilding(building=0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM notification_config WHERE building_id = ?`;

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [building], (error, results) => {
          if (error) {
            console.log('Cannot load record NotificationConfiguration', sql_load);
            throw Error(error);
          } 
          if (results.length) {
            this.dbData = results[0];
            this.setID(results[0]['notification_config_id']);
            resolve(results);
          } else {
            resolve([]);
          }
          connection.release();
        });
        

      });

    });
  }


  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO notification_config (
        building_id,
        account_id,
        user_type,
        users,
        user_responded,
        message,
        frequency,
        recipients,
        responders,
        building_manager,
        dtLastSent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        account_id = ?,        
        users = ?,
        user_responded = ?,
        message = ?,
        frequency = ?,
        recipients = ?,
        responders = ?,
        building_manager = ?,
        dtLastSent = ?
      `;

      const param = [
        ('building_id' in this.dbData) ? this.dbData['building_id'] : '0',
        ('account_id' in this.dbData) ? this.dbData['account_id'] : '0',
        ('user_type' in this.dbData) ? this.dbData['user_type'] : '',
        ('users' in this.dbData) ? this.dbData['users'] : '',
        ('user_responded' in this.dbData) ? this.dbData['user_responded'] : '',
        ('message' in this.dbData) ? this.dbData['message'] : '',
        ('frequency' in this.dbData) ? this.dbData['frequency'] : 0,
        ('recipients' in this.dbData) ? this.dbData['recipients'] : 0,
        ('responders' in this.dbData) ? this.dbData['responders'] : 0,
        ('building_manager' in this.dbData) ? this.dbData['building_manager'] : 0,
        ('dtLastSent' in this.dbData) ? this.dbData['dtLastSent'] : '0000-00-00',
        ('account_id' in this.dbData) ? this.dbData['account_id'] : '0',        
        ('users' in this.dbData) ? this.dbData['users'] : '',
        ('user_responded' in this.dbData) ? this.dbData['user_responded'] : '',
        ('message' in this.dbData) ? this.dbData['message'] : '',
        ('frequency' in this.dbData) ? this.dbData['frequency'] : 0,
        ('recipients' in this.dbData) ? this.dbData['recipients'] : 0,
        ('responders' in this.dbData) ? this.dbData['responders'] : 0,
        ('building_manager' in this.dbData) ? this.dbData['building_manager'] : 0,
        ('dtLastSent' in this.dbData) ? this.dbData['dtLastSent'] : '0000-00-00'
      ];
      

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }
        connection.query(sql_insert, param, (err, results) => {
          if (err) {
            console.log('Cannot create record NotificationConfiguration', err, sql_insert);
            throw new Error(err);
          }
          this.id = results.insertId;          
          this.dbData['notification_config_id'] = this.id;
          resolve(true);
          connection.release();
        });
        
      });

    });

  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE notification_config SET
        building_id = ?,
        account_id = ?,
        user_type = ?,
        users = ?,
        user_responded = ?,
        message = ?,
        frequency = ?,
        recipients = ?,
        responders = ?,
        building_manager = ?,
        dtLastSent = ?
        WHERE notification_config_id = ?
      `;
      const param = [
        ('building_id' in this.dbData) ? this.dbData['building_id'] : '0',
        ('account_id' in this.dbData) ? this.dbData['account_id'] : '0',
        ('user_type' in this.dbData) ? this.dbData['user_type'] : '',
        ('users' in this.dbData) ? this.dbData['users'] : '',
        ('user_responded' in this.dbData) ? this.dbData['user_responded'] : '',
        ('message' in this.dbData) ? this.dbData['message'] : '',
        ('frequency' in this.dbData) ? this.dbData['frequency'] : 0,
        ('recipients' in this.dbData) ? this.dbData['recipients'] : 0,
        ('responders' in this.dbData) ? this.dbData['responders'] : 0,
        ('building_manager' in this.dbData) ? this.dbData['building_manager'] : 0,
        ('dtLastSent' in this.dbData) ? this.dbData['dtLastSent'] : '0000-00-00',
        this.ID() ? this.ID() : 0
      ];
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }
        connection.query(sql_update, param, (err, results) => {
          if (err) {
            console.log('Cannot update record NotificationConfiguration');
            throw Error(err);
          }
          resolve(true);
          connection.release();
        });
        
      });
      
    });
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM notification_config WHERE notification_config_id = ?`;
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }
        connection.query(sql_load, [this.id], (error, results) => {
          if (error) {
            console.log('Cannot load record NotificationConfiguration', sql_load);
            throw Error(error);
          }
          if(results[0]){
            this.dbData = results[0];
            this.setID(results[0]['notification_config_id']);
          }
          resolve(this.dbData);
          connection.release();
        });
        
      });
      
    });
  }

  public generateConfigData(accountId = 0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      let whereAccountClause = '';
      if (accountId) {
        whereAccountClause = `WHERE notification_config.account_id = ${accountId}`;
      }
      const sql = `SELECT
                      notification_config.*,
                      locations.name
                    FROM
                      notification_config
                    INNER JOIN
                      locations
                    ON
                      notification_config.building_id = locations.location_id ${whereAccountClause}
                    ORDER BY notification_config.building_id`;
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }
        connection.query(sql, [accountId], (error, results) => {
          if (error) {
            console.log('Cannot generate list - NotificationConfiguration', sql);
            throw Error(error);
          }
          resolve(results);
          connection.release();
        });       
      });      
    });
  }
}
