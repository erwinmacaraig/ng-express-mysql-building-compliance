import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { EmailSender } from '../models/email.sender';
import { SecurityAnswers } from '../models/security-answers.model';
import { SecurityQuestions } from '../models/security-questions.model';

import * as moment from 'moment';

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

	   	router.get('/change/password-request/:user_id/:token', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().changePasswordRequest(req, res, next);
	   	});

	   	router.post('/forgot/password/change/users/password', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().changeUsersPassword(req, res, next);
	   	});

	   	router.get('/forgot/password/find/username/:username', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().findUsername(req, res, next);
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
				(userdata) => {
					let currentDate = moment(),
						expirationDate = currentDate.add(1, 'day'),
						expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss'),
						saveData = {
							user_id : userdata['user_id'],
							token : this.generateRandomChars(25)+'-'+this.generateRandomChars(25),
							action : 'forgot-password',
							expiration_date : expDateFormat
						},
						tokenModel = new Token();

					userdata['token'] = saveData['token'];

					tokenModel.create(saveData).then(
						() => {
							this.sendEmailChangePassword(req, userdata,
								() => {
									response.data = saveData;
									response.message = 'Email was sent to you, please open the email and click the link to confirm reset password request. Thank you!';
									response.status = true;
									res.statusCode = 200;
									res.send(response);
								},
								() => {
									response.message = "Email was not sent";
									res.send(response);
								}
							);

							
						},
						() => {
							response.message = "Unsuccessful token saving";
							res.send(response);
						}
					);
				},
				(e) => {
					response.message = 'Email does not exist';
					res.send(response);
				}
			);
		}
	}

	public sendEmailChangePassword(req, userData, success, error){
		let opts = { 
	        from : 'allantaw2@gmail.com',
	        fromName : 'EvacConnect',
	        to : [],
	        body : '',
	        attachments: [],
	        subject : 'EvacConnect Invitation'
	    };

		let email = new EmailSender(opts),
			emailBody = email.getEmailHTMLHeader(),
			link = req.protocol + '://' + req.get('host') +'/change/password-request/'+userData.user_id+'/'+userData.token;

		emailBody += '<h3 style="text-transform:capitalize;">Hi '+this.capitalizeFirstLetter(userData.first_name)+' '+this.capitalizeFirstLetter(userData.last_name)+'</h3> <br/>';
		emailBody += '<h4> Please click the link below to create new password. </h4> <br/>';
		emailBody += '<a href="'+link+'" target="_blank" style="text-decoration:none; color:#0277bd;">'+link+'</a> ';

		emailBody += email.getEmailHTMLFooter();

		email.assignOptions({
			body : emailBody,
			to: [userData.email]
		});

		email.send(success, error);
	}

	public changePasswordRequest(req: Request, res: Response, next: NextFunction){
		let userId = req.params.user_id,
			token = req.params.token,
			user = new User(userId),
			tokenModel = new Token(),
			response = {
				status : false,
				message : '',
				data : {}
			};

		// Default status code
		res.statusCode = 400;

		user.load().then(
			(userdata) => {
				tokenModel.getByToken(token).then(
					(tokenData) => {
						if(tokenData['user_id'] == userId){

							if(tokenData['verified'] == 1){
								res.send('Token is already verified');
							}else{
								let currentDate = moment(),
									expirationDate = moment(tokenData['expiration_date'], ['YYYY-MM-DD HH:mm:ss']);

								if(expirationDate.isAfter(currentDate)){
									// Redirect to angular Router
									//change-user-password/:user_id/:token
									let link = req.protocol + '://' + req.get('host') + '/change-user-password/'+userId+'/'+token;
									res.redirect(link);
								}else{
									response.message = 'Token expired';
									res.send(response);
								}
							}

						}else{
							response.message = 'Invalid user in token';
							res.send(response);
						}
					},
					() => {
						response.message = 'Invalid token';
						res.send(response);
					}
				);
			},
			() => {
				response.message = 'User not found';
				res.send(response);
			}
		);
	}

	public validateChangeUserPassword(data){
		let response = {
			status : false, message : '', data : {}
		},
		error = 0;

		if( !('user_id' in data) ){
			error++;
		}

		if( !('token' in data) ){
			error++;
		}

		if( !('new_password' in data) ){
			error++;
		}else{
			if(data.new_password !== data.confirm_password){
				error++;
				response.message = 'Password mismatch';
			}
		}

		if( !('confirm_password' in data) ){
			error++;
		}

		if(error == 0){
			response.status = true;
		}

		return response;
	}

	public changeUsersPassword(req: Request, res: Response, next: NextFunction){
		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			};

		// Default status code
		res.statusCode = 400;

		let validateData = this.validateChangeUserPassword(reqBody);
 
		if(validateData.status){
			let userId = reqBody.user_id,
				token = reqBody.token,
				newPass = reqBody.new_password,
				confirmPass = reqBody.confirm_password,
				user = new User(userId),
				tokenModel = new Token()

			user.load().then(
				(userdata) => {
					tokenModel.getByToken(token).then(
						(tokenData) => {
							if(tokenData['user_id'] == userId){

								let currentDate = moment(),
									expirationDate = moment(tokenData['expiration_date'], ['YYYY-MM-DD HH:mm:ss']);

								if(expirationDate.isAfter(currentDate)){

									if(tokenData['verified'] == 1){
										response.message = 'This request was already verified';
										res.send(response);
									}else{
										tokenModel.set('verified', 1);
										tokenModel.dbUpdate().then(
											() => {
												user.set('password', md5('Ideation'+newPass+'Max'));
												user.dbUpdate().then(
													() => {
														res.statusCode = 200;
														response.status = true;
														response.message = 'Success';
														res.send(response);
													},
													() => {
														response.message = 'Unable to update';
														res.send(response);
													}
												);
											},
											() => {
												response.message = 'Token update unsuccessful'
											}
										);
									}


								}else{
									response.message = 'Token expired';
									res.send(response);
								}

							}else{
								response.message = 'Invalid user in token';
								res.send(response);
							}
						},
						() => {
							response.message = 'Invalid token';
							res.send(response);
						}
					);
				},
				() => {
					response.message = 'User not found';
					res.send(response);
				}
			);
		}else{
			response.message = (validateData.message.length == 0) ? 'There\'s an invalid field' : validateData.message;
			res.send(response);
		}
	}

	public findUsername(req: Request, res: Response, next: NextFunction){
		let username = req.params.username,
			response = {
				status : false,
				message : '',
				data : {}
			},
			userModel = new User(),
			answerModel = new SecurityAnswers(),
			questionModel = new SecurityQuestions();

		// Default status code
		res.statusCode = 400;

		console.log(username);

		userModel.getByUsername(username).then(
			(userdata) => {
				answerModel.getByUserId(userdata['user_id']).then(
					(answerdata) => {
						questionModel.setID(answerdata['security_question_id']);
						questionModel.load().then(
							(questiondata) => {
								response.data = {
									'question' : questiondata['question'],
									'question_id' : questiondata['security_question_id']
								};
								response.status = true;
								res.statusCode = 200;
								res.send(response);
							},
							() => {
								response.message = 'This user is invalid has no security question';
								res.send(response);
							}
						);
					},
					() => {
						response.message = 'This user is invalid has no security question';
						res.send(response);
					}
				);
			},
			() => {
				response.message = 'Invalid username';
				res.send(response);
			}
		);

	}


}

  