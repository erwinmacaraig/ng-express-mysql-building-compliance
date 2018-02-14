import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class ProductsFavoritesModel extends BaseClass {
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT pf.products_favorites_id, pf.user_id, pf.quantity, pf.target_user_id, pf.diagram_finish_id, pf.pdf_only, pf.location_id, p.* 
                    FROM products_favorites pf INNER JOIN products p ON pf.product_id = p.product_id 
                    WHERE pf.products_favorites_id = ?`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, [this.id], (error, results, fields) => {
                if (error) {
                    throw new Error(error);
                }
                if (!results.length) {
                    reject(`Favorite product not found`);
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['products_favorites_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE
            products_favorites
            SET
            product_id = ?,
            user_id = ?,
            quantity = ?,
            target_user_id = ?,
            diagram_finish_id = ?,
            pdf_only = ?,
            location_id = ?
            WHERE products_favorites_id = ?`;
            const product = [
            ('product_id' in this.dbData) ? this.dbData['product_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('quantity' in this.dbData) ? this.dbData['quantity'] : 0,
            ('target_user_id' in this.dbData) ? this.dbData['target_user_id'] : 0,
            ('diagram_finish_id' in this.dbData) ? this.dbData['diagram_finish_id'] : 0,
            ('pdf_only' in this.dbData) ? this.dbData['pdf_only'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            this.ID() ? this.ID() : 0
            ];

            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, product, (error, results, fields) => {
                if (error) {
                    console.log('Favorite products model', error);
                    throw new Error(error);
                }
                resolve(true);
            });
            connection.end();
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const insert_sql = `INSERT INTO products_favorites (product_id, user_id, quantity, target_user_id, diagram_finish_id, pdf_only, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            const product = [
            ('product_id' in this.dbData) ? this.dbData['product_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('quantity' in this.dbData) ? this.dbData['quantity'] : 0,
            ('target_user_id' in this.dbData) ? this.dbData['target_user_id'] : 0,
            ('diagram_finish_id' in this.dbData) ? this.dbData['diagram_finish_id'] : 0,
            ('pdf_only' in this.dbData) ? this.dbData['pdf_only'] : 0,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(insert_sql, product, (error, results, fields) => {
                if (error) {
                    throw new Error(error);
                }
                this.id = results.insertId;
                this.dbData['products_favorites_id'] = results.insertId;
                resolve(this.id);
            });
            connection.end();
        });
    }
    public create(createData) {
        return new Promise((resolve, reject) => {
            for (const key in createData) {
                this.dbData[key] = createData[key];
            }
            if ('products_favorites_id' in createData) {
                this.id = createData['products_favorites_id'];
            }
            resolve(this.write());
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM products_favorites WHERE products_favorites_id = ? LIMIT 1`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_del, [this.ID()], (error, results, fields) => {
                if (error) {
                    console.log(error);
                    reject('Error deleting record');

                } else {
                    resolve(true);
                }

            });
            connection.end();
        });
    }

    public getUsersFavorites(userId) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT pf.products_favorites_id, pf.user_id, pf.quantity, pf.target_user_id, pf.diagram_finish_id, pf.pdf_only, pf.location_id, p.* 
                    FROM products_favorites pf INNER JOIN products p ON pf.product_id = p.product_id 
                    WHERE pf.user_id = ?`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, [userId], (error, results, fields) => {
                if (error) {
                    throw new Error(error);
                }

                this.dbData = results;
                resolve(this.dbData);

            });
            connection.end();
        });
    }
}