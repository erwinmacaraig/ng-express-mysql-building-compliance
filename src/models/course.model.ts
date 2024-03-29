
import { BaseClass } from './base.model';
import * as Promise from 'promise';

export class Course extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load(): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM scorm_course WHERE course_id = ?`;
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }
          connection.query(sql_load, [this.ID()], (error, results, fields) => {
            if (error) {
              console.log('course.model.load', error, sql_load);
              throw new Error('There was a problem loading data model values');
            }
            if (!results.length) {
              reject({'message': 'No records found with course id:' + this.ID()});
            } else {
              this.dbData = results[0];
              this.setID(results[0]['course_id']);
              resolve(this.dbData);
            }
            connection.release();
          });

          
      });
    });
  } // end load

  public getWhere(arrWhere): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM scorm_course `,
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
                      throw new Error('Error loading scorm course');
                  } else {
                      this.dbData = results;
                      resolve(results);
                  }
                  connection.release();
              });
              
          });
          
      });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO scorm_course (
        course_name,
        course_launcher,
      ) VALUES (?, ?)`;
      const param = [
        ('course_name' in this.dbData) ? this.dbData['course_name'] : null,
        ('course_launcher' in this.dbData) ? this.dbData['course_launcher'] : null
      ];
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }
          connection.query(sql_insert, param, (error, results, fields) => {
            if (error) {
              console.log('course.model.dbInsert', error, sql_insert);
              throw new Error('There was a problem adding a new course');
            }
            this.id = results.insertId;
            this.dbData['course_id'] = this.id;
            resolve(true);
            connection.release();
          });
          
      });
      
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE scorm_course SET
          course_name = ?,
          course_launcher = ?
        WHERE course_id = ?
      `;
      const param = [
        ('course_name' in this.dbData) ? this.dbData['course_name'] : null,
        ('course_launcher' in this.dbData) ? this.dbData['course_launcher'] : null,
        this.ID() ? this.ID() : 0
      ];
      this.pool.getConnection((err, connection) => {
          if(err){
              throw new Error(err);
          }
          connection.query(sql_update, param, (error, results, fields) => {
            if (error) {
              console.log('course.model.dbUpdate', error, sql_update);
              throw new Error('Cannot update course');
            }
            resolve(true);
            connection.release();
          });
          
      });
      
    });
  }

  public create(createData: object) {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
      });
      if ('course_id' in createData) {
        this.id = createData['course_id'];
      }
      resolve(this.write());
    });
  }
}
