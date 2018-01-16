import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { Account } from '../models/account.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { UserInvitation } from './../models/user.invitation.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';
import { LocationAccountUser } from '../models/location.account.user';
import { LocationAccountRelation } from '../models/location.account.relation';
import { Location } from '../models/location.model';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { EmailSender } from './../models/email.sender';
import { UserRequest } from '../models/user.request.model';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';

import * as moment from 'moment';
import * as validator from 'validator';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';


export class UsersRoute extends BaseRoute {

	/**
	* Constructor
	*
	* @class RegisterRoute
	* @constructor
	*/
	constructor() {
		super();
	}


	public static create(router: Router) {
		router.post('/users/upload-profile-picture', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().uploadProfilePicture(req, res, next);
	    });

	    router.post('/users/check-is-verified', (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().checkVerifiedUser(req, res, next);
	    });

	    router.get('/users/get-roles/:user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserRole(req, res, next);
	    })

	    router.get('/users/get-users-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountId(req, res, next);
	    });

	    router.get('/users/get-user-locations-trainings-ecoroles/:loc_acc_user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserLocationsTrainingsEcoRoles(req, res, next);
	    })

	    router.post('/users/archive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToArchive(req, res, next);
	    });

	    router.get('/users/get-archived-users-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getArchivedUsersByAccountId(req, res, next);
	    });

	    router.post('/users/unarchive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToUnArchive(req, res, next);
	    });

	    router.post('/users/create-bulk-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().createBulkUsers(req, res, next);
	    });

	    router.post('/users/remove-user-from-location', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeUserFromLocation(req, res, next);
	    });

	    router.post('/users/get-my-warden-team', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getMyWardenTeam(req, res, next);
	    });

	    router.post('/users/request-as-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().requestAsWarden(req, res, next);
	    });

	    router.post('/users/get-warden-request', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getWardenRequest(req, res, next);
	    });

	    router.post('/users/resign-as-chief-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().resignAsChiefWarden(req, res, next);
	    });

	    router.post('/users/resign-as-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().resignAsWarden(req, res, next);
	    });

	    router.post('/users/mobility-impaired-info', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().saveMobilityImpairedDetails(req, res, next);
	    });
	}

	public uploadProfilePicture(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			data : {},
			message : ''
		};

		const fu = new FileUploader(req, res, next);
		const link = fu.uploadFile().then(
			() => {
				console.log(req.body.user_id);

				let filesModel = new Files(),
					fileUserModel = new FileUser(),
					awsPath = fu.getUploadedFileLocation();

				filesModel.create({
					file_name : req['file']['filename'],
					url : awsPath,
					directory : 'uploads',
					uploaded_by : req.body.user_id,
					datetime : moment().format('YYYY-MM-DD HH:mm:ss')
				}).then(
					() => {
						fileUserModel.create({
							user_id : req.body.user_id,
							file_id : filesModel.ID(),
							type : 'profile'
						}).then(
							() => {
								response.status = true;
								response.data['url'] = awsPath;
								res.send(response);
							},
							() => {
								response.message = 'Error on saving file';
								res.end(response);
							}
						);
					},
					() => {
						response.message = 'Error on saving file';
						res.end(response);
					}
				);
			}
		).catch((e) => {
			response.message = 'Error on uploading';
			res.end(response);
		});
	}

	public checkVerifiedUser(req: Request, res: Response, next: NextFunction) {
		let response = {
			status : false,
			data : {},
			message : ''
		},
		tokenModel = new Token();
		res.statusCode = 400;

		tokenModel.getkUserVerified(req.body.user_id).then(
			(token) => {
				res.statusCode = 200;
				response.status = true;
				response.message = 'User is verified';
				res.send(response);
			},
			() => {
				response.message = 'not verified';
				res.send(response);
			}
		);
	}

	public getUserRole(req: Request, res: Response, next: NextFunction){
		let userRoleRelation = new UserRoleRelation(),
			response = {
				status : false,
				message : '',
				data : {}
			},

			getWardenRoles = (callBack) => {
				new UserEmRoleRelation().getEmRolesByUserId(req.params['user_id']).then(
                    (userRoles) => {
                        for(let i in userRoles){
                            response.data[ Object.keys( response.data ).length ] = {
                                role_id : userRoles[i]['em_roles_id'],
                                role_name : userRoles[i]['role_name'],
                                is_warden_role : userRoles[i]['is_warden_role']
                            };
                        }
                        callBack();
                    },
                    (a) => {
                        callBack();
                    }
                );
			}

		res.statusCode = 400;
		userRoleRelation.getByUserId(req.params['user_id']).then(
			(roles) => {
				for(let i in roles){
					if(roles[i]['role_id'] == 1){
						roles[i]['role_name'] = 'Building Manager';
					}else if(roles[i]['role_id'] == 2){
						roles[i]['role_name'] = 'Tenant';
					}
				}

				response.data = roles;

				getWardenRoles(() => {
					response.status = true;
					res.statusCode = 200;
					res.send(response);
				});
			},
			() => {
				getWardenRoles(() => {
					response.status = true;
					res.statusCode = 200;
					res.send(response);
				});
			}
		);
	}

	public async getUsersByAccountId(req: Request, res: Response, next: NextFunction){
		let accountId = req.params.account_id,
			locationAccountUser = new LocationAccountUser(),
			response = {
				data : <any>[],
				status : false,
				message : ''
			},
			allParents = [];

		let arrWhere = [];
			arrWhere.push( ["account_id = "+accountId ] );
			arrWhere.push( ["archived = "+0] );
		let locations = await locationAccountUser.getMany(arrWhere);
		let emRolesModel = new UserEmRoleRelation();
		let emRoles = await emRolesModel.getEmRoles();
		let locationsToSend = [];

		let allowedRoleIds = [0,1,2];
		for(let i in emRoles){
			allowedRoleIds.push(emRoles[i]['em_roles_id']);
		}

		for(let l in locations){

			if(  allowedRoleIds.indexOf(locations[l]['role_id']) > -1 ){
				let userModel = new User(locations[l]['user_id']);
				let parentLocation = new Location(locations[l]['parent_id']);

				if(allParents.indexOf(locations[l]['parent_id']) == -1){
					await parentLocation.load().then(() => {
						allParents[ locations[l]['parent_id'] ] = parentLocation.getDBData();
						locations[l]['parent_data'] = parentLocation.getDBData();
					}, () => {
						locations[l]['parent_data'] = {};
					});
				}else{
					locations[l]['parent_data'] = allParents[ locations[l]['parent_id'] ];
				}

				await userModel.load().then( async ()=>{
					locations[l]['user_info'] = userModel.getDBData();

					let filesModel = new Files();
					try{
						let profRec = await filesModel.getByUserIdAndType( userModel.get('user_id'), 'profile' );
						locations[l]['user_info']['profile_pic'] = profRec[0]['url'];
					}catch(e){
						locations[l]['user_info']['profile_pic'] = '';
					}

				},()=>{
					locations[l]['user_info'] = {};
				});

				locationsToSend.push(locations[l]);
			}

		}

		response.data = locationsToSend;
		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async getUserLocationsTrainingsEcoRoles(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			data : {
				user : {},
				location : {},
				trainings : <any>[],
				role_text : '',
				role_id : 0
			},
			message : ''
		},
		locationAccountUser = new LocationAccountUser(req.params['loc_acc_user_id']);

		await locationAccountUser.load();

		let loc_acc_user = locationAccountUser.getDBData(),
			userModel = new User(loc_acc_user['user_id']),
			locationModel = new Location(loc_acc_user['location_id']);

		response.data['user'] = await userModel.load();
		response.data['location'] = await locationModel.load();
		response.data['loc_acc_user'] = loc_acc_user;

		try{
			let parentLocation = new Location(response.data['location']['parent_id']);
			await parentLocation.load();
			response.data['location']['parent_data'] = ( Object.keys(parentLocation.getDBData()).length > 0 ) ? parentLocation.getDBData() : {};
		}catch(e){
			response.data['location']['parent_data'] = {};
		}

		if(loc_acc_user['role_id'] == 1){
			response.data['role_text'] = 'Building Manager';
			response.data.role_id = 1;
		}else if(loc_acc_user['role_id'] == 2){
			response.data['role_text'] = 'Tenant';
			response.data.role_id = 2;
		}else{
			let userEmRoleRelation = new UserEmRoleRelation();
			await userEmRoleRelation.getEmRolesByUserId( loc_acc_user['user_id'] ).then(
				() => {
					let eco_roles = userEmRoleRelation.getDBData();
					response.data['eco_roles'] = eco_roles;
					for(let x in eco_roles){
						response.data['role_text'] = eco_roles[x]['role_name'];
						response.data.role_id = eco_roles[x]['em_roles_id'];
					}
				},
				() => {
				}
			);
		}

		let fileModel = new Files();
        await fileModel.getByUserIdAndType(loc_acc_user['user_id'], 'profile').then(
            (fileData) => {
                response.data['user']['profilePic'] = fileData[0].url;
            },
            () => {
                response.data['user']['profilePic'] = '';
            }
        );

        response.data['user']['mobility_impaired_details'] = {}

        if( response.data['user']['mobility_impaired'] == 1 ){
        	let mobilityModel = new MobilityImpairedModel(),
        		arrWhere = [];

        	arrWhere.push( "user_id = " + response.data['user']['user_id'] );
        	arrWhere.push( "location_id = " + response.data['location']['location_id'] );

        	let mobilityDetails = await mobilityModel.getMany( arrWhere );
        	response.data['user']['mobility_impaired_details'] = ( mobilityDetails[0] ) ? mobilityDetails[0] : {};
        }

		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async setLocationAccountUserToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['location_account_user_id']){
			let locAccountUser = new LocationAccountUser(req.body['location_account_user_id'][i]);
			await locAccountUser.load();
			console.log(locAccountUser.getDBData());
			locAccountUser.set('archived', 1);
			await locAccountUser.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async setLocationAccountUserToUnArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['location_account_user_id']){
			let locAccountUser = new LocationAccountUser(req.body['location_account_user_id'][i]);
			await locAccountUser.load();
			console.log(locAccountUser.getDBData());
			locAccountUser.set('archived', 0);
			await locAccountUser.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async getArchivedUsersByAccountId(req: Request, res: Response, next: NextFunction){
		let accountId = req.params.account_id,
			locationAccountUser = new LocationAccountUser(),
			response = {
				data : <any>[],
				status : false,
				message : ''
			},
			allParents = [];

		let arrWhere = [];
			arrWhere.push( ["account_id = "+accountId ] );
			arrWhere.push( ["archived = "+1 ] );
			
		let locations = await locationAccountUser.getMany(arrWhere);
		for(let l in locations){
			let userModel = new User(locations[l]['user_id']);
			let parentLocation = new Location(locations[l]['parent_id']);

			if(allParents.indexOf(locations[l]['parent_id']) == -1){
				await parentLocation.load().then(() => {
					allParents[ locations[l]['parent_id'] ] = parentLocation.getDBData();
					locations[l]['parent_data'] = parentLocation.getDBData();
				}, () => {
					locations[l]['parent_data'] = {};
				});
			}else{
				locations[l]['parent_data'] = allParents[ locations[l]['parent_id'] ];
			}

			await userModel.load().then(()=>{
				locations[l]['user_info'] = userModel.getDBData();
			},()=>{
				locations[l]['user_info'] = {};
			});

		}

		response.data = locations;
		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async createBulkUsers(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false, data : [], message: ''
		},
		users = JSON.parse(req.body.users),
		returnUsers = [];

		for(let i in users){
			let userModel = new User(),
				userRoleRelation = new UserRoleRelation(),
				userEmRole = new UserEmRoleRelation(),
				emRoles = await new UserEmRoleRelation().getEmRoles(),
				isEmailValid = this.isEmailValid(users[i]['email']),
				isBlackListedEmail = false,
				hasError = false;

			users[i]['errors'] = {};

			if(isEmailValid){
				isBlackListedEmail = new BlacklistedEmails().isEmailBlacklisted(users[i]['email']);
				if(!isBlackListedEmail){
					await userModel.getByEmail(users[i]['email']).then(
						() => {
							console.log(userModel.getDBData());
							hasError = true;
							users[i]['errors']['email_taken'] = true;
						},
						() => {}
					);
				}else{
					users[i]['errors']['blacklisted'] = true;
					hasError = true;
				}
			}else{
				users[i]['errors']['invalid'] = true;
				hasError = true;
			}

			if(!hasError){
				let
				token = this.generateRandomChars(30),
				saveData = {
					'first_name' : users[i]['first_name'],
					'last_name' : users[i]['last_name'],
					'email' : users[i]['email'],
					'contact_number' : users[i]['mobile_number'],
					'location_id' : users[i]['account_location_id'],
					'account_id' : req['user']['account_id'],
					'role_id' : (users[i]['account_role_id'] == 1 || users[i]['account_role_id'] == 2) ? users[i]['account_role_id'] : 0,
					'eco_role_id' : (users[i]['account_role_id'] != 1 && users[i]['account_role_id'] != 2) ? users[i]['account_role_id'] : 0,
					'invited_by_user' : req['user']['user_id']
				};

				let invitation = new UserInvitation();
				await invitation.create(saveData);

				let tokenModel = new Token();
				await tokenModel.create({
					'token' : token,
					'action' : 'invitation',
					'id' : invitation.ID(),
					'id_type' : 'user_invitations_id'
				});

				const opts = {
					from : 'allantaw2@gmail.com',
					fromName : 'EvacConnect',
					to : [],
					cc: [],
					body : '',
					attachments: [],
					subject : 'EvacConnect Notification'
				};
				const email = new EmailSender(opts);
				const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + token;
				let emailBody = email.getEmailHTMLHeader();
				emailBody += `<h3 style="text-transform:capitalize;">Hi ${saveData['first_name']} ${saveData['last_name']},</h3> <br/>
				<h4>You were added to EvacConnect Compliance Management System.</h4> <br/>
				<h5>Click on the link below to setup your password.</h5> <br/>
				<a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

				emailBody += email.getEmailHTMLFooter();

				email.assignOptions({
					body : emailBody,
					to: [saveData['email']],
					cc: ['erwin.macaraig@gmail.com']
				});
				email.send(
					(data) => console.log(data),
					(err) => console.log(err)
				);
			}else{
				returnUsers.push( users[i] );
			}

		}

		res.statusCode = 200;
		response.status = true;
		response.data = returnUsers;
		res.send(response);
	}

	public async removeUserFromLocation(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false, data : <any>[], message : ''
		},
		id = req.body['location_account_user_id'],
		locAccUserModel = new LocationAccountUser(id),
		locAccUser = await locAccUserModel.load(),
		emRoleModel = new UserEmRoleRelation();

		await locAccUserModel.delete();

		/*let emRolesRec = await emRoleModel.getEmRolesByUserId(locAccUser['user_id']),
			hasGenOcc = false,
			hasOtherWarden = false;

		for(let i in emRolesRec){
			emRolesRec[i]['deleted'] = false;
			if(emRolesRec[i]['location_id'] == locAccUser['location_id']){
				const deleteEmRoleModel = new UserEmRoleRelation( emRolesRec[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
				emRolesRec[i]['deleted'] = true;
			}

			if(
				(emRolesRec[i]['is_warden_role'] == 1) && 
				(emRolesRec[i]['location_id'] != locAccUser['location_id']) &&
				!emRolesRec[i]['deleted']
				){
				hasOtherWarden = true;
			}

			if(emRolesRec[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasOtherWarden && !hasGenOcc){
			let createEmRole = new UserEmRoleRelation();
			await createEmRole.create({
				'user_id' : locAccUser['user_id'],
				'location_id' : locAccUser['location_id'],
				'em_role_id' : 8
			});

			let createLoctionRelation = new LocationAccountUser();
			await createLoctionRelation.create({
				'user_id' : locAccUser['user_id'],
				'account_id' : locAccUser['account_id'],
				'location_id' : locAccUser['location_id'],
				'role_id' : 8
			});
		}*/
		
		response.status = true;
		res.send(response);
	}

	public async getMyWardenTeam(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true, data : {
				user : {},
				eco_role : {},
				location : {},
				team : <any>[]
			}, message : ''
		},
		roleId = req.body.role_id,
		emRoleRelation = new UserEmRoleRelation(),
		emRoles = await emRoleRelation.getEmRoles(),
		myEmRoleRelation = new UserEmRoleRelation(),
		myEmRoles,
		locationAccountUser = new LocationAccountUser(),
		locationModel = new Location();

		try{
			myEmRoles = await myEmRoleRelation.getEmRolesByUserId(req['user']['user_id']);
			for(let i in emRoles){
				if(emRoles[i]['em_roles_id'] == roleId){
					response.data.eco_role = emRoles[i];
				}
			}

			response.data['myEmRoles'] = myEmRoles;

			const accountsLocations = await locationAccountUser.getMany([
				[ "account_id = "+req['user']['account_id'] ]
			]);

			let myEmRoleRecord = {};
			for(let i in myEmRoles){
				if(myEmRoles[i]['em_roles_id'] == roleId){
					myEmRoleRecord = myEmRoles[i];
				}
			}

			if(myEmRoleRecord['location_id']){
				myEmRoleRecord['related_locations'] = await locationModel.getAncestries(myEmRoleRecord['location_id']);
				response.data.location = {
					'location_id' : myEmRoleRecord['location_id'],
					'parent_id' : myEmRoleRecord['parent_id'],
					'name' : myEmRoleRecord['location_name'],
					'formatted_address' : myEmRoleRecord['formatted_address'],
					'google_place_id' : myEmRoleRecord['google_place_id'],
					'google_photo_url' : myEmRoleRecord['google_photo_url'],
					'related_locations' : myEmRoleRecord['related_locations'],
					'parent_location' : {}
				};

				let mainParentLocationId,
					mainParent = {};
				for(let i in myEmRoleRecord['related_locations']){
					if(myEmRoleRecord['related_locations'][i]['parent_id'] == -1){
						mainParent = myEmRoleRecord['related_locations'][i];
						mainParentLocationId = myEmRoleRecord['related_locations'][i]['location_id'];
					}
				}

				if(myEmRoleRecord['parent_id'] == response.data.location['parent_id']){
					if(response.data.location['parent_id'] > -1){
						response.data.location['parent_location'] = mainParent;
					}
				}

				let deepLocation = new Location(),
					subLocations = await deepLocation.getDeepLocationsByParentId(mainParentLocationId),
					subLocationsIds = [];

				for(let i in subLocations){
					subLocationsIds.push(subLocations[i]['location_id']);
				}

				let userEmRoleRelationTeam = new UserEmRoleRelation(),
					teamEmRoles = <any>[];

				if(  roleId == 11 || roleId == 15 || roleId == 16 || roleId == 18 ){
					//Chief Wardens //Deputy Chief Warden //Building Warden //Deputy Building Warden
					teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], subLocationsIds.join(','));
				}else if(roleId == 8 || roleId == 9 ||  roleId == 10 || roleId == 12 || roleId == 13 || roleId == 14){
					//Gen Occupant
					teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], myEmRoleRecord['location_id']);
				}else{

				}

				response.data['teamEmRoles'] = teamEmRoles;

				let team = [];
				for(let i in teamEmRoles){
					if(teamEmRoles[i]['user_id'] != req['user']['user_id']){
						teamEmRoles[i]['parent_location'] = {};
						if(teamEmRoles[i]['parent_id'] == mainParentLocationId){
							teamEmRoles[i]['parent_location'] = mainParent;
						}else{
							for(let x in subLocations){
								if(teamEmRoles[i]['parent_id'] == subLocations[x]['location_id']){
									teamEmRoles[i]['parent_location'] = subLocations[x];
								}
							}
						}
						team.push(teamEmRoles[i]);
					}
				}
				response.data.team = team;
				
				/*response.data['accntlocations'] = accountsLocations;
				response.data['emRoles'] = emRoles;
				response.data['myEmRoles'] = myEmRoles;
				response.data['myEmRoleRecord'] = myEmRoleRecord;*/
				response.data.user = req['user'];

				let fileModel = new Files();
		        await fileModel.getByUserIdAndType(req['user']['user_id'], 'profile').then(
		            (fileData) => {
		                response.data['user']['profilePic'] = fileData[0].url;
		            },
		            () => {
		                response.data['user']['profilePic'] = '';
		            }
		        );
			}else{
				response.status = false;
			}

		}catch(e){
			response.status = false;
		}

		res.send(response);
	}

	public async requestAsWarden(req: Request, res: Response, next: NextFunction){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		locationModel = new Location(req.body.location),
		userModel = new User(req.body.user),
		approverModel = new User(req.body.approver),
		token1Model = new Token(),
		token2Model = new Token(),
		token1 = this.generateRandomChars(30),
		token2 = this.generateRandomChars(30),
		currentDate = moment(),
		expirationDate = currentDate.add(1, 'day'),
		expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss');

		try{
			let location = await locationModel.load();
			await userModel.load();
			await approverModel.load();

			await requestModel.create({
				'user_id' : req.body.user,
				'requested_role_id' : 9,
				'location_id' : req.body.location,
				'approver_id' : req.body.approver
			});

			await token1Model.create({
				'token' : token1,
				'action' : 'user-request-approve',
				'verified' : 0,
				'expiration_date' : expDateFormat,
				'id' : requestModel.ID(),
				'id_type' : 'user_requests_id'
			});

			await token2Model.create({
				'token' : token2,
				'action' : 'user-request-decline',
				'verified' : 0,
				'expiration_date' : expDateFormat,
				'id' : requestModel.ID(),
				'id_type' : 'user_requests_id'
			});

			let parentLocationModel = new Location( location['parent_id'] ),
				parentLocation;
			if(location['parent_id'] > -1){
				parentLocation = await parentLocationModel.load();
			}

			const 
			opts = {
				from : 'allantaw2@gmail.com',
				fromName : 'EvacConnect',
				to : [ approverModel.get('email') ],
				cc: ['erwin.macaraig@gmail.com'],
				body : '',
				attachments: [],
				subject : 'EvacConnect Warden Request'
			},
			email = new EmailSender(opts),
			approvelink = req.protocol + '://' + req.get('host') + '/token/' + token1,
			declinelink = req.protocol + '://' + req.get('host') + '/token/' + token2;


			let 
			emailBody = email.getEmailHTMLHeader(),
			userName = userModel.get('first_name')+' '+userModel.get('last_name'),
			approverName = approverModel.get('first_name')+' '+approverModel.get('last_name'),
			locationString =  '';

			if(Object.keys(parentLocation).length > 0){
				locationString += parentLocation['name']+', ';
			}

			locationString += location['name'];

			emailBody += `<h3 style="text-transform:capitalize;">Hi ${approverName},</h3> <br/>
			<h4> ${userName} requested to be a warden in location '${locationString}' </h4> <br/>
			<h5>Click on the link below for corresponding response </h5> <br/>
			<a href="${approvelink}" target="_blank" style="text-decoration:none; color:#0277bd;">Approve</a> | 
			<a href="${declinelink}" target="_blank" style="text-decoration:none; color:#f44336;">Decline</a>
			<br>`;
			emailBody += email.getEmailHTMLFooter();

			email.assignOptions({
				body : emailBody
			});

			email.send(
				(data) => console.log(data),
				(err) => console.log(err)
			);

		}catch(e){
			response.status = false;
			response.message = e;
		}
		
		res.send(response);
	}

	public async getWardenRequest(req: Request, res: Response, next: NextFunction){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		arrWhere = [];

		arrWhere.push('user_id = '+req.body.user_id);
		response.data = await requestModel.getWhere(arrWhere);

		res.send(response);
	}

	public async userRequestHandler(req: Request, res: Response, tokenData, fromEmail:boolean){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		tokenModel = new Token(),
		arrWhere = [],
		action = 'approved',
		status = 1,
		currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

		if(tokenData['verified'] == 0){

			if(tokenData['action'].indexOf('decline') > -1){
				action = 'declined';
				status = 2;
			}

			arrWhere.push('user_requests_id = '+tokenData['id']);
			let requests = await requestModel.getWhere(arrWhere);
			if(Object.keys(requests).length > 0){
				let allToken = await tokenModel.getAllByUserId(tokenData['id'], undefined, 'user_requests_id');
				for(let i in allToken){
					let tokenModify = new Token(allToken[i]['token_id']);
					await tokenModify.load();
					tokenModify.set('verified', 1);
					await tokenModify.dbUpdate();
				}

				let request = requests[0],
					requestModify = new UserRequest(request['user_requests_id']);
				await requestModify.load();
				requestModify.set('status', status);
				requestModify.set('date_responded', currentDate);
				requestModify.set('viewed', 1);

				let locationId = parseInt(request['location_id']),
					userId = request['user_id'],
					approverId = request['approver_id'],
					roleId = parseInt(request['requested_role_id']);

				let locationModel = new Location(locationId),
					userModel = new User(userId),
					approverModel = new User(approverId),
					parentLocationModel = new Location(),
					parentLoc = <any>{};

				const location = await locationModel.load(),
					user = await userModel.load(),
					approver = await approverModel.load();

				if(location['parent_id'] > -1){
					parentLocationModel.setID(location['parent_id']);
					parentLoc = await parentLocationModel.load();
				}

				let validRole = false,
					isWarden = false,
					isTRPFRP = false,
					roleName = '';

				if(roleId <= 2){
					// await requestModify.dbUpdate();
					//validRole = true;
					//isTRPFRP = true;
					// if (roleId == 1){
					//		roleName = 'FRP'
					// }else{
					// 		roleName = 'TRP';
					// }
				}else if(roleId >= 9 && roleId <= 18){
					validRole = true;
					isWarden = true;
					let emRoleModel = new UserEmRoleRelation();
					let emroles = await emRoleModel.getEmRoles();
					for(let i in emroles){
						if(emroles[i]['em_roles_id'] == roleId){
							roleName = emroles[i]['role_name'];
						}
					}
				}

				if(validRole){
					await requestModify.dbUpdate();

					if(status == 1){
						let locAccUser = new LocationAccountUser(),
							emRoleModel = new UserEmRoleRelation(),
							userRoleModel = new UserRoleRelation();

						await locAccUser.create({
							'location_id' : locationId,
							'account_id' : user['account_id'],
							'user_id' : user['user_id'],
							'role_id' : roleId
						});

						if(isWarden){
							await emRoleModel.create({
								'user_id' : user['user_id'],
								'em_role_id' : roleId,
								'location_id' : locationId
							});
						}
					}

					const 
					opts = {
						from : 'allantaw2@gmail.com',
						fromName : 'EvacConnect',
						// to : [ userModel.get('email') ],
						to : [ 'adelfin@evacgroup.com.au' ],
						cc: [],
						body : '',
						attachments: [],
						subject : 'EvacConnect '+roleName+' Request '
					},
					email = new EmailSender(opts);

					let 
					emailBody = email.getEmailHTMLHeader(),
					userName = userModel.get('first_name')+' '+userModel.get('last_name'),
					approverName = approverModel.get('first_name')+' '+approverModel.get('last_name'),
					locationString =  '';

					if(Object.keys(parentLoc).length > 0){
						locationString += parentLoc['name']+', ';
					}

					locationString += location['name'];

					emailBody += `<h3 style="text-transform:capitalize;">Hi ${userName},</h3> <br/>
					<h4> ${approverName} has ${action} your ${roleName} request in location '${locationString}' </h4> <br/>
					<br>`;
					emailBody += email.getEmailHTMLFooter();

					email.assignOptions({
						body : emailBody
					});

					email.send(
						(data) => console.log(data),
						(err) => console.log(err)
					);

					response.message = 'Success!';

				}else{
					response.message = 'Role is invalid';
				}


			}else{
				response.message = 'No record found';
			}

		}else{
			response.message = 'Sorry, this has already been used';
		}

		if(fromEmail){
			res.send('<h2>'+response.message+'</h2> <script>  setTimeout(function(){ window.close(); }, 2000); </script>');
		}

		res.send(response);
	}

	public async resignAsChiefWarden(req: Request, res: Response, next: NextFunction){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		userId = req.body.user_id,
		emRoleRelationModel = new UserEmRoleRelation(),
		usersEmRoles = await emRoleRelationModel.getEmRolesByUserId(userId);
		response.data = usersEmRoles;

		let hasGenOcc = false,
			deletedEmRole = {};
		for(let i in usersEmRoles){
			if(usersEmRoles[i]['em_roles_id'] == 11){
				deletedEmRole = JSON.parse(JSON.stringify(usersEmRoles[i]));
				let deleteEmRoleModel = new UserEmRoleRelation(  usersEmRoles[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
			}

			if(usersEmRoles[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasGenOcc){
			let createEmRoleGenOccModel = new UserEmRoleRelation();
			await createEmRoleGenOccModel.create({
				'user_id' : userId,
				'em_role_id' : 8,
				'location_id' : deletedEmRole['location_id']
			});
		}

		res.send(response);
	}

	public async resignAsWarden(req: Request, res: Response, next: NextFunction){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		userId = req.body.user_id,
		locationId = req.body.location_id,
		emRoleRelationModel = new UserEmRoleRelation(),
		usersEmRoles = await emRoleRelationModel.getEmRolesByUserId(userId);
		response.data = usersEmRoles;

		let hasGenOcc = false,
			deletedEmRole = {};
		for(let i in usersEmRoles){
			if( usersEmRoles[i]['is_warden_role'] == 1 && usersEmRoles[i]['location_id'] == locationId){
				deletedEmRole = usersEmRoles[i];
				let deleteEmRoleModel = new UserEmRoleRelation(  usersEmRoles[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
			}

			if(usersEmRoles[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasGenOcc){
			let createEmRoleGenOccModel = new UserEmRoleRelation();
			await createEmRoleGenOccModel.create({
				'user_id' : userId,
				'em_role_id' : 8,
				'location_id' : deletedEmRole['location_id']
			});
		}

		res.send(response);
	}

	public async saveMobilityImpairedDetails(req: Request, res: Response, next: NextFunction){
		let 
		response = <any>{
			status : true, data : [], message : ''
		},
		locationId = req.body.location_id,
		userId = req.body.user_id,
		mobilityImpairedModel = new MobilityImpairedModel();

		let arrWhere = [];
			arrWhere.push("user_id = "+userId);
			arrWhere.push("location_id = "+locationId);
		let mobililtyExist = await mobilityImpairedModel.getMany( arrWhere );

		if(mobililtyExist[0]){
			let mobilityUpdate = new MobilityImpairedModel(mobililtyExist[0]['mobility_impaired_details_id']);
			mobilityUpdate.set('user_id', userId);
			mobilityUpdate.set('location_id', locationId);
			mobilityUpdate.set('is_permanent', req.body.is_permanent);
			mobilityUpdate.set('duration_date', req.body.duration_date);
			mobilityUpdate.set('assistant_type', req.body.assistant_type);
			mobilityUpdate.set('equipment_type', req.body.equipment_type);
			mobilityUpdate.set('evacuation_procedure', req.body.evacuation_procedure);
			mobilityUpdate.set('date_created', mobililtyExist[0]['date_created']);
			mobilityUpdate.dbUpdate();
		}else{
			await mobilityImpairedModel.create({
				'user_id' : userId,
				'location_id' : locationId,
				'is_permanent' : req.body.is_permanent,
				'duration_date' : req.body.duration_date,
				'assistant_type' : req.body.assistant_type,
				'equipment_type' : req.body.equipment_type,
				'evacuation_procedure' : req.body.evacuation_procedure,
				'date_created' : moment().format('YYYY-MM-DD HH:mm:00')
			});
		}


		res.send(response);
	}

}
