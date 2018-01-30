import * as db from 'mysql2';
import { BaseClass } from './base.model';

const dbconfig = require('../config/db');
import * as Promise from 'promise';

export class Translog extends BaseClass {

    constructor(id?: number) {
      super();
      if (id) {
        this.id = id;
      }
    }

}
