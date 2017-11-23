
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
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

	   	router.get('/location/get/:location_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getId(req, res, next);
	   	});

	   	router.get('/location/get-by-account/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByAccountId(req, res, next);
	   	});

	   	router.get('/location/get-by-userid-accountid/:user_id/:account_id', (req: Request, res: Response, next: NextFunction) => {
	   		new LocationRoute().getByUserIdAndAccountId(req, res, next);
       });

      router.post('/location/search-db-location', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new LocationRoute().searchDbForLocation(req, res);
      });

      router.get('/location/get-parent-locations-by-account-id/:account_id',
       new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
        new LocationRoute().getParentLocationsByAccount(req, res, next);
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

  public async createLocation(req: AuthRequest, res: Response) {

    let parent_id = -1;
    const dbLocationData = {};
    dbLocationData['parent_id'] = parent_id;
    Object.keys(req.body).forEach((key) => {
      switch (key) {
        case 'location_name':
          dbLocationData['name'] = req.body.location_name;
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
    // create main location
    try {
      await location.create(dbLocationData);
      parent_id = location.ID();
      dbLocationData['parent_id'] = parent_id;
    } catch (er) {
      throw new Error('Unable to create main location');
    }
    // create sublevels (sublocations)
    for (let i = 0; i < req.body.sublevels.length; i++) {
      try {
        const subLevel = new Location();
        dbLocationData['name'] = req.body.sublevels[i];
        await subLevel.create(dbLocationData);
      } catch (e) {
        throw new Error('Unable to process sub levels');
      }
    }
    return {
      status: 'Success'
    };
  }
  public searchDbForLocation(req: AuthRequest, res: Response) {

    console.log(req.body);
    return res.status(200).send({
      'message': 'ok'
    });
  }

	public getByAccountId(req: Request, res: Response, next: NextFunction) {
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

