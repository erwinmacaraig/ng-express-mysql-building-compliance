import * as Promise from 'promise';
import { BaseClass } from './base.model';

export class AccountSubscription extends BaseClass {
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM account_subscription WHERE account_subscription_id = ?`;
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_load, [this.id], (error, results) => {
                    if (error) {
                        throw new Error(error);
                    }
                    if (!results.length) {
                        reject(`Subscription with id ${this.id} not found.`);
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['account_subscription_id']);
                        resolve(this.dbData);
                    }
                    connection.release();
                });
                
            });
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO account_subscription (
                account_id,
                type,
                valid_till,
                bulk_license_total,
                enabled
            ) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                type = ?,
                valid_till = ?,
                bulk_license_total = ?,
                enabled = ?
            `;

            const param = [
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('type' in this.dbData) ? this.dbData['type'] : 'free',
                ('valid_till' in this.dbData) ? this.dbData['valid_till'] : 0,
                ('bulk_license_total' in this.dbData) ? this.dbData['bulk_license_total'] : -1,
                ('enabled' in this.dbData) ? this.dbData['enabled'] : 1,
                ('type' in this.dbData) ? this.dbData['type'] : 0,
                ('valid_till' in this.dbData) ? this.dbData['valid_till'] : 0,
                ('bulk_license_total' in this.dbData) ? this.dbData['bulk_license_total'] : -1,
                ('enabled' in this.dbData) ? this.dbData['enabled'] : 1
            ];

            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_insert, param, (error, results) => {
                    if (error) {
                        console.log(sql_insert, param, error);
                        throw new Error;
                    }
                    this.id = results.insertId;
                    this.dbData['account_subscription_id'] = results.insertId;
                    resolve(this.id);
                    connection.release();
                });
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE
            account_subscription
                                SET
                                    account_id = ?,
                                    type = ?,
                                    valid_till = ?,
                                    bulk_license_total = ?
                                    enabled = ?
                                WHERE
                                    account_subscription_id = ?`;
            const param = [                
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('type' in this.dbData) ? this.dbData['type'] : 'free',
                ('valid_till' in this.dbData) ? this.dbData['valid_till'] : '',
                ('bulk_license_total' in this.dbData) ? this.dbData['bulk_license_total'] : -1,
                ('enabled' in this.dbData) ? this.dbData['enabled'] : 1,
                this.id
            ];

            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_update, param, (error, results) => {
                    if (error) {
                        throw new Error(error);
                    }
                    resolve(this.id);
                    connection.release();
                });
                
            });

        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (const key in createData) {
                this.dbData[key] = createData[key];
              }
              if ('product_subscription_id' in createData) {
                this.id = createData['product_subscription_id'];
              }
              resolve(this.write());
        });
    }

    public getAccountSubscription(accountId=0, include_features: boolean = false, filter={}): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let sql: string = '';

            sql = `SELECT
                        account_subscription.*
                    FROM
                        account_subscription
                    WHERE 
                        account_subscription.account_id = ?
                    AND
                        account_subscription.enabled = 1`;

            if (include_features) {
                sql = `SELECT
                    account_subscription.*,
                    subscription_feature.feature,
                    subscription_feature.value
                FROM
                    account_subscription
                INNER JOIN
                    subscription_feature
                ON
                    account_subscription.type = subscription_feature.subscription_type
                WHERE 
                    account_subscription.account_id = ? AND account_subscription.enabled = 1`;
            }
            const param = [accountId];
            this.pool.getConnection((err, connection) => {
                if(err) {
                    throw new Error(err);
                }
                connection.query(sql, param, (error, results) => {
                    if (error) {
                        console.log(param);
                        throw new Error(sql);
                    }
                    resolve(results);
                    connection.release();
                });
                
            });
        });
    }

    public listAccountSubscriptions(filter = {}): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let sql: string = '';
            
            sql = `SELECT * FROM account_subscription WHERE enabled = 1;`;
            if ('type' in filter) {
                switch(filter['type']) {
                    case 'free':
                        sql += ` AND account_subscription.type = 'free'`
                    break;
                    case 'premium':
                        sql += ` AND account_subscription.type = 'premium'`
                    break;
                    default:
                        sql += ` AND account_subscription.type <> 'free'`;
                    break;
                }
            }
            if ('account_id' in filter) {
                sql += ` AND account_id = ${filter['account_id']}`;
            }

            this.pool.getConnection((err, connection) => {
                if(err) {
                    throw new Error(err);
                }
                connection.query(sql, [], (error, results) => {
                    if (error) {
                        console.log(sql);
                        throw new Error(sql);
                    }
                    resolve(results);
                    connection.release();
                });
                
            });
        });
    }



}