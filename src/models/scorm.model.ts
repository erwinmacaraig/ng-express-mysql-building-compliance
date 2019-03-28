import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');
import * as moment from 'moment';
import * as Promise from 'promise';

export class Scorm extends BaseClass {
    
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {

    }

    public dbInsert() {

    }

    public dbUpdate() {

    }

    public create(createData) {

    }

    public init(relationId: number = 0) {
        return new Promise((resolve, reject) => {
            this.checkRelationExist(relationId).then((exists) => {
                if (exists) {
                    resolve(true);
                } else {
                    const sql_init = `INSERT INTO scorm (course_user_relation_id, parameter_name, parameter_value)
                    VALUES
                      (${relationId}, 'last_accessed', ${moment().format('YYYY-MM-DD')}),
                      (${relationId}, 'cmi.core._children', ''),
                      (${relationId}, 'cmi.core.student_id', ''),
                      (${relationId}, 'cmi.core.student_name', ''),
                      (${relationId}, 'cmi.core.lesson_location', ''),
                      (${relationId}, 'cmi.core.credit', ''),
                      (${relationId}, 'cmi.core.lesson_status', 'not attempted'),
                      (${relationId}, 'cmi.core.entry', ''),
                      (${relationId}, 'cmi.core.score_children', ''),
                      (${relationId}, 'cmi.core.score.raw', 0),
                      (${relationId}, 'cmi.core.score.max', 0),
                      (${relationId}, 'cmi.core.score.min', 0),
                      (${relationId}, 'cmi.core.total_time', '0000:00:00.00'),
                      (${relationId}, 'cmi.core.lesson_mode', 'normal'),
                      (${relationId}, 'cmi.core.exit', ''),
                      (${relationId}, 'cmi.core.session_time', '0000:00:00.00'),
                      (${relationId}, 'cmi.suspend_data', ''),
                      (${relationId}, 'cmi.launch_data', ''),
                      (${relationId}, 'cmi.comments', ''),
                      (${relationId}, 'cmi.comments_from_lms', ''),
                      (${relationId}, 'cmi.objectives._children', ''),
                      (${relationId}, 'cmi.objectives._count', ''),
                      (${relationId}, 'cmi.objectives.n.id', ''),
                      (${relationId}, 'cmi.objectives.n.score._children', ''),
                      (${relationId}, 'cmi.objectives.n.score.raw', ''),
                      (${relationId}, 'cmi.objectives.n.score.max', ''),
                      (${relationId}, 'cmi.objectives.n.score.min', ''),
                      (${relationId}, 'cmi.objectives.n.status', 'not attempted'),
                      (${relationId}, 'cmi.student_data._children', ''),
                      (${relationId}, 'cmi.student_data.mastery_score', 0),
                      (${relationId}, 'cmi.student_data.max_time_allowed', '0000:00:00.00'),
                      (${relationId}, 'cmi.student_data.time_limit_action', 'exit.message'),
                      (${relationId}, 'cmi.student_preference._children', ''),
                      (${relationId}, 'cmi.student_preference.audio', ''),
                      (${relationId}, 'cmi.student_preference.language',''),
                      (${relationId}, 'cmi.student_preference.speed', ''),
                      (${relationId}, 'cmi.student_preference.text', ''),
                      (${relationId}, 'cmi.interactions._children', ''),
                      (${relationId}, 'cmi.interactions._count', 0),
                      (${relationId}, 'cmi.interactions.n.id', ''),
                      (${relationId}, 'cmi.interactions.n.objectives._count', ''),
                      (${relationId}, 'cmi.interactions.n.objectives.n.id', ''),
                      (${relationId}, 'cmi.interactions.n.time', '0000:00:00.00'),
                      (${relationId}, 'cmi.interactions.n.type', 'choice'),
                      (${relationId}, 'cmi.interactions.n.correct_responses._count', 0),
                      (${relationId}, 'cmi.interactions.n.correct_responses.n.pattern', ''),
                      (${relationId}, 'cmi.interactions.n.weighting', 0),
                      (${relationId}, 'cmi.interactions.n.student_response', ''),
                      (${relationId}, 'cmi.interactions.n.result', 'neutral'),
                      (${relationId}, 'cmi.interactions.n.latency', '');`;
                    const connection = db.createConnection(dbconfig);
                    connection.query(sql_init, [], (error, results, fields) => {
                        if (error) {
                            console.log('scorm.model.init', error, sql_init);
                            throw new Error('There is an error initializing data models');
                        }
                        console.log(results);
                        resolve(true);
                    });
                    connection.end();
                }
            });
        });
    }

    private checkRelationExist(relationId: number = 0){
        return new Promise((resolve, reject) => {
            const sql_check = `SELECT course_user_relation_id FROM scorm WHERE course_user_relation_id = ? LIMIT 1`;
            this.pool.getConnection((err, connection) => {
                connection.query(sql_check, [relationId], (error, results, fields) => {
                    if (error) {
                        console.log('scorm.model.checkRelationsExist', error, sql_check);
                        throw new Error('cannot check relation');
                    }
                    if (!results.length) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
                connection.release();
            });
            
        });
    }

    public getDataModelVal(relation: number = 0, param: string = ''): Promise<string> {
        return new Promise((resolve, reject) => {
            console.log(`relation is ${relation}`);
            console.log(`parameter is ${param}`);
            const sql_get = `SELECT
                              parameter_value
                            FROM
                              scorm
                            WHERE
                              parameter_name = ?
                            AND
                              course_user_relation_id = ?
                            LIMIT 1`;
            this.pool.getConnection((err, connection) => {
                connection.query(sql_get, [param, relation], (error, results, fields) => {
                    if (error) {
                        console.log('scorm.model.getDataModelVal', error);
                        throw new Error('Cannot get data model value with the given parameter ' + param + ' AND relation ' + relation);
                    }
                    console.log(results);
                    resolve(results[0]['parameter_value']);
                });
                connection.release();
            });
            
        });
    }

    public setDataModelVal(relation: number = 0, paramName: string = '', paramVal: string = null): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql_set = `UPDATE
                              scorm
                            SET
                              parameter_value = ?
                            WHERE
                              parameter_name = ?
                            AND
                              course_user_relation_id = ?`;
            this.pool.getConnection((err, connection) => {
                connection.query(sql_set, [paramVal, paramName, relation], (error, results, fields) => {
                    if (error) {
                        console.log('scorm.model.setDataModelVal', error);
                        throw new Error('Cannot set value with the given parameter ' + paramName + ' AND relation ' + relation);
                    }
                    resolve(true);
                });
                connection.release();
            });
            
        });
    }
}

