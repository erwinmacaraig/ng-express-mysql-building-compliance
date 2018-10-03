import * as db from 'mysql2';
import { BaseClass } from './base.model';
const dbconfig = require('../config/db');

import * as Promise from 'promise';
const aws_credential = require('../config/aws-access-credentials.json');
export class ComplianceDocumentsModel extends BaseClass {

    constructor(id?: number) {
        super();
        if (id) {
            this.id = id;
        }
    }

    public load() {
        return new Promise((resolve, reject) => {
            const sql_load = 'SELECT * FROM compliance_documents WHERE compliance_documents_id = ?';
            const uid = [this.id];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_load, uid, (error, results, fields) => {
                if (error) {
                    return console.log(error);
                }
                if (!results.length){
                    reject('Compliance docs not found');
                } else {
                    this.dbData = results[0];
                    this.setID(results[0]['compliance_documents_id']);
                    resolve(this.dbData);
                }
            });
            connection.end();
        });
    }

    public getWhere(arrWhere){
        return new Promise((resolve) => {

            let sql = `SELECT 
                  accounts.account_directory_name,
                  parentLocation.location_directory_name as parent_location_directory_name,
                  parentLocation.is_building as parent_is_building,
                  locations.location_directory_name,
                  compliance_kpis.name,
                  compliance_documents.*,
                  compliance_kpis.directory_name,
                  compliance_kpis.validity_in_months,
                  DATE_FORMAT(compliance_documents.date_of_activity, "%e/%c/%Y") as date_of_activity_formatted,
                  compliance_kpis.validity_in_months,
                  IF (date_of_activity = '0000-00-00', NULL,
                    DATE_FORMAT(DATE_ADD(compliance_documents.date_of_activity, INTERVAL compliance_kpis.validity_in_months MONTH), "%e/%c/%Y"))as valid_till
                  FROM
                    compliance_documents
                  INNER JOIN
                    compliance_kpis ON compliance_documents.compliance_kpis_id =  compliance_kpis.compliance_kpis_id
                  INNER JOIN
                    accounts ON accounts.account_id = compliance_documents.account_id
                  INNER JOIN 
                    locations ON locations.location_id = compliance_documents.building_id
                  LEFT JOIN locations as parentLocation 
                    ON parentLocation.location_id = locations.parent_id
                    `;
            for(let i in arrWhere){
                if(parseInt(i) == 0){
                    sql += ` WHERE `;
                }else{
                    sql += ` AND `;
                }
                sql += arrWhere[i];
            }
            sql += ` ORDER BY timestamp DESC `;
            const connection = db.createConnection(dbconfig);            
            connection.query(sql, (error, results, fields) => {
                if (error) {
                    console.log(error, sql);
                }
                for (const r of results) {
                    // let urlPath = `${aws_credential['AWS_S3_ENDPOINT']}${aws_credential['AWS_Bucket']}/`;
                    let urlPath = '';
                    urlPath += r['account_directory_name'];
                    if (r['parent_location_directory_name'] != null && r['parent_location_directory_name'].trim().length > 0) {
                        if(r['parent_is_building'] == 1){
                            urlPath +=  `/${r['parent_location_directory_name']}`;
                        }
                    }
                    urlPath += `/${r['location_directory_name']}/${r['directory_name']}/${r['document_type']}/`+encodeURIComponent(r['file_name']);
                    r['urlPath'] = urlPath;
                }
                this.dbData = results;
                resolve(results);
            });
            connection.end();

        });
    }
    
    public dbUpdate() {
        return new Promise((resolve, reject) => {
            const sql_update = `UPDATE compliance_documents SET
            account_id = ?, building_id = ?, compliance_kpis_id = ?,
            document_type = ?, file_name = ?, override_document = ?,
            description = ?, date_of_activity = ?, viewable_by_trp = ?,
            file_size = ?, file_type = ?, timestamp = ?
            WHERE compliance_documents_id = ? `;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : null,
            ('document_type' in this.dbData) ? this.dbData['document_type'] : null,
            ('file_name' in this.dbData) ? this.dbData['file_name'] : null,
            ('override_document' in this.dbData) ? this.dbData['override_document'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null,
            ('date_of_activity' in this.dbData) ? this.dbData['date_of_activity'] : null,
            ('viewable_by_trp' in this.dbData) ? this.dbData['viewable_by_trp'] : null,
            ('file_size' in this.dbData) ? this.dbData['file_size'] : null,
            ('file_type' in this.dbData) ? this.dbData['file_type'] : null,
            ('timestamp' in this.dbData) ? this.dbData['timestamp'] : null,
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
            const sql_update = `INSERT INTO compliance_documents
            ( account_id, building_id, compliance_kpis_id, document_type, file_name, override_document, description, date_of_activity, viewable_by_trp, file_size, file_type, timestamp )
            VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`;
            const param = [
            ('account_id' in this.dbData) ? this.dbData['account_id'] : null,
            ('building_id' in this.dbData) ? this.dbData['building_id'] : null,
            ('compliance_kpis_id' in this.dbData) ? this.dbData['compliance_kpis_id'] : null,
            ('document_type' in this.dbData) ? this.dbData['document_type'] : null,
            ('file_name' in this.dbData) ? this.dbData['file_name'] : null,
            ('override_document' in this.dbData) ? this.dbData['override_document'] : null,
            ('description' in this.dbData) ? this.dbData['description'] : null,
            ('date_of_activity' in this.dbData) ? this.dbData['date_of_activity'] : null,
            ('viewable_by_trp' in this.dbData) ? this.dbData['viewable_by_trp'] : null,
            ('file_size' in this.dbData) ? this.dbData['file_size'] : null,
            ('file_type' in this.dbData) ? this.dbData['file_type'] : null,
            ('timestamp' in this.dbData) ? this.dbData['timestamp'] : null,
            this.ID() ? this.ID() : 0
            ];
            const connection = db.createConnection(dbconfig);
            connection.query(sql_update, param, (err, results, fields) => {
                if (err) {
                    console.log(sql_update, param);
                    throw new Error(err);
                }
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
            if ('compliance_documents_id' in createData) {
              this.id = createData.compliance_documents_id;
            }
            resolve(this.write());
        });
    }

}
