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
         }).catch((e) => {
            console.log(e);
            return res.status(400).send({
              message: 'No location found'
            });
         });
	   	});

      router.post('/location/assign-location', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new LocationRoute().assignSubLocation(req, res).then((data) => {
            return res.status(200).send({
              message: data
            });
        }).catch((e) => {
          return res.status(400).send((<Error>e).message);
        });
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
              	locations : [],
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
          console.log( (<Error>e).message);
          return res.status(400).send((<Error>e).message);
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

      router.get('/location/get-sublocations-of-parent/:parent_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new LocationRoute().getSublocationsOfParent(req, res)
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
    		locationParent = new Location(parentId),
    		locationSub = new Location(),
    		userRoleRel = new UserRoleRelation();
      	let subs;
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

  		// checks for location name if same name exists
  		subs = await locationParent.getSublocations(req.user.user_id, r);
  		for (let s of subs) {
  			console.log(s['name'].toUpperCase() + ' compared with ' + sublocation_name.toUpperCase());
  			if (s['name'].toUpperCase() === sublocation_name.toUpperCase()) {
  				throw new Error('Sub location with the name provided already exists');
  			}
  		}

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

    public async assignSubLocation(req: AuthRequest, res: Response) {
      let locIds = JSON.parse(req.body.locIds);
      const parentId = req.body.parentId;
      // Get the necessary role account relation
      const userRoleRel = new UserRoleRelation();
      let locationAccntUser;
      const role = await userRoleRel.getByUserId(req.user.user_id, true);
      console.log(`role is ${role}`);
      for (let i = 0; i < locIds.length; i++) {
          console.log(`Iterate: ${locIds[i]}`);
          locationAccntUser = new LocationAccountUser();
          try {
            let temp = await locationAccntUser.getByLocationIdAndUserId(locIds[i], req.user.user_id);
          } catch(err) {
            await locationAccntUser.create({
              'location_id': locIds[i],
              'account_id': req.user.account_id,
              'user_id': req.user.user_id,
              'role_id': role
            });
          }
      }
      return 'Success';

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

      	// we need to check the role(s)
      	const userRoleRel = new UserRoleRelation();
      	const roles = await userRoleRel.getByUserId(req.user.user_id);

      	let response = {
      		'location' : {},
      		'sublocations' : [],
      		'parent' : {},
      		'siblings' : []
      	};

      	// what is the highest rank role
      	let r = 100;
      	for (let i = 0; i < roles.length; i++) {
      		if(r > parseInt(roles[i]['role_id'], 10)) {
      			r = roles[i]['role_id'];
      		}
      	}

      	await location.load();

      	response.location = location.getDBData();

      	sublocations = await location.getSublocations(req.user.user_id, r);
      	response.sublocations = sublocations;
	    // get immediate parent
	    const parentId = <number>location.get('parent_id');

	    if (parentId === -1 ) {
	    	return response;
	    }
	    let siblings;
	    const parentLocation = new Location(parentId);
	    await parentLocation.load();
	    siblings = await parentLocation.getSublocations(req.user.user_id, r);

	    response.parent = parentLocation.getDBData();
	    response.siblings = siblings;

	    return response;
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
      	let data;
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
		  // locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id);
		  // console.log(locationsOnAccount);
		  locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id, r);

  		switch(r) {
  			case 1:
  				for (let loc of locationsOnAccount) {
  					location = new Location(loc.location_id);
  					loc['sublocations'] = await location.getSublocations();
  				}
  				// break;
  				return { 'locations' : locationsOnAccount };
  			case 2:
  				// get the parent or parents of these sublocation
  				let results;
  				// let objectOfSubs:{[key: number]: Array<Object>} = {};
  				let objectOfSubs:{[key: number]: any[]} = {};
  				let seenParents = []; // these are the parent ids
  				let rootParents = [];
  				let pId = 0;
  				for (let loc of locationsOnAccount) {
  					objectOfSubs[loc.parent_id] = [];
  				}
  				for (let loc of locationsOnAccount) {
  					objectOfSubs[loc.parent_id].push(loc);

  					if ((seenParents.indexOf(loc.parent_id)*1)  === -1) {

  						seenParents.push(loc.parent_id);
  						let parentId = loc.parent_id;
  						while (parentId !== -1) {
  							location = new Location(parentId);
  							await location.load();
  							parentId = location.get('parent_id');
  						}

  						rootParents.push(location.getDBData());
  						location.set('desc', loc.parent_id);
  						location = undefined;
  					}
  				}

  				let seenRoots = [];
  		    let processedRootParents = [];
  				for (let r of rootParents) {
  		          if(seenRoots.indexOf(r['location_id']) == -1) {
  		            r['sublocations'] = [];
  		            r['sublocations'] = objectOfSubs[r['desc']];
  		            r['sublocations']['total'] = 0;
  		            r['total_subs'] = objectOfSubs[r['desc']].length;
  		            seenRoots.push(r['location_id']);
  		            processedRootParents.push(r);
  		          }
  		        }
  				return {
  					'locations':  processedRootParents
  				};
  		}
  		return locationsOnAccount;
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

  public getSublocationsOfParent(req: AuthRequest, res: Response){
    let  
    parentId = req.params.parent_id,
    response = {
      status : false,
      message : '',
      data : <any>[]
    },
    locationSublocations = new Location();
    res.statusCode = 200;


    locationSublocations.getParentsChildren(parentId).then((results) => {
      response.data = results;
      res.send(response);
    });

  }

}

