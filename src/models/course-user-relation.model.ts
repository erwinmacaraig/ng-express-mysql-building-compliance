import * as db from 'mysql2';
import { BaseClass } from './base.model';
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
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [this.ID], (error, results, fields) => {
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
      connection.end();
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO course_user_relation (
        user_id,
        course_id,
      ) VALUES (?, ?)`;
      const param = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
        ('course_id' in this.dbData) ? this.dbData['course_id'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_insert, param, (error, results, fields) => {
        if (error) {
          console.log('course_user_relation.model.dbInsert', error, sql_insert);
          throw new Error('There was a problem registering this person to the course');
        }
        this.id = results.insertId;
        this.dbData['course_user_relation_id'] = this.id;
        resolve(true);
      });
      connection.end();
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE course_user_relation SET
                            user_id = ?,
                            course_id = ?
                          WHERE
                            course_user_relation_id = ?
      `;
      const param = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
        ('course_id' in this.dbData) ? this.dbData['course_id'] : null,
        this.ID() ? this.ID() : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, param, (error, results, fields) => {
        if (error) {
          console.log('course_user_relation.model.dbUpdate', error, sql_update);
          throw new Error('Cannot update relation');
        }
        resolve(true);
      });
      connection.end();
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

  public getRelation(user: number = 0, course: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql_get = `SELECT
                        course_user_relation_id
                      FROM
                        course_user_relation
                      WHERE
                        user_id = ?
                      AND
                        course_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql_get, [user, course], (error, results, fields) => {
          if (error) {
              console.log('course-user-relation.model', error, sql_get);
              throw new Error('There was an error getting relationship');
          }
          if (results.length) {
              resolve(results[0]['course_user_relation_id']);
          } else {
              reject({
                  'message': 'There are no relation between user and course'
              });
          }
      });
      connection.end();
    });
  }

  public getAllCourseForUser(user: number = 0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT
                     *
                  FROM
                    course_user_relation
                  INNER JOIN
                    scorm_course
                  ON
                    course_user_relation.course_id = scorm_course.course_id
                  WHERE
                    course_user_relation.user_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql, [user], (error, results, fields) => {
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
      connection.end();
    });
  }
}
