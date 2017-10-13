import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class UserRoleRelation extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
    	return new Promise((resolve, reject) => {
	        const sql_load = 'SELECT * FROM user_role_relation WHERE user_role_relation_id = ?';
	        const uid = [this.id];
	        const connection = db.createConnection(dbconfig);
	        connection.query(sql_load, uid, (error, results, fields) => {
	          if (error) {
	            return console.log(error);
	          }
	          this.dbData = results[0];
	          resolve(this.dbData);
	        });
	        connection.end();
	    });
    }

 	public dbInsert() {
 		return new Promise((resolve, reject) => {
          const sql_insert = `INSERT INTO user_role_relation (
            user_id,
            role_id
          ) VALUES (?, ?)
          `;
          const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : null
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, user, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['user_role_relation_id'] = this.id;
            resolve(true);
          });
          connection.end();

        });
 	}

 	public dbUpdate() {
 		return new Promise((resolve, reject) => {
          const sql_update = `UPDATE user_role_relation SET user_id = ?, role_id = ? WHERE user_role_relation_id = ? `;
          const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : null
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, user, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['user_role_relation_id'] = this.id;
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
        if ('user_role_relation_id' in createData) {
          this.id = createData.user_role_relation_id;
        }
        resolve(this.write());
      });
 	}   

}