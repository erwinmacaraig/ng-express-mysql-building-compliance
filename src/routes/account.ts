import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import  * as fs  from 'fs';
import * as path from 'path';
const validator = require('validator');
const md5 = require('md5');

/**
 * / route
 *
 * @class AccountRoute
 */
 export class AccountRoute extends BaseRoute {
	/**
   	* Create the routes.
   	*
   	* @class AccountRoute
   	* @method create
   	* @static
   	*/
	public static create(router: Router) {
	   	// add route
	   	
	   	router.get('/accounts/get-by-user/:user_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().getAccountByUserId(req, res);
	   	});

	   	router.post('/accounts/generate-invitation-code', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().generateInvitationCode(req, res);
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

	public getAccountByUserId(req: AuthRequest, res: Response){
		let  response = {
				status : false,
				message : '',
				data : {}
			},
			account = new Account();

		// Default status code
		res.statusCode = 400;
		
		account.getByUserId(req.params['user_id']).then(
			(accountData) => {
				response.status = true;
				res.statusCode = 200;
				response.data = accountData;
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

	/**
	 * To generate random characters
	 * @return {String} characters
	 */
	public generateRandomChars(length){
		let chars = 'ABCDEFGHIJKKLMNOPQRSTUVWXYZ0987654321',
			len = (typeof length == 'number') ? length : 15,
			responseCode = '';

		for(let i=0; i<=len; i++){
			responseCode += chars[ Math.floor(Math.random() * chars.length) ];
		}

		return responseCode;
	}


	public generateInvitationCode(req: AuthRequest, res: Response){
		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			},
			error = 0;

		res.statusCode = 400;

		if( !('location_id' in reqBody ) ){
			response.message = 'Location is required, ';
			error++;
		}else{
			if( !('account_id' in reqBody ) ){
				response.message = 'Account is required, ';
				error++;
			}else{
				if( !('roles' in reqBody ) ){
					response.message = 'Roles are required, ';
					error++;
				}
			}
		}

		if(error == 0){
			let responseCodes = {};
			for(let i in reqBody.roles){
				responseCodes[ Object.keys(responseCodes).length ] = {
					'role' : reqBody.roles[i], 'code' : this.generateRandomChars(25)
				};
			}

			response.data = responseCodes;
			res.statusCode = 200;
			res.send(response);
		}else{
			res.send(response);
		}

	}

}

  