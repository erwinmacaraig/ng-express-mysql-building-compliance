import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { Account } from '../models/account.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { InvitationCode  } from '../models/invitation.code.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';
import { LocationAccountUser } from '../models/location.account.user';
import { Location } from '../models/location.model';


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

	    router.get('/users/get-user-for-frp-trp-view/:user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserForFrpTrpView(req, res, next);
	    })

	    router.post('/users/archive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToArchive(req, res, next);
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
			arrWhere.push( ["account_id", "=", accountId ] );
			arrWhere.push( ["archived", "=", 0 ] );
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

	public async getUserForFrpTrpView(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false, 
			data : {
				user : {},
				locations : <any>[],
				trainings : <any>[],
				eco_roles : <any>[],
			},
			message : ''
		},
		userModel = new User(req.params['user_id']);

		response.data['user'] = await userModel.load();

		let fileModel = new Files();
        await fileModel.getByUserIdAndType(req.params['user_id'], 'profile').then(
            (fileData) => {
                response.data['user']['profilePic'] = fileData[0].url;
            },
            () => {
                response.data['user']['profilePic'] = '';
            }
        );

		let locationAccountUser = new LocationAccountUser();
		let arrWhere = [];
			arrWhere.push( ["user_id", "=", req.params['user_id'] ] );
		
		response.data['locations'] = await locationAccountUser.getMany(arrWhere);
		let allParents = [];
		for(let l in response.data.locations){
			let parentLocation = new Location(response.data.locations[l]['parent_id']);

			if(allParents.indexOf(response.data.locations[l]['parent_id']) == -1){
				await parentLocation.load().then(() => {
					allParents[ response.data.locations[l]['parent_id'] ] = parentLocation.getDBData();
					response.data.locations[l]['parent_data'] = parentLocation.getDBData();
				}, () => {
					response.data.locations[l]['parent_data'] = {};
				});
			}else{
				response.data.locations[l]['parent_data'] = allParents[ response.data.locations[l]['parent_id'] ];
			}
		}

		let userEmRoleRelation = new UserEmRoleRelation();
		response.data['eco_roles'] = await userEmRoleRelation.getEmRolesByUserId( req.params['user_id'] );

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

}
