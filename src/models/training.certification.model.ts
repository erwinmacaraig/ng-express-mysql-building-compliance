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
          console.log('TrainingCertification.dbUpdate', error, sql_update);
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

  public getEMRUserCertifications(users: Array<number>): Promise<object> {
    return new Promise((resolve, reject) => {
      if (!users.length) {
        reject('Invalid input');
        return;
      }
      let trained = 0;
      const outcome = {
        'total_passed': 0,
        'passed': [],
        'failed': []
      };
      const users_string = users.join(',');
      const connection = db.createConnection(dbconfig);
      const sql = `SELECT
              user_em_roles_relation.location_id,
                user_em_roles_relation.user_id,
                user_em_roles_relation.em_role_id,
                em_roles.role_name,
                training_requirement.training_requirement_id,
                training_requirement.training_requirement_name,
                training_requirement.num_months_valid,
                certifications.certification_date,
                DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date,
                certifications.pass,
                IF (certification_date IS NOT NULL,
                  IF(DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW(), 'active', 'expired'),
                  'not taken') as validity
            FROM
              user_em_roles_relation
            INNER JOIN
              em_roles
            ON
              em_roles.em_roles_id = user_em_roles_relation.em_role_id
            INNER JOIN
              em_role_training_requirements
            ON
              user_em_roles_relation.em_role_id = em_role_training_requirements.em_role_id
            INNER JOIN
                training_requirement
            ON
                training_requirement.training_requirement_id = em_role_training_requirements.training_requirement_id
            LEFT JOIN
              certifications
            ON
              (certifications.training_requirement_id  =  training_requirement.training_requirement_id AND
                user_em_roles_relation.user_id = certifications.user_id)
            WHERE user_em_roles_relation.user_id IN (${users_string});`;
      connection.query(sql, [], (error, results, fields) => {
        if (error) {
          console.log('training.certification.model.getEMRUserCertifications', error, sql);
          throw new Error('There was a problem getting the certifications of the following users: ' + users_string);
        }
        if (!results.length) {
          reject('There are no records to be found for these users - ' + users_string);
        } else {
          for (let i = 0; i < results.length; i++) {
            // future-improvement: modify this to accommodate future need of having to take two or more course to be compliant
            if (results[i]['validity'] === 'active' && results[i]['pass']) {
              trained = trained + 1;
              (outcome['passed']).push(results[i]);
            } else {
              (outcome['failed']).push(results[i]);
            }
          }
          outcome['total_passed'] = trained;
        }
        resolve(outcome);
      });
      connection.end();
    });
  }
}
