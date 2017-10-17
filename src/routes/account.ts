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
	   	
	   	router.get('/get-by-user/:user_id', (req: Request, res: Response, next: NextFunction) => {
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

		account.getByUserId(req.params['user_id']).then(
			(accountData) => {
				res.statusCode = 200;
				response.data = accountData;
				res.send(response);
			},
			(e) => {
				res.statusCode = 200;
				response.message = 'no accounts found';
				res.send(response);
			}
		);

		 
	}

}

  