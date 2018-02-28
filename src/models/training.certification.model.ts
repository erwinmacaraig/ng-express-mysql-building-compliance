import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class TrainingCertification extends BaseClass {

  constructor(id: number = 0) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load(): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM certifications`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql, [this.id], (error, results, fields) => {
        if (error) {
          console.log('TrainingCertification.load', error, sql);
          throw new Error('Error loading certifaction.');
        } else {
          if (results.length > 0) {
            this.dbData = results[0];
            this.setID(results[0]['certifications_id']);
            resolve(this.dbData);
          } else {
            reject('No record found.');
          }
        }
      });
      connection.end();
    });
  }

  public dbInsert(): Promise <boolean> {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO certifications (
        training_requirement_id,
        course_method,
        third_party,
        description,
        user_id,
        certification_date,
        pass,
        registered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const connection = db.createConnection(dbconfig);
      const values = [
        ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
        ('course_method' in this.dbData) ? this.dbData['course_method'] : '',
        ('third_party' in this.dbData) ? this.dbData['third_party'] : null,
        ('description' in this.dbData) ? this.dbData['description'] : null,
        ('user_id' in this.dbData) ? this.dbData[''] : 0,
        ('certification_date' in this.dbData) ? this.dbData['certification_date'] : null,
        ('pass' in this.dbData) ? this.dbData['pass'] : 1,
        ('registered' in this.dbData) ? this.dbData['registered'] : 1
      ];
      connection.query(sql_insert, values, (error, results, fields) => {
        if (error) {
          console.log('TrainingCertification.dbInsert', error, sql_insert);
          throw new Error('Cannot add new certificate');
        }
        this.id = results.insertId;
        this.dbData['certifications_id'] = this.id;
        resolve(true);
      });
      connection.end();

    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE certifications SET
          training_requirement_id = ?,
          course_method = ?,
          third_party = ?,
          description = ?,
          user_id = ?,
          certification_date = ?,
          pass = ?,
          registered = ?
        WHERE
        certifications_id = ?
      `;
      const values = [
        ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
        ('course_method' in this.dbData) ? this.dbData['course_method'] : '',
        ('third_party' in this.dbData) ? this.dbData['third_party'] : null,
        ('description' in this.dbData) ? this.dbData['description'] : null,
        ('user_id' in this.dbData) ? this.dbData[''] : 0,
        ('certification_date' in this.dbData) ? this.dbData['certification_date'] : null,
        ('pass' in this.dbData) ? this.dbData['pass'] : 1,
        ('registered' in this.dbData) ? this.dbData['registered'] : 1,
        this.id
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, values, (error, results, fields) => {
        if (error) {
          console.log('TrainingCertification.dbUpdate', error, sql);
          throw new Error('Cannot update certification record');
        }
        resolve(true);
      });
      connection.end();
    });
  }

  public create(createData) {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
        if ('certifications_id' in createData) {
          this.id = createData['certifications_id'];
        }
        resolve(this.write());
      });
    });
  }
}
