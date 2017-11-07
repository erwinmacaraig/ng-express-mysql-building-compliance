import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { InvitationCode  } from '../models/invitation.code.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import * as validator from 'validator';
import * as path from 'path';


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
		router.post('/users/upload-profile-picture', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
	    	new  UsersRoute().uploadProfilePicture(req, res, next);
	    });
	}


	public uploadProfilePicture(req: AuthRequest, res: Response, next: NextFunction){
		const fu = new FileUploader(req, res, next);
		const link = fu.uploadFile().then(
			(url) => {
				res.statusCode = 200;
				res.send({
					status : true,
					imageUrl : fu.getUploadedFileLocation()
				});
			}
		).catch((e) => {
			res.statusCode = 500;
			return res.end('Error uploading file');
		});
	}

}