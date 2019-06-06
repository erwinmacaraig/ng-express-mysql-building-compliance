import { BaseClass } from './base.model';
import * as Promise from 'promise';
import * as moment from 'moment';


export class TrainingCertification extends BaseClass {

  constructor(id: number = 0) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load(): Promise<object> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM certifications WHERE certifications_id = ?`;
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

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
          connection.release();
        });
        
      });
      
    });
  }

  public dbInsert(): Promise <boolean> {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO certifications (
        training_requirement_id,
        course_method,
        third_party_name,
        description,
        user_id,
        certification_date,
        pass,
        registered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        ('training_requirement_id' in this.dbData) ? this.dbData['training_requirement_id'] : 0,
        ('course_method' in this.dbData) ? this.dbData['course_method'] : 'online_by_evac',
        ('third_party_name' in this.dbData) ? this.dbData['third_party_name'] : null,
        ('description' in this.dbData) ? this.dbData['description'] : null,
        ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
        ('certification_date' in this.dbData) ? this.dbData['certification_date'] : moment().format('YYYY-MM-DD'),
        ('pass' in this.dbData) ? this.dbData['pass'] : 1,
        ('registered' in this.dbData) ? this.dbData['registered'] : 1
      ];

      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_insert, values, (error, results, fields) => {
          if (error) {
            console.log('TrainingCertification.dbInsert', error, sql_insert);
            throw new Error('Cannot add new certificate');
          }
          this.id = results.insertId;
          this.dbData['certifications_id'] = this.id;
          resolve(true);
          connection.release();
        });
        
      });
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE certifications SET
          training_requirement_id = ?,
          course_method = ?,
          third_party_name = ?,
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
        ('course_method' in this.dbData) ? this.dbData['course_method'] : 'online_by_evac',
        ('third_party_name' in this.dbData) ? this.dbData['third_party_name'] : null,
        ('description' in this.dbData) ? this.dbData['description'] : null,
        ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
        ('certification_date' in this.dbData) ? this.dbData['certification_date'] : null,
        ('pass' in this.dbData) ? this.dbData['pass'] : 1,
        ('registered' in this.dbData) ? this.dbData['registered'] : 1,
        this.id
      ];
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_update, values, (error, results, fields) => {
          if (error) {
            console.log('TrainingCertification.dbUpdate', error, sql_update);
            throw new Error('Cannot update certification record');
          }
          resolve(true);
          connection.release();
        });
        
      });
      
    });
  }

  public create(createData) {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
        if ('certifications_id' in createData) {
          this.id = createData['certifications_id'];
        }
      });
      resolve(this.write());
    });
  }

  /**
   * @description
   * Determine if the given users has a valid certifications
   */
  public getEMRUserCertifications(users: Array<number>,  filter = {}): Promise<object>{
    return new Promise((resolve, reject) => {
      const outcome = {
        'total_passed': 0,
        'passed': [],
        'failed': [],
        'percentage': '',
        'users' : [],
        'results' : []
      };
      if (!users.length) {
        // reject('Invalid input');
        resolve(outcome);
        return;
      }
      let filterStr = '';
      let trained = 0;

      const users_string = users.join(',');

      if ('em_role_id' in filter) {
        filterStr += ` AND user_em_roles_relation.em_role_id = ${filter['em_role_id']}`;
      }
      if ('location' in filter) {
        filterStr += ` AND user_em_roles_relation.location_id = ${filter['location']}`;
      }
      const sql = `SELECT
                certifications.certifications_id,
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
            INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
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
            WHERE user_em_roles_relation.user_id IN (${users_string}) ${filterStr}
            ORDER BY certifications.certification_date DESC;`;

      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, [], (error, results, fields) => {
          if (error) {
            console.log('training.certification.model.getEMRUserCertifications', error, sql);
            throw new Error('There was a problem getting the certifications of the following users: ' + users_string);
          }
          if (!results.length) {
            // reject('There are no records to be found for these users - ' + users_string);
            resolve(outcome);
          } else {
            let objUsers = {};
            for (let i = 0; i < results.length; i++) {
              if( !objUsers[ results[i]['user_id'] ] ){
                  objUsers[ results[i]['user_id'] ] = results[i];
              }
            }

            for(let i in objUsers){
               if (objUsers[i]['validity'] === 'active' && objUsers[i]['pass']) {
                trained = trained + 1;
                (outcome['passed']).push(objUsers[i]);
              } else {
                (outcome['failed']).push(objUsers[i]);
              }
            }

            outcome['total_passed'] = trained;
            outcome['percentage'] = Math.round((trained / users.length) * 100).toFixed(0).toString() + '%';
          }
          resolve(outcome);
          connection.release();
        });
        
      });
      
    });
  }

  public getCertificationsInUserIds(userIds='0'): Promise<Array<object>> {
    return new Promise((resolve, reject) => {

      let sql = `SELECT
                  c.certifications_id,
                  c.training_requirement_id,
                  c.course_method,
                  c.certification_date,
                  c.pass,
                  c.user_id,
                  DATE_ADD(c.certification_date, INTERVAL tr.num_months_valid MONTH) as expiry_date,
                  IF (c.certification_date IS NOT NULL,
                      IF(DATE_ADD(c.certification_date, INTERVAL tr.num_months_valid MONTH) > NOW(), 'active', 'expired'),
                  'not taken') as validity
                FROM certifications c
                INNER JOIN training_requirement tr ON c.training_requirement_id = tr.training_requirement_id
                WHERE c.user_id IN (`+userIds+`) ORDER BY c.certification_date DESC`;
      
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, [], (error, results, fields) => {
          if (error) {
            throw new Error('Error on fetching certifications on getCertificationsInUserIds');
          }          
          
          resolve(results);
          connection.release();
        });
        
      });
      

    });
  }

  public checkAndUpdateTrainingCert(certData: object = {}) {
    return new Promise((resolve, reject) => {
      let sql_where_filter = 'WHERE 1=1';
      console.log(certData);
      sql_where_filter += ('training_requirement_id' in certData) ?
        ` AND certifications.training_requirement_id = ${certData['training_requirement_id']}` : '';

      sql_where_filter += ('user_id' in certData) ? ` AND certifications.user_id = ${certData['user_id']}` :'';

      sql_where_filter += ('certifications_id' in certData) ?
        `AND certifications.certifications_id = ${certData['certifications_id']}` : '';

      let sql_check = `SELECT
            certifications.certifications_id,
            certifications.training_requirement_id,
            certifications.user_id,
            certifications.certification_date,
            DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date,
            certifications.pass,
            IF (certification_date IS NOT NULL,
              IF(DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW(), 'active', 'expired'),
                'not taken') as validity
          FROM
            certifications
          INNER JOIN
            training_requirement
          ON
            training_requirement.training_requirement_id = certifications.training_requirement_id
          ${sql_where_filter}
          AND DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()
      `;
      
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_check, [], (error, results, fields) => {
          if (error) {
            console.log('Cannot check the data of this given certificate', error, certData, sql_check);
            throw new Error('Cannot check the data of this given certificate');
          }
          
          // there is no certification or certification is expired
          if (!results.length) {
            this.create(certData).then((data) => {
              //resolve(true);
              resolve(this.id);
            }).catch((e) => {
              console.log('training.certification.model creating/updating certification failed');
              reject('training.certification.model creating/updating certification failed');
            });
          } else {
            // Certificate is still valid
            // JUST UPDATE THE CERTIFICATION DATE
            certData['certifications_id'] = results[0]['certifications_id'];
            certData['certification_date'] = moment().format('YYYY-MM-DD');          
            this.create(certData).then((data) => {
              // resolve(true);
              resolve(this.id);
            }).catch((e) => {
              console.log('training.certification.model creating/updating certification failed');
              reject('training.certification.model creating/updating certification failed');
            });
          }
          connection.release();
        });
       
      });
      

    });
  }

  public getCertificatesByInUsersId(userIds, limit?, count?, courseMethod?, pass?, trainingId?, orderBy?) {
    return new Promise((resolve) => {
      const limitSql = (limit) ? ' LIMIT '+limit : '';
      const courseMethodSql = (courseMethod) ? ' AND  certifications.course_method = "' + courseMethod + '" ' : '';
      let sql = '',
          passSql = '',
          trainingIdSql = (trainingId > 0) ? ' AND training_requirement.training_requirement_id = ' + trainingId : '';

      if(pass == 1){
          passSql += '  AND certifications.pass = 1 AND DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW() ';
      }else if(pass == 0){
          passSql += `
            AND certifications.user_id NOT IN (SELECT user_id FROM certifications LEFT JOIN training_requirement ON training_requirement.training_requirement_id = certifications.training_requirement_id WHERE user_id IN (${userIds})  AND certifications.pass = 1 AND DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW() )
           `;
      }

      const orderSql = (orderBy) ? orderBy : 'ORDER BY TRIM(a.account_name) ASC, certifications.certification_date DESC';
      // const orderSql = (orderBy) ? orderBy : 'ORDER BY certifications.user_id ASC, certifications.certification_date DESC';
      if(count){
          sql = `
            SELECT
              COUNT(training_requirement.training_requirement_id) as count
            FROM
              users
              LEFT JOIN certifications ON certifications.user_id = users.user_id
              LEFT JOIN training_requirement ON training_requirement.training_requirement_id = certifications.training_requirement_id
              LEFT JOIN accounts a ON users.account_id = a.account_id
            WHERE
                users.user_id IN (${userIds}) ${courseMethodSql} ${trainingIdSql} ${passSql}
            ${orderSql}
          `;
      } else {
          sql = `
            SELECT
              IF (training_requirement.training_requirement_name IS NOT NULL,
                training_requirement.training_requirement_name,
                IF(tr2.training_requirement_name IS NOT NULL, tr2.training_requirement_name, 'No user role') ) as training_requirement_name,
              training_requirement.training_requirement_id,
              training_requirement.num_months_valid,
              certifications.certifications_id,
              certifications.course_method,
              certifications.certification_date,
              certifications.pass,
              certifications.registered,
              cur.course_id,
              sc.course_name,
              em_roles.role_name,
              users.user_id, users.first_name, users.last_name, users.account_id,
              DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date,
              IF ( certifications.certification_date IS NOT NULL,
                 IF(DATE_ADD(certifications.certification_date,
                  INTERVAL training_requirement.num_months_valid MONTH) > NOW(), 'valid', 'expired'), 'not taken') as status
            FROM
              users
              LEFT JOIN certifications ON certifications.user_id = users.user_id
              LEFT JOIN training_requirement ON training_requirement.training_requirement_id = certifications.training_requirement_id
              LEFT JOIN user_em_roles_relation ON users.user_id = user_em_roles_relation.user_id
              LEFT JOIN em_role_training_requirements ON user_em_roles_relation.em_role_id = em_role_training_requirements.em_role_id
              LEFT JOIN em_roles ON em_roles.em_roles_id = em_role_training_requirements.em_role_id
              LEFT JOIN training_requirement as tr2 ON tr2.training_requirement_id = em_role_training_requirements.training_requirement_id
              LEFT JOIN course_user_relation as cur ON cur.user_id = users.user_id
              LEFT JOIN scorm_course as sc ON sc.course_id = cur.course_id
              LEFT JOIN accounts a ON users.account_id = a.account_id
            WHERE users.user_id IN (${userIds}) ${courseMethodSql} ${trainingIdSql} ${passSql}
            GROUP BY certifications.certifications_id
            ${orderSql} ${limitSql}
          `;
      }
      // console.log(sql);
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, (error, results, fields) => {

          if(error){
              console.log(sql);
            throw new Error("Error getting certification by user ids");
          }

          this.dbData = results;
          resolve(results);
          connection.release();
        });
        
      });
    });
  }

  public getRequiredTrainings() {
    return new Promise((resolve, reject) => {
      const resultSet = {};
      const sql = `
        SELECT em_role_training_requirements.*,
          training_requirement.training_requirement_name,
          training_requirement.num_months_valid
        FROM
          em_role_training_requirements
        INNER JOIN
          training_requirement
        ON
          training_requirement.training_requirement_id = em_role_training_requirements.training_requirement_id;`;
      
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, [], (error, results, fields) => {
          if (error) {
            console.log('training.certifications.model.getRequiredTrainings', sql, error);
            throw Error('Cannot retrieve required training fields');
          }
          if (!results.length) {
            resolve('There are no required certifications');
          } else {
            for (let i = 0; i < results.length; i++) {
              if (results[i]['em_role_id'] in resultSet) {
                (resultSet[results[i]['em_role_id']]['training_requirement_name']).push(results[i]['training_requirement_name']);
                (resultSet[results[i]['em_role_id']]['training_requirement_id']).push(results[i]['training_requirement_id']);
              } else {
                resultSet[results[i]['em_role_id']] = {
                  'training_requirement_name': [results[i]['training_requirement_name']],
                  'training_requirement_id': [results[i]['training_requirement_id']]
                };

              }
            }
            resolve(resultSet);
          }
          connection.release();
        });
        
      });

      
    });
  }

  /**
   * @method getNumberOfTrainings
   * this gets the total REQUIRED trainings
   * @param userIds
   * Array that contains the user ids to which we assign the total number of trainings
   * @param filter
   * filter used for querying the database
   * @description
   * This method will give you the total number of required trainings only for a given user
   */
  public getNumberOfTrainings(userIds = [], filter = {}) {
    return new Promise((resolve, reject) => {
      const user_trainings = {};
      if (!userIds.length) {
        resolve({});
      } else {
        const userIdString = userIds.join(',');
        let filterString = '';

        filterString += ('pass' in filter) ? ' AND pass = ' + filter['pass'] : ' AND pass = 1';
        filterString +=
        ('current' in filter) ? ` AND DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()` : '';
        if ('training_requirement' in filter && filter['training_requirement'].length) {
          const training_requirement_str = filter['training_requirement'].join(',');
          filterString += ` AND training_requirement.training_requirement_id IN (${training_requirement_str})`;
        }
        const sql = `SELECT
                      user_id
                    FROM
                        certifications
                    INNER JOIN
                       training_requirement
                    ON
                        training_requirement.training_requirement_id = certifications.training_requirement_id
                    WHERE
                        certifications.user_id IN (${userIdString})
                      ${filterString}
                    GROUP BY
                      certifications.certifications_id
                    ORDER BY
                      user_id
                    `;
        
        this.pool.getConnection((err, connection) => {
          if (err) {                    
              throw new Error(err);
          }

          connection.query(sql, [], (error, results, fields) => {
            if (error) {
              console.log('training.certification.model.getNumberOfTrainings', error, sql);
              throw Error('There was a problem getting the number of trainings');
            }
            if (!results.length) {
              resolve({});
            } else {
              for (let i = 0; i < results.length; i++) {
                if (results[i]['user_id'] in user_trainings) {
                  user_trainings[results[i]['user_id']]['count'] = user_trainings[results[i]['user_id']]['count'] + 1;
                } else {
                  user_trainings[results[i]['user_id']] = {
                    'count': 1
                  };
                }
              }
              resolve(user_trainings);
            }
            connection.release();
          });
          
        });
        
      }
    });
  }
  /**
   * @param user_id - User
   * @param training_requirements
   * Array of training requirements
   * @returns
   * Return an array of required training ids
   */
  public getTrainings(user_id: number = 0, training_requirements = []): Promise<Array<number>> {
    return new Promise((resolve, reject) => {
      if (training_requirements.length === 0) {
        resolve([]);
        return;
      }
      const missingTrainings = [];
      const takenRequiredTrainings = [];
      const resultSet = [];

      const training_requirements_str = training_requirements.join(',');
      const sql = `SELECT
                    certifications.*,                   
                    training_requirement.training_requirement_name
                FROM
                  certifications
                INNER JOIN
                  training_requirement ON training_requirement.training_requirement_id = certifications.training_requirement_id
                WHERE
                  certifications.user_id = ${user_id}
                AND
                  DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()
                AND
                  certifications.pass = 1
                AND training_requirement.training_requirement_id IN (${training_requirements_str});`;
      
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, [], (error, results) => {
          if (error) {
            console.log('training.certifications.model.getTrainings', error, sql);
            throw Error('Cannot query certifications for this user');
          }
          for (const r of results) {
            takenRequiredTrainings.push(r['training_requirement_id']);
          }

          for (const tr of training_requirements) {
            if (takenRequiredTrainings.indexOf(tr) === -1) {
              missingTrainings.push(tr);
            }
          }
          resolve(missingTrainings);
          connection.release();
        });
        
      });
    });
  } 

  public listCertifications(userIds=[], limit?, count?, courseMethod?, pass?, trainingId?, orderBy?):Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      if (!userIds.length) {
        resolve([]);
        return;
      }
      const limitSql = (limit) ? ' LIMIT '+limit : '';
      const courseMethodSql = (courseMethod) ? ` AND  certifications.course_method = '${courseMethod}'` : '';
      let passSql = '',
          trainingIdSql = (trainingId > 0) ? ` AND training_requirement.training_requirement_id = ${trainingId}` : '';

      if(pass == 1){
          passSql += '  AND certifications.pass = 1 AND DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW() ';
      }else if(pass == 0){
          passSql += ` AND certifications.pass = 1 AND DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) < NOW()`;
      }

      const userIdString = userIds.join(',');
      const sql_listing = `
                          SELECT
                            certifications.*,
                            DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date,
                              IF ( certifications.certification_date IS NOT NULL,
                                IF(DATE_ADD(certifications.certification_date,
                                  INTERVAL training_requirement.num_months_valid MONTH) > NOW(), 'valid', 'expired'), 'not taken') as status
                          FROM certifications
                          INNER JOIN training_requirement ON training_requirement.training_requirement_id = certifications.training_requirement_id
                          WHERE 
                            user_id IN (${userIdString}) ${courseMethodSql} ${trainingIdSql} ${passSql}
                          ORDER BY
                            certifications.certifications_id DESC`;
      // console.log(sql_listing);
      this.pool.getConnection((err, connection) => {
        if (err) {                    
          throw new Error(err);
        }
        connection.query(sql_listing, [], (error, results) => {
          if (error) {
            console.log(sql_listing);
            throw Error('Cannot query list of certifications');
          }
          resolve(results);
          connection.release();
        });
        
      });
      
      
    });
  }
  
  getActiveCertificate(userId=0, trainingId=0): Promise<Array<object>> {
    return new Promise((resolve, reject) => {

      const sql = `SELECT
                    certifications.*,
                    DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date 
                  FROM
                    certifications
                  INNER JOIN
                       training_requirement
                    ON
                        training_requirement.training_requirement_id = certifications.training_requirement_id
                    WHERE
                        certifications.user_id = ?
                    AND
                      certifications.training_requirement_id = ?
                    AND
                      certifications.pass = 1
                    AND
                      DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()`;
      const params = [userId, trainingId];
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('training.certifications.model.getActiveCertificate', error, sql, params);
            throw Error('Cannot query certifications for this user');
          }      
          resolve(results);
          connection.release();
        });
        
      });

    });
  }

  public userCertificates(userId=0, trid?): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      let trClause = '';
      const params = [userId];
      if (trid) {
        trClause = ` AND certifications.training_requirement_id = ?`;
        params.push(trid);
      }
      const sql = `SELECT
                      certifications.certifications_id,
                      certifications.training_requirement_id,
                      certifications.course_method,
                      IF (certifications.course_method='online_by_evac', 'Online Training', 'Face to Face Training') AS training_type,
                      certifications.certification_date,
                      training_requirement.training_requirement_name,
                      offline_training_to_certification_relation.location_name
                  FROM 
                    certifications
                  INNER JOIN
                    training_requirement
                  ON
                    certifications.training_requirement_id = training_requirement.training_requirement_id
                  LEFT JOIN
                    offline_training_to_certification_relation
                  ON 
                    offline_training_to_certification_relation.certifications_id = certifications.certifications_id AND offline_training_to_certification_relation.course_method = certifications.course_method
                  WHERE
                    certifications.user_id = ?
                  AND
                    certifications.pass = 1
                  ${trClause}
                  ORDER BY certifications.certifications_id DESC`;
      
      
      this.pool.getConnection((err, connection) => {
        if (err) {
          throw new Error(err);
        }

        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('cannot execute userCertificates', sql, params);
            throw new Error('cannot query certifications');
          }
          resolve(results);
          connection.release();
        });
        
      });
    });
  }

  public getCertificateDetailsForDownload(certId=0): Promise<Object> {
    return new Promise((resolve, reject) => {
      const params = [];
      if (certId) {
        params.push(certId);
      } else {
        params.push(this.id);
      }
      
      const sql = `SELECT
                    users.first_name,
                    users.last_name,
                    certifications.*,
                    training_requirement.training_requirement_name,
                    YEAR(certifications.certification_date) as control_year,
                    MONTHNAME(certifications.certification_date) as control_month,
                    DAY(certifications.certification_date) as control_day
                  FROM
                    certifications
                  INNER JOIN
                    users
                  ON
                    certifications.user_id = users.user_id
                  INNER JOIN
                    training_requirement
                  ON
                    certifications.training_requirement_id = training_requirement.training_requirement_id
                  WHERE
                    certifications.certifications_id = ?;`;
      
      this.pool.getConnection((err, connection) => {
        if (err) {
          throw new Error(err);
        }
        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log('cannot execute getCertificateDetailsForDownload', sql, params);
            throw new Error('cannot query certifications');
          }
          if (results.length > 0) {
            resolve({
              name: `${results[0]['first_name']} ${results[0]['last_name']}`,
              training: `${results[0]['training_requirement_name']}`,
              certificate_no: `${results[0]['control_year']}-${results[0]['certifications_id']}`,
              training_date: `${results[0]['control_day']} ${results[0]['control_month']} ${results[0]['control_year']}`
            });

          } else {
            reject({});
          }
          connection.release();
        });
        
      });

    });
  }

  public recordOfflineTraining(certData={}):Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO offline_training_to_certification_relation (
        certifications_id,
        location_id,
        building_id,
        location_name
      ) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE
        location_id = ?,
        building_id = ?,
        location_name = ?
      `;
      const values = [
        ('certifications_id' in certData) ? certData['certifications_id'] : 0,
        ('location_id' in certData ) ? certData['location_id'] : 0,
        ('building_id' in certData ) ? certData['building_id'] : 0,
        ('location_name' in certData ) ? certData['location_name'] : '',
        ('location_id' in certData ) ? certData['location_id'] : 0,
        ('building_id' in certData ) ? certData['building_id'] : 0,
        ('location_name' in certData ) ? certData['location_name'] : '',
      ];

      this.pool.getConnection((err, connection) => {
        if (err) {
          throw new Error(err);
        } 
        connection.query(sql, values, (error, results) => {
          if (error) {
            console.log('TrainingCertification.recordOfflineTraining', error, sql, values);
            throw new Error('Cannot add new offline training location record');
          }
          resolve(true);
          connection.release();
        });
        
      });
    });
  }

  public getBulkActiveCertificates(userIds=[], trainingIds=[]): Promise<Array<object>> {
    return new Promise((resolve, reject) => {
      if (userIds.length == 0 || trainingIds.length == 0) {
        reject('Arguments cannot be empty for user ids and training ids');
        return;
      }
      const sql = `SELECT
                    certifications.*,
                    DATE_ADD(certification_date, INTERVAL training_requirement.num_months_valid MONTH) as expiry_date 
                  FROM
                    certifications
                  INNER JOIN
                       training_requirement
                    ON
                        training_requirement.training_requirement_id = certifications.training_requirement_id
                    WHERE
                        certifications.user_id IN (${userIds.join(',')})
                    AND
                      certifications.training_requirement_id IN (${trainingIds.join(',')})
                    AND
                      certifications.pass = 1
                    AND
                      DATE_ADD(certifications.certification_date, INTERVAL training_requirement.num_months_valid MONTH) > NOW()
                    `;
      console.log(sql);
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql, [], (error, results) => {
          if (error) {
            console.log('training.certifications.model.getBulkActiveCertificates', error, sql);
            throw Error('Cannot query certifications');
          }      
          resolve(results);
          connection.release();
        });
      });
    });
  }

  public removeUser(userId=0) {
    return new Promise((resolve, reject) => {
      const params = [userId];
      const sql = `DELETE FROM certifications WHERE user_id = ? `;
      this.pool.getConnection((err, connection) => {
        if (err) {
          throw new Error(err);
        }
        connection.query(sql, params, (error, results) => {
          if (error) {
            console.log(error, sql, params);
            throw new Error(error);
          }
          resolve(results);
          connection.release();
        });
      });
    });
  }


}
