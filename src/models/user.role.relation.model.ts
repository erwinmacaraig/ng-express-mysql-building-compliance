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
        if(!results.length){
          reject('No role found');
        }else{
          this.dbData = results[0];
          this.setID(results[0]['user_role_relation_id']);
          resolve(this.dbData);
        }
      });
      connection.end();
    });
  }

  public getByUserId(user_id) {
    return new Promise((resolve, reject) => {
      const sql_load = 'SELECT * FROM user_role_relation WHERE user_id = ?';
      const param = [user_id];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_load, param, (error, results, fields) => {
        if (error) {
          return console.log(error);
        }
        if(!results.length){
          reject('No role found');
        }else{
          this.dbData = results[0];
          this.setID(results[0]['user_role_relation_id']);
          resolve(this.dbData);
        }
      });
      connection.end();
    });
  }

 	public dbInsert() {
 		return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO user_role_relation (
        user_id,
        role_id,
        location_id
      ) VALUES (?, ?, ?)
      `;
      const user = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
        ('role_id' in this.dbData) ? this.dbData['role_id'] : null,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_insert, user, (err, results, fields) => {
        if (err) {
          throw new Error(err);
        }
        resolve(true);
      });
      connection.end();

    });
 	}

 	public dbUpdate() {
 		return new Promise((resolve, reject) => {
      const sql_update = `UPDATE user_role_relation SET user_id = ?, role_id = ?, location_id = ? WHERE user_role_relation_id = ? `;
      const user = [
        ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
        ('role_id' in this.dbData) ? this.dbData['role_id'] : null,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        this.ID() ? this.ID() : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, user, (err, results, fields) => {
        if (err) {
          throw new Error(err);
        }
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