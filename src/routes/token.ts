import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';

import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';

import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';

import * as moment from 'moment';
import * as validator from 'validator';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';

import { RegisterRoute } from './register';
import { ForgotPasswordRequestRoute } from './forgot.password';



export class TokenRoute extends BaseRoute {

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
		router.get('/token/:token', (req: Request, res: Response, next: NextFunction) => {
			new TokenRoute().handle(req, res, next);
		});
	}

	public handle(req: Request, res: Response, next: NextFunction){
		let token = req.params.token,
			response = {
				status : false,
				message : '',
				data : {}
			},
			tokenModel = new Token();

		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {

				this.callModules(tokenData, req, res, next);

			},
			() => {
				response.message = 'No token found';
				res.send(response);
			}
		);
	}

	public callModules(tokenData, req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			message : '',
			data : {}
		},
		action = tokenData['action'];

		switch (action) {
			case "verify":
				new RegisterRoute().userVerification(req, res, next);
				break;
			case "forgot-password":
				new ForgotPasswordRequestRoute().changePasswordRequest(req, res, next);
				break;
			default:
				response.message = 'No action found';
				res.send(response);
				break;
		}

	}

}