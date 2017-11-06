import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class SecurityAnswers extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM security_answer WHERE security_answer_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Answer not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['security_question_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByQuestionId(qID:Number) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM security_answer WHERE security_question_id = ?  ',
               param = [qID];

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Answer not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['security_answer_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByUserId(userId:Number) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM security_answer WHERE user_id = ? ',
               param = [userId];

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Answer not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['security_answer_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE security_answer SET security_question_id = ?, answer = ?,  user_id = ? WHERE security_answer_id = ? `;
          const param = [
            ('security_question_id' in this.dbData) ? this.dbData['security_question_id'] : 0,
            ('answer' in this.dbData) ? this.dbData['answer'] : '',
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            this.ID() ? this.ID() : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, param, (err, results, fields) => {
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
          const sql_insert = `INSERT INTO security_answer (security_question_id, answer, user_id) VALUES (?, ?, ?)`;
          const param = [
            ('security_question_id' in this.dbData) ? this.dbData['security_question_id'] : 0,
            ('answer' in this.dbData) ? this.dbData['answer'] : '',
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['security_answer_id'] = this.id;
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
            if ('security_answer_id' in createData) {
              this.id = createData.security_answer_id;
            }
            resolve(this.write());
        });
    }

}