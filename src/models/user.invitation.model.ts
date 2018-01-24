import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class UserInvitation extends BaseClass {
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }
    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM user_invitations WHERE user_invitations_id = ?';
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
                this.setID(results[0]['user_invitations_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end method load

    public getInvitationByCode(code: string, used?: boolean) {
        return new Promise((resolve, reject) => {
            let sql_load = `SELECT * from user_invitations
            INNER JOIN token ON user_invitations.user_invitations_id = token.id WHERE token = ?;
            `;
            const param = [code];
            if (!used) {
              sql_load = sql_load + ' AND was_used = 0';
            }
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                console.log(error);
                throw new Error(error);
              }
              console.log(results);
              if (!results.length) {
                reject('Invitation code not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['user_invitations_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end getInvitationByCode method

    public getManyInvitationByCode(code: string, used?: boolean) {
        return new Promise((resolve, reject) => {
            let sql_load = `SELECT * from user_invitations
            INNER JOIN token ON user_invitations.user_invitations_id = token.id WHERE token = ?`;
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
                this.dbData = results;
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end getInvitationByCode method

    public getInvitationByAccountId(accountId:Number, roleId?: Number) {
        return new Promise((resolve, reject) => {
            let sql_load = 'SELECT * FROM user_invitations WHERE account_id = ?';
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
                this.setID(results[0]['user_invitations_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    } // end getInvitationByCode method

    public getWhere(where:Object){
        return new Promise((resolve, reject) => {
            let sql_load = `
                SELECT ui.*, l.name as location_name, lp.name as parent_name  
                FROM user_invitations ui INNER JOIN locations l  ON ui.location_id = l.location_id
                LEFT JOIN locations lp  ON l.parent_id = lp.location_id
            `;
            let whereString = '';
            const param = [];

            let count = 0;
            for(let i in where){

                if(count == 0){
                    whereString += ' WHERE ';
                }else{
                    whereString += ' AND ';
                }

                whereString += ' ui.'+where[i][0];

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
                  user_invitations
                SET
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    location_id = ?,
                    account_id = ?,
                    role_id = ?,
                    eco_role_id = ?,
                    mobility_impaired = ?,
                    contact_number = ?,
                    phone_number = ?,
                    invited_by_user = ?,
                    was_used = ?
                WHERE
                    user_invitations_id = ?
            `;
            const values = [
                ('first_name' in this.dbData) ? this.dbData['first_name'] : null,
                ('last_name' in this.dbData) ? this.dbData['last_name'] : null,
                ('email' in this.dbData) ? this.dbData['email'] : null,
                ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('role_id' in this.dbData) ? this.dbData['role_id'] : 0,
                ('eco_role_id' in this.dbData) ? this.dbData['eco_role_id'] : 0,
                ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : 0,
                ('contact_number' in this.dbData) ? this.dbData['contact_number'] : '',
                ('phone_number' in this.dbData) ? this.dbData['phone_number'] : null,
                ('invited_by_user' in this.dbData) ? this.dbData['invited_by_user'] : 0,
                ('was_used' in this.dbData) ? this.dbData['was_used'] : 0,
                this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, values, (err, results, fields) => {
              if (err) {
                throw new Error(err);
              }
              this.id = results.insertId;
              this.dbData['user_invitations_id'] = this.id;
              resolve(true);
            });
            connection.end();

        }); // end of Promise
    } // end of dbUpdate method

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO user_invitations (
                first_name,
                last_name,
                email,
                location_id,
                account_id,
                role_id,
                eco_role_id,
                mobility_impaired,
                contact_number,
                phone_number,
                invited_by_user,
                was_used
            ) VALUES (
                ?,
                ?,
                ?,
                ?,
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
                ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
                ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
                ('email' in this.dbData) ? this.dbData['email'] : '',
                ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
                ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
                ('role_id' in this.dbData) ? this.dbData['role_id'] : 0,
                ('eco_role_id' in this.dbData) ? this.dbData['eco_role_id'] : 0,
                ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : 0,
                ('contact_number' in this.dbData) ? this.dbData['contact_number'] : '',
                ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
                ('invited_by_user' in this.dbData) ? this.dbData['invited_by_user'] : 0,
                ('was_used' in this.dbData) ? this.dbData['was_used'] : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, values, (err, results, fields) => {
              if (err) {
                console.log(sql_insert);
                throw new Error(err);
              }
              this.id = results.insertId;
              this.dbData['user_invitations_id'] = this.id;
              resolve(true);
            });
            connection.end();

        }); // end Promise
    } // end dbInsert method

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
              this.dbData[key] = createData[key];
            }
            if ('user_invitations_id' in createData) {
              this.id = createData.user_invitations_id;
            }
            resolve(this.write());
        });
    } // end create

    public delete() {
      return new Promise((resolve, reject) => {
        const sql_delete = `DELETE FROM user_invitations WHERE user_invitations_id = ?`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_delete, [this.ID()], (err, results, fields) => {
          if (err) {
            console.log(sql_delete, err);
            throw new Error(err);
          } else {
            resolve(true);
          }
        });
        connection.end();
      });
    }

} // end class
