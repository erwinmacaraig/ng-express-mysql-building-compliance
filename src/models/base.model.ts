import * as Promise from 'promise';
import * as db from 'mysql2';
const dbconfig = require('../config/db.json');
export abstract class BaseClass {

    protected id: number;
    protected dbData = {};
    protected fields: Array<string> = [];
    protected pool: db.Pool = global['dbconnection'] = (global['dbconnection']) ? global['dbconnection'] : db.createPool(dbconfig);

    constructor(id?: number) {
        if (id) {
            this.id = id;
        }
    }

    protected abstract load();

    protected abstract dbUpdate();

    protected abstract dbInsert();

    protected abstract create(createData: {}): void;

    public setID(id: number): void {
        this.id = id;
    }

    public ID(): number {
        return this.id;
    }

    public getDBData(): {} {
        return this.dbData;
    }

    public get(fieldName: string): number|string {
        if (fieldName in this.dbData) {
            return this.dbData[fieldName];
        }
    }

    public set(fieldName: string, fieldValue: number|string): void {
        this.dbData[fieldName] = fieldValue;
    }

    public write() {
      return new Promise((resolve, reject) => {
        if (this.ID()) {
          resolve(this.dbUpdate());
        } else {
          resolve(this.dbInsert());
        }
      });

    }

}
