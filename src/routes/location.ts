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
	   	
	   	router.get('/location/get/:location_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getId(req, res, next);
	   	});

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

	private countTotalImpairedOfParentLocation = (parentData) => {
		let counter = 0,
			count = (countData) => {
				let thisCount =  0;
				for(let x in countData['wardens']){
					if(countData['wardens'][x]['mobility_impaired'] == 1){
						thisCount += 1;
					}
				}
				for(let x in countData['frp']){
					if(countData['frp'][x]['mobility_impaired'] == 1){
						thisCount += 1;
					}
				}
				for(let x in countData['trp']){
					if(countData['trp'][x]['mobility_impaired'] == 1){
						thisCount += 1;
					}
				}
				return thisCount;
			},
			searchChildWardens = (children) => {
				for(let i in children){
					if(children[i]['sublocations'] !== undefined){
						if( Object.keys(children[i]['sublocations']).length > 0 ){
							searchChildWardens(children[i]['sublocations']);
						}
					}
					counter += count(children[i]);
				}
			};

		counter += count(parentData);
		searchChildWardens(parentData.sublocations);
		return counter;
	}

	private countTotalFloorWarden = (parentData) => {
		let counter = 0,
			count = (countData) => {
				let thisCount =  0;
				for(let x in countData['wardens']){
					//em_role_id = 10 == 'Floor Warden'
					if(countData['wardens'][x]['em_role_id'] == 10){
						thisCount += 1;
					}
				}
				return thisCount;
			},
			searchChildWardens = (children) => {
				for(let i in children){
					if(children[i]['sublocations'] !== undefined){
						if( Object.keys(children[i]['sublocations']).length > 0 ){
							searchChildWardens(children[i]['sublocations']);
						}
					}
					counter += count(children[i]);
				}
			};

		counter += count(parentData);
		searchChildWardens(parentData.sublocations);
		return counter;
	}

	private countTotalWardenOfParentLocation = (parentData) => {
		let wardens = {},
			addToWarden = (oData) => {
				for(let w in oData.wardens){
					if(wardens[ oData.wardens[w]['user_id'] ] === undefined){
						wardens[ oData.wardens[w]['user_id'] ] = oData.wardens[w];
					}
				}
			},
			searchChildWardens = (children) => {
				for(let i in children){
					if(children[i]['sublocations'] !== undefined){
						if( Object.keys(children[i]['sublocations']).length > 0 ){
							searchChildWardens(children[i]['sublocations']);
						}
					}
					addToWarden(children[i]);
				}
			};

		addToWarden(parentData);
		searchChildWardens(parentData.sublocations);
		return Object.keys(wardens).length;
	}

	private addWardenToLocations = (locations, wardens) => {
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
	}

	private addFrpTrpToLocations = (locations, frptrps) => {
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
	}

	private addWardenCounts = (locations) => {
		let searchChild = (children) => {
				for(let i in children){
					if(children[i]['sublocations'] !== undefined){
						if( Object.keys(children[i]['sublocations']).length > 0 ){
							searchChild(children[i]['sublocations']);
						}
					}
					children[i]['overall_warden_count'] = this.countTotalWardenOfParentLocation(children[i]);
					children[i]['overall_impaired'] = this.countTotalImpairedOfParentLocation(children[i]);
					children[i]['overall_floor_warden'] = this.countTotalFloorWarden(children[i]);
				}
			};

		searchChild(locations);
		return locations;
	}

	public getId(req: Request, res: Response, next: NextFunction){
		let locationId = req.params.location_id,
			response = { status : false, message : '', data : [] },
			fetchingProgress = {
				location : false, wardens : false, frptrp : false, accountsLocations : false
			},
			fetchedDatas = { 
				locations : <any>[], wardens:<any>[], frptrp:<any>[], accountLocations:<any>[]
			},
			user = req['user'],
			location = new Location(),
			locationSingle = new Location(locationId),
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
			};

		callWait(() => {

			fetchedDatas.locations = this.addWardenToLocations(fetchedDatas.locations, fetchedDatas.wardens);
			fetchedDatas.locations = this.addFrpTrpToLocations(fetchedDatas.locations, fetchedDatas.frptrp);
			
			let toMergedData = Object.create(fetchedDatas.locations),
				mergedData = this.mergeToParent(toMergedData),
				finalData = [];

			this.addWardenCounts(mergedData);
			
			for(let i in fetchedDatas.accountLocations){
				for(let n in mergedData){
					if(fetchedDatas.accountLocations[i]['location_id'] == mergedData[n]['location_id']){
						mergedData[n]['no_locations'] = 0;
						mergedData[n]['level_occupied'] = mergedData[n]['sublocations'].length;
						finalData.push(mergedData[n]);
					}
				}
			}

			response.data = finalData[0];
			
			responseSend();

		});

		wardensModel.getWardensByAccountId(user['account_id']).then(
			(wardens) => {
				fetchedDatas.wardens = wardens;
				fetchingProgress.wardens = true;
			},
			() => {
				fetchingProgress.wardens = true;
			}
		);

		frpTrpModel.getFrpTrpByAccountId(user['account_id']).then(
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

		locationSingle.load().then(
			(locationData) => {
				fetchedDatas.accountLocations = [];
				fetchedDatas.accountLocations.push(locationData);
				fetchingProgress.accountsLocations = true;
			},
			(e) => {
				fetchingProgress.accountsLocations = true;
			}
		);
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
			};

		callWait(() => {

			fetchedDatas.locations = this.addWardenToLocations(fetchedDatas.locations, fetchedDatas.wardens);
			fetchedDatas.locations = this.addFrpTrpToLocations(fetchedDatas.locations, fetchedDatas.frptrp);
			
			let toMergedData = Object.create(fetchedDatas.locations),
				mergedData = this.mergeToParent(toMergedData),
				finalData = [];

			this.addWardenCounts(mergedData);

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

  