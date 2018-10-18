import * as db from 'mysql2';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

import { BaseClass } from './base.model';

export class Gateway extends BaseClass {


    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {

    }

    public dbInsert() {

    }

    public dbUpdate() {

    }

    public create(createData) {

    }

    public getActiveConfig() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM gateway_config WHERE gateway_status = 1 LIMIT 1`;

            this.pool.getConnection((err, connection) => {
                connection.query(sql, [], (error, results, fields) => {
                    if (error) {
                        console.log('gateway.model getActiveConfig', error);
                        throw new Error(error);
                    } else {
                        resolve(results[0]);
                    }
                });
                connection.release();
            });

        });
    }
}

