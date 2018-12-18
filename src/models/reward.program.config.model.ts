import {BaseClass} from './base.model';
import * as Promise from 'promise';

export class RewardConfig extends BaseClass {
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = `SELECT * FROM reward_program_config WHERE reward_program_config_id = ?`;
                connection.query(sql_load, [this.id], (error, results) => {
                    if (error) {
                        console.log(error);
                        throw new Error(error);
                    }
                    this.dbData = results[0];
                    this.setID(results[0]['reward_program_config_id']);
                });
                connection.release();
            });
        });
    }

    public dbUpdate() {}

    public dbInsert() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_insert = `INSERT INTO reward_program_config (
                    sponsor_to_id,
                    sponsor_to_id_type,
                    sponsor,
                    sponsor_contact_email,
                    user_role,
                    enabled,
                    modified_by,
                    raw_config
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    sponsor = ?,
                    sponsor_contact_email = ?,
                    user_role = ?,
                    enabled = ?,
                    modified_by = ?,
                    raw_config = ?
                `;
                const param = [
                    ('sponsor_to_id' in this.dbData) ? this.dbData['sponsor_to_id'] : 0,
                    ('sponsor_to_id_type' in this.dbData) ? this.dbData['sponsor_to_id_type'] : null,
                    ('sponsor' in this.dbData) ? this.dbData['sponsor'] : null,
                    ('sponsor_contact_email' in this.dbData) ? this.dbData['sponsor_contact_email'] : null,
                    ('user_role' in this.dbData) ? this.dbData['user_role'] : 0,
                    ('enabled' in this.dbData) ? this.dbData['enabled'] : 1,
                    ('modified_by' in this.dbData) ? this.dbData['modified_by'] : 0,
                    ('raw_config' in this.dbData) ? this.dbData['raw_config'] : null,

                    ('sponsor' in this.dbData) ? this.dbData['sponsor'] : null,
                    ('sponsor_contact_email' in this.dbData) ? this.dbData['sponsor_contact_email'] : null,                    
                    ('user_role' in this.dbData) ? this.dbData['user_role'] : 0,
                    ('enabled' in this.dbData) ? this.dbData['enabled'] : 1,
                    ('modified_by' in this.dbData) ? this.dbData['modified_by'] : 0,
                    ('raw_config' in this.dbData) ? this.dbData['raw_config'] : null,
                ];
                connection.query(sql_insert, param, async (error, results) => {
                    if (error) {
                        console.log('Cannot create config record for reward program', error, sql_insert);                        
                        throw new Error(error);   
                    }
                    this.id = results.insertId;
                    this.dbData['reward_program_config_id'] = this.id;
                    this.setID(results[0]['reward_program_config_id']);
                    await this.deleteActivities();
                    if ('activities' in this.dbData) {
                        for (let activity of (this.dbData['activities'] as Array<object>)) {
                            await this.insertActivities(activity['activity'], activity['points']);
                        }
                    }
                    
                    resolve(true);

                });
                connection.release();
            });
        });
    }

    private deleteActivities() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_delete = `DELETE FROM reward_program_activities WHERE reward_program_config_id = ?`;
                connection.query(sql_delete, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot delete reward program activities', sql_delete, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            });            
        });
    }
    private insertActivities(activity, points) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_insert_activities = `INSERT INTO reward_program_activities (
                    reward_program_config_id,
                    activity,
                    activity_points
                ) VALUES ( ?, ?, ?)`;
                connection.query(sql_insert_activities, [this.id, activity, points], (error, results) => {
                    if (error) {
                        console.log('Cannot delete reward program activities', sql_insert_activities, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            });            
        });
    }

    public create() {}

}