import {BaseClass} from './base.model';
import * as Promise from 'promise';

export class UserTrainingModuleRelation extends BaseClass {
    constructor(id: number = 0) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load(): Promise<Object> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_training_module_relation WHERE user_training_module_id = ?`;
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
                });
                connection.release();

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
                dtCompleted,
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
                    return;
                });
                connection.release();

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
                });
                connection.release();

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

    trainingRequirementModuleStatus(userId=0, trId=0, moduleId=0) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM user_`;
        });
    }
    
}

