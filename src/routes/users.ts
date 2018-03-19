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
const md5 = require('md5');


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
		router.get('/users/is-admin/:user_id',  (req: Request, res: Response) => {
			new UsersRoute().checkIfAdmin(req, res);
		});

		router.post('/users/update', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
	    	new  UsersRoute().updateUser(req, res, next);
	    });

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

	    router.get('/users/get-users-by-account-none-auth/:account_id', (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountIdNoneAuth(req, res);
	    });

	    router.get('/users/get-user-locations-trainings-ecoroles/:user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserLocationsTrainingsEcoRoles(req, res, next);
	    })

	    router.post('/users/archive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToArchive(req, res, next);
	    });

	    router.post('/users/archive-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setUsersToArchive(req, res, next);
	    });

	    router.post('/users/unarchive-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeUsersFromArchive(req, res, next);
	    });

	    router.post('/users/archive-invited-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setInvitedUsersToArchive(req, res, next);
	    });

	    router.post('/users/unarchive-invited-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeInvitedUsersFromArchive(req, res, next);
	    });

	    router.get('/users/get-archived-users-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountId(req, res, next, 1);
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

	    router.get('/users/get-tenants/:location_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getLocationsTenants(req, res, next);
	    });
	}

	public async checkIfAdmin(req: Request , res: Response){
		let userModel = new User(req.params.user_id),
			response = {
				status : false, message : ''
			};

		try{
			let user = await userModel.load();
			if(user['evac_role'] == 'admin'){
				response.status = true;
			}
		}catch(e){}

		res.send(response);
	}

	public async updateUser(req: Request , res: Response, next: NextFunction){
		let 
		response = {
			status : false,
			data : {},
			message : ''
		};

		try{
			let 
			userModel = new User(req.body.user_id),
			userData = await userModel.load();

			for(let i in userData){
				if(i in req.body){
					if(i == 'password'){
						req.body[i] = md5('Ideation'+req.body[i]+'Max');
					}
					userData[i] = req.body[i];
				}
			}

			userModel.setID(req.body.user_id);

			await userModel.dbUpdate();

			response.status = true;
			response.data = userData;
		}catch(e){
			response.message = 'No user found';
		}


		res.send(response);
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

	public async getUsersByAccountIdNoneAuth(req: Request, res: Response){
		let accountId = req.params.account_id,
			userModel = new User();

		res.send({
			status : true,
			data : await userModel.getByAccountId(accountId),
			message : ''
		});

	}

	public async getUsersByAccountId(req: Request, res: Response, next: NextFunction, archived?){
		let accountId = req.params.account_id,
			userID = req['user']['user_id'],
			locationAccountUser = new LocationAccountUser(),
			response = {
				data : <any>[],
				status : false,
				message : ''
			},
			allParents = [],
			allUsersModel = new User(),
			allUsers = <any>[],
			allUsersIds = [],
			emRolesModel = new UserEmRoleRelation(),
			emRoles = await emRolesModel.getEmRoles(),
			emRolesIndexedId = {};

		if(!archived){ archived = 0; }

		allUsers = await allUsersModel.getByAccountId(accountId, archived);

		for(let user of allUsers){
			allUsersIds.push(user.user_id);
			let filesModel = new Files();
			try{
				let profRec = await filesModel.getByUserIdAndType( user.user_id, 'profile' );
				user['profile_pic'] = profRec[0]['url'];
			}catch(e){
				user['profile_pic'] = '';
			}
		}

		let sqlInLocation = ` (
              SELECT
                locations.location_id
              FROM
                locations
              INNER JOIN
                location_account_user LAU
              ON
                locations.location_id = LAU.location_id
              WHERE
                LAU.account_id = ${accountId}
              AND
                locations.archived = 0
              AND
                LAU.user_id = ${userID}
              AND LAU.archived = 0
              GROUP BY
                locations.location_id
              ORDER BY
                locations.location_id
            )`;

        let arrWhere = [];
			arrWhere.push( ["account_id = "+accountId ] );
			arrWhere.push( ["lau.location_id IN "+sqlInLocation ] );

		let locations = await locationAccountUser.getMany(arrWhere);


		let allowedRoleIds = [0,1,2];
		for(let i in emRoles){
			allowedRoleIds.push(emRoles[i]['em_roles_id']);
			emRolesIndexedId[ emRoles[i]['em_roles_id'] ] = emRoles[i];
		}

		let allowedUsersId = [];
		for(let i in locations){
			if( allowedUsersId.indexOf( locations[i]['user_id'] ) == -1  ){
				allowedUsersId.push(locations[i]['user_id']);
			}
		}

		let toSendData = [];
		for(let user of allUsers){
			if( allowedUsersId.indexOf(user.user_id) > -1 ){
				user['locations'] = <any>[];
				for(let l in locations){
					if( 
						( allowedRoleIds.indexOf( locations[l]['role_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['em_roles_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['location_role_id'] ) > -1 )  
						&& locations[l]['user_id'] == user.user_id
						){
						user['locations'].push(locations[l]);
					}
				}
				toSendData.push(user);
			}
		}

		for(let user of toSendData){
			let locs = user.locations;
			user['roles'] = [];
			let tempUserRoles = {};
			for(let loc of locs){
				let roleName = 'General Occupant',
					roleId = 8;

				if( emRolesIndexedId[ loc.em_roles_id ] ){
					roleName = emRolesIndexedId[ loc.em_roles_id ]['role_name'];
					roleId = loc.em_roles_id;
				}else if( emRolesIndexedId[ loc.location_role_id ] ){
					roleName = emRolesIndexedId[ loc.location_role_id ]['role_name'];
					roleId = loc.location_role_id;
				}else if(loc.location_role_id == 1){
					roleName = 'FRP';
					roleId = 1;
				}else if(loc.location_role_id == 2){
					roleName = 'TRP';
					roleId = 2;
				}else if(loc.role_id == 1){
					roleName = 'FRP';
					roleId = 1;
				}else if(loc.role_id == 2){
					roleName = 'TRP';
					roleId = 2;
				}

				if(!tempUserRoles[roleId]){
					tempUserRoles[roleId] = roleId;
					user['roles'].push({
						role_name : roleName, role_id : roleId
					});
				}
				
			}

			user['training_applicable'] = true;
            for(let role of user['roles']){
                if(role.em_roles_id == 12 || role.em_roles_id == 13){
                    if(user['roles'].length == 1){
                        user['training_applicable'] = false;
                    }
                }
            }
		}

		response.data = toSendData;
		response['locations'] = locations;
		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async getUserLocationsTrainingsEcoRoles(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			data : {
				user : {},
				locations : {},
				trainings : <any>[],
				eco_roles : <any>[]
			},
			message : ''
		},
		userId = req.params['user_id'],
		userModel = new User(userId),
		locationAccountUserModel = new LocationAccountUser(),
		fileModel = new Files(),
		user = {},
		emRolesModel = new UserEmRoleRelation(),
		emRoles = await emRolesModel.getEmRoles(),
		mobilityModel = new MobilityImpairedModel();

		response.data.eco_roles = emRoles;

		try{
			let user = await userModel.load(),
				locations = <any>[];

			if( Object.keys(user).length > 0 ){
				user['mobility_impaired_details'] = [];

				let sqlInLocation = ` (
		              SELECT
		                locations.location_id
		              FROM
		                locations
		              INNER JOIN
		                location_account_user LAU
		              ON
		                locations.location_id = LAU.location_id
		              WHERE
		                LAU.account_id = `+user['account_id']+`
		              AND
		                locations.archived = 0
		              AND
		                LAU.user_id = `+req['user']['user_id']+`
		              AND LAU.archived = 0
		              GROUP BY
		                locations.location_id
		              ORDER BY
		                locations.location_id
		            )`;
				let arrWhere = [];
				arrWhere.push(['user_id = '+userId]);
				arrWhere.push( ["lau.location_id IN "+sqlInLocation ] );
				locations = await locationAccountUserModel.getMany(arrWhere);
				
				if( user['mobility_impaired'] == 1 ){
		        	let mobilityModel = new MobilityImpairedModel(),
		        		arrWhere = [];

		        	arrWhere.push( ["user_id = " + userId] );
		        	arrWhere.push( "duration_date > NOW()" );
		        	let mobilityDetails = await mobilityModel.getMany( arrWhere );
		        	user['mobility_impaired_details'] = mobilityDetails;
		        }

				await fileModel.getByUserIdAndType(userId, 'profile').then(
		            (fileData) => {
		                user['profilePic'] = fileData[0].url;
		            },
		            () => {
		                user['profilePic'] = '';
		            }
		        );


				user['mobility_impaired_details'] = <any> await mobilityModel.getMany([ [ "user_id = "+userId] ]);

				for(let i in user['mobility_impaired_details']){
					user['mobility_impaired_details'][i]['date_created_formatted'] = moment(user['mobility_impaired_details'][i]['date_created']).format('MMM. DD, YYYY');
					user['mobility_impaired_details'][i]['duration_date_formatted'] = moment(user['mobility_impaired_details'][i]['duration_date']).format('MMM. DD, YYYY');
				}

			}

			response.data.locations = locations;
			response.data.user = user;
			response.status = true;
		}catch(e){
			response.status = false;
		}

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

	public async setUsersToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['user_ids']){
			let userModel = new User(req.body['user_ids'][i]);
			await userModel.load();
			
			userModel.set('archived', 1);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async removeUsersFromArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['user_ids']){
			let userModel = new User(req.body['user_ids'][i]);
			await userModel.load();
			
			userModel.set('archived', 0);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async setInvitedUsersToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['ids']){
			let userModel = new UserInvitation(req.body['ids'][i]);
			await userModel.load();
			
			userModel.set('archived', 1);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async removeInvitedUsersFromArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['ids']){
			let userModel = new UserInvitation(req.body['ids'][i]);
			await userModel.load();
			
			userModel.set('archived', 0);
			await userModel.dbUpdate();
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
				// isBlackListedEmail = new BlacklistedEmails().isEmailBlacklisted(users[i]['email']);
				// if(!isBlackListedEmail){
					await userModel.getByEmail(users[i]['email']).then(
						() => {
							console.log(userModel.getDBData());
							hasError = true;
							users[i]['errors']['email_taken'] = true;
						},
						() => {}
					);
				// }else{
				// 	users[i]['errors']['blacklisted'] = true;
				// 	hasError = true;
				// }
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

				response.data['myEmRoleRecord'] = myEmRoleRecord;
				response.data['mainParentLocationId'] = mainParentLocationId;
				response.data['mainParent'] = mainParent;

				if(myEmRoleRecord['parent_id'] == response.data.location['parent_id']){
					if(response.data.location['parent_id'] > -1){
						response.data.location['parent_location'] = mainParent;
					}
				}

				let deepLocation = new Location(),
					subLocations = await deepLocation.getDeepLocationsByParentId(mainParentLocationId),
					subLocationsIds = [];

				response.data['subLocations'] = subLocations;

				for(let i in subLocations){
					subLocationsIds.push(subLocations[i]['location_id']);
				}

				console.log(subLocationsIds);

				let userEmRoleRelationTeam = new UserEmRoleRelation(),
					teamEmRoles = <any>[];

				if(  roleId == 11 || roleId == 15 || roleId == 16 || roleId == 18 ){
					//Chief Wardens //Deputy Chief Warden //Building Warden //Deputy Building Warden
					teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], subLocationsIds.join(','));
				}else if(roleId == 8 || roleId == 9 ||  roleId == 10 || roleId == 12 || roleId == 13 || roleId == 14){
					//Gen Occupant //Warden //Fire Safety Advisor //Emergency Planning Committee Member //First Aid Officer
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
		mobilityImpairedModel = new MobilityImpairedModel();

		let saveData = {
			'is_permanent' : req.body.is_permanent,
			'assistant_type' : req.body.assistant_type,
			'equipment_type' : req.body.equipment_type,
			'duration_date' : '',
			'evacuation_procedure' : req.body.evacuation_procedure
		};

		if('mobility_impaired_details_id' in req.body){
			saveData['mobility_impaired_details_id'] = req.body.mobility_impaired_details_id;
		}

		if(saveData['is_permanent'] == 0){
			saveData['duration_date'] = req.body.duration_date;
		}

		if('user_id' in req.body){
			saveData['user_id'] = req.body.user_id;
			saveData['date_created'] = moment().format('YYYY-MM-DD HH:mm:00');
		}else if('user_invitations_id' in req.body){
			saveData['user_invitations_id'] = req.body.user_invitations_id;
			saveData['date_created'] = moment().format('YYYY-MM-DD HH:mm:00');
		}

		await mobilityImpairedModel.create(saveData);

		res.send(response);
	}

	public async getLocationsTenants(req: Request, res: Response, next: NextFunction){
		let response = {
			data : <any>[],
			message : ''
		},
		locId = req.params.location_id,
		locationAccModel = new LocationAccountRelation(),
		returnData = [];

		let tenantsAccount = await locationAccModel.getTenantsOfLocationId(locId),
			accountIds = [],
			accounts = [];
		for(let i in tenantsAccount){
			let accountModel = new Account(tenantsAccount[i]['account_id']);

			try{
				let acc = await accountModel.load();
				acc['users'] = [];
				acc['trps'] = [];
				acc['trp_name'] = '';
				acc['warden_benchmarking'] = '0/00';
				acc['wardens'] = '0/00';
				acc['wardens_trained'] = 0;
				accounts.push( acc );
			}catch(e){}

			accountIds.push(tenantsAccount[i]['account_id']);
		}

		let locAccUserModel = new LocationAccountUser(),
			locAccUserData = await locAccUserModel.getByLocationIdAndAccountId(locId, accountIds.join(',')),
			users = [];

		for(let i in locAccUserData){
			let loc = locAccUserData[i],
				userModel = new User(loc.user_id);

			try{
				let user = <any> await userModel.load();

				for(let a in accounts){

					if(accounts[a]['account_id'] == loc.account_id){
						
						let emRoleModel = new UserEmRoleRelation(),
							emRoles = <any> [];

						try{
							emRoles = await emRoleModel.getEmRolesByUserId(user.user_id);
						}catch(e){ }

						if(loc.role_id == 2){
							accounts[a]['trps'].push({
								first_name : user.first_name,
								last_name : user.last_name,
								user_id : user.user_id
							});
						}

						accounts[a]['users'].push({
							role_id : loc.role_id,
							first_name : user.first_name,
							last_name : user.last_name,
							user_id : user.user_id,
							em_roles : emRoles
						});
					}



				}

				users.push( user );
			}catch(e){}
		}

		
		for(let a in accounts){
			let trpnamesArr = [];
			for(let x in accounts[a]['trps']){
				trpnamesArr.push( accounts[a]['trps'][x]['first_name'] +' '+ accounts[a]['trps'][x]['last_name'] );
			}

			accounts[a]['trp_name'] = trpnamesArr.join(', ');
		}

		response.data = accounts;

		res.send(response);

	}

}
