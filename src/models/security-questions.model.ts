import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class SecurityQuestions extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM security_question WHERE security_question_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Question not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['security_question_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getAll() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM security_question';
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE security_question SET question = ? WHERE security_question_id = ? `;
          const token = [
            ('question' in this.dbData) ? this.dbData['question'] : '',
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
          const sql_insert = `INSERT INTO security_question (question) VALUES (?)`;
          const token = [
            ('question' in this.dbData) ? this.dbData['user_id'] : ''
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, token, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['security_question_id'] = this.id;
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
            if ('security_question_id' in createData) {
              this.id = createData.security_question_id;
            }
            resolve(this.write());
        });
    }

}