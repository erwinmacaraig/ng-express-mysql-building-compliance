import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
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
	   	
	   	router.get('/accounts/get-by-user/:user_id', (req: Request, res: Response, next: NextFunction) => {
	   		console.log(req.params['user_id']);
	   		new AccountRoute().getByUserId(req, res, next);
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

	public getByUserId(req: Request, res: Response, next: NextFunction){
		let  response = {
				status : false,
				message : '',
				data : {}
			},
			account = new Account();

		// Default status code
		res.statusCode = 400;

		console.log(req.params['user_id']);

		account.getByUserId(req.params['user_id']).then(
			(accountData) => {
				console.log(accountData, response);
				response.status = true;
				res.statusCode = 200;
				response.data = accountData;
				res.send(response);
			},
			(e) => {
				console.log(e, response);
				response.status = true;
				res.statusCode = 200;
				response.message = 'no accounts found';
				res.send(response);
			}
		);

		 
	}

}

  