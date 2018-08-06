
import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';


export class PaperAttendanceDocumentModel extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public create(createData): Promise<any> {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
      });
      if ('paper_attendance_docs_id' in createData) {
        this.id = createData['paper_attendance_docs_id'];
      }
      resolve(this.write());
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO paper_attendance_docs (
        dtTraining,
        intTrainingCourse,
        intUploadedBy,
        strOriginalfilename
      ) VALUES (?, ?, ?, ?)`;

      const param = [
        ('dtTraining' in this.dbData) ? this.dbData['dtTraining'] : '0000-00-00',
        ('intTrainingCourse' in this.dbData) ? this.dbData['intTrainingCourse'] : 0,
        ('intUploadedBy' in this.dbData) ? this.dbData['intUploadedBy'] : 0,
        ('strOriginalfilename' in this.dbData) ? this.dbData['strOriginalfilename'] : ''
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_insert, param, (err, results) => {
        if (err) {
          console.log('Cannot create record PaperAttendanceDocumentModel', err);
          throw new Error(err);
        }
        this.id = results.insertId;
        this.dbData['paper_attendance_docs_id'] = this.id;
      });
      connection.end();
    });

  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE paper_attendance_docs SET
          dtTraining = ?,
          intTrainingCourse = ?,
          intUploadedBy = ?,
          strOriginalfilename = ?
        WHERE paper_attendance_docs_id = ?
      `;
      const param = [
        ('dtTraining' in this.dbData) ? this.dbData['dtTraining'] : '0000-00-00',
        ('intTrainingCourse' in this.dbData) ? this.dbData['intTrainingCourse'] : 0,
        ('intUploadedBy' in this.dbData) ? this.dbData['intUploadedBy'] : 0,
        ('strOriginalfilename' in this.dbData) ? this.dbData['strOriginalfilename'] : '',
        this.ID() ? this.ID() : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, param, (err, results) => {
        if (err) {
          console.log('Cannot update record PaperAttendanceDocumentModel');
          throw Error(err);
        }
        resolve(true);

      });
      connection.end();
    });
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM paper_attendance_docs WHERE paper_attendance_docs_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, [this.id], (error, results) => {
        if (error) {
          console.log('Cannot load record PaperAttendanceDocumentModel');
          throw Error(error);
        }
        this.dbData = results[0];
        this.setID(results[0]['paper_attendance_docs_id']);
      });
      connection.end();
    });
  }

  public getLastInsertedId(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT paper_attendance_docs_id FROM paper_attendance_docs ORDER BY paper_attendance_docs_id DESC LIMIT 1`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql, [], (error, results) => {
        if (error) {
          console.log('Cannot get last id PaperAttendanceDocumentModel');
          throw Error(error);
        }
        if (results.length > 0) {
          resolve(results[0]['paper_attendance_docs_id']);
        } else {
          resolve(0);
        }
      });
      connection.end();
    });
  }

}
