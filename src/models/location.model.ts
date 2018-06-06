
import * as db from 'mysql2';
import { BaseClass } from './base.model';
import { UtilsSync } from './util.sync';

const dbconfig = require('../config/db');
const defs = require('../config/defs.json');

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

    public countSubLocations(parentId){
        return new Promise((resolve) => {
            const sql_load = `SELECT COUNT(location_id) as count FROM locations WHERE parent_id = ? AND archived = 0 `;
            const param = [parentId];
            const connection = db.createConnection(dbconfig);

            connection.query(sql_load, param, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }

                resolve( results[0]['count'] );
            });
            connection.end();
        });
    }

	public getWhere(arrWhere, limit?, count?){
		return new Promise((resolve, reject) => {
			let sql_load = `SELECT * FROM locations `;
            if(count){
                sql_load = 'SELECT COUNT(location_id) as count FROM locations '
            }
			let c = 0;
			for(let i in arrWhere){
				if(c == 0){
					sql_load += ' WHERE ';
				}else{
					sql_load += ' AND ';
				}

				sql_load += arrWhere[i];
			}

            if(limit && !count){
                sql_load += ' LIMIT '+limit;
            }

			const connection = db.createConnection(dbconfig);
			connection.query(sql_load, (error, results, fields) => {
				if (error) {
                    console.log(error);
					return false;
				}
				for(let i in results){
                    results[i]['sublocations'] = [];
                }

                this.dbData = results;
                resolve(this.dbData);

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
			});
			connection.end();
		});
	}

	public getByInIds(ids, archived?){
		return new Promise((resolve) => {
			if(archived == undefined){
				archived = 0;
			}

			const sql_load = `SELECT * FROM locations WHERE location_id IN (`+ids+`) AND archived = `+archived + ` ORDER BY location_id ASC `;
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
			google_place_id = ?, google_photo_url = ?, admin_verified = ?, admin_verified_date = ?, admin_id = ?
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
			('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : (this.dbData['street'] + this.dbData['city']).replace(/ /g, ''),
			('archived' in this.dbData) ? this.dbData['archived'] : 0,
			('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
			('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null,
			('admin_verified' in this.dbData) ? this.dbData['admin_verified'] : 0,
			('admin_verified_date' in this.dbData) ? this.dbData['admin_verified_date'] : null,
			('admin_id' in this.dbData) ? this.dbData['admin_id'] : 0,
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
			google_photo_url,
			admin_verified,
			admin_verified_date,
			admin_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
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
      		('is_building' in this.dbData) ? this.dbData['is_building'] : 1,
      		('location_directory_name' in this.dbData) ? this.dbData['location_directory_name'] : (this.dbData['street'] + this.dbData['city']).replace(/ /g, ''),
			('archived' in this.dbData) ? this.dbData['archived'] : 0,
			('google_place_id' in this.dbData) ? this.dbData['google_place_id'] : null,
			('google_photo_url' in this.dbData) ? this.dbData['google_photo_url'] : null,
			('admin_verified' in this.dbData) ? this.dbData['admin_verified'] : 0,
			('admin_verified_date' in this.dbData) ? this.dbData['admin_verified_date'] : null,
			('admin_id' in this.dbData) ? this.dbData['admin_id'] : 0,
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
			google_photo_url,
            is_building
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
			(SELECT @pi := ('${parentId}')) initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
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

    public getDeepLocationsMinimizedDataByParentId(parentId){
        return new Promise((resolve) => {
            const sql_load = `SELECT location_id, parent_id, name
            FROM (SELECT location_id, parent_id, name FROM locations WHERE archived = 0 ORDER BY parent_id, location_id) sublocations,
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
					// sublocationQuery = sublocationQuery + `AND location_account_user.role_id = ${role_id}`;
				}
			} else {
				sublocationQuery = `SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id  DESC`;
			}

			sublocationQuery = `SELECT * FROM locations WHERE archived = 0 ORDER BY parent_id, location_id  DESC`;
			const sql_get_subloc = `
			SELECT location_id, name, parent_id, is_building FROM (${sublocationQuery}) sublocations, (SELECT @pv := ?)
			initialisation WHERE find_in_set(parent_id, @pv) > 0 AND @pv := concat(@pv, ',', location_id) ORDER BY location_id;`;

			const connection = db.createConnection(dbconfig);
			connection.query(sql_get_subloc, [this.ID()], (err, results, fields) => {
				if (err) {
					console.log(sql_get_subloc);
					throw new Error('Internal error. There was a problem processing your query');
				}
				if (results.length) {
					let newResults = [],
						unassignedResults = [];

					for (let i = 0; i < results.length; i++) {
						unassignedResults.push({
							'location_id' : results[i]['location_id'],
							'name' : results[i]['name'],
              'parent_id' : results[i]['parent_id'],
							'is_building' : results[i]['is_building'],
							'children' : []
						});
					}

					for(let i in unassignedResults){
						for(let x in unassignedResults){
							if(unassignedResults[i]['parent_id'] == unassignedResults[x]['location_id']){
								unassignedResults[x]['children'].push(unassignedResults[i]);
							}
						}
					}

					for(let i in unassignedResults){
						if(unassignedResults[i]['parent_id'] == this.ID()){
							newResults.push(unassignedResults[i]);
						}
					}

					resolve(newResults);
				} else {
					resolve([]);
				}

			});
			connection.end();
		});
    }

	public getParentsChildren(parentId, raw = 1, buildings_only:boolean = false, archived?): any {
		return new Promise((resolve) => {
            let archiveStr = (archived) ? archived : '0';
            let locationIds = [];
            let sql = `SELECT *
            FROM (SELECT * FROM locations WHERE archived = ${archiveStr} ORDER BY parent_id, location_id) sublocations,
            (SELECT @pi := ('${parentId}')) initialisation WHERE FIND_IN_SET(parent_id, @pi) > 0 AND @pi := concat(@pi, ',', location_id)`;
            const connection = db.createConnection(dbconfig);
            connection.query(sql, (err, results, fields) => {
                if (err) {
                    console.log(sql);
                    throw new Error('Internal error. There was a problem processing your query');
                }
                if (raw) {
                    resolve(results);
                } else if (buildings_only) {
                    for (const r of results) {
                        if (parseInt(r['is_building'], 10) === 1) {
                            locationIds.push(r['location_id']);
                        }
                    }
                    resolve(locationIds);
                } else {
                    for (const r of results) {
                        locationIds.push(r['location_id']);
                    }
                    resolve(locationIds);
                }
            });
            connection.end();
        });
	}

	public getAncestryIds(sublocId){

		return new Promise((resolve) => {
			let sql = `SELECT @pi as ids FROM ( SELECT * FROM locations WHERE archived = 0 AND location_id <= ${sublocId} ) sublocations ,
						(SELECT @pi := parent_id FROM locations WHERE location_id = ${sublocId} ) parent
					    WHERE FIND_IN_SET(location_id, @pi) > 0 AND @pi := concat(@pi, ',', parent_id)
					    ORDER BY location_id DESC`;

			const connection = db.createConnection(dbconfig);
			connection.query(sql, (err, results, fields) => {
				if (err) {
					console.log(err);
					throw new Error(err);
				}

				if(results.length > 0){
					resolve([
						{
							ids : results[ results.length - 1 ]['ids']
						}
					]);
				}else{
					resolve([ {
						ids : '0'
					} ]);
				}


			});
			connection.end();
		});
	}

	public getAncestries(sublocId){

		return new Promise( (resolve) => {
			this.getAncestryIds(sublocId).then((resultsIds) => {

				if(sublocId.length == 0){
					sublocId = '0';
				}

				let sql = `SELECT * FROM locations WHERE location_id IN (` + sublocId + `)`;

				if( resultsIds[0]['ids'].length > 0 ){
                	sql = `SELECT * FROM locations WHERE location_id IN (` + sublocId + `,` + resultsIds[0]['ids'] + `)`;
                }

				const connection = db.createConnection(dbconfig);
				connection.query(sql, (err, results, fields) => {
					if (err) {
						console.log(sql);
						throw new Error('Internal error. There was a problem processing your query');
					}

					resolve(results);
				});
				connection.end();
			});
		});
    }

    /**
    *
    * @param em_role_id
    * @param location_id
    * @param role_id
    * the ACCOUNT ROLE ID of the user logged in to the system
    */
    public getEMRolesForThisLocation(em_role_id: number = 0, location_id?: number, role_id: number = 0) {
        return new Promise((resolve, reject) => {
        let location = this.ID();

        let em_role_filter = '';
        let connection;
        let sql;

        if (location_id) {
          location = location_id;
        }
        if (em_role_id > 0) {
          em_role_filter = ` AND user_em_roles_relation.em_role_id = ${em_role_id}`;
        }
        let location_em_roles = {};
        let subLocToEmRoles:{[key: number]: {}} = {};

        if (role_id === parseInt(defs['Manager'], 10) ) {

            // FRP SECTION
            this.getParentsChildren(location).then((sublocations) => {
              const subIds = [location_id];
              Object.keys(sublocations).forEach((key) => {
                subIds.push(sublocations[key]['location_id']);
              });
              let subIdstring = subIds.join(',');
              subIdstring = (subIdstring.length == 0) ? '0' : subIdstring;

              sql = `SELECT
                          user_em_roles_relation.*,
                          em_roles.role_name,
                          locations.name,
                          locations.is_building
                        FROM
                          user_em_roles_relation
                        INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                        INNER JOIN
                          em_roles
                        ON
                          em_roles.em_roles_id = user_em_roles_relation.em_role_id
                        INNER JOIN
                          locations
                        ON
                          locations.location_id = user_em_roles_relation.location_id
                        WHERE
                        users.archived = 0
                        AND user_em_roles_relation.location_id IN (${subIdstring}) ${em_role_filter}
                        ORDER BY em_role_id
                        `;

              connection = db.createConnection(dbconfig);
              connection.query(sql, [], (error, results, fields) => {
                if (error) {
                  console.log('location.model.getEMRolesForThisLocation', error, sql);
                  throw new Error('There was an error getting the EM Roles for this location');
                }
                if (!results.length) {
                  reject('There are no EM Roles for this location id - ' + location);
                } else {
                  // console.log('Roles from db are ', results);
                  for (let i = 0; i < results.length; i++) {
                    if (results[i]['em_role_id'] in location_em_roles) {
                      location_em_roles[results[i]['em_role_id']]['count'] = location_em_roles[results[i]['em_role_id']]['count'] + 1;
                      (location_em_roles[results[i]['em_role_id']]['users']).push(results[i]['user_id']);
                      if ((location_em_roles[results[i]['em_role_id']]['location']).indexOf(results[i]['location_id']) == -1) {
                        (location_em_roles[results[i]['em_role_id']]['location']).push(results[i]['location_id']);
                      }
                      // (location_em_roles[results[i]['em_role_id']][results[i]['location_id']]).push(results[i]['user_id']);
                      let loc = results[i]['location_id'];
                      loc = loc.toString();

                      if (loc in  location_em_roles[results[i]['em_role_id']]) {
                        (location_em_roles[results[i]['em_role_id']][loc]['users']).push(results[i]['user_id']);
                      } else {
                        location_em_roles[results[i]['em_role_id']][loc] = {
                          'users': [],
                          'name': ''
                        }
                        location_em_roles[results[i]['em_role_id']][loc]['users'].push(results[i]['user_id']);
                        location_em_roles[results[i]['em_role_id']][loc]['name'] = results[i]['name']
                      }
                    }
                    else {
                      let keyIndex = results[i]['em_role_id'];
                      let loc = results[i]['location_id'].toString();
                      location_em_roles[keyIndex] = {
                        'name': results[i]['role_name'],
                        'count': 1,
                        'users': [results[i]['user_id']],
                        'location': [results[i]['location_id']]
                      };
                      location_em_roles[results[i]['em_role_id']][loc] = {
                        'users': [],
                        'name': ''
                      }
                      location_em_roles[keyIndex][loc]['users'].push(results[i]['user_id']);
                      location_em_roles[keyIndex][loc]['name'] = results[i]['name']
                    }
                  }
                  resolve(location_em_roles);
                }
              });
              connection.end();
            }).catch((e) => {
              return [];
            });
        } else if(role_id === parseInt(defs['Tenant'], 10) ) {
          sql = `SELECT
                  user_em_roles_relation.*,
                  em_roles.role_name,
                  locations.name,
                  locations.is_building
                FROM
                  user_em_roles_relation
                INNER JOIN users ON users.user_id = user_em_roles_relation.user_id
                INNER JOIN
                  em_roles
                ON
                  em_roles.em_roles_id = user_em_roles_relation.em_role_id
                INNER JOIN
                  locations
                ON
                  locations.location_id = user_em_roles_relation.location_id
                WHERE
                  user_em_roles_relation.location_id = ${location} ${em_role_filter}
                AND users.archived = 0
                ORDER BY em_role_id
                `;
          connection = db.createConnection(dbconfig);
          connection.query(sql, [], (error, results) => {
            if (error) {
              return console.log('location.model.getEMRolesForThisLocation', error, sql);
            }
            if (!results.length) {
              reject('There are no EM Roles for this location id - ' + location);
            } else {

              for (let i = 0; i < results.length; i++) {


                if (results[i]['em_role_id'] in location_em_roles) {
                  if (location_em_roles[results[i]['em_role_id']]['users'].indexOf(results[i]['user_id']) === -1) {
                    (location_em_roles[results[i]['em_role_id']]['users']).push(results[i]['user_id']);
                    location_em_roles[results[i]['em_role_id']]['count'] = location_em_roles[results[i]['em_role_id']]['users'].length;
                  }

                  if ((location_em_roles[results[i]['em_role_id']]['location']).indexOf(results[i]['location_id']) == -1) {
                    (location_em_roles[results[i]['em_role_id']]['location']).push(results[i]['location_id']);
                  }
                  // (location_em_roles[results[i]['em_role_id']][results[i]['location_id']]).push(results[i]['user_id']);
                  let loc = results[i]['location_id'];
                  loc = loc.toString();

                  if (loc in  location_em_roles[results[i]['em_role_id']]) {
                    (location_em_roles[results[i]['em_role_id']][loc]['users']).push(results[i]['user_id']);
                  } else {
                    location_em_roles[results[i]['em_role_id']][loc] = {
                      'users': [],
                      'name': ''
                    }
                    location_em_roles[results[i]['em_role_id']][loc]['users'].push(results[i]['user_id']);
                    location_em_roles[results[i]['em_role_id']][loc]['name'] = results[i]['name']
                  }
                }
                else {
                  let keyIndex = results[i]['em_role_id'];
                  let loc = results[i]['location_id'].toString();
                  location_em_roles[keyIndex] = {
                    'name': results[i]['role_name'],
                    'count': 1,
                    'users': [results[i]['user_id']],
                    'location': [results[i]['location_id']]
                  };
                  location_em_roles[results[i]['em_role_id']][loc] = {
                    'users': [],
                    'name': ''
                  }
                  location_em_roles[keyIndex][loc]['users'].push(results[i]['user_id']);
                  location_em_roles[keyIndex][loc]['name'] = results[i]['name'];
                  // location_em_roles['all_role_users'] = allUsers;
                }
              }
              resolve(location_em_roles);
            }
          });
          connection.end();
        } else {
          resolve({});
        }

        });
    }

    /**
    *
    * @param location_id
    * @param role
    * @description
    * get Tenant Responsible Persons(s) given a location
    */
    public getTRPOnLocation(locations = [], role = 0): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
          const r = [];
          if (!locations.length) {
            resolve([]);
            return;
          }
          const locationStr = locations.join(',');
          let locId = this.ID();

          const sql = `SELECT
            location_account_user.location_id,
            accounts.account_id,
            user_role_relation.role_id,
            users.first_name,
            users.last_name,
            users.email
          FROM
            location_account_user
          INNER JOIN
            user_role_relation
          ON
            user_role_relation.user_id = location_account_user.user_id
          INNER JOIN
            users
          ON
            users.user_id = location_account_user.user_id
          INNER JOIN accounts ON accounts.account_id = users.account_id
          WHERE
            location_account_user.location_id IN (${locationStr})
          AND
            role_id = ?`;

          const connection = db.createConnection(dbconfig);
          connection.query(sql, [role], (error, results) => {
            if (error) {
              console.log('location.model.getTRPOnLocation',error, sql);
              throw Error('Cannot perform query');
            }
            if (!results.length) {
              resolve([]);
            } else {
              for (let res of results) {
                r.push(res);
              }
              resolve(r);
            }
          });
          connection.end();
        });
    }


    public getTenantAccounts(location = 0): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let locId = this.ID();
        const resultSet = [];
        if (location) {
          locId = location;
        }
        const sql_get_tenant_accounts = `
          SELECT * FROM location_account_relation WHERE location_id = ? AND responsibility = 'Tenant' GROUP BY account_id;
        `;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get_tenant_accounts, [locId], (error, results) => {
          if (error) {
            console.log('location.model.getTenantAccouts', error, sql_get_tenant_accounts);
            throw Error('Internal error: Cannot obtain tenant accounts on this location ' + locId);
          }
          for (let r of results) {
            resultSet.push(r);
          }
          resolve(resultSet);
        });
        connection.end();
      });
    }

    public bulkLocationDetails(locations = [], filter = {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        if (locations.length === 0) {
          resolve([]);
          return;
        }
        let offsetLimit = '';

        if ('limit' in filter){
          offsetLimit = 'LIMIT '+filter['limit'];
        }

        if('offset' in filter && 'limit' in filter){
          offsetLimit = 'LIMIT '+filter['offset']+','+filter['limit'];
        }
        let nameSearch = '';
        if('name' in filter && filter['name'].length > 0){
            nameSearch = `AND locations.name LIKE '%${filter['name']}%' `;
        }

        let archivedStr = '';
        if('archived' in filter){
            archivedStr += ` AND locations.archived = ${filter['archived']}`;
        }

        let orderBy = '';
        if('sort' in filter){
            if(filter['sort'] == 'name-asc'){
                orderBy = ' ORDER BY name ASC ';
            }else if(filter['sort'] == 'name-desc'){
                orderBy = ' ORDER BY name DESC ';
            }

        }

        const myLocations = [];
        const locationStr = locations.join(',');
        let sql_details = `SELECT * FROM locations WHERE location_id IN (${locationStr}) ${nameSearch} ${archivedStr} ${orderBy} ${offsetLimit}`;
        if ('count' in filter) {
          sql_details = `SELECT COUNT(location_id) as count FROM locations WHERE location_id IN (${locationStr}) ${nameSearch} ${archivedStr} ${orderBy} `;
        }
        const connection = db.createConnection(dbconfig);
        connection.query(sql_details, [], (error, results) => {
          if (error) {
            console.log('location.model.bulkLocationDetails', error, sql_details);
            throw Error('Cannot get locations');
          }
          resolve(results);
        });
        connection.end();

      });
    }

    public getLocationDetailsUsingName(name: string = ''): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        const sql_get = `SELECT * FROM locations WHERE formatted_address  REGEXP '^${name}$' LIMIT 1;`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_get, [], (error, results) => {
          if (error) {
            console.log('location.model.getLocationDetailsUsingName', error, sql_get);
            throw Error('Internal error. Cannot get location details');
          }
          resolve(results);
        });
      });
    }

}
