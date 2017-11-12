import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class InvitationCode extends BaseClass {
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }
    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM invitation_codes WHERE invitation_code_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Invitation code not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['invitation_code_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end method load

    public getInvitationByCode(code: string, used?: boolean) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM invitation_codes WHERE code = ?';
            const param = [code];
            if (!used) {
              sql_load = sql_load + ' AND was_used = 0';
            }
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length) {
                reject('Invitation code not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['invitation_code_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end getInvitationByCode method

    public getInvitationByAccountId(accountId:Number, roleId?: Number) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM invitation_codes WHERE account_id = ?';
            const param = [];
            param.push(accountId);
            if (roleId) {
              sql_load = sql_load + ' AND role_id = ?';
              param.push(roleId);
            }
            
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length) {
                reject('Invitation code not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['invitation_code_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end getInvitationByCode method

    public getWhere(where:Object){
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM invitation_codes ';
            let whereString = '';
            const param = [];
            
            let count = 0;
            for(let i in where){

                if(count == 0){
                    whereString += ' WHERE ';
                }else{
                    whereString += ' AND ';
                }

                whereString += ' '+where[i][0];

                if( where[i].hasOwnProperty(2) ){
                    whereString += ' '+where[i][1]+' ? ';
                    param.push( where[i][2] );
                }

                count++;
            }

            sql_load += whereString;
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length) {
                reject('Invitation code not found');
              } else {
                this.dbData = results;
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `
                UPDATE
                    invitation_codes
                SET
                    code = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    location_id = ?,
                    account_id = ?,
                    role_id = ?,
                    was_used = ?
                WHERE
                    invitation_code_id = ?
            `;
            const values = [
                ('code' in this.dbData) ? this.dbData['code'] : '',
                ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
                ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
                ('email' in this.dbData) ? this.dbData['email'] : '',
                ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('role_id' in this.dbData) ? this.dbData['role_id'] : 0,
                ('was_used' in this.dbData) ? this.dbData['was_used'] : 0,
                this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, values, (err, results, fields) => {
              if (err) {
                throw new Error(err);
              }
              this.id = results.insertId;
              this.dbData['invitation_code_id'] = this.id;
              resolve(true);
            });
            connection.end();

        }); // end of Promise
    } // end of dbUpdate method

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO invitation_codes (
                code,
                first_name,
                last_name,
                email,
                location_id,
                account_id,
                role_id,
                was_used
            ) VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )`;
            const values = [
                ('code' in this.dbData) ? this.dbData['code'] : '',
                ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
                ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
                ('email' in this.dbData) ? this.dbData['email'] : '',
                ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('role_id' in this.dbData) ? this.dbData['role_id'] : 0,
                ('was_used' in this.dbData) ? this.dbData['was_used'] : 0,
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, values, (err, results, fields) => {
              if (err) {
                throw new Error(err);
              }
              this.id = results.insertId;
              this.dbData['invitation_code_id'] = this.id;
              resolve(true);
            });
            connection.end();

        }); //end Promise
    } // end dbInsert method

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('invitation_code_id' in createData) {
              this.id = createData.invitation_code_id;
            }
            resolve(this.write());
        });
    } // end create

} // end class
