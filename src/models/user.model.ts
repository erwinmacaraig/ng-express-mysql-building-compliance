import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
import * as validator from 'validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';

export class User extends BaseClass {

    public static getByToken(token: string) {
        return new Promise((resolve, reject) => {
            const parts = token.split(' ');

            if (parts.length === 2 && parts[0] === 'Bearer') {
                try {
                    const decoded = jwt.verify(parts[1], process.env.KEY);
                    console.log(decoded);
                    const sql_load = 'SELECT * FROM users WHERE user_id = ? AND token = ?';
                    const val = [decoded.user, decoded.user_db_token];
                    const connection = db.createConnection(dbconfig);
                    connection.query(sql_load, val, (error, results, fields) => {
                        if (error) {
                            throw error;
                        }
                        if (!results.length) {
                            reject('No user found');
                        } else {
                            resolve(results[0]);
                        }
                    });
                    connection.end();
                } catch (e) {
                    return reject('Not Authenticated');
                }
            }
        });
    }

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE user_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    throw error;
                }
                if (!results.length) {
                    reject('No user found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getByEmail(email: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE email = ?';
            const param = [email];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                if (!results.length) {
                    reject('No user found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getByUsername(username: String) {
        console.log(username);
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE user_name = ?';
            const param = [username];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                if (!results.length) {
                    reject('No user found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['user_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    loadByCredentials(username: string, passwd: string) {
        return new Promise((resolve, reject) => {
            let whereClause = '';
            if (validator.isEmail(username)) {
                whereClause = 'WHERE email = ?';
            } else {
                whereClause = 'WHERE user_name = ?';
            }
            const sql_user = `SELECT users.* FROM users
                              INNER JOIN token ON users.user_id = token.user_id `
                              + whereClause + ` AND password = ?
                              AND users.token <> '' AND users.token IS NOT NULL
                              AND token.verified = 1`;
            const newPasswd = md5('Ideation' + passwd + 'Max');
            const credential = [username, newPasswd];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_user, credential, (error, results, fields) => {
                if (error) {
                    console.log(sql_user);
                    throw error;
                }
                if (!results.length) {
                    reject('Invalid user');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0].user_id);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO users (
            first_name,
            last_name,
            email,
            phone_number,
            mobile_number,
            occupation,
            mobility_impaired,
            time_zone,
            can_login,
            password,
            account_id,
            last_login,
            evac_role,
            invitation_date,
            add_to_location,
            token,
            approved_license_agreement,
            logged_in,
            archived,
            must_change_password,
            user_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const user = [
            ('first_name' in this.dbData) ? this.dbData['first_name'] : '',
            ('last_name' in this.dbData) ? this.dbData['last_name'] : '',
            ('email' in this.dbData) ? this.dbData['email'] : '',
            ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
            ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : ' ',
            ('occupation' in this.dbData) ? this.dbData['occupation'] : '',
            ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : '0',
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('can_login' in this.dbData) ? this.dbData['can_login'] : '0',
            ('password' in this.dbData) ? this.dbData['password'] : '',
            ('account_id' in this.dbData) ? this.dbData['account_id'] : '0',
            ('last_login' in this.dbData) ? this.dbData['last_login'] : null,
            ('evac_role' in this.dbData) ? this.dbData['evac_role'] : '',
            ('invitation_date' in this.dbData) ? this.dbData['invitation_date'] : null,
            ('add_to_location' in this.dbData) ? this.dbData['add_to_location'] : '0',
            ('token' in this.dbData) ? this.dbData['token'] : null,
            ('approved_license_agreement' in this.dbData) ? this.dbData['approved_license_agreement'] : '0',
            ('logged_in' in this.dbData) ? this.dbData['logged_in'] : '0',
            ('archived' in this.dbData) ? this.dbData['archived'] : '0',
            ('must_change_password' in this.dbData) ? this.dbData['must_change_password'] : '0',
            ('user_name' in this.dbData) ? this.dbData['user_name'] : null
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['user_id'] = this.id;
                resolve(true);
            });
            connection.end();

        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE users SET
            first_name = ?,
            last_name = ?,
            email = ?,
            phone_number = ?,
            mobile_number = ?,
            occupation = ?,
            mobility_impaired = ?,
            time_zone = ?,
            can_login = ?,
            password = ?,
            account_id = ?,
            last_login = ?,
            evac_role = ?,
            invitation_date = ?,
            add_to_location = ?,
            token = ?,
            approved_license_agreement = ?,
            logged_in = ?,
            archived = ?,
            must_change_password = ?,
            user_name = ?
            WHERE user_id = ?
            `;
            const user = [
            ('first_name' in this.dbData) ? this.dbData['first_name'] : null,
            ('last_name' in this.dbData) ? this.dbData['last_name'] : null,
            ('email' in this.dbData) ? this.dbData['email'] : '',
            ('phone_number' in this.dbData) ? this.dbData['phone_number'] : '',
            ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : '',
            ('occupation' in this.dbData) ? this.dbData['occupation'] : '',
            ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : '0',
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('can_login' in this.dbData) ? this.dbData['can_login'] : '0',
            ('password' in this.dbData) ? this.dbData['password'] : null,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('last_login' in this.dbData) ? this.dbData['last_login'] : null,
            ('evac_role' in this.dbData) ? this.dbData['evac_role'] : null,
            ('invitation_date' in this.dbData) ? this.dbData['invitation_date'] : null,
            ('add_to_location' in this.dbData) ? this.dbData['add_to_location'] : null,
            ('token' in this.dbData) ? this.dbData['token'] : null,
            ('approved_license_agreement' in this.dbData) ? this.dbData['approved_license_agreement'] : null,
            ('logged_in' in this.dbData) ? this.dbData['logged_in'] : '0',
            ('archived' in this.dbData) ? this.dbData['archived'] : '0',
            ('must_change_password' in this.dbData) ? this.dbData['must_change_password'] : '0',
            ('user_name' in this.dbData) ? this.dbData['user_name'] : null,
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, user, (err, results, fields) => {
                if (err) {
                    throw new Error(err + ' ' + sql_update);
                }
                resolve(true);
            });
            connection.end();
        }); // end Promise
    }

    public create(createData) {
        return new Promise((resolve, reject) => {
            for (let key in createData ) {
                this.dbData[key] = createData[key];
            }
            if ('user_id' in createData) {
                this.id = createData.user_id;
            }
            resolve(this.write());
        });
    }

    public getAll(limit:number, orderBy:String, order:String){
        return new Promise((resolve, reject) => {
            limit = (limit) ? limit : 25;
            orderBy = (orderBy) ? orderBy : 'user_id';
            order = (order) ? order : 'DESC';
            const sql_load = "SELECT * FROM users ORDER BY "+orderBy+" "+order+" LIMIT "+limit+"";
            const param = [ ];
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

}
