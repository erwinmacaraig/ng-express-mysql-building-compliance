import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class Location extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM locations WHERE location_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Location not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = `
                SELECT
                    lar.location_account_relation_id,
                    lar.responsibility,
                    l.*
                FROM locations l
                LEFT JOIN location_account_relation lar
                ON l.location_id = lar.location_id
                WHERE lar.account_id = ? AND l.archived = 0 AND l.parent_id = -1
                ORDER BY l.location_id ASC
            `;
            const param = [accountId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Location not found');
              }else{
                this.dbData = results;
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE locations SET
            parent_id = ?, name = ?, unit = ?, street = ?, city = ?, state = ?,
            postal_code = ?, country = ?, time_zone = ?, \`order\` = ?,
            is_building = ?, location_directory_name = ?, archived = ?  
            WHERE location_id = ?`;
          const param = [
            ('parent_id' in this.dbData) ? this.dbData['parent_id'] : 0,
            ('name' in this.dbData) ? this.dbData['name'] : '',
            ('unit' in this.dbData) ? this.dbData['unit'] : ' ',
            ('street' in this.dbData) ? this.dbData['street'] : '',
            ('city' in this.dbData) ? this.dbData['city'] : '',
            ('state' in this.dbData) ? this.dbData['state'] : '',
            ('postal_code' in this.dbData) ? this.dbData['postal_code'] : '',
            ('country' in this.dbData) ? this.dbData['country'] : '',
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('order' in this.dbData) ? this.dbData['order'] : null,
            ('is_building' in this.dbData) ? this.dbData['is_building'] : 0,
            ('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            this.ID() ? this.ID() : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_update, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['location_id'] = this.id;
            resolve(true);
          });
          connection.end();

        });
    }

    public dbInsert() {
        return new Promise((resolve, reject) => {
          const sql_insert = 'INSERT INTO locations (`parent_id`, `name`, `unit`, `street`, `city`, `state`, `postal_code`, `country`, `time_zone`, `order`, `is_building`, `location_directory_name`, `archived`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
          const param = [
            ('parent_id' in this.dbData) ? this.dbData['parent_id'] : 0,
            ('name' in this.dbData) ? this.dbData['name'] : '',
            ('unit' in this.dbData) ? this.dbData['unit'] : ' ',
            ('street' in this.dbData) ? this.dbData['street'] : '',
            ('city' in this.dbData) ? this.dbData['city'] : '',
            ('state' in this.dbData) ? this.dbData['state'] : '',
            ('postal_code' in this.dbData) ? this.dbData['postal_code'] : '',
            ('country' in this.dbData) ? this.dbData['country'] : '',
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
            ('order' in this.dbData) ? this.dbData['order'] : null,
            ('is_building' in this.dbData) ? this.dbData['is_building'] : 0,
            ('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['location_id'] = this.id;
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
            if ('location_id' in createData) {
              this.id = createData.location_id;
            }
            resolve(this.write());
        });
    }

}