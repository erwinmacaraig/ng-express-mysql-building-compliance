import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');
const defs = require('../config/defs.json');

import * as Promise from 'promise';
export class LocationAccountRelation extends BaseClass {

    constructor(id?: number){
        super();
        if(id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_account_relation_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length) {
                reject('Record not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_account_relation_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ?';
            const param = [locationId];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, param, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              if(!results.length){
                reject('Record not found');
              }else{
                this.dbData = results[0];
                this.setID(results[0]['location_account_relation_id']);
                resolve(this.dbData);
              }
            });
            connection.end();
        });
    }

    public getByAccountIdAndLocationId(accountId, locationId) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE account_id = ? AND location_id = ? ORDER BY location_account_relation_id DESC';
            const param = [accountId, locationId];
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

    public getByWhereInLocationIds(locationIds: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id IN ('+locationIds+')';

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

    public getManyByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ?';
            const param = [locationId];
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

    public getTenantsOfLocationId(locationId){
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ? AND responsibility IN ("Tenant", "tenant") ';
            const param = [locationId];
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

    public getByAccountId(accountId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE account_id = ?';
            const param = [accountId];
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

    public getLocationAccountRelation(filter: object) {
      return new Promise((resolve, reject) => {
        const val = [];
        let whereClause = '';
        if ('location_id' in filter) {
          whereClause += `AND location_id = ? `;
          val.push(filter['location_id']);
        }
        if ('account_id' in filter) {
          whereClause += `AND account_id = ? `;
          val.push(filter['account_id']);
        }
        if ('responsibility' in filter) {
          whereClause += `AND responsibility = ?`;
          val.push(filter['responsibility']);
        }
        const sql = `SELECT * FROM location_account_relation WHERE 1=1 ${whereClause}`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql, val, (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          if (!results.length) {
            reject('Record not found '+JSON.stringify(filter));
          } else {
            resolve(results);
          }
        });
        connection.end();
      });
    }

    public dbUpdate() {
        return new Promise((resolve, reject) => {
          const sql_update = `UPDATE location_account_relation SET
                location_id = ?, account_id = ?, responsibility = ?
                WHERE location_account_relation_id = ? `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('responsibility' in this.dbData) ? this.dbData['responsibility'] : "",
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
          const sql_insert = `INSERT INTO location_account_relation (
            location_id,
            account_id,
            responsibility
          ) VALUES (?,?,?)
          `;
          const param = [
            ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : 0,
            ('responsibility' in this.dbData) ? this.dbData['responsibility'] : ""
          ];
          const connection = db.createConnection(dbconfig);
          connection.query(sql_insert, param, (err, results, fields) => {
            if (err) {
              throw new Error(err);
            }
            this.id = results.insertId;
            this.dbData['location_account_relation_id'] = this.id;
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
            if ('location_account_relation_id' in createData) {
              this.id = createData.location_account_relation_id;
            }
            resolve(this.write());
        });
    }
    /**
     * @description
     * Retrieve a list of all locations for an account with the necessary filters supplied
     * Mainly used in listing all the locations for a user under an account
     * @param accountId
     * required parameter
     * @param filter
     */
    public listAllLocationsOnAccount(accountId = 0, filter = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const resultSet = [];
        let filterStr = '';
        if ('responsibility' in filter) {
          if (filter['responsibility'] === defs['Tenant']) {
            filterStr += ` AND location_account_relation.responsibility = 'Tenant'`;
          }
          if (filter['responsibility'] === defs['Manager']) {
            filterStr += ` AND location_account_relation.responsibility = 'Manager'`;
          }
        }
        if ('is_building' in filter) {
          filterStr += ` AND locations.is_building = ${filter['is_building']}`;
        }
        const sql_get_locations = `
          SELECT
            location_account_relation.*,
            locations.location_id,
            CONCAT(parent_locations.name, ' ', locations.name) as name,
            locations.is_building,
            locations.google_photo_url,
            locations.admin_verified
          FROM
            location_account_relation
          INNER JOIN
            locations
          ON
            locations.location_id = location_account_relation.location_id
          LEFT JOIN
            locations as parent_locations
          ON
            locations.parent_id = parent_locations.location_id
          WHERE
            location_account_relation.account_id = ?
            ${filterStr}
          GROUP BY location_account_relation.location_id;`;

        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_locations, [accountId], (error, results) => {
          if (error) {
            console.log('location.account.relation.listAllLocationsOnAccount', error, sql_get_locations);
            throw Error('Cannot get all locations for this account');
          }
          if (results.length > 0) {
            for (const loc of results) {
              resultSet.push(loc);
            }
            resolve(resultSet);
          } else {
            resolve([]);
          }
        });
        connection.end();

      });

    }

}
