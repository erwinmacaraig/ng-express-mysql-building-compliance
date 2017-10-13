import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class Token extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM token WHERE token_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Token not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['token_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByToken(token:String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM token WHERE token = ?';
            const param = [token];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Token not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['token_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE token SET token = ?, user_id = ?, action = ? WHERE token_id = ? `;
          const token = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('token' in this.dbData) ? this.dbData['token'] : 0,
            ('action' in this.dbData) ? this.dbData['action'] : ""
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, token, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['token_id'] = this.id;
            resolve(true);
          });
          connection.end();

        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
          const sql_insert = `INSERT INTO token (
            user_id,
            token,
            action
          ) VALUES (?, ?, ?)
          `;
          const token = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('token' in this.dbData) ? this.dbData['token'] : 0,
            ('action' in this.dbData) ? this.dbData['action'] : ""
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, token, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['token_id'] = this.id;
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
            if ('token_id' in createData) {
              this.id = createData.token_id;
            }
            resolve(this.write());
        });
    }

}