import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import  * as fs  from 'fs';
import * as path from 'path';
const validator = require('validator');
const md5 = require('md5');
/**
 * / route
 *
 * @class RegisterRoute
 */
 export class RegisterRoute extends BaseRoute {

	/**
   	* Create the routes.
   	*
   	* @class RegisterRoute
   	* @method create
   	* @static
   	*/
	public static create(router: Router) {
	   	// add register route
	   	router.post('/register', (req: Request, res: Response, next: NextFunction) => {
	   		new RegisterRoute().index(req, res, next);
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

	/**
	 * Required keys
	 * @param { Object } data user's data from sign up page
	 */
	public validateKeys(data){
		if(
			('first_name' in data) &&
			('last_name' in data) &&
			('email' in data) &&
			('password' in data) &&
			('confirm_password' in data) &&
			('role_id' in data)
		){
			return true;
		}else{
			return false;
		}
	}

	public sanitizeData(data){
		/*
		data.first_name = validator.trim(data.first_name);
		data.first_name = validator.escape(data.first_name);

		data.last_name = validator.trim(data.last_name);
		data.last_name = validator.escape(data.last_name);
		
		data.email = validator.trim(data.email);
		data.email = validator.normalizeEmail(data.email);

		data.password = validator.trim(data.password);
		data.password = validator.escape(data.password);

		data.confirm_password = validator.trim(data.confirm_password);
		data.confirm_password = validator.escape(data.confirm_password);*/

		return data;
	}

	public validateData(data){
		let errors = 0,
			response = {
				status : false,
				message : '',
				data : {}
			};

		// first name validation
		if(validator.isEmpty(data.first_name)){
			response.data['first_name'] = ' First name is required ';
			errors++;
		}

		// last name validation
		if(validator.isEmpty(data.last_name)){
			response.data['last_name'] = ' Last name is required ';
			errors++;
		}

		// email validation
		if(validator.isEmpty(data.email)){
			response.data['email'] = ' Email is required ';
			errors++;
		}else if( !validator.isEmail(data.email) ){
			response.data['email'] = ' Email is invalid ';
			errors++;
		}

		if(validator.isEmpty(data.password) || validator.isEmpty(data.confirm_password)){
			response.data['password'] = ' Password is required ';
			errors++;
		}else if(data.password !== data.confirm_password){
			response.data['password'] = ' Password and Confirm password did not matched ';
			errors++;
		}

		if( !validator.isInt( ''+data.role_id+'' ) ){
			response.data['role_id'] = ' Role id is required and must be a number ';
			errors++;
		}

		if(errors > 0){
			response.status = false;
			let count = 0,
				msg = '';
			for(let i in response.data){
				msg += response.data[i];
				if( Object.keys(response.data).length - 1 !=  count){
					msg += ',';
				}
				count++;
			}
			response.message = msg;
		}else{
			response.status = true;
		}

		return response;
	}

	/**
	 * Index
	 * @param {Request}      req  
	 * @param {Response}     res  
	 * @param {NextFunction} next 
	 */
	public index(req: Request, res: Response, next: NextFunction){

		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			};

		// Default status code && content type
		res.statusCode = 400;

		if(this.validateKeys(reqBody)){
			// reqBody = this.sanitizeData(reqBody);
			let validatorResponse:any = this.validateData(reqBody);
			if(validatorResponse.status){
				const userEmailCheck = new User();
				userEmailCheck.getByEmail(reqBody.email).then(
					(userdata) => {
						response.message = 'Email already taken';
						response.data['email_taken'] = 'Email already taken';
						res.send(response);
					},
					(e) => {
						this.saveUser(reqBody, res, next, response);
					}
				);
			}else{
				res.send(validatorResponse);
			}
		}else{
			response.message = 'Please complete required fields';
			res.send(response);
		}
	}

	private saveUser(reqBody, res: Response, next: NextFunction, response){
		// Save the data
		const user = new User();
		const userRole = new UserRoleRelation();
		reqBody.password = md5('Ideation'+reqBody.password+'Max');
		reqBody.evac_role = 'Client';
		user.create(reqBody).then(
			() => {
				/* CURRENT AVAILABLE TO INSERT TRP AND FRP */
				if(reqBody.role_id == 2 || reqBody.role_id == 1){
					userRole.create({
						'user_id' : user.ID(),
						'role_id' : reqBody.role_id
					}).then(
						() => {
							res.statusCode = 200;
							response.status = true;
							response.data = reqBody;
							response.data['user_id'] = user.ID();
							res.send(response);
						},
						() => {
							res.statusCode = 500;
							res.send('Unable to save user role');
						}
					);
				}else{
					res.statusCode = 200;
					response.status = true;
					response.data = reqBody;
					response.data['user_id'] = user.ID();
					res.send(response);
				}
			},
			() => {
				res.statusCode = 500;
				res.send('Unable to save');
			}
		);
	}

}

  