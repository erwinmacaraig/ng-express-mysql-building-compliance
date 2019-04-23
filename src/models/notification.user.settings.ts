
import { BaseClass } from './base.model';
import * as Promise from 'promise';
import * as moment from 'moment';

export class NotificationUserSettingsModel extends BaseClass {
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
            if ('notification_user_settings_id' in createData) {
                this.id = createData['notification_user_settings_id'];
            }
            resolve(this.write());
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO notification_user_settings (
            user_id,
            frequency,
            one_month_training_reminder,
            date_created )
            VALUES (?, ?, ?, ?)
            `;

            const param = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
            ('frequency' in this.dbData) ? this.dbData['frequency'] : '0',
            ('one_month_training_reminder' in this.dbData) ? this.dbData['one_month_training_reminder'] : '',
            ('date_created' in this.dbData) ? this.dbData['date_created'] : moment().format('YYYY-MM-DD')
            ];

            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }
                connection.query(sql_insert, param, (err, results) => {
                    if (err) {
                        console.log('Cannot create record NotificationUserSettingsModel', err, sql_insert);
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['notification_user_settings_id'] = this.id;
                    resolve(true);
                    connection.release();
                });
                
            });

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE notification_user_settings SET
            user_id = ?,
            frequency = ?,
            one_month_training_reminder = ?,
            date_created = ?
            WHERE notification_user_settings_id = ?
            `;
            const param = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : '0',
            ('frequency' in this.dbData) ? this.dbData['frequency'] : '0',
            ('one_month_training_reminder' in this.dbData) ? this.dbData['one_month_training_reminder'] : '',
            ('date_created' in this.dbData) ? this.dbData['date_created'] : moment().format('YYYY-MM-DD'),
            this.ID() ? this.ID() : 0
            ];
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }
                connection.query(sql_update, param, (err, results) => {
                    if (err) {
                        console.log('Cannot update record NotificationUserSettingsModel');
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
            const sql_load = `SELECT * FROM notification_user_settings WHERE notification_user_settings_id = ?`;
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }
                connection.query(sql_load, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot load record NotificationUserSettingsModel', sql_load);
                        throw Error(error);
                    }
                    if(results[0]){
                        this.dbData = results[0];
                        this.setID(results[0]['notification_user_settings_id']);
                    }
                    resolve(this.dbData);
                    connection.release();
                });
                
            });

        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_load = `DELETE FROM notification_user_settings WHERE notification_user_settings_id = ?`;
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }
                connection.query(sql_load, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot load record NotificationUserSettingsModel delete', sql_load);
                        throw Error(error);
                    }
                    resolve(true);
                    connection.release();
                });
                
            });

        });
    }

    public getWhereUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM notification_user_settings WHERE user_id = ? ORDER BY date_created DESC`;
            this.pool.getConnection((err, connection) => {
                if(err){
                    throw new Error(err);
                }
                connection.query(sql_load, [userId], (error, results) => {
                    if (error) {
                        console.log('Cannot load record NotificationUserSettingsModel.getWhereUserId', sql_load);
                        throw Error(error);
                    }
                    this.dbData = results;
                    resolve(this.dbData);
                    connection.release();
                });
                
            });

        });
    }

}
