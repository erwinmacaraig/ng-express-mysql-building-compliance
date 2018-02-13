import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class DiagramFinishModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM diagram_finish WHERE diagram_finish_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length){
                    reject('Diagram finish not found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['diagram_finish_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE diagram_finish SET name = ? WHERE diagram_finish_id = ? `;
            const param = [
            ('name' in this.dbData) ? this.dbData['name'] : '',
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
            const sql_insert = `INSERT INTO diagram_finish (name) VALUES (?)`;
            const param = [ ('name' in this.dbData) ? this.dbData['lead'] : '' ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_insert, param, (err, results, fields) => {

                if (err) {
                    reject(err);
                    throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['diagram_finish_id'] = this.id;
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
            if ('diagram_finish_id' in createData) {
                this.id = createData.diagram_finish_id;
            }
            resolve(this.write());
        });
    }

    public getAll() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM diagram_finish ORDER BY diagram_finish_id ASC';
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


}
