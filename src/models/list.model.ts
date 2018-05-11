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
                'account_id': r['account_id'],
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
    /**
     *
     * @param buildingLocations
     * @description
     * Method to get the immediate sublevel given a building
     * @author
     * Erwin Macaraig
     */
    generateSublocationsForListing(buildingLocations = []): Promise<Object> {
      return new Promise((resolve, reject) => {
        if (buildingLocations.length === 0) {
          resolve([]);
          return;
        }
        const buildingLocationsStr = buildingLocations.join(',');
        const sublocations: {[k: number]: object} = {};
        const loc = {
          'id': 0,
          'name': ''
        };
        const resultSet = [];
        const sql = `SELECT
                      locations.location_id,
                      locations.parent_id,
                      locations.name,
                      parent_location.name as parent_location_name
                 FROM locations
                 INNER JOIN locations AS parent_location
                 ON locations.parent_id = parent_location.location_id
                 WHERE locations.parent_id IN (${buildingLocationsStr})
                 ORDER BY locations.parent_id`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [], (error, results) => {
          if (error) {
            console.log('list.model.generateSublocationsForListing', error, sql);
            throw Error('There was an error generating the list of sublocations');
          }
          for (const r of results) {
            if (r['parent_id'] in sublocations) {
              loc['id'] = r['location_id'];
              loc['name'] = r['name'];
              sublocations[r['parent_id']]['sublocations'].push({
                'id': r['location_id'],
                'name': r['name']
              });
            } else {
              const locationParentIndex = r['parent_id'];

              sublocations[locationParentIndex] = {
                parent_location_id: locationParentIndex,
                sublocations: [{
                  'id': r['location_id'],
                  'name': r['name']
                }],
                parent_location_name: r['parent_location_name']
              };
            }
          }
          Object.keys(sublocations).forEach((parent) => {
            resultSet.push(sublocations[parent]);
          });
          resolve({
            resultArray: resultSet,
            resultObject: sublocations
          });
        });
        connection.end();

      });
    }

}
