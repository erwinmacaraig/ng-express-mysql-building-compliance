import * as db from 'mysql2';
import * as Promise from 'promise';
import * as csv from 'fast-csv';
import * as fs from 'fs';

const dbconfig = require('../config/db');
const defs = require('../config/defs.json');

export class Utils {
    constructor() {}

    public checkUserValidInALocation(user: number) {
      return new Promise((resolve, reject) => {
        const sql_check = `SELECT * FROM user_location_validation WHERE user_id = ? AND status = 'VERIFIED'`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_check, [user], (error, results, fields) => {
          if (error) {
            reject(`Internal error`);
            return console.log(error);
          }
          console.log(`user is ${user}`);
          console.log(results);
          resolve(results.length);

        });
        connection.end();
      });
    }

    public listAllFRP(parent_location: number = 0, user_id: number = 0, account?: number) {
      return new Promise((resolve, reject) => {
        let sql_get_frp = `SELECT
                              users.user_id,
                              first_name,
                              last_name,
                              email
                            FROM
                              users
                            INNER JOIN
                              user_role_relation
                            ON
                              users.user_id = user_role_relation.user_id
                            INNER JOIN
                              location_account_user
                            ON
                              users.user_id = location_account_user.user_id
                            WHERE
                              user_role_relation.role_id = 1
                            AND
                              location_account_user.location_id = ?
                            AND
                              users.token <> ''
                            AND
                              users.token IS NOT NULL
                            AND users.user_id <> ?`;
        const val = [parent_location];
        val.push(user_id);
        if (account) {
          sql_get_frp = sql_get_frp + ' AND users.account_id = ?';
          val.push(account);
        }
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_frp, val, (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('No FRP found');
          } else {
            resolve(results);
          }
        });
        connection.end();
      }); // end Promise
    }

    public listAllTRP(location: number, account?: number, user_id: number = 0) {
      return new Promise((resolve, reject) => {
        let accountSql = '';
        if (account) {
          accountSql = 'AND u.account_id = '+account;
        }

        let sql_get_trp = `
          SELECT
            lau.user_id,
            lau.location_id,
            u.user_id,
            u.first_name,
            u.last_name,
            u.email,
            lau.account_id,
            lau.role_id AS role_id_location,
            urr.role_id AS role_id_account
          FROM
            location_account_user lau
            INNER JOIN users u ON u.user_id = lau.user_id
            RIGHT JOIN user_role_relation urr ON u.user_id = urr.user_id
          WHERE
            lau.location_id IN (`+location+`) AND
            lau.role_id = 2 AND
            u.token IS NOT NULL AND
            u.user_id <> `+user_id+` AND
            u.token <> ''
            `+accountSql+`
            OR
            lau.location_id IN (`+location+`) AND
            urr.role_id = 2 AND
            u.token IS NOT NULL AND
            u.user_id <> `+user_id+` AND
            u.token <> ''
            `+accountSql+`
        `;

        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_trp, (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('No TRP found');
          } else {
            resolve(results);
          }
        });
        connection.end();
      }); // end of promise
    }

    public storeRequestValidation(validation_request: any): Promise<number> {
      console.log(validation_request);
      return new Promise((resolve, reject) => {
        const sql_request = `INSERT INTO user_frp_validation (
          user_id,
          FRP_user_id,
          validation_request_date
        )
        VALUES (
          ?,
          ?,
          NOW()
        )`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_request, [
          validation_request['user_id'],
          validation_request['approvalFrom']
        ], (error, results, fields) => {
          if (error) {
            console.log('Error here', error);
            reject(error);
          }
          console.log(results);
          resolve(results.insertId);
        });
        connection.end();
      });
    }

    public getAccountLocationRelationInfo(
           location_id: number,
           account_id: number) {

      return new Promise((resolve, reject) => {
        const sql_get = `SELECT
                            locations.name,
                            locations.unit,
                            locations.street,
                            locations.city,
                            locations.state,
                            locations.postal_code,
                            accounts.account_name
                        FROM
                            locations
                        INNER JOIN
                            location_account_relation
                        ON
                            locations.location_id = location_account_relation.location_id
                        INNER JOIN
                            accounts
                        ON
                            location_account_relation.account_id = accounts.account_id
                        WHERE
                           location_account_relation.location_id = ?
                        AND
                            location_account_relation.account_id = ?`;

          const connection = db.createConnection(dbconfig);
          connection.query(sql_get, [
            location_id,
            account_id
          ], (error, results, fields) => {
            if (error) {
              console.log('Error here', error);
              reject(error);
            }
            console.log(results);
            resolve(results[0]);
          });
          connection.end();

      });
    }
    public validateUserIntoAccount(validationId: number, userId: number, frpId: number, accountId: number) {
      return new Promise((resolve, reject) => {
        const sql_upate = `UPDATE
                            user_frp_validation
                          INNER JOIN
                            users
                          ON
                            user_frp_validation.user_id = users.user_id
                          SET
                            response = 1,
                            account_id = ?,
                            response_date = NOW()
                          WHERE
                            user_frp_validation_id = ?
                          AND
                            users.user_id = ?
                          AND
                            FRP_user_id = ?`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_upate, [
          accountId,
          validationId,
          userId,
          frpId
        ], (error, results, fields) => {
          if (error) {
            console.log(error);
            reject(error);
          }
          resolve(true);
        });
        connection.end();
      });

    }

    public buildECORoleList(isWardenRole?: number) {
      return new Promise((resolve, reject) => {
        let whereClause = '';
        if (isWardenRole) {
          whereClause = `WHERE is_warden_role = ${isWardenRole}`;
        }
        const sql_em_roles = `SELECT * FROM em_roles ${whereClause}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_em_roles, [], (error, results, fields) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            resolve(results);
          }
        });
        connection.end();
      });
    }

    public deployQuestions(account_id: number,
          location_id: number,
          user_id: number,
          role_id: number,
          ctrl: number = 1) {

      return new Promise((resolve, reject) => {
        const questionData = [];
        const placeHolder = {};
        let connection;
        switch (ctrl) {
          case 1:
            // How many TRP does this account have? (1)
            let sql_get = `SELECT
                  COUNT(responsibility) as total
                FROM
                  location_account_relation
                WHERE
                  responsibility = 'Tenant'
                AND
                  account_id = ?`;
            connection = db.createConnection(dbconfig);
            connection.query(sql_get, [account_id],
            (error, results, fields) => {
              if (error) {
                console.log('Error ', error);
                reject(error);
              }
              console.log(results[0]);
              console.log(results[0]['total']);
              resolve(results[0]['total']);
            });

            const sql = `INSERT INTO question_validation_relation (
                  question_pool_id,
                  user_id,
                  account_id,
                  ans
                ) VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE question_pool_id = ?, ans = ?`;

            connection.end();
            break;
          case 2:
            sql_get = `SELECT
                          user_id
                      FROM
                        users
                      WHERE
                        users.user_id
                      NOT IN
                        (SELECT DISTINCT user_id FROM user_role_relation)
                      AND
                        account_id <> 0
                      AND
                        account_id = ?`;
            connection = db.createConnection(dbconfig);
            connection.query();
            break;

        }
      });
    }

    public processCSVUpload(filename: string) {
      return new Promise((resolve, reject) => {

        let counter = 0;
        const columnNames = [];
        let fieldnames = {};

        // filename with file path
        const arrayOfRows = [];
        const CSVStream =  csv.fromPath(<string>filename)
          .on('data', (data) => {

              if (counter > 0 ) {
                for (let i = 0; i < columnNames.length; i++) {
                  fieldnames[columnNames[i]] = <string>data[i];
                }
                arrayOfRows.push(fieldnames);
                fieldnames = {};
              } else {
                for (let n = 0; n < data.length; n++) {
                  columnNames.push(defs['table_headers'][data[n]]);
                }
                // columnNames = data;
              }
              counter = counter + 1;

           })
           .on('end', () => {
             resolve(arrayOfRows);
           })
           .on('error', (error) => {
             console.log(error);
             reject(error);
             throw new Error('There was an error reading your file');
           })
          });
    }

    public s3DownloadCompliancePackPathGen(account_id: number = 0, location_id: number = 0): Promise<string> {
      return new Promise((resolve, reject) => {
        const sql_get = `SELECT
                          accounts.account_directory_name,
                          locations.location_directory_name
                        FROM
                          location_account_relation
                        INNER JOIN
                          accounts
                        ON
                          location_account_relation.account_id = accounts.account_id
                        INNER JOIN
                           locations
                        ON
                          locations.location_id = location_account_relation.location_id
                        WHERE
                          accounts.account_id = ?
                        AND
                          locations.location_id = ?
                        AND
                          locations.is_building = 1
                        LIMIT 1`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [account_id, location_id], (error, results, fields) => {
          if (error) {
            console.log('utils.model.s3DownloadCompliancePackPathGen', error, sql_get);
            throw new Error(`Cannot generate path for location id ${location_id} and account id ${account_id}`);
          } else {
            if (!results.length) {
              reject(`Not enough data to generate path for location id ${location_id} and account id ${account_id}`);
            } else {
              resolve(`${results[0]['account_directory_name']}/${results[0]['location_directory_name']}`);
            }
          }
        });
        connection.end();


      });
    }

    public s3DownloadFilePathGen(account_id: number = 0,
                                 location_id: number = 0,
                                 kpi: number = 0,
                                 type: string = 'Primary'
                                ): Promise<string> {
      return new Promise((resolve, reject) => {
        const sql_get = `SELECT
                             accounts.account_directory_name,
                             locations.location_directory_name,
                             compliance_kpis.directory_name,
                             compliance_documents.document_type,
                             compliance_documents.file_name
                          FROM
                             compliance_documents
                          INNER JOIN
                             accounts
                          ON
                             compliance_documents.account_id = accounts.account_id
                          INNER JOIN
                             locations
                          ON
                             compliance_documents.building_id = locations.location_id
                          INNER JOIN
                             compliance_kpis
                          ON
                            compliance_documents.compliance_kpis_id = compliance_kpis.compliance_kpis_id
                          WHERE
                            accounts.account_id = ?
                          AND
                            locations.location_id = ?
                          AND
                            compliance_kpis.compliance_kpis_id = ?
                          AND
                            compliance_documents.document_type = ?
                          LIMIT 1`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [account_id, location_id, kpi, type], (error,  results, fields) => {
          if (error) {
            console.log('utils.model.s3DownloadFilePathGen', error, sql_get);
            return new Error(`Cannot generate download path for account id ${account_id}, location id ${location_id},
            kpi ${kpi} and type ${type}`);
          } else {
            if (!results.length) {
              reject(`Not enough date to generate download path for account id ${account_id}, location id ${location_id},
              kpi ${kpi} and type ${type}`);
            } else {
              resolve(`${results[0]['account_directory_name']}/${results[0]['location_directory_name']}/${results[0]['directory_name']}/${results[0]['document_type']}/${results[0]['file_name']}`);
            }
          }
        });
        connection.end();
      });
    }

}
