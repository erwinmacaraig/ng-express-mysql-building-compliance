import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { Location } from './location.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class Account extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM accounts WHERE account_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length){
                reject('Account not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getAll(config = {}): Promise<any> {
      return new Promise((resolve, reject) => {
          let sql_load = 'SELECT * FROM accounts WHERE archived = 0';
          let page = 0;
          const accountIds = [];
          const connection = db.createConnection(dbconfig);
          if ('page' in config) {
            page = Math.abs(parseInt(config['page'], 10)) * 10;
            sql_load = `SELECT account_id FROM accounts LIMIT 10 OFFSET ${page}`;
            connection.query(sql_load, (error, results) => {
              if (error) {
                console.log('account.model.getAll - cannot get account ids', error, sql_load);
                throw Error('There was a problem getting the list of account ids');
              }
              for (const r of results) {
                accountIds.push(r['account_id']);
              }
              resolve(accountIds);
            });
            connection.end();
            return;
          }
          if ('count' in config) {
            sql_load = `SELECT COUNT(account_id) as total FROM accounts;`;
            connection.query(sql_load, (error, results) => {
              if (error) {
                console.log('account.model.getAll - cannot get total number of accounts', error, sql_load);
                throw Error('There was a problem getting the total number of account');
              }
              resolve(results[0]['total']);
            });
            connection.end();
            return;
          }
          if ('query' in config) {
            sql_load = `SELECT account_id FROM accounts WHERE account_name LIKE '%${config['query']}%' LIMIT 10`;
            connection.query(sql_load, (error, results) => {
              if (error) {
                console.log('account.model.getAll - cannot get account with the specified query', error, sql_load);
                throw Error('There was a problem querying accounts given the name');
              }
              for (const r of results) {
                accountIds.push(r['account_id']);
              }
              resolve(accountIds);
            });
            connection.end();
            return;
          }
          if ('all' in config) {
            sql_load = `SELECT account_id FROM accounts WHERE archived = 0`;
            connection.query(sql_load, (error, results) => {
              if (error) {
                console.log('account.model.getAll - cannot get all account listing', error, sql_load);
                throw Error('There was a problem querying all accounts');
              }
              for (const r of results) {
                accountIds.push(r['account_id']);
              }
            });
            connection.end();
            return;
          }

          connection.query(sql_load, (error, results, fields) => {
            if (error) {
              return console.log(error);
            }
            this.dbData = results;
            if (results.length) {
              resolve(results);
            } else {
              resolve(this.dbData);
            }
          });
          connection.end();
      });
    }

    public getByUserId(userId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT accounts.* FROM accounts INNER JOIN users ON accounts.account_id = users.account_id WHERE users.user_id = ?';
            const param = [userId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Account not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByAccountCode(code: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM accounts WHERE account_code = ?';
            const param = [code];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Account not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    getRelatedAccounts(accntId){
      return new Promise((resolve, reject) => {
            const sql_load = `SELECT a.*
                      FROM
                        location_account_relation lar
                      INNER JOIN accounts a ON lar.account_id = a.account_id
                      WHERE
                        lar.location_id  IN (SELECT la.location_id FROM location_account_relation la WHERE la.account_id = ?)
                        AND a.archived = 0
                      GROUP BY lar.account_id`;
            const param = [accntId];



            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }

              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });

    }

    public searchByAccountName(name: String) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM accounts WHERE account_name LIKE "%`+name+`%" AND archived = 0 ORDER BY account_name ASC `;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }

              this.dbData = results;
              resolve(this.dbData);

            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE accounts SET
                lead = ?, online_training = ?, account_name = ?, building_number = ?,
                billing_unit = ?, billing_street = ?, billing_city = ?,
                billing_state = ?, billing_postal_code = ?, billing_country = ?,
                location_id = ?, account_type = ?, account_directory_name = ?,
                archived = ?, block_access = ?, account_code = ?,
                default_em_role = ?, epc_committee_on_hq = ?, trp_code = ?, account_domain = ?,
                key_contact = ?, time_zone = ?, email_add_user_exemption = ?
                WHERE account_id = ? `;
          const param = [
            ('lead' in this.dbData) ? this.dbData['lead'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            ('account_name' in this.dbData) ? this.dbData['account_name'] : "",
            ('building_number' in this.dbData) ? this.dbData['building_number'] : "",
            ('billing_unit' in this.dbData) ? this.dbData['billing_unit'] : "",
            ('billing_street' in this.dbData) ? this.dbData['billing_street'] : "",
            ('billing_city' in this.dbData) ? this.dbData['billing_city'] : "",
            ('billing_state' in this.dbData) ? this.dbData['billing_state'] : "",
            ('billing_postal_code' in this.dbData) ? this.dbData['billing_postal_code'] : "",
            ('billing_country' in this.dbData) ? this.dbData['billing_country'] : "",
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_type' in this.dbData) ? this.dbData['account_type'] : "Account",
            ('account_directory_name' in this.dbData) ? this.dbData['account_directory_name'] :
                                                        ('account_name' in this.dbData) ?
                                                        this.dbData['account_name'].replace(/ /g, '') : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('block_access' in this.dbData) ? this.dbData['block_access'] : 0,
            ('account_code' in this.dbData) ? this.dbData['account_code'] : null,
            ('default_em_role' in this.dbData) ? this.dbData['default_em_role'] : "1;8;General Occupant,0;9;Warden",
            ('epc_committee_on_hq' in this.dbData) ? this.dbData['epc_committee_on_hq'] : 0,
            ('trp_code' in this.dbData) ? this.dbData['trp_code'] : '',
            ('account_domain' in this.dbData) ? this.dbData['account_domain'] : '',
            ('key_contact' in this.dbData) ? this.dbData['key_contact'] : "",
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : "",
            ('email_add_user_exemption' in this.dbData) ? this.dbData['email_add_user_exemption'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            this.ID() ? this.ID() : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            resolve(true);
          });
          connection.end();

        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
          const sql_insert = `INSERT INTO accounts (
            lead,
            online_training,
            account_name,
            building_number,
            billing_unit,
            billing_street,
            billing_city,
            billing_state,
            billing_postal_code,
            billing_country,
            location_id,
            account_type,
            account_directory_name,
            archived,
            block_access,
            account_code,
            default_em_role,
            epc_committee_on_hq,
            trp_code,
            account_domain,
            key_contact,
            time_zone,
            email_add_user_exemption
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `;
          const param = [
            ('lead' in this.dbData) ? this.dbData['lead'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            ('account_name' in this.dbData) ? this.dbData['account_name'] : "",
            ('building_number' in this.dbData) ? this.dbData['building_number'] : "",
            ('billing_unit' in this.dbData) ? this.dbData['billing_unit'] : "",
            ('billing_street' in this.dbData) ? this.dbData['billing_street'] : "",
            ('billing_city' in this.dbData) ? this.dbData['billing_city'] : "",
            ('billing_state' in this.dbData) ? this.dbData['billing_state'] : "",
            ('billing_postal_code' in this.dbData) ? this.dbData['billing_postal_code'] : "",
            ('billing_country' in this.dbData) ? this.dbData['billing_country'] : "",
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_type' in this.dbData) ? this.dbData['account_type'] : "Account",
            ('account_directory_name' in this.dbData) ? this.dbData['account_directory_name'] :
                                                        ('account_name' in this.dbData) ?
                                                        this.dbData['account_name'].replace(/ /g, '') : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('block_access' in this.dbData) ? this.dbData['block_access'] : 0,
            ('account_code' in this.dbData) ? this.dbData['account_code'] : null,
            ('default_em_role' in this.dbData) ? this.dbData['default_em_role'] : "1;8;General Occupant,0;9;Warden",
            ('epc_committee_on_hq' in this.dbData) ? this.dbData['epc_committee_on_hq'] : 0,
            ('trp_code' in this.dbData) ? this.dbData['trp_code'] : '',
            ('account_domain' in this.dbData) ? this.dbData['account_domain'] : '',
            ('key_contact' in this.dbData) ? this.dbData['key_contact'] : "",
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : "",
            ('email_add_user_exemption' in this.dbData) ? this.dbData['email_add_user_exemption'] : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {

            if (err) {
              reject(err);
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['account_id'] = this.id;
            resolve(true);
          });
          connection.end();

        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('account_id' in createData) {
              this.id = createData.account_id;
            }
            resolve(this.write());
        });
    }

    public getLocationsOnAccount(user_id?: number, role_id?: number, archived?): Promise<Object[]> {
        return new Promise((resolve, reject) => {
            let user_filter = '';
            if (archived == undefined) {
              archived = 0;
            }
            if (user_id) {
                user_filter = `AND LAU.user_id = ${user_id}`;
            }

            const sql_get_locations = `SELECT
              locations.parent_id,
              locations.name,
              locations.formatted_address,
              locations.location_id,
              locations.google_photo_url,
              locations.admin_verified,
              locations.is_building,
              LAU.location_account_user_id
            FROM
              locations
            INNER JOIN
              location_account_user LAU
            ON
              locations.location_id = LAU.location_id
            WHERE
              locations.archived = ?
              ${user_filter}
            GROUP BY
              locations.location_id
            ORDER BY
              locations.location_id;
            `;
            const val = [archived];
            const connection = db.createConnection(dbconfig);

            connection.query(sql_get_locations, val, (err, results, fields) => {
                if (err) {
                    console.log(err);
                    // console.log(sql_get_locations);
                    throw new Error('Internal problem. There was a problem processing your query');
                }
                if (results.length) {
                    this.dbData = results;
                    resolve(results);
                } else {
                    reject(`No location found for this account ${this.ID()}`);
                }
            });
            connection.end();
        });
    }

    public getActivityLog(locationIds?, offsetLimit?, count?){
        if(!offsetLimit){
            offsetLimit = 0,10;
        }

        let accountId = this.ID(),
            locationSql = '';

        if(locationIds){
            locationSql = ' AND compliance_documents.building_id IN ('+locationIds+')';
        }

        return new Promise((resolve, reject) => {
            let accountId = this.ID();
            let sql = `
                SELECT
                    compliance_documents.compliance_documents_id,
                    compliance_documents.account_id,
                    compliance_documents.building_id,
                    compliance_documents.compliance_kpis_id,
                    compliance_documents.document_type,
                    compliance_documents.file_name,
                    compliance_documents.override_document,
                    compliance_documents.description,
                    compliance_documents.date_of_activity,
                    compliance_documents.viewable_by_trp,
                    compliance_documents.file_size,
                    compliance_documents.file_type,
                    compliance_documents.timestamp,
                    compliance_kpis.directory_name

                FROM compliance_kpis
                INNER JOIN compliance_documents
                ON compliance_kpis.compliance_kpis_id = compliance_documents.compliance_kpis_id
                WHERE compliance_documents.account_id = ${accountId} ${locationSql}
                ORDER BY compliance_documents.timestamp DESC
                LIMIT ${offsetLimit}
            `;

            if(count){
                sql = `
                    SELECT COUNT(compliance_documents.compliance_documents_id) as count FROM
                    compliance_kpis
                    INNER JOIN compliance_documents
                    ON compliance_kpis.compliance_kpis_id = compliance_documents.compliance_kpis_id
                    WHERE compliance_documents.account_id = ${accountId} ${locationSql}
                    ORDER BY compliance_documents.timestamp DESC
                `;
            }


            const connection = db.createConnection(dbconfig);
            connection.query(sql, (err, results, fields) => {
                if (err) {
                    console.log(err);
                    throw new Error('Internal problem. There was a problem processing your query');
                }
                this.dbData = results;
                resolve(results);
            });
            connection.end();
        });
    }

    public getAllEMRolesOnThisAccount(accountId = 0, filter = {} ): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let account = this.ID();
        let filterStr = '';
        let uniqStr = `GROUP BY users.user_id`;
        const resultSet = [];
        if (accountId) {
          account = accountId;
        }
        if ('location' in filter && filter['location'].length > 0) {
          filterStr += ' AND user_em_roles_relation.location_id IN (' + filter['location'].join(',') + ')';
        }
        if ('em_roles' in filter) {
          filterStr += ' AND user_em_roles_relation.em_role_id IN (' + filter['em_roles'].join(',')  + ')';
        }
        if ('all' in filter) {
          uniqStr = '';
        }
        if('search' in filter){
            filterStr += ' AND CONCAT(users.first_name, " ", users.last_name) LIKE "%'+filter['search']+'%" ';
        }
        if('user_ids' in filter){
            filterStr += ' AND users.user_id IN ('+filter['user_ids']+') ';
        }

        const sql_all = `
          SELECT
          	users.user_id,
            users.first_name,
            users.last_name,
            users.email,
            user_em_roles_relation.location_id,
            user_em_roles_relation.em_role_id,
            em_roles.role_name,
            IF(ploc.name IS NOT NULL, CONCAT( IF(TRIM(ploc.name) <> '', CONCAT(ploc.name, ', '), ''), locations.name), locations.name) as location_name
          FROM
          	users
          INNER JOIN
          	user_em_roles_relation
          ON
            users.user_id = user_em_roles_relation.user_id
          INNER JOIN
            em_roles
          ON
           user_em_roles_relation.em_role_id = em_roles.em_roles_id
          INNER JOIN
              locations ON user_em_roles_relation.location_id = locations.location_id
          LEFT JOIN
              locations ploc ON locations.parent_id = ploc.location_id
          WHERE
            users.account_id = ? ${filterStr}
          AND
           users.archived = 0 ${uniqStr}
          ORDER BY
          	users.user_id;
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_all, [account], (error, results) => {
          if (error) {
            console.log('account.model.getAllEMRolesOnThisAccount', error, sql_all);
            throw Error('Cannot generate the list of emergency roles');
          }
          for (const r of results) {
            resultSet.push(r);
          }
          resolve(resultSet);
        });
        connection.end();
      });
    }

    public getAllEMRolesOnThisAccountNotCompliant(accountId = 0, filter = {} ): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let account = this.ID();
        let filterStr = '';
        let uniqStr = `GROUP BY users.user_id`;
        const resultSet = [];
        if (accountId) {
          account = accountId;
        }
        if ('location' in filter && filter['location'].length > 0) {
          filterStr += ' AND uer.location_id IN (' + filter['location'].join(',') + ')';
        }
        if ('em_roles' in filter) {
          filterStr += ' AND uer.em_role_id IN (' + filter['em_roles'].join(',')  + ')';
        }
        if ('all' in filter) {
          uniqStr = '';
        }
        if('search' in filter){
            filterStr += ' AND CONCAT(u.first_name, " ", u.last_name) LIKE "%'+filter['search']+'%" ';
        }
        if('user_ids' in filter){
            filterStr += ' AND u.user_id IN ('+filter['user_ids']+') ';
        }

        const sql_all = `
            SELECT
                u.user_id, u.first_name, u.last_name, u.email, uer.location_id, uer.em_role_id,
                uer.user_em_roles_relation_id, er.role_name, train.training_requirement_name, train.training_requirement_id,
                IF(ploc.name IS NOT NULL, CONCAT( IF(TRIM(ploc.name) <> '', CONCAT(ploc.name, ', '), ''), locations.name), locations.name) as location_name
            FROM users u
            INNER JOIN user_em_roles_relation uer ON u.user_id = uer.user_id
            INNER JOIN em_roles er ON uer.em_role_id = er.em_roles_id
            INNER JOIN em_role_training_requirements ertr ON er.em_roles_id = ertr.em_role_id
            INNER JOIN training_requirement train ON train.training_requirement_id = ertr.training_requirement_id
            INNER JOIN locations ON uer.location_id = locations.location_id
            LEFT JOIN locations ploc ON locations.parent_id = ploc.location_id
            WHERE u.user_id NOT IN (
                SELECT
                    c.user_id
                FROM certifications c
                INNER JOIN training_requirement tr ON c.training_requirement_id = tr.training_requirement_id
                INNER JOIN em_role_training_requirements emtr ON c.training_requirement_id = emtr.training_requirement_id
                WHERE c.pass = 1 AND DATE_ADD(c.certification_date, INTERVAL tr.num_months_valid MONTH) > NOW()
            )

            AND u.account_id = ? AND u.archived = 0 ${filterStr};
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_all, [account], (error, results) => {
          if (error) {
            console.log('account.model.getAllEMRolesOnThisAccountNotCompliant', error, sql_all);
            throw Error('Cannot generate the list of emergency roles');
          }
          for (const r of results) {
            resultSet.push(r);
          }
          resolve(resultSet);
        });
        connection.end();
      });
    }

    generateAdminAccountUsers(accountId: number = 0, users = []): Promise<Array<object>> {
      let account = this.ID();
      let userStr = '';
      if (accountId) {
        account = accountId;
      }
      if (users.length > 0) {
        userStr = ' AND users.user_id IN (' + users.join(',') + ')';
      }
      return new Promise((resolve, reject) => {

        const resultSet = [];
        const sql = `SELECT
            users.user_id,
            users.first_name,
            users.last_name,
            users.email,
            users.mobile_number,
            user_role_relation.role_id,
            IF (user_role_relation.role_id = 1, 'FRP', IF (user_role_relation.role_id = 2, 'TRP', '')) as account_role,
            locations.location_id,
            locations.name,
            parent_locations.name as parent_name
          FROM users
          LEFT JOIN
            user_role_relation
          ON users.user_id = user_role_relation.user_id
          LEFT JOIN
            location_account_user
          ON
            location_account_user.user_id = users.user_id
          LEFT JOIN
            locations
          ON
            locations.location_id = location_account_user.location_id
          LEFT JOIN
            locations as parent_locations
          ON
            locations.parent_id = parent_locations.location_id
          WHERE
            users.account_id = ? ${userStr}
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [account], (error, results) => {
          if (error) {
            console.log('account.model.generateAdminAccountUsers', error, sql);
            throw Error('Cannot populate list for account users');
          }
          Object.keys(results).forEach((index) => {
            resultSet.push(results[index]);
          });
          resolve(resultSet);

        });
        connection.end();
      });
    }

    generateAdminEMUsers(accountId: number = 0, users = []): Promise<Array<object>> {
      let account = this.ID();
      let userStr = '';

      if (accountId) {
        account = accountId;
      }
      if (users.length > 0) {
        userStr = ' AND users.user_id IN (' + users.join(',') + ')';
      }
      return new Promise((resolve, reject) => {

        const resultSet = [];
        const sql = `SELECT
        users.user_id,
        users.first_name,
        users.last_name,
        users.email,
        users.mobile_number,
        user_em_roles_relation.em_role_id as role_id,
        em_roles.role_name,
        locations.location_id,
        locations.name,
        parent_locations.name as parent_name
      FROM users
      LEFT JOIN
        user_em_roles_relation
      ON
        users.user_id = user_em_roles_relation.user_id
      LEFT JOIN em_roles ON em_roles.em_roles_id = user_em_roles_relation.em_role_id
      LEFT JOIN
        locations
      ON
        locations.location_id = user_em_roles_relation.location_id
      LEFT JOIN
        locations as parent_locations
      ON
        locations.parent_id = parent_locations.location_id
      WHERE
        users.account_id = ? ${userStr}
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, [account], (error, results) => {
          if (error) {
            console.log('account.model.generateAdminEMUsers', error, sql);
            throw Error('Cannot populate list for emergency users');
          }
          Object.keys(results).forEach((index) => {
            resultSet.push(results[index]);
          });
          resolve(resultSet);

        });
        connection.end();
      });
    }

    public getAccountDetailsUsingName(name: string = ''): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const sql_get = `SELECT * FROM accounts WHERE account_name REGEXP '^${name}$' LIMIT 1`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [], (error, results) => {
          if (error) {
            console.log('account.model.getAccountDetailsUsingName', error, sql_get);
            throw Error('Internal error. Cannot get account details');
          }
          resolve(results);
        });
      });
    }

} // end class
