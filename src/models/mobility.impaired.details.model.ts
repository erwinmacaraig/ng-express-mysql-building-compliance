import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
export class MobilityImpairedModel extends BaseClass {

	constructor(id?: number){
		super();
		if(id) {
			this.id = id;
		}
	}

	public load() {
		return new Promise((resolve, reject) => {
			const sql_load = 'SELECT * FROM mobility_impaired_details WHERE mobility_impaired_details_id = ? ORDER BY date_created DESC';
			const uid = [this.id];
			const connection = db.createConnection(dbconfig);
			connection.query(sql_load, uid, (error, results, fields) => {
				if (error) {
					return console.log(error);
				}
				this.dbData = results[0];
				this.setID(results[0]['mobility_impaired_details_id']);
				resolve(this.dbData);
			});
			connection.end();
		});
	}

	public getMany(arrWhere) {
		return new Promise((resolve, reject) => {
			let sql_load = 'SELECT * FROM mobility_impaired_details ';

			if(arrWhere.length){
				let count = 0;
				for(let w in arrWhere){
					if(count == 0){
						sql_load += ' WHERE '+arrWhere[w];
					}else{
						sql_load += ' AND '+arrWhere[w];
					}
					count++;
				}
			}
			
			sql_load += ' ORDER BY date_created DESC ';

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

			const sql_update = `UPDATE mobility_impaired_details SET
			user_id = ?, is_permanent = ?, duration_date = ?, assistant_type = ?, equipment_type = ?, evacuation_procedure = ?, date_created = ?
			WHERE mobility_impaired_details_id = ?`;
			const param = [
			('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
			('is_permanent' in this.dbData) ? this.dbData['is_permanent'] : 0,
			('duration_date' in this.dbData) ? this.dbData['duration_date'] : null,
			('assistant_type' in this.dbData) ? this.dbData['assistant_type'] : null,
			('equipment_type' in this.dbData) ? this.dbData['equipment_type'] : null,
			('evacuation_procedure' in this.dbData) ? this.dbData['evacuation_procedure'] : null,
			('date_created' in this.dbData) ? this.dbData['date_created'] : '',
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
			const sql_insert = `INSERT INTO mobility_impaired_details 
			(user_id, is_permanent, duration_date, assistant_type, equipment_type, evacuation_procedure, date_created) 
			VALUES (?, ?, ?, ?, ?, ?, ?);`;
			const param = [
			('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
			('is_permanent' in this.dbData) ? this.dbData['is_permanent'] : 0,
			('duration_date' in this.dbData) ? this.dbData['duration_date'] : null,
			('assistant_type' in this.dbData) ? this.dbData['assistant_type'] : null,
			('equipment_type' in this.dbData) ? this.dbData['equipment_type'] : null,
			('evacuation_procedure' in this.dbData) ? this.dbData['evacuation_procedure'] : null,
			('date_created' in this.dbData) ? this.dbData['date_created'] : ''
			];
			const connection = db.createConnection(dbconfig);
			connection.query(sql_insert, param, (err, results, fields) => {
				if (err) {
					console.log(sql_insert);
					throw new Error(err);
				}
				this.id = results.insertId;
				this.dbData['mobility_impaired_details_id'] = this.id;
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
			if ('mobility_impaired_details_id' in createData) {
				this.id = createData.mobility_impaired_details_id;
			}
			resolve(this.write());
		});
	}


}
