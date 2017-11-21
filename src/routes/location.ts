import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Location } from '../models/location.model';
import { LocationAccountUser } from '../models/location.account.user';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import  * as fs  from 'fs';
import * as path from 'path';
const validator = require('validator');
const md5 = require('md5');

/**
 * / route
 *
 * @class LocationRoute
 */
 export class LocationRoute extends BaseRoute {
	/**
   	* Create the routes.
   	*
   	* @class AccountRoute
   	* @method create
   	* @static
   	*/
	public static create(router: Router) {
	   	// add route
	   	
	   	router.get('/location/get-by-account/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByAccountId(req, res, next);
	   	});

	   	router.get('/location/get-by-userid-accountid/:user_id/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByUserIdAndAccountId(req, res, next);
	   	});

	   	router.get('/location/get-for-listing/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getForListing(req, res, next);
	   	});

   	}

	/**
	* Constructor
	*
	* @class RegisterRoute
	* @constructor
	*/
	constructor() {	
		super();
	}

	public getByAccountId(req: Request, res: Response, next: NextFunction){
		let  response = {
				status : false,
				message : '',
				data : {}
			},
			location = new Location();

		// Default status code
		res.statusCode = 400;

		location.getManyByAccountId(req.params['account_id']).then(
			(locaData) => {
				response.status = true;
				res.statusCode = 200;
				response.data = locaData;
				res.send(response);
			},
			(e) => {
				response.status = true;
				res.statusCode = 200;
				response.message = 'no accounts found';
				res.send(response);
			}
		);
	}

	public getByUserIdAndAccountId(req: Request, res: Response, next: NextFunction){
		let  response = {
				status : false,
				message : '',
				data : {}
			},
			locAccUser = new LocationAccountUser();

		// Default status code
		res.statusCode = 200;

		let arrWhere = [];
		arrWhere.push([ 'user_id', '=', req.params.user_id ]);
		arrWhere.push([ 'account_id', '=', req.params.account_id ]);

		locAccUser.getMany(arrWhere, true).then(
			(locations) => {
				response.data = locations;
				res.send(response);
			},
			() => {
				res.send(response);
			}
		);

	}

	public getForListing(req: Request, res: Response, next: NextFunction){
		let  response = {
				status : false,
				message : '',
				data : []
			},
			locationFormat = {
				name : '',
				parent_id : -1,
				state : '',
				no_locations : 0,
				level_occupied : 0,
				frp : [],
				compliance_percentage : 0,
				wardens : [],
				mobility_impaired : 0
			},
			location = new Location(),
			wardensModel = new LocationAccountUser(),
			frpTrpModel = new LocationAccountUser();

		// Default status code
		res.statusCode = 200;

		location.getManyByAccountId(req.params['account_id']).then(
			(results) => {

				for(let i in results){
					let d = Object.assign(locationFormat, results[i]);
					
					d.level_occupied = Object.keys(results[i]['sublocations']).length;
					response.data.push(d);
				}


				let 
				callBackWarden = (wardens) => {
					for(let i in response.data){
						for(let w in wardens){
							console.log(wardens[w]);
							if(wardens[w]['location_id'] == response.data[i]['location_id']){
								response.data[i]['wardens'].push(wardens[w]);
							}
						}

						if(parseInt(i) == (Object.keys(response.data).length - 1)){
							frpTrpModel.getFrpTrpByAccountId(req.params['account_id']).then(
								(frptrps) => {
									callBackFrpTrp(frptrps);
								},
								() => {
									callBackFrpTrp({});
								}
							);
						}
					}
				},
				callBackFrpTrp = (frptrps) => {
					for(let i in response.data){
						for(let w in frptrps){
							console.log(frptrps[w]);
							if(frptrps[w]['location_id'] == response.data[i]['location_id'] && frptrps[w]['role_id'] == 1){
								response.data[i]['frp'].push(frptrps[w]);
							}
						}

						if(parseInt(i) == (Object.keys(response.data).length - 1)){
							res.statusCode = 200;
							res.send(response);
						}
					}
				}

				wardensModel.getWardensByAccountId(req.params['account_id']).then(
					(wardensResults) => {
						callBackWarden(wardensResults);
					},
					() => {
						callBackWarden({});
					}
				);
				
				
			},
			(e) => {
				response.status = true;
				res.statusCode = 200;
				response.message = 'no accounts found';
				res.send(response);
			}
		);
	}

}

  