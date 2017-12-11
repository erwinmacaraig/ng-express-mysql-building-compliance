import { Account } from '../models/account.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { Location } from '../models/location.model';
import { LocationAccountUser } from '../models/location.account.user';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as fs from 'fs';
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

      router.get('/location/get/:location_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {

        new LocationRoute().getLocation(req, res).then((data) => {
          return res.status(200).send(data);
          /*
          {
          'location': location.getDBData(),
          'sublocation': sublocations
          }
          */
         }).catch((e) => {
            return res.status(400).send({
              message: 'No location found'
            });
         });

	   		 // new LocationRoute().getLocation(req, res);
	   	});

	   	router.get('/location/get-by-account/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByAccountId(req, res, next);
	   	});

	   	router.get('/location/get-by-userid-accountid/:user_id/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByUserIdAndAccountId(req, res, next);
	   	});

       	router.get('/location/get-parent-locations-by-account-id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new LocationRoute().getParentLocationsByAccount(req, res).then((data) => {
              return res.status(200).send(data);
            }).catch((err) => {
              return res.status(400).send({
                message: 'Error getting locations'
            	});
       		});
       	});

       	router.post('/location/create', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().createLocation(req, res).then((data) => {
	            return res.status(200).send({
	              message: 'Create location successful'
	            });
	        }).catch((e) => {
	            return res.status(400).send({
	              message: 'Bad Request'
	            });
	        });
      	});

      	router.post('/sublocation/create', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().createSublocation(req, res).then((sublocationData) => {
	            return res.status(200).send({
	            	data : sublocationData,
	           		message: 'Create sublocation successful'
	            });
	        }).catch((e) => {
	            return res.status(400).send({
	            	message: e
	            });
	        });
      	});

		router.post('/location/search-db-location', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().searchDbForLocation(req, res);
		});

		router.get('/location/get-deep-by-id/:location_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().getDeepLocationsById(req, res);
		});

		router.post('/location/get-by-ids', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().getLocationsByMultipleId(req, res);
		});

		router.post('/location/check-user-verified', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().checkUserVerifiedInLocation(req, res);
		});

		router.post('/location/archive', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new LocationRoute().archiveLocation(req, res).then((data) => {
	            return res.status(200).send({
	           		message: 'Successful'
	            });
	        }).catch((e) => {
	            return res.status(400).send({
	            	message: e
	            });
	        });
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

  	public searchDbForLocation(req: AuthRequest, res: Response) {
        const location = new Location();
        location.search(
          req.body.formatted_address,
          req.body.google_place_id
        ).then((results) => {
          if(results.length) {
            return res.status(200).send({
              message: 'Results found',
              count: results.length,
              result: results
            });
          }
          else {
            return res.status(200).send({
              message: 'No results found',
              count: 0
            });
          }

        }).catch((e) => {
          return res.status(400).send({
            message: `Unable to fulfill request`
          });
        });
    }


  	public async createLocation(req: AuthRequest, res: Response) {

        let parent_id = -1;
        const dbLocationData = {};
        dbLocationData['parent_id'] = parent_id;
        Object.keys(req.body).forEach((key) => {
          switch (key) {
            case 'location_name':
              dbLocationData['name'] = req.body.location_name ? req.body.location_name: '';
            break;
            case 'unit':
              dbLocationData['unit'] = req.body.unit;
            break;
            case 'street_number':
              dbLocationData['street'] = req.body.street_number + ' ';
            break;
            case 'street':
              dbLocationData['street'] += req.body.street;
            break;
            case 'city':
              dbLocationData['city'] = req.body.city;
            break;
            case 'state':
              dbLocationData['state'] = req.body.state;
            break;
            case 'postal_code':
              dbLocationData['postal_code'] = req.body.postal_code;
            break;
            case 'country':
              dbLocationData['country'] = req.body.country;
            break;
            case 'formatted_address':
              dbLocationData['formatted_address'] = req.body.formatted_address;
            break;
            case 'latitude':
              dbLocationData['lat'] = req.body.latitude;
            break;
            case 'longitude':
              dbLocationData['lng'] = req.body.longitude;
            break;
            case 'photoUrl':
              dbLocationData['google_photo_url'] = req.body.photoUrl;
            break;
            case 'google_place_id':
              dbLocationData['google_place_id'] = req.body.google_place_id;
            break;
          }
        });
        console.log(dbLocationData);
        const location = new Location();
        let locationAccntUser;
        let locationAccnt;
        // we need to check the role(s)
        const userRoleRel = new UserRoleRelation();
        const roles = await userRoleRel.getByUserId(req.user.user_id);

        // what is the highest rank role
        let r = 100;
        for (let i = 0; i < roles.length; i++) {
          if(r > parseInt(roles[i]['role_id'], 10)) {
            r = roles[i]['role_id'];
          }
        }

        const roles_text = ['', 'Manager', 'Tenant'];
        // create main location
        try {
          await location.create(dbLocationData);
          parent_id = location.ID();
          locationAccnt = new LocationAccountRelation();
          await locationAccnt.create({
            'location_id': parent_id,
            'account_id': req.user.account_id,
            'responsibility': roles_text[r]
          });
          dbLocationData['parent_id'] = parent_id;
          locationAccntUser = new LocationAccountUser();
          await locationAccntUser.create({
            location_id: parent_id,
            account_id: req.user.account_id,
            user_id: req.user.user_id,
            role_id: r
          });
        } catch (er) {
          throw new Error('Unable to create main location');
        }

        // create sublevels (sublocations)
        for (let i = 0; i < req.body.sublevels.length; i++) {
          try {
            const subLevel = new Location();
            locationAccnt = new LocationAccountRelation();

            dbLocationData['name'] = req.body.sublevels[i];
            await subLevel.create(dbLocationData);

            await locationAccnt.create({
              'location_id': subLevel.ID(),
              'account_id': req.user.account_id,
              'responsibility': roles_text[r]
            });
            locationAccntUser = new LocationAccountUser();
            await locationAccntUser.create({
              location_id:  subLevel.ID(),
              account_id: req.user.account_id,
              user_id: req.user.user_id,
              role_id: 2
            });

          } catch (e) {
            throw new Error('Unable to process sub levels');
          }
        }
        return {
          status: 'Success'
        };
    }

    public async createSublocation(req: AuthRequest, res: Response){
    	let parentId = req.body.parent_id,
    		sublocation_name = req.body.name,
    		locationParent = new Location(),
    		locationSub = new Location(),
    		userRoleRel = new UserRoleRelation();

    	let locations = await locationParent.getByInIds(parentId),
    		locationAccntUser = new LocationAccountUser(),
    		locationAccnt = new LocationAccountRelation(),
    		subData = {},
    		roles = await userRoleRel.getByUserId(req.user.user_id);

    	// what is the highest rank role
    	let r = 100;
    	for (let i = 0; i < roles.length; i++) {
    		if(r > parseInt(roles[i]['role_id'], 10)) {
    			r = roles[i]['role_id'];
    		}
    	}

        const roles_text = ['', 'Manager', 'Tenant'];

    	if(Object.keys(locations).length > 0){
    		for(let i in locations[0]){
				if(i !== 'location_id'){
					subData[i] = locations[0][i];
				}
			}

			subData['name'] = sublocation_name;
			subData['parent_id'] = parentId;
			subData['order'] = null;

			try{
				await locationSub.create(subData);
				subData['location_id'] = locationSub.ID();
 
				await locationAccnt.create({
					'location_id': subData['location_id'],
					'account_id': req.user.account_id,
					'responsibility': roles_text[r]
				});

				await locationAccntUser.create({
					'location_id' : subData['location_id'],
					'account_id' : req.user.account_id,
					'user_id' : req.user.user_id,
					'role_id' : r
				});

				return subData;
			}catch (e){
				throw new Error('Unable to save sublocation');
			}

    	}else{
    		throw new Error('No parent found');
    	}
    }

    public async archiveLocation(req: AuthRequest, res: Response){
    	let locationId = req.body.location_id,
    		locationModel = new Location(),
    		locationSubModel = new Location(),
    		locations;

    	locations = await locationModel.getByInIds(locationId);
    	if(Object.keys(locations).length > 0){
    		let location = locations[0];

    		for(let i in location){
    			locationModel.set(i, location[i]);
    		}

    		locationModel.setID(locationId);
    		locationModel.set('archived', 1);

    		try{
    			await locationModel.dbUpdate();

	    		let sublocations = await locationSubModel.getDeepLocationsByParentId(locationId);
	    		for(let i in sublocations){
	    			let archiveModel = new Location();

	    			for(let x in sublocations[i]){
	    				archiveModel.set(x, sublocations[i][x]);
	    			}
	    			archiveModel.setID(sublocations[i]['location_id']);
	    			archiveModel.set('archived', 1);

	    			await archiveModel.dbUpdate();
	    		}

    		}catch(e){
    			throw new Error('Unable to archive location');
    		}

    	}else{
    		throw new Error('No location found');
    	}
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
			if(parent.sublocations === undefined){
				parent['sublocations'] = [];
			}
			for(let c in data){
				let child = data[c];
				if(child.parent_id == parent.location_id){
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
						if(oData.wardens[w]['is_warden_role'] == 1){
							wardens[ oData.wardens[w]['user_id'] ] = oData.wardens[w];
						}
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

  	public async getLocation(req: AuthRequest, res: Response) {
	    let locationId = <number>req.params.location_id;
	    const location = new Location(locationId);
	    let sublocations;
	    let othersub = [];
	    await location.load();
	    sublocations = await location.getSublocations();

	    if (sublocations.length) {
	      return {
	        'location': location.getDBData(),
	        'sublocations': sublocations
	      };
	    }
	    // get immediate parent
	    const parentId = <number>location.get('parent_id');
	    let siblings;
	    const parentLocation = new Location(parentId);
	    await parentLocation.load();
	    siblings = await parentLocation.getSublocations();

	    return {
	      'location': location.getDBData(),
	      'parent': parentLocation.getDBData(),
	      'siblings': siblings
	    }
	    /*
	      response = { status : false, message : '', data : [] },
	      fetchingProgress = {
	        location: false,
	        wardens: false,
	        frptrp: false,
	        accountsLocations: false
	      },
	      fetchedDatas = {
	        locations: <any>[],
	        wardens:<any>[],
	        frptrp:<any>[],
	        accountLocations:<any>[]
	      },
	      user = req['user'];
	      const location = new Location(),
	      locationSingle = new Location(locationId),
	      wardensModel = new LocationAccountUser(),
	      frpTrpModel = new LocationAccountUser(),

	      callWait = (callBack) => {
					setTimeout(() => {
						if (fetchingProgress.location && fetchingProgress.wardens && fetchingProgress.frptrp && fetchingProgress.accountsLocations){
		private pullSpecificParent = (parentId, data) => {
			let
			parentData = [],
			searchChild = (children) => {
				for(let i in children){
					if(children[i]['sublocations'] !== undefined){
						if( Object.keys(children[i]['sublocations']).length > 0 ){
							searchChild(children[i]['sublocations']);
						}
					}
				};

				for(let i in data){
					searchChild(data[i]['sublocations']);
					if(data[i]['location_id'] == parentId){
						parentData.push(data[i]);
					}
				}

				return parentData;
			}

		public getId(req: Request, res: Response, next: NextFunction){
			let locationId = req.params.location_id,
				response = { status : false, message : '', data :<any>[] },
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
						if(fetchingProgress.location && fetchingProgress.wardens && fetchingProgress.frptrp){
							callBack();
						} else {
							callWait(callBack);
						}

					}, 100);
				},
				responseSend = () => {
					res.statusCode = 200;
					res.send(response);
				};

			callWait(() => {

				fetchedDatas.locations = this.addWardenToLocations(fetchedDatas.locations, fetchedDatas.wardens);
				fetchedDatas.locations = this.addFrpTrpToLocations(fetchedDatas.locations, fetchedDatas.frptrp);

				let toMergedData = Object.create(fetchedDatas.locations),
					mergedData = this.mergeToParent(toMergedData),
					finalData = <any>{},
					parentData = <any>{};

				this.addWardenCounts(mergedData);

				finalData = this.pullSpecificParent(locationId, mergedData);
				parentData = this.pullSpecificParent(finalData[0].parent_id, mergedData);

				if(finalData.length > 0){
					finalData[0]['no_locations'] = (finalData[0].parent_id == -1) ? 1 : 0;
					finalData[0]['level_occupied'] = (finalData[0].sublocations.length > 0) ? finalData[0].sublocations.length : 0;
					finalData = finalData[0];
				}

				response.data = {
					location : finalData,
					parent : (parentData.length > 0) ? parentData[0] : []
				};
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
					fetchedDatas.accountLocations = [];
					for(let i in results){
						if(results[i]['location_id'] == locationId){
							fetchedDatas.accountLocations.push(results[i]);
						}
					}
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
	  	*/
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

	public async getParentLocationsByAccount(req: AuthRequest, res: Response) {

	    const accountId = req.user.account_id;
	    const account = new Account(accountId);
	    let locationsOnAccount = [];
	    let location;

	    // we need to check the role(s)
	    const userRoleRel = new UserRoleRelation();
	    const roles = await userRoleRel.getByUserId(req.user.user_id);

	    // what is the highest rank role
	    let r = 100;
	    console.log(roles);

	    for (let i = 0; i < roles.length; i++) {
	      if(r > parseInt(roles[i]['role_id'], 10)) {
	        r = roles[i]['role_id'];
	      }
	    }

	    locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id);
	    for (let loc of locationsOnAccount) {
	      location = new Location(loc.location_id);
	      loc['sublocations'] = await location.getSublocations();
	    }
	    return locationsOnAccount;

	    /*
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
							mergedData[n]['no_locations'] = 1;
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
	    */
	}

	public getDeepLocationsById(req: AuthRequest, res: Response){
		let  response = {
			status : false,
			message : '',
			data : {}
		},
		locations = new Location();

		// Default status code
		res.statusCode = 200;

		locations.getDeepLocationsByParentId(req.params.location_id).then(
			(results) => {
				res.statusCode = 200;
				response.data = results;
				res.send(response);
			},
			(e) => {
				response.message = e;
				res.send(response);
			}
		);
	}

	public getLocationsByMultipleId(req: AuthRequest, res: Response){
		let  response = {
			status : false,
			message : '',
			data : {}
		},
		locations = new Location();

		// Default status code
		res.statusCode = 200;

		locations.getByInIds(req.body.ids).then(
			(results) => {
				res.statusCode = 200;
				response.data = results;
				res.send(response);
			},
			(e) => {
				response.message = e;
				res.send(response);
			}
		);

	}

	public checkUserVerifiedInLocation(req: AuthRequest, res: Response){
		let  response = {
			status : false,
			message : '',
			data : {
				verified : false
			}
		},
		locationSublocations = new Location(),
		locationAccountUser = new LocationAccountUser();

		res.statusCode = 400;

		locationSublocations.getDeepLocationsByParentId(req.body.parent_id).then(
			(sublocations) => {
				if(Object.keys(sublocations).length > 0){
					let ids = [];
					for(let i in sublocations){
						ids.push(sublocations[i]['location_id']);
					}

					locationAccountUser.getByLocationIdAndUserId( ids.join(',') , req.user.user_id ).then(
						(results) => {
							if(Object.keys(results).length > 0){
								response.data.verified = true;
							}

							res.statusCode = 200;
							res.send(response);
						},
						(e) => {
							response.message = e;
							res.send(response);
						}
					);
				}else{
					res.send(response);
				}
			}
		);
	}

}

