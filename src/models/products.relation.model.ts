import { BaseClass } from './base.model';
import * as db from 'mysql2';
import { Product } from './product.model';
import * as Promise from 'promise';


const dbconfig = require('../config/db');

export class ProductsRelationModel extends BaseClass{
	
	constructor(id?:number){
		super();
		if(id){
			this.id = id;
		}
	}

	public load(){
		return new Promise((resolve, reject) => {
			const sql_load = `SELECT * FROM products_relation WHERE products_relation_id = ?`;
			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql_load, [this.id], (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }
                    if (!results.length) {
                        reject(`Product relation not found.`);
                    } else {
                        this.dbData = results[0];
                        this.setID(results[0]['products_relation_id']);
                        resolve(this.dbData);
                    }
                });
                connection.release();
            });
			
		});
	}

	public create(createData){
		return new Promise((resolve, reject) => {
			for (const key in createData) {
				this.dbData[key] = createData[key];
			}
			if ('products_relation_id' in createData) {
				this.id = createData['products_relation_id'];
			}
			resolve(this.write());
		});
	}

	public dbInsert(){
		return new Promise((resolve, reject) => {

			const sql = `INSERT INTO products_relation (
					parent_product_id,
					product_id
				) VALUES (?, ?)`;

			const data = [
				('parent_product_id' in this.dbData) ? this.dbData['parent_product_id'] : 0,
				('product_id' in this.dbData) ? this.dbData['product_id'] : 0
			];

			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql, data, (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }
                    this.id = results.insertId;
                    this.dbData['products_relation_id'] = results.insertId;
                    resolve(this.id);
                });
                connection.release();
            });
			

		});
	}

	public dbUpdate(){
 		return new Promise((resolve, reject) => {

			const sql = `UPDATE products_relation SET
				parent_product_id = ?, product_id = ? 
				WHERE products_relation_id = ?`;

			const data = [
				('parent_product_id' in this.dbData) ? this.dbData['parent_product_id'] : 0,
				('product_id' in this.dbData) ? this.dbData['product_id'] : 0,
				(this.ID()) ? this.ID() : 0
			];

			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql, data, (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }    
                    resolve(true);
                });
                connection.release();
            });
			

		});
	}

	public getWhere(arrWhere){

		return new Promise((resolve, reject) => {
			let sql = `SELECT * FROM products_relation`,
				where = '';
			
			if(arrWhere){
				for(let i in arrWhere){
					if( parseInt(i) == 0 ){
						where += ' WHERE ';
					}else{
						where += ' AND ';
					}

					where += arrWhere[i]+' ';
				}
			}

			sql = sql+' '+where;

			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }

                    this.dbData = results;
                    resolve(this.dbData);

                });
                connection.release();
            });
			
		});
	}

	public getProductsFromParentId(parentId){
		return new Promise((resolve, reject) => {
			let sql = `
				SELECT p.*, pr.parent_product_id
				FROM products_relation pr
				INNER JOIN products p ON pr.product_id = p.product_id
				WHERE pr.parent_product_id = `+parentId;

			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }

                    this.dbData = results;
                    resolve(this.dbData);
                });
                connection.release();
            });
			
		});
	}

	public getPackagesAndProducts(){

		return new Promise((resolve, reject) => {
			let sql = `SELECT * FROM products WHERE product_type = "package" AND archived = 0 `;
			this.pool.getConnection((err, connection) => {
                if(err){
                  throw new Error(err);
                }

                connection.query(sql, (error, results, fields) => {
                    if (error) {
                        throw new Error(error);
                    }

                    let promises = [];

                    for(let i in results){
                        results[i]['products'] = [];
                        promises.push(this.getProductsFromParentId(results[i]['product_id']));
                    }

                    Promise.all(promises).then((productsResults) => {
                        productsResults.forEach((products) => {

                            for(let prod of products){
                                for(let i in results){
                                    if(results[i]['product_id'] == prod.parent_product_id){
                                        results[i]['products'].push(prod);
                                    }
                                }
                            }

                            this.dbData = results;
                            resolve(this.dbData);
                        });
                    });

                    if(results.length == 0){
                        this.dbData = results;
                        resolve(this.dbData);
                    }

                });
                connection.release();
            });
			
		});
	}

}