import * as db from 'mysql2';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class Gateway {
  constructor() {}

  public getActiveConfig() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM gateway_config WHERE gateway_status = 1 LIMIT 1`;

      const connection = db.createConnection(dbconfig);
      connection.query(sql, [], (error, results, fields) => {
        if (error) {
          console.log('gateway.model getActiveConfig', error);
          throw new Error(error);
        } else {
          resolve(results[0]);
        }
      });
      connection.end();
    });
  }
}

