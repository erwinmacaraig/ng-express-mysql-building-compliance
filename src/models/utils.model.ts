import * as db from 'mysql2';
import * as Promise from 'promise';

const dbconfig = require('../config/db');

export class Utils {
    constructor() {}

    public listAllFRP(account?: number) {
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
                            WHERE
                              user_role_relation.role_id = 1
                            AND
                              users.token <> ''
                            AND
                              users.token IS NOT NULL`;
        const val = [];
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

    public listAllTRP(location: number, account?: number) {
      return new Promise((resolve, reject) => {
        let sql_get_trp = `SELECT
                                users.user_id,
                                first_name,
                                last_name,
                                email,
                                location_id
                              FROM
                                users
                              INNER JOIN
                                user_role_relation
                              ON
                                users.user_id = user_role_relation.user_id
                            INNER JOIN
                              location_account_relation
                            ON
                              location_account_relation.account_id = users.account_id
                            WHERE
                              user_role_relation.role_id = 2
                            AND
                                users.token <> ''
                            AND
                                users.token IS NOT NULL
                            AND
                              location_account_relation.location_id = ?
                            `;

        const val = [location];
        if (account) {
          sql_get_trp = sql_get_trp + ' AND  users.account_id = ?';
          val.push(account);
        }
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_trp, val, (error, results, fields) => {
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

}




