import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class Product extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }

  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM products WHERE product_id = ?`;
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_load, [this.id], (error, results, fields) => {
          if (error) {
            console.log('product.model.ts', error);
            throw new Error(error);
          }
          if (!results.length) {
            reject(`Product with id ${this.id} not found.`);
          } else {
            this.dbData = results[0];
            this.setID(results[0]['product_id']);
            resolve(this.dbData);
          }
        });
        connection.release();

      });
      
    });
  }

  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE
                            products
                          SET
                            product_code = ?,
                            product_type = ?,
                            amount = ?,
                            product_desc = ?,
                            product_image = ?,
                            product_title = ?,
                            product_timestamp = ?,
                            archived = ?,
                            months_of_validity = ?
                          WHERE product_id = ?`;
      const product = [
        ('product_code' in this.dbData) ? this.dbData['product_code'] : null,
        ('product_type' in this.dbData) ? this.dbData['product_type'] : null,
        ('amount' in this.dbData) ? this.dbData['amount'] : '0.00',
        ('product_desc' in this.dbData) ? this.dbData['product_desc'] : null,
        ('product_image' in this.dbData) ? this.dbData['product_image'] : null,
        ('product_title' in this.dbData) ? this.dbData['product_title'] : null,
        ('product_timestamp' in this.dbData) ? this.dbData['product_timestamp'] : null,
        ('archived' in this.dbData) ? this.dbData['archived'] : 0,
        ('months_of_validity' in this.dbData) ? this.dbData['months_of_validity'] : 12,
        this.ID() ? this.ID() : 0
      ];

      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_update, product, (error, results, fields) => {
          if (error) {
            console.log('product.model', error);
            throw new Error(error);
          }
          resolve(true);
        });
        connection.release();

      });
      
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const insert_sql = `INSERT INTO products (
        product_code,
        product_type,
        amount,
        product_desc,
        product_image,
        product_title,
        product_timestamp,
        archived,
        months_of_validity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const product = [
        ('product_code' in this.dbData) ? this.dbData['product_code'] : null,
        ('product_type' in this.dbData) ? this.dbData['product_type'] : null,
        ('amount' in this.dbData) ? this.dbData['amount'] : '0.00',
        ('product_desc' in this.dbData) ? this.dbData['product_desc'] : null,
        ('product_image' in this.dbData) ? this.dbData['product_image'] : null,
        ('product_title' in this.dbData) ? this.dbData['product_title'] : null,
        ('product_timestamp' in this.dbData) ? this.dbData['product_timestamp'] : null,
        ('archived' in this.dbData) ? this.dbData['archived'] : 0,
        ('months_of_validity' in this.dbData) ? this.dbData['months_of_validity'] : 12
      ];
      
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(insert_sql, product, (error, results, fields) => {
          if (error) {
            throw new Error(error);
          }
          this.id = results.insertId;
          this.dbData['product_id'] = results.insertId;
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
      if ('product_id' in createData) {
        this.id = createData['product_id'];
      }
      resolve(this.write());
    });
  }

  public listProducts(filter?: any) {
    return new Promise((resolve, reject) => {
      const sql_list = `SELECT * FROM products WHERE archived = 0`;
      this.pool.getConnection((err, connection) => {
        if(err){
          throw new Error(err);
        }

        connection.query(sql_list, [], (error, results, fields) => {
          if (error) {
            console.log('product.model', error);
            throw new Error(error);
          }
          if (!results.length) {
            reject(`Product listing empty.`);
          } else {
            resolve(results);
          }
        });
        connection.release();

      });
      
    });
  }
}
