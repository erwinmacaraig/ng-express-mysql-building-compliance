import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';

export class UserEmRoleRelation extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM user_em_roles_relation WHERE user_em_roles_relation_id = ?';
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
                    this.setID(results[0]['user_em_roles_relation_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getEmRolesByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT
                      uer.user_em_roles_relation_id,
                      er.role_name,
                      er.is_warden_role,
                      uer.location_id,
                      er.em_roles_id
                    FROM em_roles er
                    INNER JOIN user_em_roles_relation uer ON er.em_roles_id = uer.em_role_id
                    WHERE uer.user_id = ?`;
            const uid = [userId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if(!results.length){
                    reject('No role found');
                }else{
                    this.dbData = results;
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getEmRoles() {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM em_roles`;
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

    public dbInsert() {
        return new Promise((resolve, reject) => {
            const sql_insert = `INSERT INTO user_em_roles_relation (
            user_id,
            em_role_id,
            location_id
            ) VALUES (?, ?, ?)
            `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('em_role_id' in this.dbData) ? this.dbData['em_role_id'] : null,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : null
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
            const sql_update = `UPDATE user_em_roles_relation SET user_id = ?, em_role_id = ?, location_id = ? WHERE user_em_roles_relation_id = ? `;
            const user = [
            ('user_id' in this.dbData) ? this.dbData['user_id'] : null,
            ('em_role_id' in this.dbData) ? this.dbData['em_role_id'] : null,
            ('location_id' in this.dbData) ? this.dbData['location_id'] : null,
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
            if ('user_em_roles_relation_id' in createData) {
                this.id = createData.user_em_roles_relation_id;
            }
            resolve(this.write());
        });
    }

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM user_em_roles_relation WHERE user_em_roles_relation_id = ? LIMIT 1`;
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

}
