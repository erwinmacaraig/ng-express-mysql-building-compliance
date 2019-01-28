
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';


export class TrainingRequirements extends BaseClass {

    constructor(id: number = 0) {
        super();
        if (id) {
            this.id = id;
        }
    }
    public load(): Promise<object> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM training_requirement WHERE training_requirement_id = ?`;
            this.pool.getConnection((err, connection) => {
                connection.query(sql, [this.id], (error, results, fields) => {
                    if (error) {
                        throw new Error('Error loading training requirements.');
                    } else {
                        if (results.length > 0) {
                            this.dbData = results[0];
                            this.setID(results[0]['training_requirement_id']);
                            resolve(this.dbData);
                        } else {
                            reject('No training requirement found.');
                        }
                    }
                });
                connection.release();
            });
        });
    }

    public getWhere(arrWhere): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM training_requirement `,
                count = 0;
            for(let i in arrWhere){
                if( count == 0 ){
                    sql += ' WHERE '+arrWhere[i];
                }else{
                    sql += ' AND '+arrWhere[i];
                }

                count++;
            }


            this.pool.getConnection((err, connection) => {
                connection.query(sql, [this.id], (error, results, fields) => {
                    if (error) {
                        throw new Error('Error loading training requirements.');
                    } else {
                        this.dbData = results;
                        resolve(results);
                    }
                });
                connection.release();
            });
            
        });
    }

    public dbInsert(): Promise <boolean> {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO training_requirement (
            training_requirement_name,
            num_months_valid,
            scorm_course_id,
            description
            ) VALUES (?, ?, ?, ?)`;

            const values = [
            ('training_requirement_name' in this.dbData) ? this.dbData['training_requirement_name'] : null,
            ('num_months_valid' in this.dbData) ? this.dbData['num_months_valid'] : null,
            ('scorm_course_id' in this.dbData) ? this.dbData['scorm_course_id'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null
            ];

            this.pool.getConnection((err, connection) => {
                connection.query(sql_insert, values, (error, results, fields) => {
                    if (error) {
                        throw new Error('Error inserting training requirements.');
                    }
                    this.id = results.insertId;
                    this.dbData['training_requirement_id'] = this.id;
                    resolve(true);
                });
                connection.release();
            });

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE training_requirement SET
            training_requirement_name = ?,
            num_months_valid = ?,
            scorm_course_id = ?,
            description = ?
            WHERE
            training_requirement_id = ?
            `;
            const values = [
            ('training_requirement_name' in this.dbData) ? this.dbData['training_requirement_name'] : null,
            ('num_months_valid' in this.dbData) ? this.dbData['num_months_valid'] : null,
            ('scorm_course_id' in this.dbData) ? this.dbData['scorm_course_id'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null,
            this.id
            ];
            
            this.pool.getConnection((err, connection) => {
                connection.query(sql_update, values, (error, results, fields) => {
                    if (error) {
                        throw new Error('Error inserting updating requirements.');
                    }
                    resolve(true);
                });
                connection.release();
            });
        });
    }

    public requirements_details(requirement_ids = [], em_roles = []): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        if (!requirement_ids.length || !em_roles.length) {
          resolve([]);
          return;
        }
        const requirements = requirement_ids.join(',');
        const roles = em_roles.join(',');

        const sql = `SELECT em_roles.em_roles_id, training_requirement.*, em_roles.role_name FROM training_requirement
            INNER JOIN em_role_training_requirements ON
            training_requirement.training_requirement_id = em_role_training_requirements.training_requirement_id
            INNER JOIN em_roles ON em_role_training_requirements.em_role_id = em_roles.em_roles_id
            WHERE training_requirement.training_requirement_id IN (${requirements})
            AND em_roles.em_roles_id IN (${roles})`;

        
        this.pool.getConnection((err, connection) => {
            connection.query(sql, [], (error, results) => {
                if (error) {
                    console.log('training_requirements.requirement_details', error, sql);
                    throw Error('Cannot get requirements');
                }
                resolve(results);
            });
            connection.release();
        });

      });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            Object.keys(createData).forEach((key) => {
                this.dbData[key] = createData[key];
                if ('training_requirement_id' in createData) {
                    this.id = createData['training_requirement_id'];
                }
            });
            resolve(this.write());
        });
    }

    public allEmRolesTrainings():Promise<Array<object>>{
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    emt.em_role_training_requirements_id,
                    em.role_name,
                    emt.em_role_id,
                    tr.training_requirement_id,
                    tr.training_requirement_name,
                    tr.num_months_valid
                FROM em_role_training_requirements emt
                INNER JOIN em_roles em ON emt.em_role_id = em.em_roles_id
                INNER JOIN training_requirement tr ON emt.training_requirement_id = tr.training_requirement_id
                ORDER BY em.em_roles_id
            `;
            

            this.pool.getConnection((err, connection) => {
                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        throw new Error('Error allEmRolesTrainings');
                    } else {
                        resolve(results);                        
                    }
                });
                connection.release();
            });
            
        });
    }

    public addTrainingModule(trainingRequirementId=0, moduleData={}): Promise<boolean> {
        let trid = this.ID();

        if (trainingRequirementId) {
            trid = trainingRequirementId;
        }
                
        return new Promise((resolve, reject) => {
            const sql = `INSERT INT training_module  (
                            training_requirement_id,
                            module_name,
                            module_subname,
                            module_launcher,
                            module_skill_points,
                            addedBy
                        VALUES (?, ?, ?, ?, ?, ?);`;
            const params = [
                trid,
                ('module_name' in moduleData) ?  moduleData['module_name'] : null,
                ('module_subname' in moduleData) ? moduleData['module_subname'] : null,
                ('module_launcher' in moduleData) ? moduleData['module_launcher'] : null,
                ('module_skill_points' in moduleData) ? moduleData['module_skill_points'] : null,
                ('addedBy' in moduleData) ? moduleData['addedBy'] : null
            ];            
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error();
                } 
                connection.query(sql, params, (error, results) => {
                    if (error) {
                        console.log('Cannot insert training module', sql, params);
                        throw new Error(error);
                    }
                    resolve(true);
                });
                connection.release();

            });
        });
    } 

    public getTrainingModulesForRequirement(trainingRequirementId=0): Promise<Array<object>> {
        let trid = this.ID();

        if (trainingRequirementId) {
            trid = trainingRequirementId;
        }
        
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM training_module WHERE training_requirement_id = ?`;
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error();
                }
                const params = [trid]; 
                connection.query(sql, params, (error, results) => {
                    if (error) {
                        console.log('Cannot retrieve training modules for this requirement id', sql, params);
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();

            });
        });
    }

}
