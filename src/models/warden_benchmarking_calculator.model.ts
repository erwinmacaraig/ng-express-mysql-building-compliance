import { BaseClass } from './base.model';
import * as db from 'mysql2';
import * as Promise from 'promise';

const dbconfig = require('../config/db.json');
export class WardenBenchmarkingCalculator extends BaseClass {
  constructor(id?: number) {
    super();
    if (id) {
      this.id = id;
    }
  }
  public load() {
    return new Promise((resolve, reject) => {
      const sql_load = `SELECT * FROM warden_benchmark_calculation
        WHERE warden_benchmark_calculation_id = ?`;
        const connection = db.createConnection(dbconfig);
        connection.query(sql_load, [this.id], (error, results, fields) => {
          if (error) {
            console.log('warden_benchmarking_calculator.load', error, sql_load);
            throw new Error('No record found');
          }
          if (!results.length) {
            reject('Cannot load calculation details');
          } else {
            this.dbData = results[0];
            this.setID(results[0]['warden_benchmark_calculation_id']);
            resolve(this.dbData);
          }
        });
        connection.end();
    });
  }

  public getBenchmarkingResultOnLocation(location_id: number = 0) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM warden_benchmark_calculation
      WHERE location_id = ?`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql, [location_id], (error, results, fields) => {
        if (error) {
          console.log('warden_benchmarking_calculator.getBenchmarkingResultOnLocation', sql, error);
          throw new Error('Internal problem, cannot get calculation results');
        }
        if (!results.length) {
          reject('No calculations found');
        } else {
          this.dbData = results[0];
          this.setID(results[0]['warden_benchmark_calculation_id']);
          resolve(results[0]['total_estimated_wardens']);
        }
      });
      connection.end();
    });
  }

  public getBulkBenchmarkingResultOnLocations(array_location_id = []) {
    return new Promise((resolve, reject) => {
      const locationIds = array_location_id.join(', ');
      const calculations = {};
      const sql = `SELECT * FROM warden_benchmark_calculation
      WHERE location_id IN (${locationIds})`;
      const connection = db.createConnection(dbconfig);
      connection.query(sql, [], (error, results, fields) => {
        if (error) {
          console.log('warden_benchmarking_calculator.getBulkBenchmarkingResultOnLocations', sql, error);
          throw new Error('Internal problem, cannot get calculation results');
        }
        if (!results.length) {
          // reject('No calculations found for these locations ' + locationIds);
          resolve({});
        } else {
          for (let i = 0; i < results.length; i++) {
            calculations[results[i]['location_id']] = results[i];
          }
          resolve(calculations);
        }
      });
      connection.end();
    });
  }
  public dbUpdate() {
    return new Promise((resolve, reject) => {
      const sql_update = `UPDATE warden_benchmark_calculation SET
          type = ?,
          number_of_floors = ?,
          number_of_occupants = ?,
          staff_percentage = ?,
          layout_type = ?,
          full_time_wardens_percentage = ?,
          mobility_impaired_percentage = ?,
          crossing_road_required = ?,
          total_estimated_wardens = ?,
          udpated_by = ?
        WHERE
          location_id = ?`;
      const values = [
        ('type' in this.dbData) ? this.dbData['type'] : '',
        ('number_of_floors' in this.dbData) ? this.dbData['number_of_floors'] : '',
        ('number_of_occupants' in this.dbData) ? this.dbData['number_of_occupants'] : 0,
        ('staff_percentage' in this.dbData) ? this.dbData['staff_percentage'] : 0,
        ('layout_type' in this.dbData) ? this.dbData['layout_type'] : '',
        ('full_time_wardens_percentage' in this.dbData) ? this.dbData['full_time_wardens_percentage'] : 0,
        ('mobility_impaired_percentage' in this.dbData) ? this.dbData['mobility_impaired_percentage'] : 0,
        ('crossing_road_required' in this.dbData) ? this.dbData['crossing_road_required'] : 0,
        ('total_estimated_wardens' in this.dbData) ? this.dbData['total_estimated_wardens'] : 0,
        ('updated_by' in this.dbData) ? this.dbData['updated_by'] : 0,
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_update, values, (error, results, fields) => {
        if (error) {
          console.log('warden_benchmarking_calculator.dbUpdate', error, sql_update);
          throw new Error('Cannot perform record update');
        }
        resolve(true);
      });
      connection.end();
    });
  }

  public dbInsert() {
    return new Promise((resolve, reject) => {
      const sql_insert = `INSERT INTO warden_benchmark_calculation (
          location_id,
          type,
          number_of_floors,
          number_of_occupants,
          staff_percentage,
          layout_type,
          full_time_wardens_percentage,
          mobility_impaired_percentage,
          crossing_road_required,
          total_estimated_wardens,
          updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
          type = ?,
          number_of_floors = ?,
          number_of_occupants = ?,
          staff_percentage = ?,
          layout_type = ?,
          full_time_wardens_percentage = ?,
          mobility_impaired_percentage = ?,
          crossing_road_required = ?,
          total_estimated_wardens = ?,
          updated_by = ?`;
      const values = [
        ('location_id' in this.dbData) ? this.dbData['location_id'] : 0,
        ('type' in this.dbData) ? this.dbData['type'] : '',
        ('number_of_floors' in this.dbData) ? this.dbData['number_of_floors'] : '',
        ('number_of_occupants' in this.dbData) ? this.dbData['number_of_occupants'] : 0,
        ('staff_percentage' in this.dbData) ? this.dbData['staff_percentage'] : 0,
        ('layout_type' in this.dbData) ? this.dbData['layout_type'] : '',
        ('full_time_wardens_percentage' in this.dbData) ? this.dbData['full_time_wardens_percentage'] : 0,
        ('mobility_impaired_percentage' in this.dbData) ? this.dbData['mobility_impaired_percentage'] : 0,
        ('crossing_road_required' in this.dbData) ? this.dbData['crossing_road_required'] : 0,
        ('total_estimated_wardens' in this.dbData) ? this.dbData['total_estimated_wardens'] : 0,
        ('updated_by' in this.dbData) ? this.dbData['updated_by'] : 0,
        ('type' in this.dbData) ? this.dbData['type'] : '',
        ('number_of_floors' in this.dbData) ? this.dbData['number_of_floors'] : '',
        ('number_of_occupants' in this.dbData) ? this.dbData['number_of_occupants'] : 0,
        ('staff_percentage' in this.dbData) ? this.dbData['staff_percentage'] : 0,
        ('layout_type' in this.dbData) ? this.dbData['layout_type'] : '',
        ('full_time_wardens_percentage' in this.dbData) ? this.dbData['full_time_wardens_percentage'] : 0,
        ('mobility_impaired_percentage' in this.dbData) ? this.dbData['mobility_impaired_percentage'] : 0,
        ('crossing_road_required' in this.dbData) ? this.dbData['crossing_road_required'] : 0,
        ('total_estimated_wardens' in this.dbData) ? this.dbData['total_estimated_wardens'] : 0,
        ('updated_by' in this.dbData) ? this.dbData['updated_by'] : 0
      ];
      const connection = db.createConnection(dbconfig);
      connection.query(sql_insert, values, (error, results, fields) => {
        if (error) {
          console.log('warden_benchmarking_calculator.dbInsert', error, sql_insert);
          throw new Error('Cannot insert record to db');
        }
        this.id = results.insertId;
        this.dbData['warden_benchmark_calculation_id'] = this.id;
        resolve(true);
      });
      connection.end();
    });
  }

  public create(createData: object = {}) {
    return new Promise((resolve, reject) => {
      Object.keys(createData).forEach((key) => {
        this.dbData[key] = createData[key];
      });
      resolve(this.dbInsert());
    });
  }

}

