
import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { TrainingCertification } from './training.certification.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class CourseUserRelation extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load(): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM course_user_relation WHERE course_user_relation_id = ?`;
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql_load, [this.ID()], (error, results, fields) => {
            if (error) {
              console.log('course-user-relation.model.load', error, sql_load);
              throw new Error('There was a problem loading course user relation id');
            }
            if (!results.length) {
              reject({'message': 'No records found with relation id:' + this.ID()});
            } else {
              this.dbData = results[0];
              this.setID(results[0]['course_id']);
              resolve(this.dbData);
            }
          });
          connection.release();
      });
      
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO course_user_relation (
        user_id,
        course_id,
        training_requirement_id,
        dtTimeStamp,
        disabled
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?) ON DUPLICATE KEY UPDATE disabled = ?`;
      const param = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
        ('course_id' in this.dbData) ? this.dbData['course_id'] : 0,
        ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
        ('disabled' in this.dbData) ? this.dbData['disabled'] : 0,
        ('disabled' in this.dbData) ? this.dbData['disabled'] : 0
      ];
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql_insert, param, (error, results, fields) => {
            if (error) {
              console.log('course_user_relation.model.dbInsert', error, sql_insert);
              throw new Error('There was a problem registering this person to the course');
            }
            this.id = results.insertId;
            this.dbData['course_user_relation_id'] = this.id;
            resolve(true);
          });
          connection.release();
      });
      
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE course_user_relation SET
                            user_id = ?,
                            course_id = ?,
                            training_requirement_id = ?,
                            disabled = ?
                          WHERE
                            course_user_relation_id = ?
      `;
      const param = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
        ('course_id' in this.dbData) ? this.dbData['course_id'] : null,
        ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
        ('disabled' in this.dbData) ? this.dbData['disabled'] : 0,
        this.ID() ? this.ID() : 0
      ];
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql_update, param, (error, results, fields) => {
            if (error) {
              console.log('course_user_relation.model.dbUpdate', error, sql_update);
              throw new Error('Cannot update relation');
            }
            resolve(true);
          });
          connection.release();
      });
      
    });
  }

  public getWhere(arrWhere): Promise<object> {
      return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM course_user_relation `,
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
              if(err){
                  throw new Error(err);
              }

              connection.query(sql, [this.id], (error, results, fields) => {
                  if (error) {
                      throw new Error('Error loading course user relation');
                  } else {
                      this.dbData = results;
                      resolve(this.dbData);
                  }
              });
              connection.release();
          });
          
      });
  }

  public create(createData: object) {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
      });
      if ('course_user_relation_id' in createData) {
        this.id = createData['course_user_relation_id'];
      }
      resolve(this.write());
    });
  }

  public getRelation(filter = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      let bulk = false;
      const values = [];
      if ('user' in filter) {
        whereClause += ` AND user_id = ?`;
        values.push(filter['user']);
      }
      if ('course' in filter) {
        whereClause += ` AND course_id = ?`;
        values.push(filter['course']);
      }
      if ('training_requirement' in filter) {
        whereClause += ` AND training_requirement_id = ?`;
        values.push(filter['training_requirement']);
      }
      if ('bulk_training_requirement' in filter && Array.isArray(filter['bulk_training_requirement'])) {
        const trainingIds = (filter['bulk_training_requirement'] as Array<number>).join(',');
        whereClause += ` AND training_requirement_id IN (${trainingIds})`;
        bulk = true;
      }
      const sql_get = `SELECT
                        training_requirement_id,
                        course_user_relation_id
                      FROM
                        course_user_relation
                      WHERE 1=1 ${whereClause}`;
                      console.log(sql_get);
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql_get, values, (error, results, fields) => {
              if (error) {
                  console.log('course-user-relation.model', error, sql_get);
                  throw new Error('There was an error getting relationship');
              }
              if (results.length && !bulk) {
                  resolve(results[0]['course_user_relation_id']);
              } else if (results.length && bulk) {
                resolve(results);
              } else if (!results.length && bulk) {
                resolve([])
              } else {                
                reject({
                  'message': 'There are no relation between user and course'
              });
              }
          });
          connection.release();
      });
      
    });
  }

  public getRelationDetails(filter = {}): Promise<object> {
    return new Promise((resolve, reject) => {
      let whereClause = '';
      const values = [];
      if ('user' in filter) {
        whereClause += ` AND course_user_relation.user_id = ?`;
        values.push(filter['user']);
      }
      if ('course' in filter) {
        whereClause += ` AND course_user_relation.course_id = ?`;
        values.push(filter['course']);
      }
      if ('training_requirement' in filter) {
        whereClause += ` AND course_user_relation.training_requirement_id = ?`;
        values.push(filter['training_requirement']);
      }
      const sql_get = `SELECT
                        course_user_relation.course_user_relation_id,
                        course_user_relation.disabled,
                        course_user_relation.user_id,
                        course_user_relation.course_id,
                        course_user_relation.training_requirement_id,
                        scorm_course.course_launcher
                      FROM
                        course_user_relation
                      INNER JOIN
                        scorm_course
                      ON
                        course_user_relation.course_id = scorm_course.course_id
                      WHERE 1=1
                        ${whereClause}`;
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql_get, values, (error, results, fields) => {
              if (error) {
                  console.log('course-user-relation.model', error, sql_get);
                  throw new Error('There was an error getting relationship');
              }
              if (results.length) {
                  resolve(results[0]);
              } else {
                  reject({
                      'message': 'There are no relation between user and course'
                  });
              }
          });
          connection.release();
      });
      
    });
  }


  public getAllCourseForUser(user: number = 0, disabled?): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      if(disabled == undefined){
        disabled = 0;
      }
      const sql = `SELECT
            course_user_relation.*,
            scorm_course.*,
            scorm.parameter_value as lesson_status,
            tr.training_requirement_name,
            tr.scorm_course_id,
            certifications.certifications_id
        FROM
          course_user_relation
        INNER JOIN
          users
        ON users.user_id = course_user_relation.user_id
        INNER JOIN
          scorm_course
        ON
          course_user_relation.course_id = scorm_course.course_id
        INNER JOIN
          training_requirement tr ON course_user_relation.training_requirement_id = tr.training_requirement_id
        LEFT JOIN
          certifications
        ON (certifications.training_requirement_id = tr.training_requirement_id
        AND certifications.user_id = course_user_relation.user_id
        AND certifications.pass = 1 AND DATE_ADD(certifications.certification_date,
          INTERVAL tr.num_months_valid MONTH) > NOW()
        )
        LEFT JOIN
          scorm
        ON (course_user_relation.course_user_relation_id = scorm.course_user_relation_id
            AND scorm.parameter_name = 'cmi.core.lesson_status')
        WHERE
          course_user_relation.user_id = ? AND course_user_relation.disabled = ?
        ORDER BY course_user_relation.dtTimeStamp DESC`;
      
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }

          connection.query(sql, [user, disabled], (error, results, fields) => {
            if (error) {
              console.log('course-user-relation.model.getAllCourseForUser', error, sql);
              throw new Error('There was a problem retrieving all courses for this user - ' + user);
            }
            if (results.length > 0) {
              resolve(results);
            } else {
              reject('There were no records found for this user - ' +  user);
            }
          });
          connection.release();
      });

      
    });
  }

  public updateUserTrainingCourseCertificate() {
    return new Promise((resolve, reject) => {
      if (!this.id) {
        console.log('No object reference. Please pass object ID');
        reject('Cannot instantiate, no object id present');
        return;
      }
      const trainingCertObj = new TrainingCertification();
      this.load().then((courseUserRelationData) => {
        console.log(courseUserRelationData);
        trainingCertObj.checkAndUpdateTrainingCert({
          'training_requirement_id': courseUserRelationData['training_requirement_id'],
          'user_id': courseUserRelationData['user_id']
        }).then((data) => {
          resolve(true);
        }).catch((e) => {
          console.log(e);
          reject(e);
        });
      }).catch((er) => {
        console.log(er);
        reject('Unable to load data');
      });
    });
  }

  /**
   * @method getNumberOfAssignedCourses
   * You passed in an array of user ids and then query the db
   * processing the results rather than having to query
   * the database one by one by user id
   * @param user
   * Array of user id
   * The user(s) on which to query the number of assigned courses
   * @param disabled
   * filter for active assigned courses or disabled for this user
   * @description
   * Method to call to get the total assigned courses to a specific user(s)
   */
  public getNumberOfAssignedCourses(user = [], disabled?) {
    return new Promise((resolve, reject) => {
      const user_course_total: {[key: number]: {}} = {};
      let userIdString;
      if (disabled === undefined) {
        disabled = 0;
      }

      if (!user.length) {
        reject({});
      } else {
        userIdString = user.join(',');
        const sql_get = `SELECT user_id, course_user_relation_id, training_requirement_id
        FROM
          course_user_relation
        INNER JOIN
          scorm_course
        ON
          course_user_relation.course_id = scorm_course.course_id
        WHERE
          course_user_relation.user_id IN (${userIdString}) AND course_user_relation.disabled = ?
        ORDER BY
          user_id`;
      

        this.pool.getConnection((err, connection) => {
            if(err){
                throw new Error(err);
            }

            connection.query(sql_get, [disabled], (error, results, fields) => {
              if (error) {
                console.log('course-user-relation.getNumberOfAssignedCourses', error, sql_get);
                throw Error('Cannot query database');
              }
              if (!results.length) {
                resolve({});
              } else {
                for (let i = 0; i < results.length; i++) {
                  if (results[i]['user_id'] in user_course_total) {
                    user_course_total[results[i]['user_id']]['count'] = user_course_total[results[i]['user_id']]['count'] + 1;
                    if (user_course_total[results[i]['user_id']]['trids']
                      .indexOf(results[i]['training_requirement_id']) === -1 ) {
                        user_course_total[results[i]['user_id']]['trids'].push((results[i]['training_requirement_id']));
                      }
                  } else {
                    user_course_total[results[i]['user_id']] = {
                      'count': 1,
                      'trids': [results[i]['training_requirement_id']]
                    };
                  }
                }

                resolve(user_course_total);
              }
            });
            connection.release();
        });

      }

    });
  }

}
