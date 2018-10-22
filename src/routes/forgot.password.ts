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

	   	/*router.get('/change/password-request/:token', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().changePasswordRequest(req, res, next);
	   	});*/

	   	router.post('/forgot/password/change/users/password', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().changeUsersPassword(req, res, next);
	   	});

	   	router.get('/forgot/password/find/username/:username', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().findUsername(req, res, next);
	   	});

	   	router.post('/forgot/password/security/question/answer', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().securityAnswer(req, res, next);
	   	});

	   	router.get('/forgot/password/get-token-data/:token', (req: Request, res: Response, next: NextFunction) => {
	   		new ForgotPasswordRequestRoute().getTokenData(req, res, next);
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
	public async index(req: Request, res: Response, next: NextFunction){

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
				async (userdata) => {
					let currentDate = moment(),
						expirationDate = currentDate.add(1, 'day'),
						expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss'),
						saveData = {
							id : userdata['user_id'],
							id_type : 'user_id',
							token : userdata['user_id']+''+this.generateRandomChars(50),
							action : 'forgot-password',
							expiration_date : expDateFormat
						},
						tokenModel = new Token(),
						multiTokenModel = new Token(),
                        tokens = <any> [];

                    try{
                        tokens = await multiTokenModel.getAllByUserId(userdata['user_id']);
                        for(let t in tokens){
                            if(tokens[t]['action'] == 'forgot-password'){
                                let tokenDelete = new Token(tokens[t]['token_id']);
                                await tokenDelete.delete();
                            }
                        }
                    }catch(e){ }

                    if(userdata['token'] == null){
                        let userModelToken = new User(userdata['user_id']);
                        userdata['token'] = saveData['token'];
                        for(let i in userdata){
                            userModelToken.set(i, userdata[i]);
                        }
                        await userModelToken.dbUpdate();
                    }else{
                        userdata['token'] = saveData['token'];
                    }

					tokenModel.create(saveData).then(
						() => {
							this.sendEmailChangePassword(req, res, userdata,
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

	public sendEmailChangePassword(req, res, userData, success, error){
		let opts = {
            from : 'admin@evacconnect.com',
            fromName : 'EvacConnect',
            to : [],
            body : '',
            attachments: [],
            subject : 'EvacConnect Change Password'
        };

        let email = new EmailSender(opts),
            link = 'https://' + req.get('host') +'/token/'+userData.token;

        let emailData = <any> {
            users_fullname : this.toTitleCase(userData.first_name+' '+userData.last_name),
            setup_link : 'https://' + req.get('host') +'/token/'+userData.token
        };

        email.assignOptions({
            to: [userData.email],
            cc: []
        });
        email.sendFormattedEmail('forgot-password', emailData, res, success, error);
	}

	public changePasswordRequest(req: Request, res: Response, next: NextFunction){
		let userId = 0,
			token = req.params.token,
			user = new User(),
			tokenModel = new Token(),
			multiTokenModel = new Token(),
			response = {
				status : false,
				message : '',
				data : {}
			};

		// Default status code
		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {
				userId = tokenData['id'];

				if(tokenData['verified'] == 1){
					res.send('Token is already verified');
				}else{

					user.setID(userId);
					user.load().then(
						() => {
							let currentDate = moment(),
								expirationDate = moment(tokenData['expiration_date'], ['YYYY-MM-DD HH:mm:ss']);

							if(expirationDate.isAfter(currentDate)){

								// Redirect to angular Router
								//change-user-password/:user_id/:token
								let link = 'https://' + req.get('host') + '/change-user-password/'+token;
								res.redirect(link);

							}else{
								response.message = 'Token expired';
								res.send(response);
							}
						},
						() => {
							response.message = 'User not found';
							res.send(response);
						}
					);
				}

			},
			() => {
				response.message = 'Invalid token';
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

	public getTokenData(req: Request, res: Response, next: NextFunction){
		let token = req.params.token,
			response = {
				status : false,
				message : '',
				data : {}
			},
			tokenModel = new Token();

		// Default status code
		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {
				res.statusCode = 200;
				response.status = true;
				response.data = tokenData;
				res.send(response);
			},
			() => {
				response.message = 'No token found';
				response.data = [];
				console.log(response);
				res.send(response);
			}
		);
	}

	public async changeUsersPassword(req: Request, res: Response, next: NextFunction){
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
				tokenModel = new Token();

			user.load().then(
				(userdata) => {
					tokenModel.getByToken(token).then(
						(tokenData) => {
							if(tokenData['id'] == userId){

								let currentDate = moment(),
									expirationDate = moment(tokenData['expiration_date'], ['YYYY-MM-DD HH:mm:ss']);

								if(expirationDate.isAfter(currentDate)){

									if(tokenData['verified'] == 1){
										response.message = 'This request was already verified';
										res.send(response);
									}else{
                                        tokenModel.set('verified', 1);
										tokenModel.set('action', 'verify');
										tokenModel.set('token', this.generateRandomChars(5)+`_${Date.now()}_${userId}`) // update token
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

		userModel.getByUsername(username).then(
			(userdata) => {
				answerModel.getByUserId(userdata['user_id']).then(
					(answerdata) => {
						questionModel.setID(answerdata['security_question_id']);
						questionModel.load().then(
							(questiondata) => {
								response.data = {
									'question' : questiondata['question'],
									'question_id' : questiondata['security_question_id'],
									'user_id' : userdata['user_id']
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

	public securityAnswer(req: Request, res: Response, next: NextFunction){
		let answer = req.body.answer,
			questionId = req.body.question_id,
			userId = req.body.user_id,
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

		answerModel.getByQuestionId(questionId, userId).then(
			(answerData) => {
				if( Object.keys(answerData).length > 0 ){

					if(answerData['answer'] == md5(answer)){

						let currentDate = moment(),
						expirationDate = currentDate.add(1, 'day'),
						expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss'),
						saveData = {
							user_id : answerData['user_id'],
							token : this.generateRandomChars(25)+'-'+this.generateRandomChars(25),
							action : 'forgot-password',
							expiration_date : expDateFormat
						},
						tokenModel = new Token();

						tokenModel.create(saveData).then(
							() => {
								res.statusCode = 200;
								response.status = true;
								response.message = 'Correct';
								response.data = {
									token : saveData.token,
									user_id : saveData.user_id
								};
								res.send(response);
							},
							() => {
								response.message = 'Saving token interupted';
								res.send(response);
							}
						);


					}else{
						response.message = 'Wrong answer';
						res.send(response);
					}

				}else{
					response.message = 'Wrong answer';
					res.send(response);
				}
			},
			() => {
				response.message = 'Wrong answer';
				res.send(response);
			}
		);
	}


}
