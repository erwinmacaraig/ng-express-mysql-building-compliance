
import { BaseClass } from './base.model';

import * as Promise from 'promise';


export class PaperAttendanceComplianceDocumentModel extends BaseClass {
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
      if ('paper_attendance_compliance_docs_id' in createData) {
        this.id = createData['paper_attendance_compliance_docs_id'];
      }
      resolve(this.write());
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.log('Error getting pool connection ' + err);
          throw err;
        }
        const sql_insert = `INSERT INTO paper_attendance_compliance_docs (
          paper_attendance_docs_id,
          account_id,
          location_id,
          compliance_kpis_id,
          training_requirement_id,
          dtTraining,
          strOriginalfilename,
          responsibility
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
        const param = [
          ('paper_attendance_docs_id' in this.dbData) ? this.dbData['paper_attendance_docs_id'] : 0,
          ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
          ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
          ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : '',
          ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
          ('dtTraining' in this.dbData) ? this.dbData['dtTraining'] : null,
          ('strOriginalfilename' in this.dbData) ? this.dbData['strOriginalfilename'] : null,
          ('responsibility' in this.dbData) ? this.dbData['responsibility'] : null 
        ];
        connection.query(sql_insert, param, (err, results) => {
          if (err) {
            console.log('Cannot create record paper attendance compliance document model', err);
            throw new Error(err);
          }
          this.id = results.insertId;
          this.dbData['paper_attendance_compliance_docs_id'] = this.id;
          resolve(true);
        });
        connection.release();
      });      
    });

  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.log('Error getting pool connection ' + err);
          throw err;
        }
        const sql_update = `UPDATE paper_attendance_compliance_docs SET
            paper_attendance_docs_id = ?,
            account_id = ?,
            location_id = ?,
            compliance_kpis_id = ?,
            training_requirement_id = ?,
            dtTraining = ?,
            strOriginalfilename = ?,
            responsibility = ?
        WHERE paper_attendance_compliance_docs_id = ?
        `;
        const param = [
            ('paper_attendance_docs_id' in this.dbData) ? this.dbData['paper_attendance_docs_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : '',
            ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
            ('dtTraining' in this.dbData) ? this.dbData['dtTraining'] : null,
            ('strOriginalfilename' in this.dbData) ? this.dbData['strOriginalfilename'] : null,
            ('responsibility' in this.dbData) ? this.dbData['responsibility'] : null, 
            this.ID() ? this.ID() : 0
        ];
        connection.query(sql_update, param, (err, results) => {
          if (err) {
            console.log('Cannot update record paper attendance compliance document model');
            throw Error(err);
          }
          resolve(true);  
        });
        connection.release();
      });
    });
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.log('Error getting pool connection ' + err);
          throw err;
        }
        const sql_load = `SELECT * FROM paper_attendance_compliance_docs WHERE paper_attendance_compliance_docs_id = ?`;
      
        connection.query(sql_load, [this.id], (error, results) => {
          if (error) {
            console.log('Cannot load record paper attendance compliance document model');
            throw Error(error);
          }
          this.dbData = results[0];
          this.setID(results[0]['paper_attendance_compliance_docs_id']);
          resolve(this.dbData);
        });
        connection.release();
      });
    });
  }

  public getLastInsertedId(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.log('Error getting pool connection ' + err);
          throw err;
        }
        const sql = `SELECT paper_attendance_compliance_docs_id FROM paper_attendance_compliance_docs ORDER BY paper_attendance_compliance_docs_id DESC LIMIT 1`;
        connection.query(sql, [], (error, results) => {
          if (error) {
            console.log('Cannot get last id paper attendance compliance document model');
            throw Error(error);
          }
          if (results.length > 0) {
            resolve(results[0]['paper_attendance_compliance_docs_id']);
          } else {
            resolve(0);
          }
        });
        connection.release();
      });
    });
  }

  
  public getPaperAttendanceRecordByLocationForCompliance(buildingId = 0, accountId = 0, responsibility = 'Manager'): Promise<Array<object>> {
    return new Promise((resolve,  reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          console.log('Error getting pool connection ' + err);
          throw err;
        }        
        const sql = `SELECT
                        paper_attendance_compliance_docs.*,
                        locations.name as location_name,
                        locations.is_building
                      FROM
                        paper_attendance_compliance_docs
                      INNER JOIN
                        locations
                      ON
                        paper_attendance_compliance_docs.location_id = locations.location_id
                      WHERE
                        paper_attendance_compliance_docs.location_id = ?
                      AND
                        paper_attendance_compliance_docs.account_id = ?
                      AND
                        paper_attendance_compliance_docs.responsibility = ?`;
        const params = [buildingId, accountId, responsibility];
        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('paper attendace compliance document model getPaperAttendanceRecordByLocationForCompliance', sql, params, error);
            throw Error(error);
          }
          resolve(results);
        });
        connection.release();
      });
    });
  }
  

}
