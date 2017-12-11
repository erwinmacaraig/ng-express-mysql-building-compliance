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

	public getAllLocations(){
		return new Promise((resolve) => {
			const sql_load = `SELECT * FROM locations WHERE archived = 0 `;
			const connection = db.createConnection(dbconfig);
			connection.query(sql_load, (error, results, fields) => {
				if (error) {
					return console.log(error);
				}
				resolve(results);
			});
			connection.end();
		});
	}

	public getChildren(parentId, call?){
		return new Promise((resolve) => {
			const sql_load = `SELECT * FROM locations WHERE parent_id = ? AND archived = 0 `;
			const param = [parentId];
			const connection = db.createConnection(dbconfig);

			connection.query(sql_load, param, (error, results, fields) => {
				if (error) {
					return console.log(error);
				}

				resolve(results);
			});
			connection.end();
		});
	}

	public getParentLocationByAccountId(accountId: Number){
		return new Promise((resolve, reject) => {
			const sql_load = `
			SELECT * FROM locations
			WHERE location_id IN (SELECT location_id FROM location_account_relation WHERE account_id = ?)
			AND archived = 0 AND parent_id = -1
			ORDER BY location_id ASC
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

					for(let i in results){
						results[i]['sublocations'] = [];
					}

					this.dbData = results;
					resolve(this.dbData);
				}

			});
			connection.end();
		});
	}

	public getManyByAccountId(accountId: Number, getChild: Boolean = false) {
		return new Promise((resolve, reject) => {
			const sql_load = `
			SELECT * FROM locations
			WHERE location_id IN (SELECT location_id FROM location_account_relation WHERE account_id = ?)
			AND archived = 0
			ORDER BY location_id ASC
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

					for(let i in results){
						results[i]['sublocations'] = [];
						if(getChild){
							this.getChildren(results[i]['location_id']).then(
								(child) => {
									results[i]['sublocations'] = child;
									this.dbData = results;
									resolve(this.dbData);
								}
								);
						}else{
							this.dbData = results;
							resolve(this.dbData);
						}
					}

					this.dbData = results;
					resolve(this.dbData);
				}
			});
			connection.end();
		});
	}

	public getByInIds(ids){
		return new Promise((resolve) => {
			const sql_load = `SELECT * FROM locations WHERE location_id IN (`+ids+`) AND archived = 0`;
			const connection = db.createConnection(dbconfig);
			connection.query(sql_load, (error, results, fields) => {
				if (error) {
					return console.log(error);
				}
				resolve(results);
			});
			connection.end();
		});
	}

	public getByUserId(userId: Number) {
		return new Promise((resolve, reject) => {
			const sql_load = `
			SELECT
			lau.location_account_user_id,
			l.*
			FROM locations l
			LEFT JOIN location_account_user lau
			ON l.location_id = lau.location_id
			WHERE lau.user_id = ? AND l.archived = 0
			ORDER BY l.location_id ASC
			`;
			const param = [userId];
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
			postal_code = ?, country = ?, formatted_address = ?,
			lat = ?, lng = ?,time_zone = ?, \`order\` = ?,
			is_building = ?, location_directory_name = ?, archived = ?,
			google_place_id = ?, google_photo_url = ?
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
			('formatted_address' in this.dbData) ? this.dbData['formatted_address'] : null,
			('lat' in this.dbData) ? this.dbData['lat'] : null,
			('lng' in this.dbData) ? this.dbData['lng'] : null,
			('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
			('order' in this.dbData) ? this.dbData['order'] : null,
			('is_building' in this.dbData) ? this.dbData['is_building'] : 0,
			('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : null,
			('archived' in this.dbData) ? this.dbData['archived'] : 0,
			('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
			('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null,
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
			const sql_insert = `INSERT INTO locations (
			parent_id,
			name,
			unit,
			street,
			city,
			state,
			postal_code,
			country,
			formatted_address,
			lat,
			lng,
			time_zone,
			\`order\`,
			is_building,
			location_directory_name,
			archived,
			google_place_id,
			google_photo_url)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
			const param = [
			('parent_id' in this.dbData) ? this.dbData['parent_id'] : 0,
			('name' in this.dbData) ? this.dbData['name'] : '',
			('unit' in this.dbData) ? this.dbData['unit'] : '',
			('street' in this.dbData) ? this.dbData['street'] : '',
			('city' in this.dbData) ? this.dbData['city'] : '',
			('state' in this.dbData) ? this.dbData['state'] : '',
			('postal_code' in this.dbData) ? this.dbData['postal_code'] : '',
			('country' in this.dbData) ? this.dbData['country'] : '',
			('formatted_address' in this.dbData) ? this.dbData['formatted_address'] : null,
			('lat' in this.dbData) ? this.dbData['lat'] : null,
			('lng' in this.dbData) ? this.dbData['lng'] : null,
			('time_zone' in this.dbData) ? this.dbData['time_zone'] : '',
			('order' in this.dbData) ? this.dbData['order'] : null,
			('is_building' in this.dbData) ? this.dbData['is_building'] : 0,
			('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : null,
			('archived' in this.dbData) ? this.dbData['archived'] : 0,
			('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
			('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null
			];
			const connection = db.createConnection(dbconfig);
			connection.query(sql_insert, param, (err, results, fields) => {
				if (err) {
					console.log(sql_insert);
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

	public search(address: string, place_id: string ): Promise<string[]> {
		return new Promise((resolve, reject) => {
			const arrResults = [];
			const sql_search = `SELECT
			parent_id,
			location_id,
			name,
			unit,
			formatted_address,
			google_photo_url
			FROM
			locations
			WHERE
			parent_id = -1
			AND
			formatted_address LIKE '${address}%'
			AND archived = 0
			OR
			google_place_id = ?
			AND archived = 0
			LIMIT 5`;

			const connection = db.createConnection(dbconfig);
			connection.query(sql_search, [place_id], (err, results, fields) => {
				if (err) {
					reject('There was problem processing SQL');
					console.log(sql_search);
					throw new Error('Internal Error. Unable to execute query.');
				}
				for (let ref of results) {
		      // console.log(ref);
		      if (ref['parent_id'] === -1) {
		      	arrResults.push(ref);
		      }
		  }
		  console.log(arrResults);
		  resolve(arrResults);
		});

			connection.end();
		});
	}

	public getDeepLocationsByParentId(parentId){
		return new Promise((resolve) => {
			const sql_load = `SELECT * 
			FROM (SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id) sublocations, 
			(SELECT @pi := '${parentId}') initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
			const connection = db.createConnection(dbconfig);
			connection.query(sql_load, (error, results, fields) => {
				if (error) {
					return console.log(error);
				}
				resolve(results);
			});
			connection.end();
		});
	}

	public getSublocations(user_id?: number, role_id?: number) {
		return new Promise((resolve, reject) => {
			const location: {[key: number]: Array<Object>} = {};
			let parentId = 0;
			let tempArr = [];
			let parents = [];

			let sublocationQuery; 
			if (user_id) { 
				sublocationQuery = `
					SELECT locations.* FROM locations 
					INNER JOIN location_account_user ON location_account_user.location_id = locations.location_id 
					AND location_account_user.user_id = ${user_id} AND locations.archived = 0 `; 
				if (role_id) { 
					sublocationQuery = sublocationQuery + `AND location_account_user.role_id = ${role_id}`; 
				} 
			} else { 
				sublocationQuery = `SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id  DESC`; 
			} 
			const sql_get_subloc = `
			SELECT location_id, name, parent_id FROM (${sublocationQuery}) sublocations, (SELECT @pv := ?) 
			initialisation WHERE find_in_set(parent_id, @pv) > 0 AND @pv := concat(@pv, ',', location_id) ORDER BY parent_id;`;

			const connection = db.createConnection(dbconfig);
			connection.query(sql_get_subloc, [this.ID()], (err, results, fields) => {
				if (err) {
					console.log(sql_get_subloc);
					throw new Error('Internal error. There was a problem processing your query');
				}
				if (results.length) {
					for (let i = 0; i < results.length; i++) {
						results[i]['children'] = [];
						if (parentId !== results[i]['parent_id']) {
							tempArr = [];
							parentId = results[i]['parent_id'];
						}
						tempArr.push(results[i]);
						location[results[i]['parent_id']] = tempArr;

					}
					parents = Object.keys(location);
					for ( let i = 0; i < parents.length - 1; i++) {
						for ( let a = 0; a < location[parents[i]].length; a++) {
							for ( let b = 0; b < parents.length;b++) {
								for (let c = 0; c < location[parents[b]].length; c++ ) {
									if (location[parents[i]][a]['location_id'] === location[parents[b]][c]['parent_id']) {
										location[parents[i]][a]['children'].push(location[parents[b]][c]);
									}
								}
							}
						}
					}
					resolve(location[this.ID()]);
				} else {
					resolve([]);
				}

			});
			connection.end();
		});
	}

}
