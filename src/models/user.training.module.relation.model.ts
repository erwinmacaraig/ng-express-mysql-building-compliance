import {BaseClass} from './base.model';
import * as Promise from 'promise';
import { getModuleFactory } from '@angular/core';

export class UserTrainingModuleRelation extends BaseClass {
    constructor(id: number = 0) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load(): Promise<Object> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_training_module_relation WHERE user_training_module_relation_id = ?`;
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                const params = [this.id];
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('Cannot load user training module relations', sql, params);
                    }
                    this.dbData = results[0];
                    this.setID(results[0]['user_training_module_relation_id']);
                    resolve(this.dbData);
                    connection.release();
                });
                

            });
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO user_training_module_relation (
                training_requirement_id,
                user_id,
                training_module_id,
                disabled,
                completed,
                dtLastAccessed,
                dtCompleted
            )
            VALUES
                (?, ?, ?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE
                disabled = ?,
                dtLastAccessed = NOW();`;
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                const params = [
                    ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                    ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
                    ('training_module_id' in this.dbData) ? this.dbData['training_module_id'] : 0,
                    ('disabled' in this.dbData) ?  this.dbData['disabled'] : 0,
                    ('completed' in this.dbData) ? this.dbData['completed'] : 0,
                    ('dtLastAccessed' in this.dbData) ? this.dbData['dtLastAccessed'] : null,
                    ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : null,
                    ('disabled' in this.dbData) ?  this.dbData['disabled'] : 0,


                ];
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('Cannot insert user training module relations', sql, params);
                    }                   
                    resolve(true);
                    connection.release();
                    return;
                    
                });
                

            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE
                            user_training_module_relation 
                        SET
                            training_requirement_id = ?,
                            user_id = ?,
                            training_module_id = ?,
                            disabled = ?,
                            completed = ?,                            
                            dtCompleted = ?
                        WHERE
                            user_training_module_relation_id = ?

            `;
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                const params = [
                    ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
                    ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
                    ('training_module_id' in this.dbData) ? this.dbData['training_module_id'] : 0,
                    ('disabled' in this.dbData) ?  this.dbData['disabled'] : 0,
                    ('completed' in this.dbData) ? this.dbData['completed'] : 0,                    
                    ('dtCompleted' in this.dbData) ? this.dbData['dtCompleted'] : null,
                    this.ID() ? this.ID() : 0
                ];
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('Cannot udpate user training module relations', sql, params);
                    }
                    resolve(true);
                    connection.release();
                });
               

            });
        });
    }

    public create(createData: object = {}) {
        return new Promise((resolve, reject) => {
            Object.keys(createData).forEach((key) => {
                this.dbData[key] = createData[key];
            });
            if ('user_training_module_relation_id' in createData) {
                this.id = createData['user_training_module_relation_id'];
            }
            resolve(this.write());
        });
    }

    trainingRequirementModuleStatuses(userId=0, trainingRequirementId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                            *
                        FROM
                            user_training_module_relation
                        WHERE
                            user_id = ?
                        AND
                            training_requirement_id = ? `;
            
            const params = [userId, trainingRequirementId];

            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('Cannot retrieve user training modules from method trainingRequirementModuleStatuses', sql, params);
                    }
                    resolve(results);
                    connection.release();
                });
                
            });

        });
    }

    userTrainingModuleRelationId(userId=0, trainingRequirementId=0, trainingModuleId=0, raw=false): Promise<any> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                            *
                        FROM
                            user_training_module_relation
                        WHERE
                            user_id = ?
                        AND
                            training_requirement_id = ?
                        AND
                            training_module_id = ?`;

            const params = [userId, trainingRequirementId, trainingModuleId];

            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('Cannot retrieve user_training_module_relation_id from method userTrainingModuleRelationId', sql, params);
                    }
                    this.id = results[0]['user_training_module_relation_id'];
                    this.dbData = results[0];
                    if (raw) {                        
                        resolve(results[0]);
                        
                    } else {
                        resolve(results[0]['user_training_module_relation_id']);
                    }
                    connection.release();
                    
                });
                
            });
                        
        });
        
    }

    public getUserTrainingModule(trainingRqmtId=0, userId=0, moduleId=0) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                            user_training_module_relation_id,
                            training_requirement_id,
                            user_id,
                            training_module_id,
                            disabled,
                            completed,
                            dtLastAccessed,
                            dtCompleted
                        FROM
                            user_training_module_relation
                        WHERE
                            training_requirement_id = ?
                        AND
                            user_id = ?
                        AND
                            training_module_id = ?`;
            
            const params = [trainingRqmtId, userId, moduleId];
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('user training module model method getUserTrainingModule', sql, params, err);
                        throw new Error(err);
                    }
                    resolve(results[0]);
                    connection.release();
                });
                
            });

        });
    }

    public listMiscTraining(userId=0, excludeTrainingIds=[], includeTrainingIds=[], uniq=true): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let trIdstr = '';
            if (excludeTrainingIds.length) {
                trIdstr = ` AND training_requirement_id NOT IN (${excludeTrainingIds.join(',')})`;
            } else if (includeTrainingIds.length) {
                trIdstr = ` AND training_requirement_id IN (${excludeTrainingIds.join(',')})`;
            }
            if (uniq) {
                trIdstr += ` GROUP BY training_requirement_id`;
            }
            const sql = `SELECT * FROM user_training_module_relation WHERE disabled = 0 AND user_id = ? ${trIdstr}`;
            const params = [userId];
            this.pool.getConnection((error, connection) => {
                if (error) {
                    throw new Error(error);
                }
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log('user training module model relation method listMiscTraining', sql, params, err);
                        throw new Error(err);
                    }
                    resolve(results);
                    connection.release();
                });
                
            });
        });
    }

    public getMyTrainingModules(userId=0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_training_module_relation WHERE user_id = ?`;
            const params = [userId];

            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql, params, (error, results) => {
                    if (error) {
                        console.log(error, sql, params);
                        throw new Error(error);
                    }
                    resolve(results);
                    connection.release();
                });
            });
        });
    }

    public resetMyTrainingModules(userId=0, trId=0): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sqlUpdate = `UPDATE
                user_training_module_relation
            SET
                completed = 0,
                dtCompleted = NULL
            WHERE
                user_id = ?
            AND
                training_requirement_id = ?
            AND 
                DATE_ADD(dtLastAccessed, INTERVAL 1 MONTH) < NOW()`;
            
            const params = [userId, trId];
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sqlUpdate, params, (error, results) => {
                    if (error) {
                        console.log(error, sqlUpdate, params);
                        throw new Error(error);
                    }
                    resolve(true);
                    connection.release();
                });
            });
        });
    }
}
