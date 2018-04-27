import * as db from 'mysql2';
import * as Promise from 'promise';
const dbconfig = require('../config/db');

export class List {
    constructor() {}

    public generateAccountsAdminList(accountIds = []): Promise<object> {
      return new Promise((resolve, reject) => {
        let accntIdStr = '';
        if (accountIds.length > 0) {
          accntIdStr =  `AND accounts.account_id IN (` + accountIds.join(',')  + `)`;
        } else {
          resolve({});
          return;
        }
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
          LEFT JOIN
            location_account_relation
          ON
            accounts.account_id = location_account_relation.account_id
          WHERE 1 = 1 ${accntIdStr}
          ORDER BY
            accounts.account_id DESC;`;
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
              let billingAddress = '';
              /*
              if (r['billing_unit'] && r['billing_unit'].length > 0) {
                billingAddress = `${r['billing_unit']}`;
              }
              */
              if (r['billing_street'] && r['billing_street'].length > 0) {
                billingAddress += `${r['billing_street']}`;
              }
              if (r['billing_city'] && r['billing_city'].length > 0) {
                billingAddress += `, ${r['billing_city']}`;
              }
              if (r['billing_state'] && r['billing_state'].length > 0) {
                billingAddress += `, ${r['billing_state']}`;
              }
              if (r['billing_postal_code'] && r['billing_postal_code'].length > 0) {
                billingAddress += `, ${r['billing_postal_code']}`;
              }
              if (r['billing_country'] && r['billing_country'].length > 0) {
                billingAddress += `, ${r['billing_country']}`;
              }
              accounts[r['account_id']] = {
                'account_name': r['account_name'],
                'billing_address': `${billingAddress}`,
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
