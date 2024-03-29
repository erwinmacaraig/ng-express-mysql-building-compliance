import { BaseClass } from './base.model';
import { AccountSubscription } from './account.subscription.model';
import { SubscriptionFeature } from './subscription.feature.model';
import { AccountSubscriptionInterface } from '../interfaces/account.subscription.interface';

const aws_credential = require('../config/aws-access-credentials.json');

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
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = 'SELECT * FROM accounts WHERE account_id = ?';
                const uid = [this.id];
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
                  connection.release();
                });
                
            });
        });
    }

    public getAll(config = {}): Promise<any> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                let sql_load = 'SELECT * FROM accounts WHERE archived = 0';
                let page = 0;
                const accountIds = [];
                
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
                        connection.release();
                    });
                    
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
                        connection.release();
                    });
                    
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
                        connection.release();
                    });
                    
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
                        resolve(accountIds);
                        connection.release();
                    });
                    
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
                    connection.release();
                });
                
            });

            
            
        });
    }

    public static getAccountSubscription(accountId=0): Promise<object> {
        return new Promise((resolve, reject) => {
            let subscription: AccountSubscriptionInterface = {
                account_id: 0,
                bulk_license_total: 0,
                valid_till: '',
                subscriptionType: 'free',
                feature: []
            };
            new AccountSubscription().getAccountSubscription(accountId).then((data) => {
                if (data.length == 0) {
                    return new SubscriptionFeature().loadSubscriptionFeatures();
                } else {
                    for (let dref of data) {
                        subscription.account_id = accountId;
                        subscription.bulk_license_total = dref['bulk_license_total'];
                        subscription.valid_till = dref['valid_till'];
                        subscription.subscriptionType = dref['type'];
                        subscription.feature.push(dref['feature']);
                    }
                    resolve(subscription);
                    return;
                }
            }).then((freeData: Array<object>) => {
                for (let dref of freeData) {
                    subscription.account_id = accountId;
                    subscription.subscriptionType = dref['subscription_type'];
                    subscription.feature.push(dref['feature']);
                }
                resolve(subscription);
                return;
            }).catch((e) => {
                console.log('There is a problem with getting account subscription, resolving to free subscription');
                resolve(subscription);
                return;
            });

        });

    }

    public getActive() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = 'SELECT account_id, account_name FROM accounts WHERE archived = 0 ORDER BY account_name';
                connection.query(sql_load, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                  connection.release();
                });
                
            });
        });
    }

    public getByIds(ids) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql = `SELECT * FROM accounts WHERE archived = 0 AND account_id IN (${ids})`;
                connection.query(sql, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                  connection.release();
                });
                
            });
        });
    }

    public getByUserId(userId: Number) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = 'SELECT accounts.* FROM accounts INNER JOIN users ON accounts.account_id = users.account_id WHERE users.user_id = ?';
                const param = [userId];
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
                  connection.release();
                });
                
            });
        });
    }

    public getByAccountCode(code: String) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = 'SELECT * FROM accounts WHERE account_code = ?';
                const param = [code];
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
                  connection.release();
                });
                
            });
        });
    }

    public getRelatedAccounts(accntId){
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                const sql_load = `SELECT a.*
                FROM
                location_account_relation lar
                INNER JOIN accounts a ON lar.account_id = a.account_id
                WHERE
                lar.location_id  IN (SELECT la.location_id FROM location_account_relation la WHERE la.account_id = ?)
                AND a.archived = 0
                GROUP BY lar.account_id`;
                const param = [accntId];

                connection.query(sql_load, param, (error, results, fields) => {
                    if (error) {
                        return console.log(error);
                    }

                    this.dbData = results;
                    resolve(this.dbData);
                    connection.release();
                });
                
            });
        });
    }

    public searchByAccountName(name: String, limit:any = false) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                let limitSql = (limit) ? 'LIMIT '+limit : '';
                const sql_load = `SELECT * FROM accounts WHERE account_name LIKE "%`+name+`%" AND archived = 0 ORDER BY account_name ASC ${limitSql} `;
                connection.query(sql_load, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }

                  this.dbData = results;
                  resolve(this.dbData);
                  connection.release();
                });
                
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                
                const sql_update = `UPDATE accounts SET
                    lead = ?, online_training = ?, fsa_by_evac = ?, account_name = ?, building_number = ?,
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
                    ('fsa_by_evac' in this.dbData) ? this.dbData['fsa_by_evac'] : 0,
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
                connection.query(sql_update, param, (err, results, fields) => {
                    if (err) {
                        throw new Error(err);
                    }
                    resolve(true);
                    connection.release();
                });               
            });
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                const sql_insert = `INSERT INTO accounts (
                    lead,
                    online_training,
                    fsa_by_evac,
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
                    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `;

                const param = [
                    ('lead' in this.dbData) ? this.dbData['lead'] : 0,
                    ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
                    ('fsa_by_evac' in this.dbData) ? this.dbData['fsa_by_evac'] : 0,
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

                connection.query(sql_insert, param, (err, results, fields) => {

                    if (err) {
                        reject(err);
                        throw new Error(err);
                    }
                    this.id = results.insertId;
                    this.dbData['account_id'] = this.id;
                    resolve(true);
                    connection.release();
                });
                
            });
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
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

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
                    connection.release();
                });
               

            });
        });
    }

    public getActivityLog(locationIds?, offsetLimit?, count?, types?): Promise<any>{
        if(!offsetLimit){
            offsetLimit = 0,10;
        }

        if(!types){
            types = '"Primary","Secondary","Supporting","Admin"';
        }

        let accountId = this.ID(),
            locationSql = '';

        if(locationIds){
            locationSql = ' AND compliance_documents.building_id IN ('+locationIds+')';
        }

        return new Promise((resolve, reject) => {

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                let accountId = this.ID();
                let sql = `
                    SELECT
                        accounts.account_directory_name,
                        parentLocation.location_directory_name as parent_location_directory_name,
                        parentLocation.is_building as parent_is_building,
                        locations.location_directory_name,
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
                    INNER JOIN accounts 
                    ON accounts.account_id = compliance_documents.account_id
                    INNER JOIN locations 
                    ON locations.location_id = compliance_documents.building_id
                    LEFT JOIN locations as parentLocation 
                    ON parentLocation.location_id = locations.parent_id

                    WHERE compliance_documents.account_id = ${accountId} ${locationSql}
                    AND compliance_documents.document_type IN (${types})
                    ORDER BY compliance_documents.timestamp DESC
                    LIMIT ${offsetLimit}
                `;

                if(count){
                    sql = `
                        SELECT COUNT(compliance_documents.compliance_documents_id) as count FROM
                        compliance_kpis
                        INNER JOIN compliance_documents
                        ON compliance_kpis.compliance_kpis_id = compliance_documents.compliance_kpis_id
                        INNER JOIN accounts 
                        ON accounts.account_id = compliance_documents.account_id
                        INNER JOIN locations 
                        ON locations.location_id = compliance_documents.building_id
                        LEFT JOIN locations as parentLocation 
                        ON parentLocation.location_id = locations.parent_id

                        WHERE compliance_documents.account_id = ${accountId} ${locationSql}
                        AND compliance_documents.document_type IN (${types})
                        ORDER BY compliance_documents.timestamp DESC
                    `;
                }

                connection.query(sql, (err, results, fields) => {
                    if (err) {
                        console.log(sql);
                        throw new Error('Internal problem. There was a problem processing your query');
                    }

                    if(!count){
                        for (const r of results) {
                            let urlPath = `${aws_credential['AWS_S3_ENDPOINT']}${aws_credential['AWS_Bucket']}/`;
                            urlPath += r['account_directory_name'];
                            if (r['parent_location_directory_name'] != null && r['parent_location_directory_name'].trim().length > 0) {
                                if(r['parent_is_building'] == 1){
                                    urlPath +=  `/${r['parent_location_directory_name']}`;
                                }
                            }
                            urlPath += `/${r['location_directory_name']}/${r['directory_name']}/${r['document_type']}/`+encodeURIComponent(r['file_name']);
                            r['urlPath'] = urlPath;
                        }
                    }

                    this.dbData = results;
                    resolve(results);
                    connection.release();
                });
                
            });
        });
    }

    public getAllEMRolesOnThisAccount(accountId = 0, filter:any = {} ): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

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
                if('not_in_user_ids' in filter){
                    filterStr += ' AND users.user_id NOT IN ('+filter['not_in_user_ids'].join(',')+') ';
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
                        accounts.account_name,
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
                    LEFT JOIN
                        accounts ON users.account_id = accounts.account_id
                    WHERE
                        users.account_id = ? ${filterStr}
                    AND
                        users.archived = 0 ${uniqStr}
                    ORDER BY
                    users.user_id;
                `;
                
                connection.query(sql_all, [account], (error, results) => {
                    if (error) {
                        console.log('account.model.getAllEMRolesOnThisAccount', error, sql_all);
                        throw Error('Cannot generate the list of emergency roles');
                    }
                    resolve(results);
                    connection.release();
                });

                
            });
        });
    }

    public getAllEMRolesOnThisAccountNotCompliant(accountId = 0, filter:any = {} ): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

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
                        INNER JOIN users u ON u.user_id = c.user_id
                        INNER JOIN training_requirement tr ON c.training_requirement_id = tr.training_requirement_id
                        INNER JOIN em_role_training_requirements emtr ON c.training_requirement_id = emtr.training_requirement_id
                        WHERE c.pass = 1 AND DATE_ADD(c.certification_date, INTERVAL tr.num_months_valid MONTH) > NOW()
                        AND u.account_id = ${account} GROUP BY c.user_id
                    )

                    AND u.account_id = ? AND u.archived = 0 ${filterStr};
                `;
                connection.query(sql_all, [account], (error, results) => {
                    if (error) {
                        console.log('account.model.getAllEMRolesOnThisAccountNotCompliant', error, sql_all);
                        throw Error('Cannot generate the list of emergency roles');
                    }
                    for (const r of results) {
                        resultSet.push(r);
                    }
                    resolve(resultSet);
                    connection.release();
                });

                
            });
        });
    }

    public generateAdminAccountUsers(accountId: number = 0, users = []): Promise<Array<object>> {
        let account = this.ID();
        let userStr = '';
        if (accountId) {
            account = accountId;
        }

        users = (users.length == 0) ? [-1] : users;

        if (users.length > 0) {
            userStr = ' AND users.user_id IN (' + users.join(',') + ')';
        }
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                const resultSet = [];
                const sql = `SELECT
                    users.user_id,
                    users.first_name,
                    users.last_name,
                    users.email,
                    users.mobile_number, 
                    user_role_relation.role_id,
                    IF (user_role_relation.role_id = 1, 'FRP', 'TRP') AS account_role,                    
                    accounts.account_id,
                    accounts.account_name,                     
                    locations.location_id,
                    locations.name,
                    parent_locations.name as parent_name,
                    location_account_user.location_account_user_id
                    FROM users
                    INNER JOIN accounts ON users.account_id = accounts.account_id                                                         
                    LEFT JOIN location_account_user
                    ON
                    location_account_user.user_id = users.user_id
                    LEFT JOIN user_role_relation ON users.user_id = user_role_relation.user_id                    
                    LEFT JOIN
                    locations
                    ON
                    locations.location_id = location_account_user.location_id
                    LEFT JOIN location_account_relation
                    ON location_account_relation.account_id = users.account_id
                    LEFT JOIN
                    locations as parent_locations
                    ON
                    locations.parent_id = parent_locations.location_id
                    WHERE
                    users.account_id = ? ${userStr}
                    GROUP BY location_account_user.location_account_user_id
                    ORDER BY users.user_id DESC
                `;
                connection.query(sql, [account], (error, results) => {
                    if (error) {
                        console.log('account.model.generateAdminAccountUsers', error, sql);
                        throw Error('Cannot populate list for account users');
                    }
                    Object.keys(results).forEach((index) => {
                        resultSet.push(results[index]);
                    });
                    resolve(resultSet);
                    connection.release();
                });

                
            });
        });
    }

    public generateAdminEMUsers(accountId: number = 0, users = []): Promise<Array<object>> {
        let account = this.ID();
        let userStr = '';

        if (accountId) {
            account = accountId;
        }
        users = (users.length == 0) ? [-1] : users;
        if (users.length > 0) {
            userStr = ' AND users.user_id IN (' + users.join(',') + ')';
        }
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                const resultSet = [];
                const sql = `SELECT
                    users.user_id,
                    users.first_name,
                    users.last_name,
                    users.email,
                    users.mobile_number,
                    accounts.account_id,
                    accounts.account_name,
                    user_em_roles_relation.em_role_id as role_id,                   
                    em_roles.role_name,
                    locations.location_id,
                    locations.name,
                    parent_locations.name as parent_name
                    FROM users
                    INNER JOIN accounts ON users.account_id = accounts.account_id
                    LEFT JOIN
                    user_em_roles_relation
                    ON
                    users.user_id = user_em_roles_relation.user_id
                    INNER JOIN em_roles ON em_roles.em_roles_id = user_em_roles_relation.em_role_id
                    INNER JOIN
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

                connection.query(sql, [account], (error, results) => {
                    if (error) {
                        console.log('account.model.generateAdminEMUsers', error, sql);
                        throw Error('Cannot populate list for emergency users');
                    }
                    Object.keys(results).forEach((index) => {
                        resultSet.push(results[index]);
                    });
                    resolve(resultSet);
                    connection.release();
                });
                
            });
        });
    }

    public getAccountDetailsUsingName(name: string = ''): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }

                const sql_get = `SELECT * FROM accounts WHERE account_name LIKE '${name}' LIMIT 1`;
                connection.query(sql_get, [], (error, results) => {
                    if (error) {
                        console.log('account.model.getAccountDetailsUsingName', error, sql_get);
                        throw Error('Internal error. Cannot get account details');
                    }
                    resolve(results);
                    connection.release();
                });

                
            });
        });
    }

    public countTenantsFromLocationIds(locationIds){
        if(locationIds.trim().length == 0){ return 0; }
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    console.log('Error gettting pool connection ' + err);
                    throw new Error(err);
                }

                const sql = `
                    SELECT * FROM
                    (
                        SELECT a1.account_id FROM location_account_user lau 
                        INNER JOIN accounts a1 ON lau.account_id = a1.account_id WHERE a1.archived = 0 AND lau.location_id IN (`+locationIds+`) 
                        UNION 
                        SELECT a2.account_id FROM user_em_roles_relation em 
                        INNER JOIN users u ON em.user_id = u.user_id INNER JOIN accounts a2 ON u.account_id = a2.account_id WHERE a2.archived = 0 AND em.location_id IN (`+locationIds+`)
                    ) accounts
                    GROUP BY account_id`;

                connection.query(sql, [], (error, results) => {
                    if (error) {
                        console.log('getAccountsInLocationIds', error, sql);
                        throw Error('Internal error. Cannot get account details');
                    }
                    
                    resolve(results.length);
                    connection.release();
                });

                
            });  
        });
    }

    public archiveAccount(accountIds=[], control=1): Promise<any> {
        return new Promise((resolve, reject) => {
            if (accountIds.length == 0) {
                reject('Invalid input parameter');
                return;
            }
            
            this.pool.getConnection((con_err, connection) => {
                if (con_err) {
                    console.log('Error gettting pool connection ' + con_err);
                    throw new Error(con_err);
                }
                const sql = `UPDATE accounts SET archived = ${control} WHERE account_id IN (${accountIds.join(',')})`;
                connection.query(sql, [], (error, results) => {
                    if (error) {
                        console.log(sql, error);
                        throw new Error('Cannot archive account(s)');
                    }
                    resolve(true);     
                    connection.release();
                });
            });

        });
    }

    public archivePeopleInAccount(accountIds=[], control=1): Promise<any> {
        return new Promise((resolve, reject) => {
            if (accountIds.length == 0) {
                reject('Invalid input parameter');
                return;
            }
            this.pool.getConnection((con_err, connection) => {
                if (con_err) {
                    console.log('Error gettting pool connection ' + con_err);
                    throw new Error(con_err);
                }
                const sql = `UPDATE users SET archived = ${control} WHERE account_id IN (${accountIds.join(',')})`;
                connection.query(sql, [], (error, results) => {
                    if (error) {
                        console.log(sql, error);
                        throw new Error('Cannot archive users in accounts');
                    }
                    resolve(true);     
                    connection.release();
                });
            });
        });
        
    }

    public getArchiveAccounts(): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                account_id,
                account_name
            FROM
                accounts
            WHERE
                archived = 1
            ORDER BY
                accounts.account_name
            `;
            this.pool.getConnection((con_error, connection) => {
                if (con_error) {
                    console.log('Error gettting pool connection ' + con_error);
                    throw new Error(con_error);
                }
                connection.query(sql, [], (err, results) => {
                    if (err) {
                        console.log(sql, err);
                        throw new Error('Cannot get list of archived accounts');
                    }
                    resolve(results);
                    connection.release();
                });
            });
        });
    }
    /**
     * 
     * @param accountId account id
     * @description returns an array of user id for this account
     */

    public accountUserIds(accountId=0): Promise<Array<Number>> {
        return new Promise((resolve, reject) => {
            let account = this.ID();
            if (accountId) {
                account = accountId;
            }
            
            this.pool.getConnection((con_error, connection) => {
                if (con_error) {
                    console.log('Error gettting pool connection ' + con_error);
                    throw new Error(con_error);
                }
                const sql = `SELECT user_id FROM users WHERE account_id = ?`;
                const params = [account];
                connection.query(sql, params, (err, results) => {
                    const ids = [];
                    if (err) {
                        console.log(sql, err);
                        throw new Error('Cannot list all users in accounts');
                    }
                    for (let r of results) {
                        ids.push(r['user_id']);
                    }
                    resolve(ids);
                    connection.release();
                });

            });

        });
    }

    public delete(accountId=0) {
        return new Promise((resolve, reject) => {
            let account = this.ID();
            if (accountId) {
                account = accountId;
            }

            this.deleteAccountUsers(account).then(() => {

            }).catch((e) => {

            });
            this.pool.getConnection((con_error, connection) => {
                if (con_error) {
                    console.log('Error gettting pool connection ' + con_error);
                    throw new Error(con_error);
                }
                const sql = `DELETE FROM accounts WHERE account_id = ?`;
                const params = [account];
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log(sql, err);
                        throw new Error('Cannot delete account');
                    }
                    resolve(results);
                    connection.release();
                });

            });

        });
    }

    private deleteAccountUsers(accountId=0) {
        return new Promise((resolve, reject) => {
            let account = this.ID();
            if (accountId) {
                account = accountId;
            }
            this.pool.getConnection((con_error, connection) => {
                if (con_error) {
                    console.log('Error gettting pool connection ' + con_error);
                    throw new Error(con_error);
                }
                const sql = `DELETE FROM users WHERE account_id = ?`;
                const params = [account];
                connection.query(sql, params, (err, results) => {
                    if (err) {
                        console.log(sql, err);
                        throw new Error('Cannot delete users in accounts');
                    }
                    resolve(results);
                    connection.release();
                });
            });            
        });

    }



} // end class
