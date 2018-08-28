import * as db from 'mysql2';
import * as Promise from 'promise';

const dbconfig = require('../config/db');
const aws_credential = require('../config/aws-access-credentials.json');

export class List {
    constructor() {}

    public listTaggedLocationsOnAccountFromLAU(account = '0', filter: object = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let clause = ' account_id = ? ';
        let paramWhere = [];
        if(account == 'admin'){
            clause = ' account_id > 0 ';
        }else{
            paramWhere.push(account);
        }
        if ('exclusion_ids' in filter && filter['exclusion_ids'].length > 0) {
          const ids = filter['exclusion_ids'].join(',');
          clause += `AND locations.location_id NOT IN (${ids})`;
        }
        if ('is_building' in filter) {
          clause += ` AND locations.is_building = ${filter['is_building']}`;
        }
        if ('name' in filter) {
          clause += ` AND locations.name LIKE '%${filter['name']}%'`;
        }

        const sql = `SELECT
            location_account_user.account_id,
            locations.parent_id,
            locations.location_id,
            locations.is_building,
            locations.name,
            locations.formatted_address,
            p1.name as p1_name,
            p1.location_id as p1_location_id,
            p1.is_building as p1_is_building,
            p2.name as p2_name,
            p2.location_id as p2_location_id,
            p2.is_building as p2_is_building,
            p3.name as p3_name,
            p3.location_id as p3_location_id,
            p3.is_building as p3_is_building,
            p4.name as p4_name,
            p4.location_id as p4_location_id,
            p4.is_building as p4_is_building,
            p5.name as p5_name,
            p5.location_id as p5_location_id,
            p5.is_building as p5_is_building
        FROM location_account_user INNER JOIN locations ON location_account_user.location_id = locations.location_id
        LEFT JOIN locations as p1 ON p1.location_id = locations.parent_id
          LEFT JOIN locations as p2 ON p2.location_id = p1.parent_id
          LEFT JOIN locations as p3 ON p3.location_id = p2.parent_id
          LEFT JOIN locations as p4 ON p4.location_id = p3.parent_id
          LEFT JOIN locations as p5 ON p5.location_id = p4.parent_id
        WHERE  ${clause} GROUP BY location_account_user.location_id;`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, paramWhere, (error, results) => {
          if (error) {
            console.log(`list.model.listTaggedLocationsOnAccount`, error, sql);
            throw Error('Cannot generate list for the account');
          }
          resolve(results);
        });
      });
    }

    public listTaggedLocationsOnAccount(account = '0', filter: object = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let whereClause = ' location_account_relation.account_id = ? ';
        let paramWhere = [];
        if(account == 'admin'){
            whereClause = ' location_account_relation.account_id > 0 ';
        }else{
            paramWhere.push(account);
        }
        if ('location' in filter && filter['location'].length > 0) {
          const inClause = filter['location'].join(',');
          whereClause += ` AND locations.location_id IN (${inClause})`;
        }
        if ('is_building' in filter) {
          whereClause += ` AND locations.is_building = ${filter['is_building']}`;
        }
        if ('name' in filter) {
          whereClause += ` AND locations.name LIKE '%${filter['name']}%'`;
        }
        const sql = `SELECT
          locations.parent_id,
          locations.location_id,
          locations.is_building,
          locations.name,
          locations.formatted_address,
          p1.name as p1_name,
          p1.location_id as p1_location_id,
          p1.is_building as p1_is_building,
          p2.name as p2_name,
          p2.location_id as p2_location_id,
          p2.is_building as p2_is_building,
          p3.name as p3_name,
          p3.location_id as p3_location_id,
          p3.is_building as p3_is_building,
          p4.name as p4_name,
          p4.location_id as p4_location_id,
          p4.is_building as p4_is_building,
          p5.name as p5_name,
          p5.location_id as p5_location_id,
          p5.is_building as p5_is_building,
          location_account_relation.account_id,
          location_account_relation.responsibility
        FROM locations INNER JOIN location_account_relation ON locations.location_id = location_account_relation.location_id
        LEFT JOIN locations as p1 ON p1.location_id = locations.parent_id
        LEFT JOIN locations as p2 ON p2.location_id = p1.parent_id
        LEFT JOIN locations as p3 ON p3.location_id = p2.parent_id
        LEFT JOIN locations as p4 ON p4.location_id = p3.parent_id
        LEFT JOIN locations as p5 ON p5.location_id = p4.parent_id
        WHERE ${whereClause} ORDER BY locations.location_id`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, paramWhere, (error, results) => {
          if (error) {
            console.log(`list.model.listTaggedLocationsOnAccount`, error, sql);
            throw Error('Cannot generate list for the account');
          }
          resolve(results);
        });
      });
    }

    public generateAccountsAdminListFromLAU(accountIds = []) {
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
            accounts.epc_committee_on_hq,
            accounts.online_training,
            accounts.key_contact,
            location_account_user.location_id
          FROM
            accounts
          LEFT JOIN
            location_account_user
          ON
            accounts.account_id = location_account_user.account_id
          WHERE 1 = 1 ${accntIdStr}
          GROUP BY
            location_account_user.location_id
          ORDER BY
            accounts.account_id DESC;`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_account_list, [], (error, results) => {
          if (error) {
            console.log('list.model.generateAccountsAdminListFromLAU', error, sql_account_list);
            throw Error('There was a problem generating the list');
          }
          for (const r of results) {
            if (r['account_id'] in accounts) {
              if (accounts[r['account_id']]['locations'].indexOf(r['location_id']) == -1) {
                accounts[r['account_id']]['locations'].push(r['location_id']);
              }
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
                'id': r['account_id'],
                'account_name': r['account_name'],
                'name':  r['account_name'],
                'key_contact': r['key_contact'],
                'billing_street': r['billing_street'],
                'billing_city': r['billing_city'],
                'billing_state': r['billing_state'],
                'billing_postal_code': r['billing_postal_code'],
                'epc_committee_on_hq': r['epc_committee_on_hq'],
                'online_training': r['online_training'],
                'billing_address': `${billingAddress}`,
                'locations': [r['location_id']],
                'type': 'account'
              };
            }
          }
          resolve(accounts);
        });
        connection.end();
      });
    }

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
            accounts.epc_committee_on_hq,
            accounts.online_training,
            accounts.key_contact,
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
              if (accounts[r['account_id']]['locations'].indexOf(r['location_id']) == -1) {
                accounts[r['account_id']]['locations'].push(r['location_id']);
              }

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
                'id': r['account_id'],
                'account_name': r['account_name'],
                'name':  r['account_name'],
                'key_contact': r['key_contact'],
                'billing_street': r['billing_street'],
                'billing_city': r['billing_city'],
                'billing_state': r['billing_state'],
                'billing_postal_code': r['billing_postal_code'],
                'epc_committee_on_hq': r['epc_committee_on_hq'],
                'online_training': r['online_training'],
                'billing_address': `${billingAddress}`,
                'locations': [r['location_id']],
                'type': 'account'
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
          resolve({
            resultArray: [],
            resultObject: {},
            resultLocationIds: []
          });
          return;
        }
        const buildingLocationsStr = buildingLocations.join(',');
        const sublocations: {[k: number]: object} = {};
        const locationIds = [];
        const loc = {
          'id': 0,
          'name': ''
        };
        const resultSet = [];
        const sql = `SELECT
                      locations.location_id,
                      locations.parent_id,
                      locations.name,
                      locations.formatted_address,
                      parent_location.name as parent_location_name,
                      parent_location.formatted_address as parent_location_formatted_address
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
            if (locationIds.indexOf(r['location_id']) === -1) {
              locationIds.push(r['location_id']);
            }
            if (r['parent_id'] in sublocations) {
              loc['id'] = r['location_id'];
              loc['name'] = r['name'];
              sublocations[r['parent_id']]['sublocations'].push({
                'id': r['location_id'],
                'name': r['name'],
                'formatted_address': r['formatted_address']
              });
            } else {
              const locationParentIndex = r['parent_id'];

              sublocations[locationParentIndex] = {
                parent_location_id: locationParentIndex,
                parent_location_name: r['parent_location_name'],
                formatted_address: r['parent_location_formatted_address'],
                sublocations: [{
                  'id': r['location_id'],
                  'name': r['name'],
                  'formatted_address': r['formatted_address']
                }]
              };
            }
          }
          Object.keys(sublocations).forEach((parent) => {
            resultSet.push(sublocations[parent]);
          });
          resolve({
            resultArray: resultSet,
            resultObject: sublocations,
            resultLocationIds: locationIds
          });
        });
        connection.end();

      });
    }

    public  generateSublocationsFromEMRoles(account: number = 0): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const sql = `SELECT
                          locations.location_id,
                          locations.parent_id,
                          locations.name,
                          locations.formatted_address,
                          parent_location.name as parent_location_name,
                          parent_location.formatted_address as parent_location_formatted_address
                     FROM locations
                     INNER JOIN locations AS parent_location
                     ON locations.parent_id = parent_location.location_id
                     INNER JOIN user_em_roles_relation
                     ON locations.location_id = user_em_roles_relation.location_id
                     INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                     WHERE users.account_id = ? AND locations.is_building = 0
                     ORDER BY locations.parent_id`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [account], (error, results) => {
          if (error) {
            console.log('list.models.generateSublocationsFromEMRoles', error, sql);
            throw Error('cannot generate list');
          }
          resolve(results);
        });

      });
    }

    public generateLocationDetailsForAddUsers(locations = []): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        if (!locations.length) {
          resolve(locations);
          return;
        }
        const locationIdStr = locations.join(',');
        const theLocations: {[k: number]: object} = {};
        const loc = {
          'id': 0,
          'name': ''
        };
        const resultSet = [];
        const sql = `SELECT
                locations.location_id,
                locations.parent_id,
                locations.name,
                locations.formatted_address,
                parent_location.name as parent_location_name,
                parent_location.formatted_address as parent_location_formatted_address
           FROM locations
           LEFT JOIN locations AS parent_location
           ON locations.parent_id = parent_location.location_id
           WHERE locations.location_id IN (${locationIdStr})
           ORDER BY locations.parent_id`;

        const connection = db.createConnection(dbconfig);
        connection.query(sql, [], (error, results) => {
          if (error) {
            console.log('list.model.generateLocationDetailsForAddUsers', error, sql);
            throw Error('There was an error generating the list of sublocations');
          }
          for (const r of results) {
            if (r['parent_id'] === -1) {
              if (r['location_id'] in theLocations) {
                loc['id'] = r['location_id'];
                loc['name'] = r['name'];
                theLocations[r['parent_id']]['sublocations'].push({
                  'id': r['location_id'],
                  'name': r['name'],
                  'formatted_address': r['formatted_address']
                });
              } else {
                theLocations[r['location_id']] = {
                  parent_location_id: r['parent_id'],
                  sublocations: [{
                    'id': r['location_id'],
                    'name': r['name'],
                    'formatted_address': r['formatted_address']
                  }],
                  parent_location_name: '',
                  formatted_address: r['formatted_address']
                };
              }
            } else {
              if (r['parent_id'] in theLocations) {
                loc['id'] = r['location_id'];
                loc['name'] = r['name'];
                theLocations[r['parent_id']]['sublocations'].push({
                  'id': r['location_id'],
                  'name': r['name'],
                  'formatted_address': r['formatted_address']
                });
              } else {
                let locName = '';
                if (r['parent_location_name'] == null || r['parent_location_name'].length == 0) {
                  locName = '_';
                } else {
                  locName = r['parent_location_name'];
                }
                theLocations[r['parent_id']] = {
                  parent_location_id: r['parent_id'],
                  parent_location_name: locName,
                  formatted_address: r['parent_location_formatted_address'],
                  sublocations: [{
                    'id': r['location_id'],
                    'name': r['name'],
                    'formatted_address': r['formatted_address']
                  }]
                };
              }
            }
          }
          Object.keys(theLocations).forEach((parent) => {
            resultSet.push(theLocations[parent]);
          });
          resolve(resultSet);
        });
        connection.end();
      });
    }

    public generateComplianceDocumentList(account, location, kpi, type?: string): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const locationStr = location.join(',');
        const sql_get = `SELECT
                      accounts.account_directory_name,
                      parentLocation.location_directory_name as parent_location_directory_name,
                      locations.location_directory_name,
                      locations.is_building,
                      locations.name,
                      compliance_kpis.directory_name,
                      compliance_kpis.validity_in_months,
                      DATE_ADD(compliance_documents.date_of_activity, INTERVAL compliance_kpis.validity_in_months MONTH) as expiry_date,
                      compliance_documents.*
                  FROM compliance_documents
                  INNER JOIN
                        accounts ON accounts.account_id = compliance_documents.account_id
                  INNER JOIN locations ON locations.location_id = compliance_documents.building_id
                  INNER JOIN compliance_kpis ON compliance_kpis.compliance_kpis_id = compliance_documents.compliance_kpis_id
                  LEFT JOIN locations as parentLocation ON parentLocation.location_id = locations.parent_id
                  WHERE compliance_documents.account_id = ?
                  AND compliance_documents.building_id IN (${locationStr})
                  AND compliance_documents.compliance_kpis_id = ?
                  ORDER BY compliance_documents.compliance_documents_id DESC`;

        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [account, kpi], (error, results) => {
          if (error) {
            console.log('list.model.generateComplianceDocumentList', error, sql_get);
            throw Error('There was an error generating the list of documents');
          }

          for (const r of results) {
            let urlPath = `${aws_credential['AWS_S3_ENDPOINT']}${aws_credential['AWS_Bucket']}/`;
            urlPath += r['account_directory_name'];
            if (r['parent_location_directory_name'] != null && r['parent_location_directory_name'].trim().length > 0) {
              urlPath +=  `/${r['parent_location_directory_name']}`;
            }
            urlPath += `/${r['location_directory_name']}/${r['directory_name']}/${r['document_type']}/${r['file_name']}`;
            r['urlPath'] = urlPath;
          }
          // console.log(results);
          resolve(results);
        });
      });
    }

}
