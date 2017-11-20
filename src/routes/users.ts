import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { Account } from '../models/account.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { InvitationCode  } from '../models/invitation.code.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';

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

	public checkVerifiedUser(req: Request, res: Response, next: NextFunction){
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
			};

		res.statusCode = 400;
		userRoleRelation.getByUserId(req.params['user_id']).then(
			(roles) => {

				response.data = roles;
				response.status = true;
				res.statusCode = 200;
				res.send(response);
			},
			() => {
				response.message = '';
				res.send(response);
			}
		);
	}

}