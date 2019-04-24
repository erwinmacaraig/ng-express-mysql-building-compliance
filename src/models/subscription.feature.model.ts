import * as Promise from 'promise';
import { BaseClass } from './base.model';

export class SubscriptionFeature extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM subscription_feature WHERE subscription_feature_id = ?`;
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_load, [this.id], (error, results) => {
                    if (error) {
                        throw new Error(error);
                    }
                    if (!results.length) {
                        reject(`Subscription feature with id ${this.id} not found.`);
                      } else {
                        this.dbData = results[0];
                        this.setID(results[0]['subscription_feature_id']);
                        resolve(this.dbData);
                      }
                });
                connection.release();
            });
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
           const sql_update = ` UPDATE
                                    subscription_feature
                                SET
                                    subscription_type = ?,
                                    feature = ?,
                                    value = ?,
                                    description = ?
                                WHERE
                                    subscription_feature_id = ?`;
                                
            const param = [
                ('subscription_type' in this.dbData) ? this.dbData['product_id'] : '',
                ('feature' in this.dbData) ? this.dbData['product_id'] : '',
                ('value' in this.dbData) ? this.dbData['value'] : 0,
                ('description' in this.dbData) ? this.dbData['description'] : '',
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
                });
                connection.release();
            });
            
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO subscription_feature (
                subscription_type,
                feature,
                value,
                description
            ) VALUES (?, ?, ?)                                
            `;

            const param = [
                ('subscription_type' in this.dbData) ? this.dbData['feature'] : '',
                ('feature' in this.dbData) ? this.dbData['feature'] : '',
                ('value' in this.dbData) ? this.dbData['value'] : 0,
                ('description' in this.dbData) ? this.dbData['description'] : ''
            ];
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_insert, param, (error, results) => {
                    if (error) {
                        throw new Error(error);
                    }
                    this.id = results.insertId;
                    this.dbData['subscription_feature_id'] = results.insertId;
                    resolve(this.id);
                });
                connection.release();
            });

        });
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (const key in createData) {
              this.dbData[key] = createData[key];
            }
            if ('subscription_feature_id' in createData) {
              this.id = createData['subscription_feature_id'];
            }
            resolve(this.write());
          });
    }

    public loadSubscriptionFeatures(type='free'): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM subscription_feature WHERE subscription_type = ?`;
            const param = [type];
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                // console.log(sql, param);
                connection.query(sql, param, (error, results) => {
                    if (error) {
                        throw new Error(error);
                    }
                    resolve(results);
                });
                connection.release();
            });
        });
    }
}