

import { BaseClass } from './base.model';
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
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
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
                connection.release();
            });
        });
    }

    public getByLocationId(locationId: Number[], include_account: boolean = false): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            let sql_load = '';
            const locationIdsString = locationId.join(',');
            sql_load = `SELECT *,
            IF(location_account_relation.responsibility = 'Manager', 1, 2)
            AS responsibility_id FROM location_account_relation WHERE location_id IN (${locationIdsString})`;
            if (include_account) {
              sql_load = `SELECT *,
                                IF(location_account_relation.responsibility = 'Manager', 1, 2) AS responsibility_id
                FROM location_account_relation
                INNER JOIN accounts
                ON location_account_relation.account_id = accounts.account_id
                WHERE location_account_relation.location_id IN (${locationIdsString})`;
            }

            sql_load += ` GROUP BY location_account_relation.responsibility`;
            const param = [];
            this.pool.getConnection((err, connection) => {
                if (err) {
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  resolve(results);
                });
                connection.release();
            });
        });
    }

    public getByAccountIdAndLocationId(accountId, locationId): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql_load = `SELECT * FROM location_account_relation WHERE account_id = ?
            AND location_id = ? ORDER BY location_account_relation_id DESC`;
            const param = [accountId, locationId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    console.log('location.account.relation.getByAccountIdAndLocationId', error);
                    throw Error('Internal Server Error');
                  }
                  resolve(results);
                });
                connection.release();
            });
        });
    }

    public getByWhereInLocationIds(locationIds: String) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id IN ('+locationIds+')';

            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                });
                connection.release();
            });
            
        });
    }

    public getManyByLocationId(locationId: Number) {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ?';
            const param = [locationId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                });
                connection.release();
            });
            
        });
    }

    public getTenantsOfLocationId(locationId){
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE location_id = ? AND responsibility IN ("Tenant", "tenant") ';
            const param = [locationId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                    this.dbData = results;
                    resolve(this.dbData);
                });
                connection.release();
            });
        });
    }

    public getByAccountId(accountId: Number): Promise<Array<object>> {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM location_account_relation WHERE account_id = ?';
            const param = [accountId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  
                  resolve(results);
                });
                connection.release();
            });            
        });
    }

    public getLocationAccountRelation(filter: object): Promise<Array<object>> {
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
        this.pool.getConnection((err, connection) => {
            if (err) {                    
                throw new Error(err);
            }
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
            connection.release();
        });
        
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
          this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }
              connection.query(sql_update, param, (err, results, fields) => {
                if (err) {
                  throw new Error(err);
                }
                resolve(true);
              });
              connection.release();
          });
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
          this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }
              connection.query(sql_insert, param, (err, results, fields) => {
                if (err) {
                  throw new Error(err);
                }
                this.id = results.insertId;
                this.dbData['location_account_relation_id'] = this.id;
                resolve(true);
              });
              connection.release();
          });
          

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

    public delete() {
        return new Promise((resolve, reject) => {
            const sql_del = `DELETE FROM location_account_relation WHERE location_account_relation_id = ? LIMIT 1`;
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_del, [this.ID()], (error, results, fields) => {
                    if (error) {
                        console.log(error);
                        reject('Error deleting record');

                    } else {
                        resolve(true);
                    }

                });
                connection.release();
            });
            
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
    public listAllLocationsOnAccount(accountId = 0, filter = <any> {}): Promise<Array<object>> {
      return new Promise((resolve, reject) => {
        let offsetLimit = ``;

        if('limit' in filter){
            offsetLimit = ' LIMIT '+filter['limit'];
        }

        if('offset' in filter && 'limit' in filter){
            offsetLimit = ' LIMIT '+filter['offset']+','+filter['limit'];
        }

        let nameSearch = '';
        if('name' in filter){
            nameSearch = (filter['name'].length > 0) ? ` AND l.name LIKE '%${filter['name']}%'` : '  ';
        }

        let orderBy = '';
        if('sort' in filter){
            if(filter['sort'] == 'name-asc'){
                orderBy = ' ORDER BY l.name ASC ';
            }else if(filter['sort'] == 'name-desc'){
                orderBy = ' ORDER BY l.name DESC ';
            }
        }

        let selectParentName = ('no_parent_name' in filter) ? 'b.name,' : `IF (p.name IS NULL, b.name, IF (CHAR_LENGTH(p.name) = 0,  b.name, CONCAT(p.name, ', ', b.name))) as name,`;

        let isPortfolio = (filter['isPortfolio']) ? filter['isPortfolio'] : false;

        let sqlJoinLAU = '';
        if(!isPortfolio && filter['userId']){
            sqlJoinLAU = ' INNER JOIN location_account_user lau ON lau.location_id = l.location_id ';
        }

        let archived = 0;
        if('archived' in filter){
            archived = filter['archived'];
        }

        let userIdQuery = '';
        if('userId' in filter){
            userIdQuery =  ` AND lau.user_id = ${filter['userId']} `;
        }

        if(accountId > 0){
            userIdQuery += ` AND lau.account_id = ${accountId} `;
        }

        let parentIdQuery = (filter['parent_id']) ? ` AND l.parent_id = ${filter['parent_id']} ` : ``;

        let sqlGetIds = `
            SELECT
            DISTINCT(IF(p1.is_building = 1, p1.location_id, l.location_id) ) as location_id
            FROM locations l
            INNER JOIN location_account_user lau ON l.location_id = lau.location_id
            LEFT JOIN locations p1 ON l.parent_id = p1.location_id
            LEFT JOIN locations p2 ON p1.parent_id = p2.location_id

            WHERE 1 = 1 
            ${userIdQuery} 
            AND (l.is_building = 1 OR p1.is_building = 1 OR p2.is_building = 1 OR l.location_id IN ( SELECT parent_id FROM locations WHERE is_building = 1 ))
            AND l.archived = ${archived}
        `;
        this.pool.getConnection((err, connection) => {
            connection.query(sqlGetIds,  (error, idResults) => {
                if(error) {
                    console.log(sqlGetIds);
                    console.log(filter['userId']);
                    throw new Error(error);
                }
                
                if(idResults.length > 0){
                    let 
                    arrIds = [],
                    ids = '';
                    for(let i in idResults){
                        arrIds.push(idResults[i]['location_id']);
                    }

                    ids = arrIds.join(',');

                    let sql_get_locations = `
                        SELECT l.*, p.is_building as parent_is_building, p.name as parent_name,
                        IF( ( SELECT COUNT(c.location_id) as count FROM locations c WHERE c.parent_id = l.location_id AND c.is_building = 1  ) > 0, 1, 0 ) as has_child_building
                        FROM locations l
                        LEFT JOIN locations p ON l.parent_id = p.location_id
                        WHERE 
                        (l.location_id IN (${ids}) AND l.is_building = 1
                        OR l.parent_id IN (${ids}) AND l.is_building = 1)
                        ${parentIdQuery}
                        ${nameSearch}
                        ${orderBy}
                    `;

                    if('parentOnly' in filter){
                        if(filter['parentOnly']){
                            sql_get_locations = `
                                SELECT l.*, p.is_building as parent_is_building, p.name as parent_name,
                                IF( ( SELECT COUNT(c.location_id) as count FROM locations c WHERE c.parent_id = l.location_id AND c.is_building = 1  ) > 0, 1, 0 ) as has_child_building
                                FROM locations l
                                LEFT JOIN locations p ON l.parent_id = p.location_id
                                WHERE 
                                l.location_id IN (
                                    SELECT DISTINCT(IF(parent_id > -1, parent_id, location_id))
                                    FROM locations
                                    WHERE 
                                    (location_id IN (${ids}) AND is_building = 1
                                    OR parent_id IN (${ids}) AND is_building = 1)
                                )
                                ${nameSearch}
                                ${orderBy}
                            `;
                        }
                    }
                    
                    if('count' in filter){
                        sql_get_locations = `
                            SELECT COUNT(l.location_id) as count 
                            FROM locations l
                            WHERE 
                            (l.location_id IN (${ids}) AND l.is_building = 1
                            OR l.parent_id IN (${ids}) AND l.is_building = 1)
                            ${parentIdQuery}
                            ${nameSearch}
                        `;
                        if('parentOnly' in filter){
                            if(filter['parentOnly']){
                                sql_get_locations = `
                                    SELECT COUNT(l.location_id) as count 
                                    FROM locations l
                                    WHERE 
                                    l.location_id IN (
                                        SELECT DISTINCT(IF(parent_id > -1, parent_id, location_id))
                                        FROM locations
                                        WHERE 
                                        (location_id IN (${ids}) AND is_building = 1
                                        OR parent_id IN (${ids}) AND is_building = 1)
                                    )
                                    ${nameSearch}
                                `;
                            }
                        }
                    }else if('locationIdOnly' in filter){
                        sql_get_locations = `
                            SELECT l.location_id
                            FROM locations l
                            WHERE 
                            (l.location_id IN (${ids}) AND l.is_building = 1
                            OR l.parent_id IN (${ids}) AND l.is_building = 1)
                            ${parentIdQuery}
                            ${nameSearch}
                        `;
                        if('parentOnly' in filter){
                            if(filter['parentOnly']){
                                sql_get_locations = `
                                    SELECT l.location_id
                                    FROM locations l
                                    WHERE 
                                    l.location_id IN (
                                        SELECT DISTINCT(IF(parent_id > -1, parent_id, location_id))
                                        FROM locations
                                        WHERE 
                                        (location_id IN (${ids}) AND is_building = 1
                                        OR parent_id IN (${ids}) AND is_building = 1)
                                    )
                                    ${nameSearch}
                                `;
                            }
                        }
                    }else{
                        sql_get_locations += ` ${offsetLimit}`;
                    }

                    // console.log('sql_get_locations', sql_get_locations);

                    this.pool.getConnection((err, connection) => {
                      if (err) {
                        console.log('Error gettting pool connection ' + err);
                        throw new Error(err);
                      }
                      
                      connection.query(sql_get_locations,  (error, bldgs) => {
                        if (error) {
                            console.log('location.account.relation.listAllLocationsOnAccount', error, sql_get_locations);
                            throw Error('Cannot get all locations for this account');
                        }

                        if('count' in filter){
                            if(bldgs[0]['count'] == null){
                              resolve([{ count : 0 }]);
                            }else{
                              resolve(bldgs);
                            }
                        }else{
                          resolve(bldgs);
                        }

                      });
                      connection.release();
                    });
                }else{
                    if('count' in filter){
                        resolve([{ count : 0 }]);
                    }else{
                        resolve([]);
                    }
                }
            });

            connection.release();
        });

        
      });
    }

    public getLoctionSiblingsOfTenantRealtedToAccountAndLocation(accountId, locationId, count?){
        return new Promise((resolve, reject) => {
            const select = (count) ? 'COUNT(siblings.location_id) as count' : 'siblings.*';
            const sql_load = `
                SELECT ${select}
                FROM locations siblings
                INNER JOIN locations location ON siblings.parent_id = location.parent_id
                INNER JOIN location_account_relation lar ON siblings.location_id = lar.location_id

                WHERE  lar.account_id = ${accountId} AND lar.responsibility = 'Tenant' AND location.location_id = ${locationId} AND siblings.location_id != ${locationId} AND siblings.archived = 0
            `;
            
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load,  (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                });
                connection.release();
            });
            
        });
    }

    public getTaggedLocationsOfAccount(accountId = 0){
        return new Promise((resolve, reject) => {
            const sql_load = `
                SELECT 
                   l.*, 
                   IF(p.name IS NOT NULL, CONCAT(p.name,', ',l.name), l.name) as location_name
                FROM location_account_relation lar
                INNER JOIN locations l ON lar.location_id = l.location_id
                LEFT JOIN locations p ON l.parent_id = p.location_id

                WHERE lar.account_id = ? AND l.archived = 0
            `;
            const param = [accountId];
            this.pool.getConnection((err, connection) => {
                if (err) {                    
                    throw new Error(err);
                }
                connection.query(sql_load, param, (error, results, fields) => {
                  if (error) {
                    return console.log(error);
                  }
                  this.dbData = results;
                  resolve(this.dbData);
                });
                connection.release();
            });
            
        });
    }

    public getTenantAccountRoleOfBlgSublocs(buildingId=0, accountId=0): Promise<Array<Object>> {
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                            location_account_relation.location_id,
                            location_account_relation.account_id,
                            location_account_relation.responsibility,
                            locations.parent_id
                        FROM
                            location_account_relation
                        INNER JOIN
                            locations
                        ON
                            locations.location_id = location_account_relation.location_id
                        WHERE
                            location_account_relation.responsibility = 'Tenant'
                        AND
                            locations.parent_id = ?
                        AND
                            location_account_relation.account_id = ?`;
            const params = [buildingId, accountId];
            this.pool.getConnection((egc, connection) => {
                if (egc) {
                    throw new Error(egc);
                }
                connection.query(sql, params, (errInQuery, results) => {
                    if (errInQuery) {
                        console.log('location account relation getTenantAccountRoleOfBlgSublocs() call', sql, params);
                        throw new Error(errInQuery);
                    }
                    if (results.length) {
                        resolve(results);
                    } else {
                        reject(results)
                    }
                });
                connection.release();
            });
        });
    }

    public getTenantAccountRoleAssignToBuilding(buildingId=0, accountId=0): Promise<Array<Object>> { 
        return new Promise((resolve, reject) => {
            const sql = `SELECT
                            location_account_relation.location_id,
                            location_account_relation.account_id,
                            location_account_relation.responsibility,
                            locations.location_id AS parent_id
                        FROM
                            location_account_relation
                        INNER JOIN
                            locations
                        ON
                            locations.location_id = location_account_relation.location_id
                        WHERE
                            location_account_relation.responsibility = 'Tenant'
                        AND
                            locations.location_id = ?
                        AND
                            location_account_relation.account_id = ?`;
            const params = [buildingId, accountId];
            this.pool.getConnection((egc, connection) => {
                if (egc) {
                    throw new Error(egc);
                }
                connection.query(sql, params, (errInQuery, results) => {
                    if (errInQuery) {
                        console.log('location account relation getTenantAccountRoleOfBlgSublocs() call', sql, params);
                        throw new Error(errInQuery);
                    }
                    if (results.length) {
                        resolve(results);
                    } else {
                        reject(results)
                    }
                });
                connection.release();
            });
        });
    }

}
