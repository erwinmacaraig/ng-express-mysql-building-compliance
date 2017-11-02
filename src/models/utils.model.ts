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
      }); // end of promise
    }
}




