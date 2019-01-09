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
                    resolve(this.dbData);
                });
                connection.release();
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error();
                }
                const sql_update = `
                    UPDATE
                        reward_program_config
                    SET
                        sponsor_to_id = ?,
                        sponsor_to_id_type = ?,
                        sponsor = ?,
                        sponsor_contact_email = ?,
                        user_role = ?,
                        enabled = ?,
                        modified_by = ?,
                        raw_config = ?
                    WHERE
                    reward_program_config_id = ?
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
                    this.id
                ];

                connection.query(sql_update, param, (err, results) => {
                    if (err) {
                        console.log('Cannot update config record for reward program', err, sql_update);                        
                        throw new Error(err);
                    }
                    if ('incentives' in this.dbData) { 
                        this.deleteRewardIncentives().then(() => {
                            for (let incentive of (this.dbData['incentives'] as Array<object>)) {
                                this.insertProgramIncentives(incentive['incentive'], incentive['points']);
                            }
                        });
                    }

                    if ('activities' in this.dbData) { 
                        this.deleteActivities().then(() => {
                            for (let activity of (this.dbData['activities'] as Array<object>)) {
                                this.insertActivities(activity['activity'], activity['points']);
                            }
                        });
                    }
                   
                    resolve(true);
                
                });
                connection.release();

            });
        });
    }

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
                connection.query(sql_insert, param, (error, results) => {
                    if (error) {
                        console.log('Cannot create config record for reward program', error, sql_insert);                        
                        throw new Error(error);   
                    }
                    this.id = results.insertId;
                    this.dbData['reward_program_config_id'] = this.id;                   
                    this.deleteRewardIncentives().then(() => {
                        if ('incentives' in this.dbData) {
                            for (let incentive of (this.dbData['incentives'] as Array<object>)) {
                                this.insertProgramIncentives(incentive['incentive'], incentive['points']);
                            }
                        }
                    });
                    this.deleteActivities().then(() => {
                        if ('activities' in this.dbData) {
                            for (let activity of (this.dbData['activities'] as Array<object>)) {
                                this.insertActivities(activity['activity'], activity['points']);
                            }
                        }
                    });
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

    public deleteProgramBuildings() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_delete = `DELETE FROM reward_program_buildings WHERE reward_program_config_id = ?`;
                connection.query(sql_delete, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot delete reward program buildings', sql_delete, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            });
        });
    }

    public deleteUsers() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_delete = `DELETE FROM user_reward_points WHERE reward_program_config_id = ?`;
                connection.query(sql_delete, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot delete reward program users', sql_delete, error);
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
                        console.log('Cannot insert reward program activities', sql_insert_activities, error, `config_id = ${this.id}`, activity, points);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            });            
        });
    }

    private deleteRewardIncentives() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_delete = `DELETE FROM reward_program_incentives WHERE reward_program_config_id = ?`;
                connection.query(sql_delete, [this.id], (error, results) => {
                    if (error) {
                        console.log('Cannot delete reward program incentives', sql_delete, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            });            
        }); 
    }


    private insertProgramIncentives(incentive, points) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_insert_activities = `INSERT INTO reward_program_incentives (
                    reward_program_config_id,
                    incentive,
                    points_to_earn
                ) VALUES ( ?, ?, ?)`;
                connection.query(sql_insert_activities, [this.id, incentive, points], (error, results) => {
                    if (error) {
                        console.log('Cannot insert reward program activities', sql_insert_activities, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
            }); 
        });
    }

    public insertRelatedBuildingConfig(location, configId) {
        return new Promise((resolve, reject) => {
           this.pool.getConnection((err, connection) => {
               if (err) {
                   throw new Error(err);
               }
               const sql_insert = `
               INSERT INTO reward_program_buildings (location_id, reward_program_config_id)
               VALUES (?, ?) ON DUPLICATE KEY UPDATE dtAdded = NOW()`;
                connection.query(sql_insert, [location, configId], (error, results) => {
                    if (error) {
                        console.log('Cannot insert reward program location', sql_insert, error);
                        throw new Error(error);
                    }
                    resolve(true);                    
                });
                connection.release();
                    
           }); 
        });
    }

    public getBuildingSubLevels(buildings = []): Promise<Array<number>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                } 
                if (buildings.length == 0) {
                    resolve([]);
                    return;
                }
                const sql = `SELECT location_id FROM locations WHERE parent_id IN ( ${buildings.join(',')}) AND archived = 0`;
                const set = [];
                connection.query(sql, [], (error, results) => {
                    if (error) {
                        console.log('Cannot get sublevels for reward programs', sql, error);
                        throw new Error(error);
                    }
                    for(let r of results) {
                        set.push(r['location_id']);
                    }
                    resolve(set);
                                      
                });
                connection.release();
            });
        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            Object.keys(createData).forEach((key) => {
              this.dbData[key] = createData[key];
            });
            if ('reward_program_config_id' in createData) {
              this.id = createData['reward_program_config_id'];
            }
            resolve(this.write());
        });
    }

    /**
     * 
     * @param accountId 
     * The account id in which we will get all the related locations (buildings only) from 
     * location_account_relation table
     * 
     * @returns 
     * array of location object
     * 
     */
    public candidateBuildingLocations(accountId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_get = `SELECT
                                    locations.location_id, 
                                    locations.name as location_name
                                FROM
                                    location_account_relation
                                INNER JOIN
                                    locations
                                ON
                                    location_account_relation.location_id = locations.location_id
                                WHERE
                                    location_account_relation.account_id = ?
                                AND
                                    locations.is_building = 1;`;

                connection.query(sql_get, [accountId], (error, results) => {
                    if (error) {
                        console.log('Cannot insert reward program location', sql_get, error);
                        throw new Error(error);
                    }
                    resolve(results);                    
                });
                connection.release();
            });
        });

    }

    public getAllConfig(): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
           this.pool.getConnection((err, connection) => {
               if (err) {
                   throw new Error(err);
               }
               const sqlAll = `
               SELECT
                    reward_program_config.reward_program_config_id,    
                    reward_program_config.sponsor,
                    accounts.account_name,
                    locations.name as location_name,
                    reward_program_incentives.incentive,
                    reward_program_config.sponsor_to_id_type,
                    reward_program_config.sponsor_to_id,
                    user_reward_points.user_id as user_reward_id,
                    user_redeemed_item.user_id as redeemer_id
                FROM
                    reward_program_config
                INNER JOIN
                    reward_program_incentives
                ON
                    reward_program_config.reward_program_config_id = reward_program_incentives.reward_program_config_id
                LEFT JOIN accounts ON (accounts.account_id = reward_program_config.sponsor_to_id AND reward_program_config.sponsor_to_id_type = 'account')                
                LEFT JOIN locations ON (locations.location_id = reward_program_config.sponsor_to_id AND reward_program_config.sponsor_to_id_type = 'location')
                LEFT JOIN user_reward_points ON user_reward_points.reward_program_config_id = reward_program_config.reward_program_config_id
                LEFT JOIN user_redeemed_item ON user_redeemed_item.reward_program_config_id = reward_program_config.reward_program_config_id
                WHERE reward_program_config.enabled = 1
                ORDER BY reward_program_config.reward_program_config_id ASC;`;
               connection.query(sqlAll, [], (error, results) => {
                   if (error) {
                        console.log('Cannot get all reward program config', sqlAll, error);
                        throw new Error(error); 
                   }
                   resolve(results);
               });
               connection.release();
           }); 
        });
    }

    public setCandidateUserForReward(reward_program_config_id=0, userId=0, acitivity=0, totalPoints=0) {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (reward_program_config_id) {
                program_config_id = reward_program_config_id;
            }
            this.clearRecordOfCandidateWithZeroActivity(program_config_id,userId).then(() => {
                this.pool.getConnection((err, connection) => {
                    if (err) {
                        throw new Error(err);
                    }
                    const sql_insert = `INSERT INTO user_reward_points (
                        reward_program_config_id,
                        user_id,
                        activity,
                        totalPoints    
                    ) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE                        
                        dtPointsEarned = NOW();
                    `;
                    connection.query(sql_insert, [program_config_id, userId, acitivity, totalPoints], (error, results) => {
                        if (error) {
                            console.log('Cannot insert user reward points record', sql_insert, error);
                            throw new Error(error);
                        }
                        /*
                        this.computeForTotalActivityPoints(userId, program_config_id).then(() => {
                            resolve(true);
                        }).catch((e) => {
                            console.log(e);
                        });
                        */
                       resolve(true);
                    });
                    connection.release();
                });
            }).catch((e) => {
                console.log(e);
            });
            


        });

    }

    public computeForTotalActivityPoints(userIds=[], configId=0): Promise<any> {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            if (!userIds.length) {                
                resolve(0);
                return;
            }
            let selectClause = 'SUM(reward_program_activities.activity_points) AS total_points';
            let userIdsStr = userIds.join(',');
            let groupByClause = '';
            if (userIds.length > 1) {
                selectClause = `
                user_reward_points.user_id,
                user_reward_points.totalPoints`;

                groupByClause = `GROUP BY user_reward_points.user_id`;
            } 

            
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_total = `SELECT 
                    ${selectClause}
                FROM
                    user_reward_points
                INNER JOIN
                    reward_program_activities
                ON
                    user_reward_points.activity = reward_program_activities.reward_program_activities_id  
                WHERE
                    user_reward_points.user_id IN (${userIdsStr}) AND user_reward_points.reward_program_config_id = ?
                ${groupByClause};`;

                connection.query(sql_total, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot compute total points', sql_total, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();                    
            });
        });
    }

    public updateUserTotalActivityPoints(userId = 0, configId=0, totalPoints) {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_update = `UPDATE
                    user_reward_points
                SET
                    totalPoints = ? 
                WHERE
                    user_reward_points.user_id = ? 
                AND
                    user_reward_points.reward_program_config_id = ?;
                ;`;

                connection.query(sql_update, [totalPoints, userId, program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot compute total points', sql_update, error);
                        throw new Error(error);
                    }
                    resolve(true);
                });
                connection.release();                    
            });
        });
    }

    public getRewardee(configId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql = `SELECT
                    users.user_id,
                    users.first_name,
                    users.last_name,
                    users.email,
                    accounts.account_name
                FROM
                    users
                INNER JOIN
                    user_reward_points
                ON
                    users.user_id = user_reward_points.user_id
                INNER JOIN
                    accounts
                ON
                    users.account_id = accounts.account_id
                WHERE
                    user_reward_points.reward_program_config_id = ?
                GROUP BY users.user_id;`;

                connection.query(sql, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot insert user reward points record', sql, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();                    
            });
             
        });
    }

    public getProgramActivities(configId=0) {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql = `SELECT
                    activity,
                    activity_points
                FROM
                    reward_program_activities
                WHERE
                    reward_program_config_id = ?`;

                connection.query(sql, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot retrieve reward program activities', sql, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });

                connection.release();
            });

        });

    }

    public getProgramIncentives(configId=0) {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql = `SELECT
                    *
                FROM
                    reward_program_incentives
                WHERE
                    reward_program_config_id = ?`;

                connection.query(sql, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot retrieve reward program incentives', sql, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });

                connection.release();
            });

        }); 
    } 

    public userRedeemedItem(userIds=[], configId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) { 
                    throw new Error(err);
                }
                if (!userIds.length) {
                    resolve([]);
                    return;
                }
                const userIdsStr = userIds.join(','); 
                const sql_get = `
                    SELECT
                        *
                    FROM
                        user_redeemed_item
                    INNER JOIN
                        reward_program_incentives
                    ON
                        user_redeemed_item.reward_program_incentives_id = reward_program_incentives.reward_program_incentives_id
                    WHERE
                        user_redeemed_item.user_id IN (${userIdsStr})
                    AND
                    user_redeemed_item.reward_program_config_id = ?
                `;

                connection.query(sql_get, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot retrieve user redeemed items', sql_get, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();
            }); 
        });
    }

    public getProgramConfigBuildings(configId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql = `SELECT                   
                    locations.location_id,
                    locations.name AS location_name
                FROM 
                    reward_program_buildings
                INNER JOIN
                    locations
                ON
                    reward_program_buildings.location_id = locations.location_id
                WHERE
                    reward_program_buildings.reward_program_config_id = ? AND locations.is_building = 1`;

                connection.query(sql, [program_config_id], (error, results) => {
                    if (error) {
                        console.log('Cannot retrieve reward program buildings', sql, error);
                        throw new Error(error);
                    }
                    resolve(results);
                });

                connection.release();
            });

        }); 
    }


    private clearRecordOfCandidateWithZeroActivity(configId=0, userId=0) {
        return new Promise((resolve, reject) => {
            let program_config_id = this.ID();
            if (configId) {
                program_config_id = configId;
            }
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                const sql_delete = `DELETE FROM user_reward_points WHERE user_id = ? AND reward_program_config_id = ? AND activity = 0`;
                connection.query(sql_delete, [userId, configId], (error, results) => {
                    if (error) {
                         console.log('Cannot delete user reward points entry', sql_delete, error);
                         throw new Error(error); 
                    }
                    resolve(results);
                });
                connection.release();
            });
        });
    }

}