
import { BaseClass } from './base.model';
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
			this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_load, uid, (error, results, fields) => {
          if (error) {
            return console.log(error);
          }
          this.dbData = results[0];
          this.setID(results[0]['mobility_impaired_details_id']);
          resolve(this.dbData);
          connection.release();
        });
        
      });
			
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
          connection.release();
        });
        
      });
			
		});
	}

	public dbUpdate() {
		return new Promise((resolve, reject) => {

			const sql_update = `UPDATE mobility_impaired_details SET
			user_id = ?, is_permanent = ?, duration_date = ?, assistant_type = ?, equipment_type = ?, evacuation_procedure = ?, date_created = ?, user_invitations_id = ?
			WHERE mobility_impaired_details_id = ?`;
			const param = [
			('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
			('is_permanent' in this.dbData) ? this.dbData['is_permanent'] : 0,
			('duration_date' in this.dbData) ? this.dbData['duration_date'] : null,
			('assistant_type' in this.dbData) ? this.dbData['assistant_type'] : null,
			('equipment_type' in this.dbData) ? this.dbData['equipment_type'] : null,
			('evacuation_procedure' in this.dbData) ? this.dbData['evacuation_procedure'] : null,
			('date_created' in this.dbData) ? this.dbData['date_created'] : '',
			('user_invitations_id' in this.dbData) ? this.dbData['user_invitations_id'] : 0,
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
          connection.release();
        });
        
      });
			

		});
	}

	public dbInsert() {
		return new Promise((resolve, reject) => {
			const sql_insert = `INSERT INTO mobility_impaired_details
			(user_id, is_permanent, duration_date, assistant_type, equipment_type, evacuation_procedure, date_created, user_invitations_id)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?);`;
			const param = [
			('user_id' in this.dbData) ? this.dbData['user_id'] : 0,
			('is_permanent' in this.dbData) ? this.dbData['is_permanent'] : 0,
			('duration_date' in this.dbData) ? this.dbData['duration_date'] : null,
			('assistant_type' in this.dbData) ? this.dbData['assistant_type'] : null,
			('equipment_type' in this.dbData) ? this.dbData['equipment_type'] : null,
			('evacuation_procedure' in this.dbData) ? this.dbData['evacuation_procedure'] : null,
			('date_created' in this.dbData) ? this.dbData['date_created'] : '',
			('user_invitations_id' in this.dbData) ? this.dbData['user_invitations_id'] : 0
			];
			
      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_insert, param, (err, results, fields) => {
          if (err) {
            console.log(sql_insert);
            throw new Error(err);
          }
          this.id = results.insertId;
          this.dbData['mobility_impaired_details_id'] = this.id;
          resolve(true);
          connection.release();
        });
        
      });

			

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

    public getImpairedUsersInLocationIds(locationIds, accountId, archived?){
        if(!archived){
            archived = 0;
        }
        return new Promise((resolve, reject) => {

            let locSql = '';
            if(locationIds){
                locSql = ` WHERE location_id IN (${locationIds}) `;
            }

            if (locationIds.length == 0) {
                resolve([]);
                return;
            }

            let accntSql = (accountId) ? ` AND account_id = ${accountId} ` : '';

            let sql = `
                SELECT
                    user_id,
                    first_name,
                    last_name,
                    email
                FROM users
                WHERE
                    archived = ${archived} ${accntSql} AND mobility_impaired = 1 AND
                    user_id IN (SELECT user_id FROM location_account_user ${locSql})
                OR
                    archived = ${archived} ${accntSql} AND mobility_impaired = 1 AND
                    user_id IN (SELECT user_id FROM user_em_roles_relation ${locSql})

                GROUP BY users.user_id
            `;

            this.pool.getConnection((err, connection) => {
              if (err) {                    
                  throw new Error(err);
              }

              connection.query(sql, (error, results) => {
                  if (error) {
                      console.log(sql);
                      throw Error('Cannot generate list of peep emergency users');
                  }

                  resolve(results);
                  connection.release();
              });

              
            });
            
        });
    }


  /**
   * @description
   * Generate a list of all Mobility Impaired
   * @param account_id
   * @param location
   * You have to supply this parameter if logged in as a TRP
   * @param type
   * if account - queries the location_account_user
   * if emergency - queries the user_em_roles_relation
   */
  public listAllMobilityImpaired(account_id = 0, location = [], type = 'account'): Promise<Array<object>> {

    return new Promise((resolve, reject) => {
      let whereClause = '';

      
      let sql_peep_users = '';
      if (location.length > 0) {
        whereClause += ` AND locations.location_id IN (${location.join(',')})`;
      }
      if (type === 'account') {
        sql_peep_users = `
        SELECT
          users.user_id,
          users.first_name,
          users.last_name,
          users.mobility_impaired,
          users.mobile_number,
          users.email,
          users.last_login,
          location_account_user.location_id,
          locations.name,
          mobility_impaired_details.mobility_impaired_details_id,
          mobility_impaired_details.is_permanent,
          mobility_impaired_details.duration_date,
          mobility_impaired_details.assistant_type,
          mobility_impaired_details.equipment_type,
          mobility_impaired_details.evacuation_procedure,
          mobility_impaired_details.date_created,
          IF (mobility_impaired_details.is_permanent = 1 AND mobility_impaired_details.duration_date > NOW(), 'expired', 'active') AS expiry
        FROM
          users
        INNER JOIN
          location_account_user
        ON
          users.user_id = location_account_user.user_id
        INNER JOIN
          locations
        ON
          locations.location_id = location_account_user.location_id
        LEFT JOIN
          mobility_impaired_details
        ON
          mobility_impaired_details.user_id = users.user_id
        WHERE
          users.account_id = ?
        AND
          users.mobility_impaired = 1
          ${whereClause}
        AND users.archived = 0
        GROUP BY users.user_id
      `;
      } else if (type === 'emergency') {
        sql_peep_users = `
        SELECT
            users.user_id,
            users.first_name,
            users.last_name,
            users.mobility_impaired,
            users.mobile_number,
            users.email,
            users.last_login,
            user_em_roles_relation.location_id,
            locations.name,
            mobility_impaired_details.mobility_impaired_details_id,
            mobility_impaired_details.is_permanent,
            mobility_impaired_details.duration_date,
            mobility_impaired_details.assistant_type,
            mobility_impaired_details.equipment_type,
            mobility_impaired_details.evacuation_procedure,
            mobility_impaired_details.date_created,
            IF (mobility_impaired_details.is_permanent = 1 AND mobility_impaired_details.duration_date > NOW(), 'expired', 'active') AS expiry
          FROM
            users
          INNER JOIN
            user_em_roles_relation
          ON
            users.user_id = user_em_roles_relation.user_id
          INNER JOIN
            locations
          ON
            locations.location_id = user_em_roles_relation.location_id
          LEFT JOIN
            mobility_impaired_details
          ON
            mobility_impaired_details.user_id = users.user_id
          WHERE
            users.account_id = ?
          AND
            users.mobility_impaired = 1 ${whereClause}
          AND users.archived = 0
          GROUP BY users.user_id
        `;
      }

      this.pool.getConnection((err, connection) => {
        if (err) {                    
            throw new Error(err);
        }

        connection.query(sql_peep_users, [account_id], (error, results) => {
          if (error) {
            console.log('mobility.impaired.details.listAllMobilityImpaired', error, sql_peep_users);
            throw Error('Cannot generate list of peep emergency users');
          }
          if (results.length > 0) {
            resolve(results);
          } else {
            reject('There are no peep');
          }
          
          connection.release();
        });
      });
      
       /*
      if (queryStat) {
        connection.query(sql_peep_account_users, [account_id], (error, results) => {
          if (error) {
            console.log('mobility.impaired.details.listAllMobilityImpaired', error, sql_peep_account_users);
            throw Error('Cannot generate list of peep account users');
          }
          if (results.length > 0) {
            for (const r of results) {
              if (uniqueIds.indexOf(r['user_id']) === -1) {
                queryResultSet.push(r);
                uniqueIds.push(r['user_id']); // just to be sure we get the unique ids
              }
            }
          }
          resolve(queryResultSet);
        });
      }
      */
    });
  }


}
