import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import  * as fs  from 'fs';
import * as path from 'path';
const validator = require('validator');
const md5 = require('md5');

/**
 * / route
 *
 * @class ForgotPasswordRequestRoute
 */
 export class ForgotPasswordRequestRoute extends BaseRoute {
	/**
   	* Create the routes.
   	*
   	* @class ForgotPasswordRequestRoute
   	* @method create
   	* @static
   	*/
	public static create(router: Router) {
	   	// add route
	   	
	   	router.post('/forgot/password/request', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().index(req, res, next);
	   	});

	   	// /forgot/password/validation/'+saveData.user_id+'/'+saveData.token+'/'+saveData.action

	   	router.get('/forgot/password/validation/:user_id/:token/:action', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().forgotPasswordValidation(req, res, next);
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

		// Default status code
		res.statusCode = 400;

		if(!validator.isEmail(reqBody.email)){
			response.message = 'Invalid email';
			res.send(response);
		}else{
			const userEmailCheck = new User();
			userEmailCheck.getByEmail(reqBody.email).then(
				userdata => {
					let saveData = {
							user_id : userdata['user_id'],
							token : this.generateRandomChars(25)+'-'+this.generateRandomChars(25),
							action : 'forgot-password' 
						},
						tokenModel = new Token();

					tokenModel.create(saveData).then(
						() => {
							const emailLink = 'http://'+req.headers.host + '/forgot/password/validation/'+saveData.user_id+'/'+saveData.token+'/'+saveData.action;
							saveData['emailLink'] = emailLink;

							response.data = saveData;
							response.message = 'Email was sent to you, please open the email and click the link to confirm reset password request. Thank you!';
							response.status = true;
							res.statusCode = 200;
							res.send(response);
						},
						() => {
							response.message = "Unsuccessful token saving";
							res.send(response);
						}
					);
				},
				e => {
					response.message = 'Email does not exist';
					res.send(response);
				}
			);
		}
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

	/**
	 * forgotPasswordValidation
	 * @param {Request}      req 
	 * @param {Response}     res
	 * @param {NextFunction} next
	 */
	public forgotPasswordValidation(req: Request, res: Response, next: NextFunction){
		const
			userId = req.params.user_id,
			token = req.params.token,
			action = req.params.action,
			user = new User(userId),
			tokenModel = new Token(),
			response = {
				status : false,
				message : '',
				data : {}
			};

		// Default bad request
		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {
				user.load().then(
					userData => {
						let userValid = false;
						if(Object.keys(userData).length > 0){
							if(userData['user_id'] == userId){
								userValid = true;
							}
						}
						
						if(userValid){
							if(tokenData['action'] == 'forgot-password'){
								let paramData = {
									user_id : new Buffer( userData['user_id'].toString() ).toString('base64'),
									full_name : new Buffer(userData['first_name']+' '+userData['last_name']).toString('base64'),
									token : token
								};

								const url = 'http://'+req.headers.host+'/change-password/'+paramData.user_id+'/'+paramData.full_name+'/'+paramData.token;

								res.send('<a href="'+url+'">'+url+'</a>');
								// res.redirect('http://'+req.headers.host+'/change-password/'+paramData.user_id+'/'+paramData.full_name+'/'+paramData.token);
							}
						}else{
							res.send('User is invalid');
						}
					},
					e => {
						res.send('User is invalid');
					}
				);
			},
			(e) => {
				res.send('Token is invalid');
			}
		);
	}

}

  