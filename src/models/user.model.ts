import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');


import * as Promise from 'promise';

export class User extends BaseClass {
    
    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }
    /*
     load = new Promise((resolve, reject) => {
        const sql_load = 'SELECT * FROM users WHERE user_id = ?'; 
        const uid = [this.id];
        const connection = db.createConnection(dbconfig);
        connection.query(sql_load, uid, (error, results, fields) => {
             if (error) {
               return console.log(error);
             }
             this.dbData = results[0]; 
             resolve(this.dbData);            
        });
    });
    */
    /*
    public load(callback) {
        const sql_load = 'SELECT * FROM users WHERE user_id = ?';
        const uid = [this.id];
        const connection = db.createConnection(dbconfig);
        connection.query(sql_load, uid, (error, results, fields) => {
             if (error) {
               return console.log(error);
             }
             this.dbData = results[0];   
             callback();          
        });
    }
    */
    
    public load() {
         return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM users WHERE user_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
              if (error) {
                return console.log(error);
              }
              this.dbData = results[0];                           
              resolve(this.dbData);
            });
         });


        
    }
    
    public dbInsert() {
        const sql_insert = `INSERT INTO users (
                                first_name,
                                last_name,
                                email,
                                phone_number,
                                mobile_number,
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
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const user = [
            ('first_name' in this.dbData) ? this.dbData['first_name'] : null,
            ('last_name' in this.dbData) ? this.dbData['last_name'] : null,
            ('email' in this.dbData) ? this.dbData['email'] : null,
            ('phone_number' in this.dbData) ? this.dbData['phone_number'] : null,
            ('mobile_number' in this.dbData) ? this.dbData['mobile_number'] : null,
            ('mobility_impaired' in this.dbData) ? this.dbData['mobility_impaired'] : null,
            ('time_zone' in this.dbData) ? this.dbData['time_zone'] : null,
            ('can_login' in this.dbData) ? this.dbData['can_login'] : null,
            ('password' in this.dbData) ? this.dbData['password'] : null,
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('last_login' in this.dbData) ? this.dbData['last_login'] : null,
            ('evac_role' in this.dbData) ? this.dbData['evac_role'] : null,
            ('invitation_date' in this.dbData) ? this.dbData['invitation_date'] : null,
            ('add_to_location' in this.dbData) ? this.dbData['add_to_location'] : null,
            ('token' in this.dbData) ? this.dbData['token'] : null,
            ('approved_license_agreement' in this.dbData) ? this.dbData['approved_license_agreement'] : null,
            ('logged_in' in this.dbData) ? this.dbData['logged_in'] : null,
            ('archived' in this.dbData) ? this.dbData['archived'] : null,
            ('must_change_password' in this.dbData) ? this.dbData['must_change_password'] : null,
            ('user_name' in this.dbData) ? this.dbData['user_name'] : null
        ];
        console.log(user);
    }

     public dbUpdate(): void {
        return;
    }

    public create(createData: {}): void {
        return;
    }
}


