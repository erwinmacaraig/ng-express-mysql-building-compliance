import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class LocationAccountUser extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_account_user_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Record not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_account_user_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM location_account_user WHERE location_account_user_id = ? LIMIT 1`;
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

    public getMany(arrWhere){
      return new Promise((resolve, reject) => {
            let sql_load = '',
              sqlWhere = '',
              count = 0,
              param = [];

            sql_load = ` SELECT l.*, lau.user_id, lau.account_id, lau.role_id, lau.location_account_user_id
              FROM locations l 
              LEFT JOIN location_account_user lau ON l.location_id = lau.location_id
              LEFT JOIN users u ON lau.user_id = u.user_id  `;

            for(let i in arrWhere){
              if(count == 0){
                sqlWhere += ' WHERE ';
              }else{
                sqlWhere += ' AND ';
              }

              sqlWhere += 'lau.'+arrWhere[i][0]+' ';

              if( typeof arrWhere[i][1] !== undefined ){
                sqlWhere += arrWhere[i][1]+' ';
              }

              if( typeof arrWhere[i][2] !== undefined ){
                sqlWhere += ' ? ';
                param.push(arrWhere[i][2]);
              }
              count++;
            }

            if(arrWhere.length > 0){
              sqlWhere += ' AND l.archived = 0 AND u.archived = 0 ';
            }else{
              sqlWhere += ' WHERE l.archived = 0 AND u.archived = 0 ';
            }

            sql_load += sqlWhere;

            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                reject(error);
                return console.log(error);
              }
              this.dbData = results;
              resolve(this.dbData);
            });
            connection.end();
        });
    }

    public getByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id = ?';
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length) {
                reject('Record not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['location_account_user_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE account_id = ?';
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Record not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_account_user_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByLocationIdAndUserId(locationIds, userId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE location_id IN (?) AND user_id = ?';
            const param = [locationIds, userId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              //
              if (!results.length) {
                reject('No record found');
              } else {
                this.dbData = results;
                resolve(this.dbData);
              }
              //
            });
            connection.end();
        });
    }

    public getWardensByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT u.*, er.role_name, lau.location_id, er.em_roles_id, er.is_warden_role
                  FROM users u
                  LEFT JOIN user_em_roles_relation uem ON uem.user_id = u.user_id
                  LEFT JOIN em_roles er ON uem.em_role_id = er.em_roles_id
                  LEFT JOIN location_account_user lau ON lau.user_id = u.user_id
                  WHERE u.account_id = ? AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Record not found');
              }else{
                this.dbData = results;
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getFrpTrpByAccountId(accountId: Number){
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT ur.role_id, u.*, lau.location_id
                FROM location_account_user lau
                  INNER JOIN users u
                    ON lau.user_id = u.user_id
                  INNER JOIN user_role_relation ur
                    ON ur.user_id = u.user_id
                  WHERE lau.account_id = ? AND u.archived = 0 GROUP BY u.user_id`;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Record not found');
              }else{
                this.dbData = results;
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByUserId(UserId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_user WHERE user_id = ?';
            const param = [UserId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
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
          const sql_update = `UPDATE location_account_user SET
                location_id = ?, account_id = ?, user_id = ?, role_id = ?, archived = ?
                WHERE location_account_user_id = ? `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : 0,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
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
          const sql_insert = `INSERT INTO location_account_user (
            location_id,
            account_id,
            user_id,
            role_id
          ) VALUES (?,?,?,?)
          `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
            ('role_id' in this.dbData) ? this.dbData['role_id'] : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['location_account_user_id'] = this.id;
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
            if ('location_account_user_id' in createData) {
              this.id = createData.location_account_user_id;
            }
            resolve(this.write());
        });
    }

}
