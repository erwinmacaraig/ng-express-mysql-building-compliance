import * as db from 'mysql2';
import * as Promise from 'promise';
const dbconfig = require('../config/db');

export class List {
    constructor() {}

    public generateAccountsAdminList(): Promise<object> {
      return new Promise((resolve, reject) => {
        const accounts = {};
        const sql_account_list = `
          SELECT
            accounts.account_id,
            accounts.account_name,
            accounts.building_number,
            accounts.billing_unit,
            accounts.billing_street,
            accounts.billing_city,
            accounts.billing_state,
            accounts.billing_postal_code,
            accounts.billing_country,
            location_account_relation.location_id
          FROM
            accounts
          INNER JOIN
            location_account_relation
          ON
            accounts.account_id = location_account_relation.account_id
          WHERE
            accounts.archived = 0
          ORDER BY
            accounts.account_id;`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_account_list, [], (error, results) => {
          if (error) {
            console.log('list.model.generateAccountsAdminList', error, sql_account_list);
            throw Error('There was a problem generating the list');
          }
          for (const r of results) {
            if (r['account_id'] in accounts) {
              accounts[r['account_id']]['locations'].push(r['location_id']);
            } else {
              accounts[r['account_id']] = {
                'account_name': r['account_name'],
                'billing_address': `${r['billing_unit']}, ${r['billing_street']},
                                    ${r['billing_city']}, ${r['billing_state']},
                                    ${r['billing_postal_code']} ${r['billing_country']}`,
                'locations': [r['location_id']]
              };
            }
          }
          resolve(accounts);
        });
        connection.end();
      });
    }

}
