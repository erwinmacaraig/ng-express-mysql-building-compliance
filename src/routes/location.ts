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
import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { Token } from '../models/token.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { TrainingCertification } from '../models/training.certification.model';
import { WardenBenchmarkingCalculator } from '../models/warden_benchmarking_calculator.model';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';

import * as fs from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
import * as session from 'express-session';
const validator = require('validator');
const md5 = require('md5');
const moment = require('moment');
const url = require('url');
const defs = require('../config/defs.json');

/**
 * / route
 *
 * @class LocationRoute
 */
 export class LocationRoute extends BaseRoute {
	/**
   	* Create the routes.
   	*
   	* @class LocationRoute
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


        router.get('/location/get-with-queries', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {

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

        router.post('/location/get-parent-locations-by-account-id-paginated', new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response) => {
            new LocationRoute().getParentLocationsByAccount(req, res, 0, true).then((data) => {
                return res.status(200).send(data);
            }).catch((err) => {
                console.log('error at endpoint /location/get-parent-locations-by-account-id-paginated calling the method getParentLocationsByAccount', err);
                /*
                    return res.status(400).send({
                        locations : [],
                        message: err
                    });
                */
            });
        });

        router.get('/location/get-parent-locations-by-account-id', new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response) => {
            new LocationRoute().getParentLocationsByAccount(req, res, 0).then((data) => {
                return res.status(200).send(data);
            }).catch((err) => {
                console.log('error at endpoint /location/get-parent-locations-by-account-id calling the method getParentLocationsByAccount', err);
                /*
                    return res.status(400).send({
                        locations : [],
                        message: err
                    });
                */
            });

        });

        router.get('/location/get-archived-parent-locations-by-account-id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().getParentLocationsByAccount(req, res, 1).then((data) => {
            return res.status(200).send(data);
          }).catch((err) => {
            return res.status(400).send({
                  locations : [],
                message: err
              });
             });
        });

        router.get('/location/get-locations-hierarchy-by-account-id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new LocationRoute().getLocationsHierarchyByAccount(req, res).then((data) => {
                return res.status(200).send(data);
            }).catch((err) => {
                console.log(err);
                return res.status(400).send({
                    locations : [],
                    message: err
                });
            });
        });

        router.get('/location/search-locations-hierarchy/:key', (req: AuthRequest, res: Response) => {
            new LocationRoute().searchLocationsHierarchy(req, res);
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
                console.log(e);
                return res.status(400).send({
                    message: e
                });
            });
        });

        router.post('/location/archive-multiple', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new LocationRoute().archiveMultipleLocation(req, res).then((data) => {
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

        router.post('/location/update', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().updateLocation(req, res);
        });

        router.post('/location/add-account', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().addAccountToLocation(req, res);
        });

      router.post('/location/remove-account', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().removeAccountFromLocation(req, res);
      });

      router.post('/location/create-building-add-account', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().createBuildingAndAddAccount(req, res);
      });

      router.get('/location/search-buildings', (req: AuthRequest, res: Response) => {
          new LocationRoute().searchBuildings(req, res);
      });

      router.get('/location/search-levels', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().searchLevels(req, res);
      });

      router.post('/location/request/add-location-to-user', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new LocationRoute().requestAddLocationToUser(req, res);
      });

      router.post('/location/get-building-levels/', new MiddlewareAuth().authenticate,
      (req: AuthRequest, res: Response) => {
        new LocationRoute().getBuildingLevels(req, res);
      });

      router.post('/location/get-info/', new MiddlewareAuth().authenticate,
      (req: AuthRequest, res: Response) => {
        new LocationRoute().getLocationInformation(req, res);
      });

      router.post('/location/list-levels-for-trp', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res: Response) => {
            new LocationRoute().getTaggedLocationsForTRP(req, res);
        }
      );

        router.post('/location/location-details-update', new MiddlewareAuth().authenticate,
        (req:AuthRequest, res:Response) => {
            new LocationRoute().updateLocationDetails(req, res);
        });

        router.get('/location/list-archived-locations/', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res:Response) => {
            new LocationRoute().listArchivedLocations(req, res);
        });

        router.post('/location/delete/', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res:Response) => {
            new LocationRoute().permanentlyDeleteLocation(req, res);
        });

        router.get('/location/list-account-user-locations/', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res:Response) => {
            new LocationRoute().listLocationsAssignedToAccountUser(req, res);
        });
        
        router.post('/location/create-new-sublevel/', new MiddlewareAuth().authenticate,
        (req:AuthRequest, res:Response) => {
            new LocationRoute().createNewSubLocation(req, res);
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

    public async createNewSubLocation(req: AuthRequest, res: Response) {
        const parentId = req.body.building_id;
        const sublocation_name = req.body.name;
        const account_role = req.body.account_role;
        const account_id = req.body.account_id;
        let subData = {};
        let temp = await new Location().getChildren(parentId);
        let parentData = await new Location(parentId).load();
        for (let loc of temp) {
            if (loc['name'].toUpperCase() === sublocation_name.toUpperCase()) {
                return res.status(500).send({
                    message: 'Location name existing'
                });
            }
        }
        subData['name'] = sublocation_name;
        subData['parent_id'] = parentId;
        subData['order'] = null;
        subData['admin_verified'] = 1;
        subData['is_building'] = 0;
        subData['street'] = parentData['street'];
        subData['city'] = parentData['city'];
        subData['state'] = parentData['state'];
        subData['formatted_address'] = parentData['formatted_address'];

        subData['admin_verified'] = 1;
        subData['admin_verified_date'] = moment().format('YYYY-MM-DD');
        subData['admin_id'] = 0;
        try {
            const locationSub = new Location();
            await locationSub.create(subData);
            subData['location_id'] = locationSub.ID();

        } catch(e) {
            console.log(e);
            return res.status(500).send({
                message: 'There was an error creating sublocation ' + sublocation_name
            });
        }    
        try {
           await new LocationAccountRelation().create({
                'location_id': subData['location_id'],
				'account_id': account_id,
				'responsibility': account_role
           });

           return res.status(200).send({
               message: 'Sub level created successfully',
               sublocation_id: subData['location_id'],
               building_id: parentId
           });

        } catch(e) {
            console.log(e);
            return res.status(500).send({
                message: 'Faile. Cannot establish location account relation'
            });
        }   

    }

    public async listLocationsAssignedToAccountUser(req: AuthRequest, res: Response) {
        let roleOfAccountInLocationObj = {};
        let accountUserData = [];
        let location_user_role = {};
        let accountRoles = [];
        const ctr = []; // this will serve as the container of unique building ids
        let buildingLocations = [];
        let wardenCtr = [];

        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);            
        } catch (e) {
            console.log('Getting the account role for a location error');
        }
        
        try {
            accountUserData = await new LocationAccountUser().getByUserId(req.user.user_id);
            for(let data of accountUserData) {
                if (data['location_id'] in roleOfAccountInLocationObj) {
                    location_user_role[data['location_id']] = roleOfAccountInLocationObj[data['location_id']]['role_id'];
                    accountRoles.push({
                        role_id: roleOfAccountInLocationObj[data['location_id']]['role_id'],
                        location_id: data['location_id'],
                        user_id: req.user.user_id
                    });
                }
            }
        } catch(e) {
            console.log(e);
        }
        
        for(let role of accountRoles) {
            if (role['role_id'] == 2) {
                try {
                    let bldg = await new Location().immediateParent([role['location_id']]);                   
                    for (let b of bldg) {
                        const impaired = await new MobilityImpairedModel().getImpairedUsersInLocationIds(role['location_id'], 0, req.user.account_id);
                        if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                            ctr.push(b['locId']);                            
                            buildingLocations.push({
                                location_id: b['locId'],
                                name: b['level'],
                                wardens: <any> await new UserEmRoleRelation().getWardensInLocationIds(role['location_id'], 0, req.user.account_id, true) ,
                                mobility_impaired: impaired.length
                            });
                        } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                            ctr.push(b['parent_id']);
                            buildingLocations.push({
                                location_id: b['parent_id'],
                                name: b['buildingName'],
                                wardens: <any> await new UserEmRoleRelation().getWardensInLocationIds(role['location_id'], 0, req.user.account_id, true),
                                mobility_impaired: impaired.length
                            });
                        }

                    }
                } catch(e) {
                    console.log('Error getting immediate parent for sublocation ' + role['location_id']);
                } 

            }
            if (role['role_id'] == 1) { 
                let tempFRP = [];
                let sublocationIds = [];
                // get sublocation ids
                sublocationIds.push(role['location_id']);
                tempFRP = await new Location().getChildren(role['location_id']);
                let temp = [];
                for (let loc of tempFRP) {
                    sublocationIds.push(loc['location_id']);
                }
                try {
                    let bldg = await new Location().immediateParent(sublocationIds);                   
                    for (let b of bldg) {
                        const wardens = <any> await new UserEmRoleRelation().getWardensInLocationIds(sublocationIds.join(','), 0, 0, true);
                        const impaired = await new MobilityImpairedModel().getImpairedUsersInLocationIds(sublocationIds.join(','), 0);
                        if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                            ctr.push(b['locId']);
                            buildingLocations.push({
                                location_id: b['locId'],
                                name: b['level'],
                                wardens: wardens,
                                mobility_impaired: impaired.length
                            });
                        } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                            ctr.push(b['parent_id']);
                            buildingLocations.push({
                                location_id: b['parent_id'],
                                name: b['buildingName'],
                                wardens: wardens,
                                mobility_impaired: impaired.length
                            });
                        }
                    }
                } catch(e) {
                    console.log('Error getting immediate parent for sublocation ' + role['location_id']);
                }
            }

        }

        return res.status(200).send({
            message: 'Success',
            locations: buildingLocations
        });

    }

      public async permanentlyDeleteLocation(req: AuthRequest, res:Response) {
        const location = new Location();
        const ids = [req.body.location_id];
        const temp = await location.immediateSublocations(req.body.location_id);
        
        for (let loc of temp) {
            ids.push(loc['location_id']);
        }
        console.log(req.body);
        
        try {
            new UserEmRoleRelation().removeLocation(ids);
            new LocationAccountUser().removeLocation(ids);
            new LocationAccountRelation().removeLocation(ids);

            await location.delete(req.body.location_id);            
            return res.status(200).send({
                message: 'Success'                
            });
        } catch(e) {
            console.log(e);
            return res.status(500).send({
                message: 'Fail'                
            });
        }
      }
      public async listArchivedLocations(req: AuthRequest, res: Response) {
          const location = new Location();
          try {
            const list = await location.getArchivedLocations();
            return res.status(200).send({
                message: 'Success',
                archives: list
            });
          } catch(e) {
            console.log(e);
            return res.status(500).send({
                message: 'Fail'                
            });
          }

      }
      public async updateLocationDetails(req: AuthRequest, res: Response) {

         console.log(req.body);
         const location = new Location(req.body.location_id);
         try {
             await location.load();
             await location.create(req.body);
             return res.status(200).send({
                message: 'Success'
            });
         } catch(e) {
             console.log(e);
            return res.status(500).send({
                message: 'Fail'
            });
         }
         

      }
      
      public getTaggedLocationsForTRP(req: AuthRequest, res: Response) {
          const userId = req.body.user;
          const building = req.body.building;
          const locationObj = new Location();
          const locAcctUserObject = new LocationAccountUser();
          locationObj.getChildren(building).then((children) => {
              const sublevelsArr = [building];
              for (let child of children) {
                sublevelsArr.push(child['location_id']);                
              }
              return locAcctUserObject.getAssignedLevelsFromBuildingOfTRP(userId, building, sublevelsArr); 
          })
          .then((data) => {            
            res.status(200).send(data);
          })
          .catch((e) => {
              console.log('error getting children');
          });
      }

      public getLocationInformation(req: AuthRequest, res: Response) {        
        const locationId = req.body.location;
        const location = new Location(locationId);
        location.load().then((data) => {
            return res.status(200).send(data);
        }).catch((e) => {
            return res.status(400).send({
                message: 'Fail'
            });
        });
      }

    public getBuildingLevels(req: AuthRequest, res: Response) {
        const location = new Location();
        const buildingId = req.body.building;
        location.getChildren(buildingId).then((data) => {
            return res.status(200).send(data);
        }).catch((e) => {
            return res.status(400).send({
                message: 'Fail'
            });
        });
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

    public async sendEmailNewLocationValidated(dbLocationData, user_id, status, req){
      if(Object.keys(dbLocationData).length > 0){
        let userModel = new User(user_id),
          user = <any> await userModel.load(),
          statusMsg = (status) ? 'Approved' : 'Declined';

          let opts = {
              from : '',
              fromName : 'EvacConnect',
              to : [],
              body : '',
              attachments: [],
              subject : 'EvacConnect Location Verification '+statusMsg
          };

          let email = new EmailSender(opts),
            emailBody = email.getEmailHTMLHeader();

          emailBody += '<h3 style="text-transform:capitalize;">Hi '+this.capitalizeFirstLetter(user.first_name)+' '+this.capitalizeFirstLetter(user.last_name)+'</h3> <br/>';
          emailBody += '<h4> Your new location created has been '+statusMsg+' </h4> ';
          emailBody += `<h4>Location name : `+dbLocationData.name+`</h4>`;
          emailBody += `<h4>Address : `+dbLocationData.formatted_address+`</h4>`;

          emailBody += '<h5>Thank you!</h5>';

          emailBody += email.getEmailHTMLFooter();

          email.assignOptions({
            body : emailBody,
            to: [user.email]
          });

          await email.send(
            () => { },
            () => { console.log('Unable to send email ('+user.email+')');  }
          );

      }
    }

    public async verifyNewLocation(req: Request, res: Response, tokenData){
      let queryObject = url.parse(req.url, true).query,
        action = queryObject.action,
        admin_id = queryObject.admin,
        user_id = queryObject.user,
        tokenModel = new Token(),
        momentToday = moment(),
        userModel = new User(user_id),
        locationModel = new Location();
        res.set('Content-Type', 'text/html');

        try{
          let momentToken = moment(tokenData['expiration_date']),
            user = await userModel.load();
          if(momentToken.isAfter(momentToday) && tokenData['verified'] == 0){

            try{

              for(let i in tokenData){
                tokenModel.set(i, tokenData[i]);
              }

              tokenModel.setID(tokenData['token_id']);
              tokenModel.set('verified', 1);
              await tokenModel.dbUpdate();

              locationModel.setID(tokenData['id']);
              let location = await locationModel.load(),
                locationDeepChildModel = new Location(),
                deepLocations = await locationDeepChildModel.getDeepLocationsByParentId(tokenData['id']),
                toUpdateLocs = [];

              toUpdateLocs.push(location);
              for(let i in deepLocations){
                toUpdateLocs.push(deepLocations[i]);
              }

              let statusAdmin = (action == 'true') ? 1 : 2,
                  statusMessage = (action == 'true') ? 'Approved' : 'Declined';

              for(let i in toUpdateLocs){
                let locModelUpdate = new Location( toUpdateLocs[i]['location_id'] );

                for(let k in toUpdateLocs[i]){
                  locModelUpdate.set(k, toUpdateLocs[i][k]);
                }

                locModelUpdate.set('admin_verified', statusAdmin);
                locModelUpdate.set('admin_verified_date', momentToday.format('YYYY-MM-DD'));
                locModelUpdate.set('admin_id', admin_id);
                await locModelUpdate.dbUpdate();
              }

              location['children'] = deepLocations;

              await this.sendEmailNewLocationValidated(location, user_id, statusAdmin, req);

              res.send(new Buffer(`<h1>Location request has been successfully `+statusMessage+` </h1> `));

            }catch(e){
              res.send(new Buffer(`<h1>Location not found</h1> `));
            }

          }else{
            res.send(new Buffer(`<h1>Token expired or been used</h1> `));
          }

        }catch(e){
          res.send(new Buffer(`<h1>Token Invalid</h1> `));
        }

    }

    public async sendEmailCreateNewLocation(dbLocationData, req, isSubLoc?){

        if( Object.keys(dbLocationData).length > 0 ){
            let userModelAdmin = new User(),
            // admins =  await userModelAdmin.getAdmins(5),
            admins = [{
                user_id : 0,
                first_name : 'EvacConnect',
                last_name : 'System',
                email : 'systems@evacgroup.com.au'
            }],
            userModel = new User(req.user.user_id),
            user = <any> await userModel.load(),
            isSub = (isSubLoc) ? isSubLoc : false;

            for(let i in admins){
                let admin = admins[i],
                tokenModel = new Token(),
                token = this.generateRandomChars(25);

                try{
                    // await tokenModel.create({
                    //   'token' : token,
                    //   'action' : 'locationverification',
                    //   'verified' : 0,
                    //   'expiration_date' : moment().add(6, 'days').format('YYYY-MM-DD'),
                    //   'id' : dbLocationData.id_of_location,
                    //   'id_type' : 'location_id'
                    // });

                    let opts = {
                        from : '',
                        fromName : 'EvacConnect',
                        to : [],
                        body : '',
                        attachments: [],
                        subject : 'EvacConnect New Location Notification'
                    };

                    let email = new EmailSender(opts),
                    emailBody = email.getEmailHTMLHeader(),
                    linkTrue = 'https://' + req.get('host') +'/token/'+token+'?action=true&admin='+admin.user_id+'&user='+user.user_id,
                    linkFalse = 'https://' + req.get('host') +'/token/'+token+'?action=false&admin='+admin.user_id+'&user='+user.user_id;

                    emailBody += '<h3 style="text-transform:capitalize;">Hi '+this.capitalizeFirstLetter(admin.first_name)+' '+this.capitalizeFirstLetter(admin.last_name)+'</h3> <br/>';
                    emailBody += '<h4> This user : '+this.capitalizeFirstLetter(user.first_name)+' '+this.capitalizeFirstLetter(user.last_name)+ ' is trying to create a new location which needs your verification.  </h4> ';

                    if(isSub){
                        emailBody += `<h4>Location name : `+dbLocationData.parent.name+`, `+dbLocationData.name+`</h4>`;
                    }else{
                        emailBody += `<h4>Location name : `+dbLocationData.name+`</h4>`;
                    }

                    emailBody += `<h4>Address : `+dbLocationData.formatted_address+`</h4>`;

                    if(dbLocationData.sublevels.length > 0){
                        emailBody += `<h4>Levels :  </h4>`;
                        emailBody += '<ul>';
                        for(let i = 0; i < dbLocationData.sublevels.length; i++){
                            if(dbLocationData.sublevels[i].length > 0){
                                emailBody += '<li>'+dbLocationData.sublevels[i]+'</li>';
                            }
                        }
                        emailBody += '</ul>';
                    }

                    // emailBody += '<h5>Action : <a href="'+linkTrue+'" target="_blank" style="text-decoration:none; color:#39a1ff;">Approve</a>  || <a href="'+linkFalse+'" target="_blank" style="text-decoration:none; color:#dc4453;">Decline</a><br/></h5>';

                    // emailBody += '<h5>Thank you!</h5>';

                    emailBody += email.getEmailHTMLFooter();

                    /*email.assignOptions({
                        body : emailBody,
                        to: [admin.email]
                    });*/

                    email.assignOptions({
                        body : emailBody,
                        to: []
                    });


                    await email.send(
                        () => { },
                        () => { console.log('Unable to send email ('+admin.email+')');  }
                        );
                }catch(e){
                    console.log(e);
                }



            }

        }
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
                // dbLocationData['google_photo_url'] = req.body.photoUrl;
                dbLocationData['google_photo_url'] = "";
                break;
                case 'google_place_id':
                dbLocationData['google_place_id'] = req.body.google_place_id;
                break;
            }
        });

        dbLocationData['admin_verified'] = 1;

        const location = new Location();
        let locationAccntUser;
        let locationAccnt;
        let userEmRole;

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
            dbLocationData["id_of_location"] = location.ID();

            locationAccnt = new LocationAccountRelation();
            await locationAccnt.create({
                'location_id': parent_id,
                'account_id': req.user.account_id,
                'responsibility': roles_text[r]
            });

            dbLocationData['parent_id'] = parent_id;

            if(r == 1){
                locationAccntUser = new LocationAccountUser();
                await locationAccntUser.create({
                    location_id: parent_id,
                    account_id: req.user.account_id,
                    user_id: req.user.user_id
                });
            }

        } catch (er) {
            throw new Error('Unable to create main location');
        }

        // create sublevels (sublocations)
        for (let i = 0; i < req.body.sublevels.length; i++) {
            try {
                const subLevel = new Location();
                locationAccnt = new LocationAccountRelation();

                let copyDbLocationData = JSON.parse( JSON.stringify(dbLocationData) );
                copyDbLocationData['name'] = req.body.sublevels[i];
                copyDbLocationData['is_building'] = 0;
                await subLevel.create(copyDbLocationData);

                await locationAccnt.create({
                    'location_id': subLevel.ID(),
                    'account_id': req.user.account_id,
                    'responsibility': roles_text[r]
                });

                locationAccntUser = new LocationAccountUser();
                await locationAccntUser.create({
                    location_id:  subLevel.ID(),
                    account_id: req.user.account_id,
                    user_id: req.user.user_id
                });

                userEmRole = new UserEmRoleRelation();
                await userEmRole.create({
                    location_id : subLevel.ID(),
                    user_id: req.user.user_id,
                    em_role_id : defs['em_roles']['GENERAL OCCUPANT']
                });

            } catch (e) {
                throw new Error('Unable to process sub levels');
            }
        }

        dbLocationData['sublevels'] = req.body.sublevels;

        await this.sendEmailCreateNewLocation(dbLocationData, req);

        return 'success';

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
            subData['admin_verified'] = 1;
            subData['is_building'] = 0;

            subData['admin_verified'] = 0;
            subData['admin_verified_date'] = null;
            subData['admin_id'] = 0;

			try{
				await locationSub.create(subData);
				subData['location_id'] = locationSub.ID();


                await locationAccnt.create({
					'location_id': subData['location_id'],
					'account_id': req.user.account_id,
					'responsibility': roles_text[r]
				});


				/*await locationAccntUser.create({
					'location_id' : subData['location_id'],
					'account_id' : req.user.account_id,
					'user_id' : req.user.user_id
				});*/

                let parentModel = new Location(parentId),
                    parent = await parentModel.load();

                subData['parent'] = parent;
                subData['id_of_location'] = locationSub.ID();
                subData['sublevels'] = [];

                let userEmRole = new UserEmRoleRelation();
                await userEmRole.create({
                    location_id : locationSub.ID(),
                    user_id: req.user.user_id,
                    em_role_id : defs['em_roles']['GENERAL OCCUPANT']
                });

                await this.sendEmailCreateNewLocation(subData, req, true);

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

        const userRoleRel = new UserRoleRelation(),
            userEmRole = new UserEmRoleRelation();
        let locationAccntUser;
        let locationAccntRel;

        for (let i = 0; i < locIds.length; i++) {
            locationAccntUser = new LocationAccountUser();
            try {
                let temp = await locationAccntUser.getByLocationIdAndUserId(locIds[i], req.user.user_id);
            } catch(err) {
                try{
                    const roles = await userRoleRel.getByUserId(req.user.user_id, true);
                    await locationAccntUser.create({
                        'location_id': locIds[i],
                        'account_id': req.user.account_id,
                        'user_id': req.user.user_id
                    });
                }catch(e){
                }
            }

            try{
                const emroles = await userEmRole.getEmRolesFilterBy({
                    user_id : req.user.user_id,
                    location_id : locIds[i]
                });
            }catch(emerr){
                userEmRole.create({
                    location_id : locIds[i],
                    user_id: req.user.user_id,
                    em_role_id : defs['em_roles']['GENERAL OCCUPANT']
                });
            }
        }
        return 'Success';

    }

    public async archiveLocation(req: AuthRequest, res: Response){
    	let locationId = req.body.location_id,
            archivedValue = req.body.archived,
    		locationModel = new Location(),
    		locationSubModel = new Location(),
    		locations;
        
        let control = 0;
        if (archivedValue == 0) {
            control = 1;
        }
        console.log('archivedValue', archivedValue);
        console.log(req.body, control);
        
    	locations = await locationModel.getByInIds(locationId, control);
    	if(Object.keys(locations).length > 0){
    		let location = locations[0];

    		for(let i in location){
    			locationModel.set(i, location[i]);
    		}

    		locationModel.setID(locationId);
    		locationModel.set('archived', archivedValue);

    		try{
    			await locationModel.dbUpdate();

	    		let sublocations = await locationSubModel.getDeepLocationsByParentId(locationId, control);
                console.log('sublocations', sublocations);
                for(let i in sublocations){
	    			let archiveModel = new Location();

	    			for(let x in sublocations[i]){
	    				archiveModel.set(x, sublocations[i][x]);
	    			}
	    			archiveModel.setID(sublocations[i]['location_id']);
	    			archiveModel.set('archived', archivedValue);

	    			await archiveModel.dbUpdate();
	    		}

    		}catch(e){
    			throw new Error('Unable to archive location');
    		}

    	}else{
    		throw new Error('No location found');
    	}
    }

    public async archiveMultipleLocation(req: AuthRequest, res: Response){
      let locations = req.body.locations;

      for(let i in locations){
        let
            locModel = new Location(locations[i]['location_id']),
            location = <any> await locModel.load(),
            archivedValue = 0;

        for(let k in location){
          locModel.set(k, location[k]);
        }

        for(let k in locations){
          if(locations[k]['location_id'] == location.location_id){
            archivedValue = locations[k]['archived'];
          }
        }

        locModel.setID( location['location_id'] );
        locModel.set('archived', archivedValue);

        await locModel.dbUpdate();
      }

      return "success";

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
                if('is_here' in child){
                  if(child.parent_id == parent.location_id && child.is_here === true){
                    child['location_name'] = (parent.name.trim().length > 0) ? parent.name.trim() +', '+child.name : child.name;
                    parent.sublocations.push(child);
                  }
                }else{
      				if(child.parent_id == parent.location_id){
                        child['location_name'] = (parent.name.trim().length > 0) ? parent.name.trim() +', '+child.name : child.name; 
      					parent.sublocations.push(child);
      				}
                }
			}
		}

		let finalData = [];
		for(let i in data){
			if(data[i]['parent_id'] == -1){
                data[i]['location_name'] = data[i]['name'];
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
		let
        isQuery = (Object.keys(req.query).length > 0) ? true : false,
        locationId = (isQuery) ? (req.query.location_id) ? req.query.location_id : req.params.location_id : req.params.location_id,
        accountId = (isQuery) ? (req.query.account_id) ? req.query.account_id : req.user.account_id : req.user.account_id,
        getRelatedOnly = (isQuery) ? (req.query.get_related_only == 'true') ? true : false : false,
        location = new Location(locationId),
        sublocations,
        othersub = [],
        locAccRel = new LocationAccountRelation(),
        userIsWarden = false,
        roleOfAccountInLocationObj = {};

      	// we need to check the role(s)
      	const userRoleRel = new UserRoleRelation();
      	let roles = <any> [];
        if(req.user.evac_role != 'admin'){
            try{
                roles = await userRoleRel.getByUserId(req.user.user_id);
            }catch(e){
                //Warden
                userIsWarden = true;
            }
        }else{
            roles = 1;
        }

      	let response = {
      		'location' : {},
      		'sublocations' : [],
      		'parent' : {},
      		'siblings' : [],
            'users_locations' : [],
            'roles' : [],
            'show_compliance' : false
      	};

      	// what is the highest rank role
      	let r = (!userIsWarden) ? 100 : 0;
      	for (let i = 0; i < roles.length; i++) {
      		if(r > parseInt(roles[i]['role_id'], 10)) {
      			r = roles[i]['role_id'];
      		}
          }
          


        response.roles = roles;

        let countRelatedLoc = await locAccRel.listAllLocationsOnAccount(req.user.account_id, {
            'responsibility' : r, 'archived' : 0, 'location_id' : locationId, 'count' : true
        });
        response['filter'] = {
            'responsibility' : r, 'archived' : 0, 'location_id' : locationId, 'count' : true
        };
        response['countRelatedLoc'] = countRelatedLoc;
        if(countRelatedLoc[0]['count'] > 0){
            response.show_compliance = true;
        }

        try{
            let emRoles = new UserEmRoleRelation(),
                emroles = <any> await emRoles.getEmRolesByUserId(req.user.user_id);
            for(let rol of emroles){
                response.users_locations.push(rol);
                response.roles.push({
                    role_id : rol.em_roles_id,
                    role_name : rol.role_name
                });
            }
        }catch(e){}

        try{
            if(!userIsWarden){
                let locAcc = new LocationAccountUser(),
                    locAccUsers = <any> await locAcc.getByUserId(req.user.user_id);
                for(let locacc of locAccUsers){
                    response.users_locations.push(locacc);
                }
            }
        }catch(e){}

      	let locData = <any> await location.load();

      	response.location = location.getDBData();
        const wardenCalc = new WardenBenchmarkingCalculator();

        let sublocationIdsArray = [0];
        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);            
            if (locationId in roleOfAccountInLocationObj) {            
                 r = roleOfAccountInLocationObj[locationId]['role_id'];   
            } else {
                r = 2;
            }
        } catch (e) {
            console.log('Getting the account role for a location error');
        }


        console.log('responsibility is ' + r);




        if(getRelatedOnly == true){
            let responsibility = (r == 1) ? 'Manager' : 'Tenant';
            sublocations = await location.getChildrenTenantRelated(locData.location_id, accountId, responsibility);



        }else{
            if(locData.parent_id == -1){
                sublocations = await location.getChildren(locData.location_id);
            }else{
                let ancestriesModel = new Location(),
                    ancestries = <any> await ancestriesModel.getAncestries(locData.location_id);

                for(let i in ancestries){
                    location.setID(ancestries[i]['location_id']);
                    sublocations = await location.getSublocations(req.user.user_id, r);
                }
            }
        }


        for (let j = 0; j < sublocations.length; j++) {
          sublocationIdsArray.push(sublocations[j]['location_id']);
        }

        // Get nominated and get total no of actual wardens and wardens that passed
        let nominatedWardensObj, nominatedFloorWardensObj, floorWardenRoles, wardenRoles;
        const training = new TrainingCertification();
        const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(sublocationIdsArray);
        try {
          wardenRoles = await location.getEMRolesForThisLocation(defs['em_roles']['WARDEN'], 0, r, 0, req.user.account_id);
        } catch(e) {
          wardenRoles = {};
        }
        try {
          floorWardenRoles = await location.getEMRolesForThisLocation(defs['em_roles']['FLOOR_WARDEN'], 0, r, 0, req.user.account_id);
        } catch(e) {
          floorWardenRoles = {};
        }

        let allWardens = [];

        for (const sub of sublocations) {
          // this part is for warden benchmarking
          if (sub['location_id'] in calcResults) {
            sub['total_estimated_wardens'] = calcResults[sub['location_id']]['total_estimated_wardens'];
          } else {
            sub['total_estimated_wardens'] = 0;
          }
          allWardens = [];
          // check first if there are wardens (technically use in rather than checking if empty object)
          if (defs['em_roles']['WARDEN'] in wardenRoles) {
            nominatedWardensObj = wardenRoles[defs['em_roles']['WARDEN']];
            if (sub['location_id'] in nominatedWardensObj) {
              allWardens = allWardens.concat(nominatedWardensObj[sub['location_id']]['users']);
            }
          }
          if (defs['em_roles']['FLOOR_WARDEN'] in floorWardenRoles) {
            nominatedFloorWardensObj = floorWardenRoles[defs['em_roles']['FLOOR_WARDEN']];
            if (sub['location_id'] in nominatedFloorWardensObj) {
              allWardens = allWardens.concat(nominatedFloorWardensObj[sub['location_id']]['users']);
            }
          }
          allWardens = Array.from(new Set(allWardens));
          sub['trained_wardens'] = 0;
          sub['nominated_wardens'] = 0;
          if (allWardens.length > 0) {
            const trainingDetailsForLocation = await training.getEMRUserCertifications(allWardens);
            sub['trained_wardens'] = trainingDetailsForLocation['total_passed'];
            sub['nominated_wardens'] = allWardens.length;
          }
        }
        

        for(let sub of sublocations) {
            let accountModelTenantCount = new Account(),
                child = await new Location().getParentsChildren(sub.location_id, 1),
                sublocsIds = [sub.location_id];

            for (let c of child) {
                sublocsIds.push(c['location_id']);
            }

            sub['num_tenants'] = 0;
            if(sublocsIds.length > 0){
                sub['num_tenants'] = <any> await accountModelTenantCount.countTenantsFromLocationIds( sublocsIds.join(',') );
            }

           
        }

        sublocations = sublocations.sort((a, b) => {
            if(a.name.localeCompare(b.name, { sensitivity : false }) == 1){
                return 1;
            }
            if(a.name.localeCompare(b.name, { sensitivity : false }) == -1){
                return -1;
            }

            return 0;
        });

      	response.sublocations = sublocations;

        let ancestriesModel = new Location(),
        ancestries = await ancestriesModel.getAncestries(locationId);
        response['ancestries'] = ancestries;

	    // get immediate parent
	    const parentId = <number>location.get('parent_id');

	    if (parentId === -1 ) {
            response.parent['name'] = '';
	    	return response;
	    }
	    let siblings;
	    const parentLocation = new Location(parentId);
	    await parentLocation.load();
        if(getRelatedOnly){
	        siblings = await parentLocation.getSublocations(req.user.user_id, r);
        }else{
            siblings = await parentLocation.getSublocations();
        }
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
		arrWhere.push([ 'user_id = '+req.params.user_id ]);
		arrWhere.push([ 'account_id = '+req.params.account_id ]);

		locAccUser.getMany(arrWhere).then(
			(locations) => {
				response.data = locations;
				res.send(response);
			},
			() => {
				res.send(response);
			}
		);
    }

	public async getParentLocationsByAccount(req: AuthRequest, res: Response, archived?, pagination?) {
	    const
            queries =  (req.method == 'POST') ? req.body : req.query,
            locAccntRelObj = new LocationAccountRelation(),
            userRoleRel = new UserRoleRelation(),
            filter = {
                archived : (archived) ? archived : 0
            },
            parentOnly = (queries.showparentonly) ? queries.showparentonly : false,
            mobilityImpaired = new MobilityImpairedModel(),
            parentId = (queries.parent_id) ? queries.parent_id : false;
            
            // console.log(queries);

        let
            r = 100,
            EMRole = new UserEmRoleRelation(),
            temp,
            totalWardens = 0,
            userIds = [],
            queryAccountId = req.user.account_id,
            response = <any> {
                locations : []
            }, roleOfAccountInLocationObj = {};
           
        let accountUserData = [];
        let location_user_role = {};
        if(pagination){
            response['pagination'] = {
                total : 0, pages : 0
            };
        }

        let 
            roles = [],
            isPortfolio = false;

        try {
          roles = await userRoleRel.getByUserId(req.user.user_id);
          
          for(let role of roles){
              if(role['is_portfolio'] == 1){
                  isPortfolio = true;
              }
              if (r > parseInt(role['role_id'],10)) {
                  r = role['role_id'];                  
              }
          }
          if (r == defs['Manager']) {
            queryAccountId = 0;
          }
        } catch(e) { }
       
        filter['parentOnly'] = (parentId) ? false : parentOnly;
        filter['responsibility'] = r;
        filter['isPortfolio'] = isPortfolio;
        filter['userId'] = req.user.user_id;
        filter['parent_id'] = parentId;

        if('search' in queries){
            filter['name'] = queries.search;
        }

        if('offset' in queries){
            filter['offset'] = queries.offset;
        }

        if('limit' in queries){
            filter['limit'] = queries.limit;
        }

        if('sort' in queries){
            filter['sort'] = queries.sort;
        }

        if('archived' in queries){
            filter['archived'] = queries.archived;
        }

        try{
            response.locations = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);            
        }catch(e){
            response.locations = [];
            console.log('There was an error getting the list of parent locations', e);
        }
        
        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);            
        } catch (e) {
            console.log('Getting the account role for a location error');
        }
        // console.log(roleOfAccountInLocationObj);
        try {
            accountUserData = await new LocationAccountUser().getByUserId(req.user.user_id);
            for(let data of accountUserData) {
                if (data['location_id'] in roleOfAccountInLocationObj) {
                    location_user_role[data['location_id']] = roleOfAccountInLocationObj[data['location_id']]['role_id'];
                }
            }
        } catch(e) {
            console.log(e);
        }


        const subLocsArr = [];
        let subLocsStr = '';
        const subLocationsObj = {};
        const tenantAccountLocations = [];

        
        for(let loc of response.locations) {
            if (loc['location_id'] in roleOfAccountInLocationObj && roleOfAccountInLocationObj[loc['location_id']]['role_id'] == 1) {            
                subLocsArr.push(loc['location_id']);
              } else if (loc['location_id'] in roleOfAccountInLocationObj && roleOfAccountInLocationObj[loc['location_id']]['role_id'] == 2)  {
                tenantAccountLocations.push(loc['location_id']);  
              }
                       
          /*
          if (location_user_role[loc['location_id']] == defs['account_roles']['BUILDING_MANAGER']) {
                subLocsArr.push(loc['location_id']);
            } else if (location_user_role[loc['location_id']] == defs['account_roles']['TENANT']) {
                tenantAccountLocations.push(loc['location_id']); 
            } 
            
          */


        }
        
        subLocsStr = subLocsArr.join(',');       
        let child = await new Location().getParentsChildren(subLocsStr, 1);
       
        for (let i of subLocsArr) {
          subLocationsObj[i] = {
            'count': 0,
            'ids': []
          };
          for (let c of child) {
            if(parseInt(c['parent_id'], 10) === parseInt(i)) {
              subLocationsObj[i]['count']++;
              subLocationsObj[i]['ids'].push(c['location_id']);
            }
          }
        }
        
        let childForTenant = [];
        // since they are only tenant on this building locations, go get the sub locations related to the account
        
        for (let building of tenantAccountLocations) {
            let tempArr = [];
            
            try {                
                tempArr = await new LocationAccountRelation().getTenantAccountRoleOfBlgSublocs(building, req.user.account_id);                
                childForTenant = childForTenant.concat(tempArr);    
                
            } catch(e) {
                // this is at the case of malls where in a tenant is assign to the building               
                try {
                    tempArr = await new LocationAccountRelation().getTenantAccountRoleAssignToBuilding(building, req.user.account_id);
                    childForTenant = childForTenant.concat(tempArr); 
                } catch(sub_e) {

                }
            }
            if ( !(building in subLocationsObj) ) {
                subLocationsObj[building] = {
                    'count': 0,
                    'ids': []
                  };
            }
            for (let c of childForTenant) {
                if(parseInt(c['parent_id'], 10) === parseInt(building)) {
                    subLocationsObj[building]['count']++;
                    subLocationsObj[building]['ids'].push(c['location_id']);
                }
            }            
            
        }

        for(let loc of response.locations) {
            let
                locsIds = [],
                mobilityModel = new MobilityImpairedModel(),
                accountModelTenantCount = new Account(),
                emRolesModel = new UserEmRoleRelation(),
                sublocsids = [],
                wardens = [];
            /*
            if (location_user_role[loc['location_id']] == defs['account_roles']['BUILDING_MANAGER']) {
                queryAccountId = 0
            } else if (location_user_role[loc['location_id']] == defs['account_roles']['TENANT']) {
                queryAccountId = req.user.account_id;
            } 
            */ 
            // FRP for this location           
            if (subLocsArr.indexOf(loc['location_id']) != -1) {
                // loc['sublocation_count'] = subLocationsObj[loc['location_id']]['count'];
                let
                subLocsModel = new Location(),                
                sublocs = <any> await subLocsModel.getChildren(loc['location_id']);

                if (loc['location_id'] in subLocationsObj) {
                    loc['sublocation_count'] = subLocationsObj[loc['location_id']]['count'];
                    locsIds = JSON.parse(JSON.stringify(subLocationsObj[loc['location_id']]['ids']));
                } else {
                    loc['sublocation_count'] = 0;
                }
                 
                    
                if(queries.sublocations){
                    loc['sublocations'] = sublocs;
                }
                for(let sub of sublocs){
                    sublocsids.push(sub.location_id);
                }
                

                if(loc.parent_id > -1){
                    locsIds.push(loc.location_id);
                }

                sublocsids.push(loc['location_id']);

                loc['num_tenants'] = <any> await accountModelTenantCount.countTenantsFromLocationIds(locsIds.join(','));
                

                wardens = <any> await emRolesModel.getWardensInLocationIds(sublocsids.join(','), 0, queryAccountId, true);
                
                loc['num_wardens'] = wardens.length;
                loc['wardens'] = wardens;

                let impaired = <any> await mobilityModel.getImpairedUsersInLocationIds(locsIds.join(','), queryAccountId); //=========

                loc['mobility_impaired'] = impaired.length;
            } else if (tenantAccountLocations.indexOf(loc['location_id']) != -1) {
                
                // TRP
                if (loc['location_id'] in subLocationsObj) {
                    loc['sublocation_count'] = subLocationsObj[loc['location_id']]['count'];
                    locsIds = JSON.parse(JSON.stringify(subLocationsObj[loc['location_id']]['ids']));
                } else {
                    loc['sublocation_count'] = 0;
                }
                if(loc.parent_id > -1){
                    locsIds.push(loc.location_id);
                }

                loc['num_tenants'] = <any> await accountModelTenantCount.countTenantsFromLocationIds(locsIds.join(','));
               
                wardens = <any> await emRolesModel.getWardensInLocationIds(locsIds.join(','), 0, queryAccountId, true);

                loc['num_wardens'] = wardens.length;
                loc['wardens'] = wardens;
                let impaired = <any> await mobilityModel.getImpairedUsersInLocationIds(locsIds.join(','), queryAccountId);
                loc['mobility_impaired'] = impaired.length;
            }
        }

        
        response['under_location'] = (parentId) ? await new Location(parentId).load() : {};
        if(parentId){
            let ancestriesModel = new Location(),
            ancestries = await ancestriesModel.getAncestries(parentId);
            response['ancestries'] = ancestries;
        }


        if(pagination){
            let
            filterCount = JSON.parse(JSON.stringify(filter)),
            locAccntRelObjCount = new LocationAccountRelation(),
            locCount = [],
            limit = 10;

            filterCount['count'] = true;

            try{
                locCount = await locAccntRelObjCount.listAllLocationsOnAccount(req.user.account_id, filterCount);
            }catch(e){
                console.log(e);
            }

            response.pagination = {
                total : (locCount[0]) ? parseInt(locCount[0]['count']) : 0,
                pages : 0
            },
            limit = (queries.limit) ? parseInt(queries.limit) : 10;

            if(response.pagination.total > limit){
                let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

                if(rem > 0){
                    totalpages++;
                }

                response.pagination.pages = totalpages;
            }

            if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
                response.pagination.pages = 1;
            }
        }
        
        return res.status(200).send(response);
	}

    public async getLocationsHierarchyByAccount(req: AuthRequest, res: Response){
        let 
        accountId = req.user.account_id,
        account = new Account(accountId),
        locationsOnAccount = [],
        locations = <any> [],
        roles = <any> [],
        response = {
            locations : <any> [],
            deepLocations : <any> []
        },
        isFrp = false,
        isTrp = false,
        isPortfolio = false,
        userRoleRel = new UserRoleRelation(),
        filter = {},
        r = 0;

        try {
          r = await userRoleRel.getByUserId(req.user.user_id, true);
        } catch(e) {
          r = 0;
        }

        try {
          roles = await userRoleRel.getByUserId(req.user.user_id);
          for(let role of roles){
              if(role['is_portfolio'] == 1){
                  isPortfolio = true;
              }
          }
        } catch(e) { }

        let
        allLocModel = new Location(), 
        allLocations = <any> await allLocModel.getAllLocations();

        filter['responsibility'] = 'Manager';
        filter['isPortfolio'] = isPortfolio;
        filter['userId'] = req.user.user_id;

        let locAccntRelObj = new LocationAccountRelation();

        try{
            response.locations = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
        }catch(e){
            response.locations = [];
        }

        let merged = this.mergeToParent(allLocations);

        for(let all of allLocations){
            for(let i in response.locations){
                if(response.locations[i]['location_id'] == all['location_id']){
                    response.locations[i] = all;
                }
            }
        }

        

        res.send(response);
    }

    public async searchLocationsHierarchy(req: AuthRequest, res: Response){
        let
        locModel = new Location(),
        subLocs = new Location(),
        locations = <any> [],
        searchBuildings = (req.query.building) ? req.query.building : false;

        console.log('req.query.building', req.query.building);

        locations = <any> await locModel.searchLocation({ name : req.params.key }, 7, false, searchBuildings);
        for(let loc of locations){
            let sublocModel = new Location(loc.location_id);
            loc['sublocations'] = <any> await sublocModel.getSublocations();
        }

        res.send(locations);
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
          data : <any>[],
          building: <any>[]
        },
        locationSublocations = new Location(req.params.parent_id);
        locationSublocations.load().then((buildingDbData) => {
          response.building = buildingDbData;
          return locationSublocations.getParentsChildren(parentId);
          // res.statusCode = 200;
        }).then((results) => {
          res.statusCode = 200;
          response.data = results;
          return res.send(response);
        });


       /*
        locationSublocations.getParentsChildren(parentId).then((results) => {
          response.data = results;
          res.send(response);
        });
        */

    }

    public async updateLocation(req: AuthRequest, res: Response){
        let
        location = req.body.location,
        sublocations = req.body.sublocations,
        response = {
          status : false,
          message : '',
          data : <any>{
              location : {},
              sublocations : []
          }
        },
        locAccntUserModel = new LocationAccountUser();

        try{

            let locModel = new Location(location.location_id);
            let locData = await locModel.load();
            let locAccUser = <any>[];
            try{
                locAccUser = await locAccntUserModel.getByLocationIdAndUserId(location.location_id, req.user.user_id);
            }catch(e){  }


            for(let i in location){
                if(i in locData){
                    locModel.set( i, location[i] );
                }
            }

            await locModel.dbUpdate();
            response.data.location = locModel.getDBData();

            for(let sub of sublocations){

                let subModel = new Location(sub.location_id);
                try{
                    let subLocData = await subModel.load();
                    for(let i in sub){
                        if(i in subLocData){
                            subModel.set( i, sub[i] );
                        }
                    }

                    await subModel.dbUpdate();
                    response.data.sublocations.push(subModel.getDBData());

                }catch(e){
                    let subLocData = JSON.parse(JSON.stringify(locData));
                    let subModel = new Location();
                    for(let i in sub){
                        if(i in subLocData){
                            subLocData[i] = sub[i];
                        }
                    }
                    subLocData['parent_id'] = locData['location_id'];
                    delete subLocData['location_id'];

                    await subModel.create(subLocData);
                    response.data.sublocations.push(subModel.getDBData());

                    let roleId = 0;
                    for(let i in locAccUser){
                        if(locAccUser[i]['location_id'] == locData['location_id']){
                            roleId = locAccUser[i]['role_id'];
                        }
                    }

                    let locAccUserModel = new LocationAccountUser();
                    await locAccUserModel.create({
                        location_id : subModel.ID(),
                        account_id : req.user.account_id,
                        user_id : req.user.user_id
                    });

                }

            }

        }catch(e){
            response.message = 'No Location';
        }

        res.send(response);

    }

    public async addAccountToLocation(req: AuthRequest, res: Response) {
        let locAccRelModel = new LocationAccountRelation(),
            locationModel = new Location(req.body.location_id),
            response = {
                status : false,
                data : {},
                message : ''
            };

        try{
            await locationModel.load();

            let responsibility = 'Tenant';
            if(locationModel.get('is_building') == 1 || locationModel.get('parent_id') == -1){
                responsibility = 'Manager';
            }

            let relations = await locAccRelModel.getByAccountIdAndLocationId(req.body.account_id, req.body.location_id);
            if(relations.length == 0){
                await locAccRelModel.create({
                    'location_id' : req.body.location_id,
                    'account_id' : req.body.account_id,
                    'responsibility' : responsibility
                });
            }


            response.status = true;
        }catch(e){}

        res.send(response);
    }

    public async removeAccountFromLocation(req: AuthRequest, res: Response){
        let locAccRelModel = new LocationAccountRelation(),
            locationModel = new Location(req.body.location_id),
            response = {
                status : false,
                data : {},
                message : ''
            };

        try{
            await locationModel.load();

            let relations = <any> await locAccRelModel.getByAccountIdAndLocationId(req.body.account_id, req.body.location_id);
            for(let rel of relations){
                let removeLocAccRel = new LocationAccountRelation(rel.location_account_relation_id);
                try{
                    await removeLocAccRel.delete();
                }catch(e){}
            }

            response.data = <any> relations;
            response.status = true;
        }catch(e){}

        res.send(response);
    }

    public async createBuildingAndAddAccount(req: AuthRequest, res: Response){
        let 
        locModel = new Location(),
        body = req.body,
        response = {
            status : false,
            data : [],
            message : ''
        },
        locationModel = new Location(),
        locData = {
            name : body.name,
            state : body.state,
            street : body.street,
            is_building : 1,
            admin_verified : 1
        },
        accountId = body.account_id,
        sublocations = body.sublocations,
        locationAccnt = new LocationAccountRelation(),
        parentId = 0,
        locId = 0;


        await locationModel.create(locData);
        parentId = locationModel.ID();
        locId = locationModel.ID();

        
        await locationAccnt.create({
            'location_id': locId,
            'account_id': accountId,
            'responsibility': 'Manager'
        });

        for(let sub of sublocations){
            let 
            locSubModel = new Location(),
            locaAccnt = new LocationAccountRelation(),
            subData = {
                parent_id : parentId,
                name : sub.name,
                state : body.state,
                street : body.street,
                is_building : 0,
                admin_verified : 1
            };

            await locSubModel.create(subData);

            await locaAccnt.create({
                'location_id': locSubModel.ID(),
                'account_id': accountId,
                'responsibility': 'Tenant'
            });
        }

        response['body'] = body;

        res.send(response);
    }

    public async searchBuildings(req: AuthRequest, res: Response){
        let 
        locModel = new Location(),
        locations = <any> [];

        let accountId = (req.query.account_id) ? req.query.account_id : 0;

        locations = await locModel.searchBuildings(req.query.key, accountId);
        if(req.query.get_sublocation){
            for(let loc of locations){
                let locSubModel = new Location(loc.location_id);
                loc['sublocations'] = await locSubModel.getSublocations();
            }
        }

        res.send(locations);
    }

    public async searchLevels(req: AuthRequest, res: Response){
        let 
        locModel = new Location(),
        locations = await locModel.searchLevels(req.query.key);

        res.send(locations);
    }

    public async requestAddLocationToUser(req: AuthRequest, res: Response){
      let 
      response = {
        data : [],
        status : false,
        message : ''
      },
      opts = {
        from : '',
        fromName : 'EvacConnect',
        to : ['jmanoharan@evacgroup.com.au'],
        cc: ['emacaraig@evacgroup.com.au'],
        body : '',
        attachments: [],
        subject : 'EvacConnect Add Location To User Request'
      },
      email = new EmailSender(opts),
      emailBody = email.getEmailHTMLHeader(),
      userModel = new User(req.body.user_id),
      accountModel = new Account(),
      locationModel = new Location();

      try{
        await userModel.load();
        accountModel.setID(<number>userModel.get('account_id'));
        await accountModel.load();

        let location = await locationModel.locationHierarchy(req.body.location_id);
        location = (location[0]) ? <any>location[0] : {};


        let 
        locName = (location['p1_name'] !== null && location['p1_name'].length > 0) ? location['p1_name']+', '+location['name'] : location['name'],
        fullname = userModel.get('first_name')+' '+userModel.get('last_name'),
        tokenModel = new Token(),
        token = this.generateRandomChars(25),
        linkTrue = 'https://' + req.get('host') +'/token/request/add-location-to-user?action=true&location='+req.body.location_id+'&user='+req.body.user_id,
        linkFalse = 'https://' + req.get('host') +'/token/request/add-location-to-user?action=false&location='+req.body.location_id+'&user='+req.body.user_id;

        emailBody += '<p style="font-size:24px;"> This user ('+this.capitalizeFirstLetter(fullname)+') from ('+accountModel.get('account_name')+') <br/>';
        emailBody += 'is requesting ('+locName+') to be added to his account <br/>';
        emailBody += '</p>';
        emailBody += '<h5>Action : <a href="'+linkTrue+'" target="_blank" style="text-decoration:none; color:#39a1ff;">Approve</a>  || <a href="'+linkFalse+'" target="_blank" style="text-decoration:none; color:#dc4453;">Decline</a><br/></h5>';
        emailBody += '<h5>Thank you!</h5>';

        emailBody += email.getEmailHTMLFooter();

        email.assignOptions({ body : emailBody });

        await email.send(
          () => {
            response.status = true;
            response.message = 'email sent';
            res.send(response);
          },
          () => {
            response.message = 'unable to send message';
            res.send(response);
          }
        );

      }catch(e){
        response.message = 'no user';
        res.send(response);
      }

    }

}
