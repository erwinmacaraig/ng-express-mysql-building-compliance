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
           })

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
                return res.status(400).send({
                    locations : [],
                    message: err
                });
            });
        });

        router.get('/location/get-parent-locations-by-account-id', new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response) => {
            new LocationRoute().getParentLocationsByAccount(req, res, 0).then((data) => {
                return res.status(200).send(data);
            }).catch((err) => {
                return res.status(400).send({
                    locations : [],
                    message: err
                });
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
                dbLocationData['google_photo_url'] = req.body.photoUrl;
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
            archivedValue = (req.body.archived) ? req.body.archived : 1,
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
    		locationModel.set('archived', archivedValue);

    		try{
    			await locationModel.dbUpdate();

	    		let sublocations = await locationSubModel.getDeepLocationsByParentId(locationId);
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
                    parent.sublocations.push(child);
                  }
                }else{
      				if(child.parent_id == parent.location_id){
      					parent.sublocations.push(child);
      				}
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
		let
        isQuery = (Object.keys(req.query).length > 0) ? true : false,
        locationId = (isQuery) ? req.query.location_id : req.params.location_id,
        accountId = (isQuery) ? req.query.account_id : req.user.account_id,
        getRelatedOnly = (isQuery) ? (req.query.get_related_only == 'true') ? true : false : false,
        location = new Location(locationId),
        sublocations,
        othersub = [],
        locAccRel = new LocationAccountRelation();

      	// we need to check the role(s)
      	const userRoleRel = new UserRoleRelation();
      	const roles = await userRoleRel.getByUserId(req.user.user_id);

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
      	let r = 100;
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
            let locAcc = new LocationAccountUser(),
                locAccUsers = <any> await locAcc.getByUserId(req.user.user_id);
            for(let locacc of locAccUsers){
                response.users_locations.push(locacc);
            }
        }catch(e){}

      	let locData = <any> await location.load();

      	response.location = location.getDBData();
        const wardenCalc = new WardenBenchmarkingCalculator();

        let sublocationIdsArray = [0];

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
        /*
        try {
          for(let i = 0; i < sublocations.length; i++) {
            if (sublocations[i]['location_id'] in nominatedWardensObj) {
              sublocations[i]['nominated_wardens'] = (nominatedWardensObj[sublocations[i]['location_id']]['users']).length;
              const trainingDetailsForLocation = await training.getEMRUserCertifications(nominatedWardensObj[sublocations[i]['location_id']]['users']);
              sublocations[i]['trained_wardens'] = trainingDetailsForLocation['total_passed'];
            } else { // there are no nominated wardens
              sublocations[i]['nominated_wardens'] = 0;
              sublocations[i]['trained_wardens'] = 0;
            }
            if (sublocations[i]['location_id'] in calcResults) {
              sublocations[i]['total_estimated_wardens'] = calcResults[sublocations[i]['location_id']]['total_estimated_wardens'];
            } else {
              sublocations[i]['total_estimated_wardens'] = 0;
            }
            sublocations[i]['total_wardens'] = (sublocations[i]['nominated_wardens'] >= sublocations[i]['total_estimated_wardens']) ?
            sublocations[i]['nominated_wardens'] : sublocations[i]['total_estimated_wardens'];
          }
          // console.log(sublocations);
        } catch(e) {
          console.log('There are no wardens for this building');
        } */

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

            /*let locAccModel = new LocationAccountRelation();
            // locAcc = <any> await locAccModel.getByWhereInLocationIds( sub.location_id );
            const locationAccountUserObj = new LocationAccountUser();
            // listing of roles is implemented here because we are only listing roles on a sub location
            try {
              const canLoginTenants = await locationAccountUserObj.listRolesOnLocation(defs['Tenant'], sub.location_id);
              sub['num_tenants'] = Object.keys(canLoginTenants).length;

              if (sub['num_tenants'] == 0) {
                const locationAccountRel = new LocationAccountRelation();
                const temp = await locationAccountRel.getByAccountIdAndLocationId(req.user.account_id, sub.location_id);
                sub['num_tenants'] = temp.length;
              }
            } catch (e) {
              sub['num_tenants']  = 0;
            }*/
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
	    // get immediate parent
	    const parentId = <number>location.get('parent_id');

	    if (parentId === -1 ) {
            response.parent['name'] = '';
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
            queries = req.body,
            locAccntRelObj = new LocationAccountRelation(),
            userRoleRel = new UserRoleRelation(),
            filter = {
                archived : (archived) ? archived : 0
            },
            mobilityImpaired = new MobilityImpairedModel();
        let
            r = 0,
            EMRole = new UserEmRoleRelation(),
            temp,
            totalWardens = 0,
            userIds = [],
            response = <any> {
                locations : []
            };

        if(pagination){
            response['pagination'] = {
                total : 0, pages : 0
            };
        }

        try {
          r = await userRoleRel.getByUserId(req.user.user_id, true);
        } catch(e) {
          console.log('location route get-parent-locations-by-account-d',e);
          r = 0;
        }
        filter['responsibility'] = r;

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
        }

        const subLocsArr = [];
        let subLocsStr = '';
        const subLocationsObj = {};
        for(let loc of response.locations){
          subLocsArr.push(loc['location_id']);
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

        for(let loc of response.locations){
            loc['sublocation_count'] = subLocationsObj[loc['location_id']]['count'];
            /*let canLoginTenants = {},
                locationAccountUserObj = new LocationAccountUser();
            try {
                canLoginTenants = await locationAccountUserObj.listRolesOnLocation(defs['Tenant'], loc['location_id']);
                loc['num_tenants'] = Object.keys(canLoginTenants).length;
            } catch(e) {
                // loc['num_tenants'] = 0;
                const locationAccountRel = new LocationAccountRelation();
                const temp = await locationAccountRel.getByAccountIdAndLocationId(req.user.account_id, loc['location_id']);
                loc['num_tenants'] = temp.length;
            }*/

            let
                subLocsModel = new Location(),
                sublocsids = [],
                sublocs = <any> await subLocsModel.getChildren(loc['location_id']),
                accountModelTenantCount = new Account();

            for(let sub of sublocs){
                sublocsids.push(sub.location_id);
            }

            let
                // locsIds = JSON.parse(JSON.stringify(sublocationIds)),
                locsIds = JSON.parse(JSON.stringify(subLocationsObj[loc['location_id']]['ids'])),
                emRolesModel = new UserEmRoleRelation(),
                wardens = [];

            if(loc.parent_id > -1){
                locsIds.push(loc.location_id);
            }

            sublocsids.push(loc['location_id']);

            loc['sublocsids'] = sublocsids.join(',');

            loc['num_tenants'] = <any> await accountModelTenantCount.countTenantsFromLocationIds(locsIds.join(','));

            wardens = <any> await emRolesModel.getWardensInLocationIds(sublocsids.join(','), 0, req.user.account_id);

            loc['num_wardens'] = wardens.length;
            loc['wardens'] = wardens;

            let mobilityModel = new MobilityImpairedModel(),
                impaired = <any> await mobilityModel.getImpairedUsersInLocationIds(locsIds.join(','), req.user.account_id);

            loc['mobility_impaired'] = impaired.length;

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
        const accountId = req.user.account_id,
            account = new Account(accountId);

        let locationsOnAccount = [],
            locations = <any> [],
            roles = <any> [],
            response = {
                locations : <any> [],
                deepLocations : <any> []
            },
            isFrp = false,
            isTrp = false;

        try{
            let userRoleModel = new UserRoleRelation();

            roles = await userRoleModel.getByUserId(req.user.user_id);

            for(let i in roles){
                if(roles[i]['role_id'] == 1){
                    isFrp = true;
                }
                if(roles[i]['role_id'] == 2){
                    isTrp = true;
                }
            }

        }catch(e){}

        try {
            locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id, 1);
            for (let loc of locationsOnAccount) {
                locations.push(loc);
            }

        } catch (e) { }

        try{
            let userEmRole = new UserEmRoleRelation(),
            emRoles = <any> await userEmRole.getEmRolesByUserId(req.user.user_id);
            for (let em of emRoles) {
                locations.push(em);
                for(let i in defs['em_roles']){
                    roles.push({
                        role_id : em.em_role_id,
                        role_name : em.role_name
                    });
                }
            }
        }catch(e){  }

        response['locations_db'] = locations;
        response['roles'] = roles;

        let responseLocations = [];
        for (let loc of locations) {
            let allSubLocationIds = [0],
                deepLocModel = new Location(),
                deepLocations = <any> [];

            if(loc.parent_id > -1){
                let ancLocModel = new Location(),
                    ancestores = <any> await ancLocModel.getAncestries(loc.location_id);
                for(let anc of ancestores){
                    if(anc.parent_id == -1){
                        deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(anc.location_id);
                        deepLocations.push(anc);
                    }
                }
            }else{
                deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);
                deepLocations.push(loc);
            }

            for(let deep of deepLocations){
                deep['sublocations'] = [];
            }

            let locMerged = this.addChildrenLocationToParent(deepLocations),
                respLoc = (locMerged[0]) ? locMerged[0] : false;

            if(respLoc){
                for(let sub of deepLocations){
                    if(sub.parent_id > -1){
                        allSubLocationIds.push(sub.location_id);
                    }
                }

                let alreadyHave = false;
                for(let resloc of responseLocations){
                    if(resloc.location_id == respLoc.location_id){
                        alreadyHave = true;
                    }
                }

                if(!alreadyHave){
                    responseLocations.push(respLoc);
                }
            }

        }

        response.locations = responseLocations;

        res.send(response);
    }

    public async searchLocationsHierarchy(req: AuthRequest, res: Response){
        let
        locModel = new Location(),
        subLocs = new Location(),
        locations = <any> [];

        locations = <any> await locModel.searchLocation({ name : req.params.key }, 7);
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

}

