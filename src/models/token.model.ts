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

    public delete() {
      return new Promise((resolve, reject) => {
        const sql_del = `DELETE FROM token WHERE token_id = ? LIMIT 1`;
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

    public getkUserVerified(userId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM token WHERE user_id = ? AND verified = 1';
            const param = [userId];

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
          const sql_update = `UPDATE token SET user_id = ?, token = ?, action = ?, verified = ?, expiration_date = ? WHERE token_id = ? `;
          const token = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('token' in this.dbData) ? this.dbData['token'] : 0,
            ('action' in this.dbData) ? this.dbData['action'] : "",
            ('verified' in this.dbData) ? this.dbData['verified'] : 0,
            ('expiration_date' in this.dbData) ? this.dbData['expiration_date'] : '',
            this.ID() ? this.ID() : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, token, (err, results, fields) => {
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
          const sql_insert = `INSERT INTO token (
            user_id,
            token,
            action,
            verified,
            expiration_date
          ) VALUES (?, ?, ?, ?, ?)
          `;
          const token = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('token' in this.dbData) ? this.dbData['token'] : 0,
            ('action' in this.dbData) ? this.dbData['action'] : "",
            ('verified' in this.dbData) ? this.dbData['verified'] : 0,
            ('expiration_date' in this.dbData) ? this.dbData['expiration_date'] : ''
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

    /**
     * To generate random characters
     * @return {String} characters
     */
    public generateRandomChars(length){
      let chars = 'ABCDEFGHIJKKLMNOPQRSTUVWXYZ0987654321',
        len = (typeof length == 'number') ? length : 15,
        responseCode = '';

      for(let i=0; i<=len; i++){
        responseCode += chars[ Math.floor(Math.random() * chars.length) ];
      }

      return responseCode;
    }

}
