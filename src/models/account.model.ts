import { EncryptDecrypt } from './../ng/app/services/encrypt.decrypt';
import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class Account extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM accounts WHERE account_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if (!results.length){
                reject('Account not found');
              } else {
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByUserId(userId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT accounts.* FROM accounts INNER JOIN users ON accounts.account_id = users.account_id WHERE users.user_id = ?';
            const param = [userId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Account not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByAccountCode(code: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM accounts WHERE account_code = ?';
            const param = [code];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Account not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['account_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public searchByAccountName(name: String) {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM accounts WHERE account_name LIKE "%`+name+`%" AND archived = 0 ORDER BY account_name ASC `;
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
          const sql_update = `UPDATE accounts SET
                lead = ?, online_training = ?, account_name = ?, building_number = ?,
                billing_unit = ?, billing_street = ?, billing_city = ?,
                billing_state = ?, billing_postal_code = ?, billing_country = ?,
                location_id = ?, account_type = ?, account_directory_name = ?,
                archived = ?, block_access = ?, account_code = ?,
                default_em_role = ?, epc_committee_on_hq = ?, trp_code = ?, account_domain = ?,
                key_contact = ?, time_zone = ?
                WHERE account_id = ? `;
          const param = [
            ('lead' in this.dbData) ? this.dbData['lead'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            ('account_name' in this.dbData) ? this.dbData['account_name'] : "",
            ('building_number' in this.dbData) ? this.dbData['building_number'] : "",
            ('billing_unit' in this.dbData) ? this.dbData['billing_unit'] : "",
            ('billing_street' in this.dbData) ? this.dbData['billing_street'] : "",
            ('billing_city' in this.dbData) ? this.dbData['billing_city'] : "",
            ('billing_state' in this.dbData) ? this.dbData['billing_state'] : "",
            ('billing_postal_code' in this.dbData) ? this.dbData['billing_postal_code'] : "",
            ('billing_country' in this.dbData) ? this.dbData['billing_country'] : "",
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_type' in this.dbData) ? this.dbData['account_type'] : "Account",
            ('account_directory_name' in this.dbData) ? this.dbData['account_directory_name'] : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('block_access' in this.dbData) ? this.dbData['block_access'] : 0,
            ('account_code' in this.dbData) ? this.dbData['account_code'] : null,
            ('default_em_role' in this.dbData) ? this.dbData['default_em_role'] : "1;8;General Occupant,0;9;Warden",
            ('epc_committee_on_hq' in this.dbData) ? this.dbData['epc_committee_on_hq'] : 0,
            ('trp_code' in this.dbData) ? this.dbData['trp_code'] : null,
            ('account_domain' in this.dbData) ? this.dbData['account_domain'] : null,
            ('key_contact' in this.dbData) ? this.dbData['key_contact'] : "",
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : "",
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
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
          const sql_insert = `INSERT INTO accounts (
            lead,
            online_training,
            account_name,
            building_number,
            billing_unit,
            billing_street,
            billing_city,
            billing_state,
            billing_postal_code,
            billing_country,
            location_id,
            account_type,
            account_directory_name,
            archived,
            block_access,
            account_code,
            default_em_role,
            epc_committee_on_hq,
            trp_code,
            account_domain,
            key_contact,
            time_zone
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          `;
          const param = [
            ('lead' in this.dbData) ? this.dbData['lead'] : 0,
            ('online_training' in this.dbData) ? this.dbData['online_training'] : 0,
            ('account_name' in this.dbData) ? this.dbData['account_name'] : "",
            ('building_number' in this.dbData) ? this.dbData['building_number'] : "",
            ('billing_unit' in this.dbData) ? this.dbData['billing_unit'] : "",
            ('billing_street' in this.dbData) ? this.dbData['billing_street'] : "",
            ('billing_city' in this.dbData) ? this.dbData['billing_city'] : "",
            ('billing_state' in this.dbData) ? this.dbData['billing_state'] : "",
            ('billing_postal_code' in this.dbData) ? this.dbData['billing_postal_code'] : "",
            ('billing_country' in this.dbData) ? this.dbData['billing_country'] : "",
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_type' in this.dbData) ? this.dbData['account_type'] : "Account",
            ('account_directory_name' in this.dbData) ? this.dbData['account_directory_name'] : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : 0,
            ('block_access' in this.dbData) ? this.dbData['block_access'] : 0,
            ('account_code' in this.dbData) ? this.dbData['account_code'] : null,
            ('default_em_role' in this.dbData) ? this.dbData['default_em_role'] : "1;8;General Occupant,0;9;Warden",
            ('epc_committee_on_hq' in this.dbData) ? this.dbData['epc_committee_on_hq'] : 0,
            ('trp_code' in this.dbData) ? this.dbData['trp_code'] : null,
            ('account_domain' in this.dbData) ? this.dbData['account_domain'] : null,
            ('key_contact' in this.dbData) ? this.dbData['key_contact'] : "",
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : ""
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {

            if (err) {
              reject(err);
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['account_id'] = this.id;
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
            if ('account_id' in createData) {
              this.id = createData.account_id;
            }
            resolve(this.write());
        });
    }

  public getLocationsOnAccount(): Promise<Object[]> {
    return new Promise((resolve, reject) => {
      const sql_get_locations = `SELECT
        locations.parent_id,
        locations.name,
        locations.location_id,
        locations.google_photo_url
      FROM
        locations
      INNER JOIN
        location_account_relation LCR
      ON
        locations.location_id = LCR.location_id
      WHERE
        locations.parent_id = -1
      AND
        LCR.account_id = ?
      ORDER BY
        locations.location_id`;

      const connection = db.createConnection(dbconfig);
      connection.query(sql_get_locations, [this.ID()], (err, results, fields) => {
        if (err) {
          console.log(err);
          console.log(sql_get_locations);
          throw new Error('Internal problem. There was a problem processing your query');
        }
        if (results.length) {
          resolve(results);
        } else {
          reject(`No location found for this account ${this.ID()}`);
        }
      });
      connection.end();
    });
  }



}
