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

	   	router.get('/location/get-parent-locations-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getParentLocationsByAccount(req, res, next);
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

	private mergeObjects(obj1,obj2){
	    var obj3 = {};
	    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
	    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
	    return obj3;
	}

	private mergeToParent(data){
		
		for(let p in data){
			let parent = data[p];
			for(let c in data){
				let child = data[c];
				if(child.parent_id == parent.location_id){
					if(parent.sublocations === undefined){
						parent['sublocations'] = [];
					}
					parent.sublocations.push(child);
				}
			}
		}

		let finalData = [];
		for(let i in data){
			if(data[i]['parent_id'] == -1){
				finalData.push(data[i]);
			}
		}

		return finalData;
	}

	public getParentLocationsByAccount(req: Request, res: Response, next: NextFunction){
		let  response = { status : false, message : '', data : [] },
			fetchingProgress = {
				location : false, wardens : false, frptrp : false, accountsLocations : false
			},
			fetchedDatas = { 
				locations : <any>[], wardens:<any>[], frptrp:<any>[], accountLocations:<any>[]
			},
			location = new Location(),
			wardensModel = new LocationAccountUser(),
			frpTrpModel = new LocationAccountUser(),
			callWait = (callBack) => {
				setTimeout(() => {
					if(fetchingProgress.location && fetchingProgress.wardens && fetchingProgress.frptrp && fetchingProgress.accountsLocations){
						callBack();
					}else{
						callWait(callBack);
					}
					
				}, 100);
			},
			responseSend = () => {
				response.data;
				res.statusCode = 200;
				res.send(response);
			},
			addWardenToLocations = (locations, wardens) => {
				for(let i in locations){
					if(locations[i]['wardens'] === undefined){ 
						locations[i]['wardens'] = [];
					}
					for(let w in wardens){
						if(locations[i]['location_id'] == wardens[w]['location_id']){
							locations[i]['wardens'].push(wardens[w]);
						}
					}
				}

				return locations;
			},
			addFrpTrpToLocations = (locations, frptrps) => {
				for(let i in locations){
					if(locations[i]['frp'] === undefined){ 
						locations[i]['frp'] = [];
					}
					if(locations[i]['trp'] === undefined){ 
						locations[i]['trp'] = [];
					}

					for(let w in frptrps){
						if(locations[i]['location_id'] == frptrps[w]['location_id']){
							if(frptrps[w]['role_id'] == 1){
								locations[i]['frp'].push(frptrps[w]);
							}else if(frptrps[w]['role_id'] == 2){
								locations[i]['trp'].push(frptrps[w]);
							}
						}
					}
				}

				return locations;
			},
			countTotalWardenOfParentLocation = (parentData) => {
				let wardens = {},
					searchChildWardens = (children) => {
						for(let i in children){
							if(children[i]['sublocations'] !== undefined){
								if( Object.keys(children[i]['sublocations']).length > 0 ){
									searchChildWardens(children[i]['sublocations']);
								}
							}
							for(let x in children[i]['wardens']){
								if( wardens[ children[i]['wardens'][x]['user_id'] ] === undefined ){
									wardens[ children[i]['wardens'][x]['user_id'] ] = children[i]['wardens'][x];
								}
							}
						}
					};

				searchChildWardens(parentData.sublocations);
				return Object.keys(wardens).length;
			},
			countTotalImpairedOfParentLocation = (parentData) => {
				let counter = 0,
					searchChildWardens = (children) => {
						for(let i in children){
							let innerCount = 0;
							if(children[i]['sublocations'] !== undefined){
								if( Object.keys(children[i]['sublocations']).length > 0 ){
									searchChildWardens(children[i]['sublocations']);
								}
							}
							for(let x in children[i]['wardens']){
								if(children[i]['wardens'][x]['mobility_impaired'] == 1){
									innerCount += 1;
								}
							}
							for(let x in children[i]['frp']){
								if(children[i]['frp'][x]['mobility_impaired'] == 1){
									innerCount += 1;
								}
							}
							for(let x in children[i]['trp']){
								if(children[i]['trp'][x]['mobility_impaired'] == 1){
									innerCount += 1;
								}
							}

							counter += innerCount;
						}
					};

				searchChildWardens(parentData.sublocations);
				return counter;
			};

		callWait(() => {

			fetchedDatas.locations = addWardenToLocations(fetchedDatas.locations, fetchedDatas.wardens);
			fetchedDatas.locations = addFrpTrpToLocations(fetchedDatas.locations, fetchedDatas.frptrp);
			
			let toMergedData = Object.create(fetchedDatas.locations),
				mergedData = this.mergeToParent(toMergedData),
				finalData = [];

			for(let i in mergedData){
				mergedData[i]['overall_warden_count'] = countTotalWardenOfParentLocation(mergedData[i]);
				mergedData[i]['overall_impaired'] = countTotalImpairedOfParentLocation(mergedData[i]);
			}
			

			for(let i in fetchedDatas.accountLocations){
				for(let n in mergedData){
					if(fetchedDatas.accountLocations[i]['location_id'] == mergedData[n]['location_id']){
						mergedData[n]['no_locations'] = 0;
						mergedData[n]['level_occupied'] = mergedData[n]['sublocations'].length;
						finalData.push(mergedData[n]);
					}
				}
			}

			response.data = finalData;
			
			responseSend();

		});

		wardensModel.getWardensByAccountId(req.params['account_id']).then(
			(wardens) => {
				fetchedDatas.wardens = wardens;
				fetchingProgress.wardens = true;
			},
			() => {
				fetchingProgress.wardens = true;
			}
		);

		frpTrpModel.getFrpTrpByAccountId(req.params['account_id']).then(
			(frptrps) => {
				fetchedDatas.frptrp = frptrps;
				fetchingProgress.frptrp = true;
			},
			() => {
				fetchingProgress.frptrp = true;
			}
		);

		location.getAllLocations().then(
			(results) => {
				fetchedDatas.locations = results;
				fetchingProgress.location = true;
			},
			() => {
				responseSend();
			}
		);

		location.getParentLocationByAccountId(req.params['account_id']).then(
			(results) => {
				fetchedDatas.accountLocations = results;
				fetchingProgress.accountsLocations = true;
			},
			(e) => {
				fetchingProgress.accountsLocations = true;
			}
		);

	}

}

  