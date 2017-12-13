import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { EmailSender } from '../models/email.sender';
import { Token } from '../models/token.model';
import { InvitationCode  } from '../models/invitation.code.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { LocationAccountUser } from '../models/location.account.user';
import { SecurityQuestions } from '../models/security-questions.model';
import { SecurityAnswers } from '../models/security-answers.model';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { Utils } from '../models/utils.model';
import { UserLocationValidation } from '../models/user-location-validation.model';

import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import * as jwt from 'jsonwebtoken';

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

      /* Remove before moving to production */
      router.get('/users', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().getUsers(req, res, next);
      });

      // Verify user for first signed user
      /*router.get('/register/user-verification/:token/:redirect', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().userVerification(req, res, next);
      });*/

      router.get('/get-security-questions', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().getSecurityQuestions(req, res, next);
      });

      router.get('/user-account-validation/:validation_id/:frp/:user/:account/:location', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().validateUserAgainstAccount(req, res, next);
      });

      router.get('/user-location-verification/:token', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().verifyUserLocation(req, res, next).then((data) => {
          res.status(200);
          return res.redirect('/success-valiadation/?user-location-verification=true');
        }).catch((e) => {
          res.status(400);
          return res.redirect('/success-valiadation/?user-location-verification=false');
        });
      });

      router.post('/register/resend-email-verification', (req: Request, res: Response, next: NextFunction) => {
        new RegisterRoute().resendEmailVerification(req, res, next);
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

  public async verifyUserLocation(req: Request, res: Response, next: NextFunction) {

    const token = new Token();
    const tokenData = await token.getByToken(req.params.token);
    console.log(tokenData);
    if (!tokenData) {
      throw new Error('Invalid token');
    }
    const expirationDateMoment = moment(tokenData['expiration_date']);
    const currentDateMoment = moment();


    if(!currentDateMoment.isBefore(expirationDateMoment)) {
      throw new Error('Token already expired');
    }
    if (tokenData['action'] !== 'location access' && tokenData['verified'] === 1) {
      throw new Error('Invalid token');
    }

    const locationAccntUser = new LocationAccountUser();
    const user = new User(tokenData['user_id']);
    await user.load();
    const verifyInstance = new UserLocationValidation();
    const verificationInfo = await verifyInstance.getByToken(req.params.token);

    await locationAccntUser.create({
      location_id: verificationInfo['location_id'],
      account_id: user.get('account_id'),
      user_id: tokenData['user_id'],
      role_id: verificationInfo['role_id']
    });

    verificationInfo['status'] = 'VERIFIED';
    await verifyInstance.create(verificationInfo);
    await token.delete();

    return {
      message: 'User location verification successful'
    };

  }

	public validateUserAgainstAccount(req: Request, res: Response, next: NextFunction) {
	  // get parameters
	  const user_frp_validation_id = req.params.validation_id;
	  const FRP_user_id = req.params.frp;
	  const user_id = req.params.user;
	  const account_id = req.params.account;
	  const location_id = req.params.location;
	  const validatedUser = new User(user_id);
	  const utils = new Utils();
	  utils.validateUserIntoAccount(user_frp_validation_id, user_id, FRP_user_id, account_id).then((data) => {

	  	const locationAccountUser = new LocationAccountUser();
	  	locationAccountUser.create({
	  		'user_id' : user_id,
	  		'location_id' : location_id,
	  		'account_id' : account_id
	  	}).then(
	  		() => {
	  			// email user that he is validated.
		        validatedUser.load().then(() => {
		          const emailOpts = {
		            'from': 'allantaw2@gmail.com',
		            'fromName': 'EvacConnect Compliance Management System',
		            'to': [validatedUser.get('email')],
		            'subject': 'User Validation Successful',
		            'body': `
		            Hi <strong>${validatedUser.get('first_name')} ${validatedUser.get('last_name')}</strong>,
		            <br /> <br />
		            Your account has been successfully validated. <br />
		            You can now login to <a href="${req.protocol}://${req.get('host')}/login">EvacConnect Compliance Management System</a>
		            <br />
		            Thank you.
		            `,
		          };
		          const email = new EmailSender(emailOpts);
		          email.send(
		            (d) => console.log(d),
		            (err) => console.log(err)
		          );
		          return res.redirect('/success-valiadation?account-validation=1');
		        });
	  		},
	  		() => {

	  		}
	  	);




	  }).catch((e) => {
	    res.status(400).send({
	      message: e
	    });
	  });

	}

	/**
	 * Required keys
	 * @param { Object } data user's data from sign up page
	 */
	public validateKeys(data){
		if(
			('first_name' in data) &&
			('last_name' in data) &&
			('password' in data) &&
			('confirm_password' in data) &&
			('role_id' in data)
		){
			if(data.role_id == 3){
				if('question_id' in data && 'security_answer' in data){
					return true;
				}else{
					return false;
				}
			}else{
				return true;
			}

		}else{
			return false;
		}
	}

	public validateData(data) {
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
		}else{
			data.first_name = this.capitalizeFirstLetter(data.first_name.toLowerCase());
		}

		// last name validation
		if(validator.isEmpty(data.last_name)){
			response.data['last_name'] = ' Last name is required ';
			errors++;
		}else{
			data.last_name = this.capitalizeFirstLetter(data.last_name.toLowerCase());
		}

		// email validation
		if('email' in data){
			if(validator.isEmpty(data.email)){
				response.data['email'] = ' Email is required ';
				errors++;
			}else if( !validator.isEmail(data.email) ){
				response.data['email'] = ' Email is invalid ';
				errors++;
			}else{
				let blackEmails = new BlacklistedEmails();
				if(blackEmails.isEmailBlacklisted(data.email) && data.role_id < 3){
					response.data['black_listed'] = "The email's domain is blacklisted";
					errors++;
				}
			}
		}
		/*
		// user name or email validation
		if('user_name' in data){
			if(!validator.isEmpty(data.user_name)){
				if( validator.isEmail(data.user_name) ){
					data.email = data.user_name;
					data.user_name = null;
				}
			}else{
				response.data['user_name'] = ' Username or email is required';
				errors++;
			}
		}
		*/

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
		}else if(data.role_id == 3){
			if( !validator.isInt( ''+data.question_id+'' ) ){
				response.data['role_id'] = ' Question id is required and must be a number ';
				errors++;
			}

			if(validator.isEmpty( ''+data.security_answer+'' )){
				response.data['security_answer'] = ' Answer is required ';
				errors++;
			}
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
	public index(req: Request, res: Response, next: NextFunction) {
	 	let reqBody = req.body,
	 	response = {
	 		status : false,
	 		message : '',
	 		data : {}
	 	};

	 	// Default status code && content type
	 	res.statusCode = 400;

	 	if(this.validateKeys(reqBody)) {
	 		// reqBody = this.sanitizeData(reqBody);
	 		let validatorResponse:any = this.validateData(reqBody);
	 		if(validatorResponse.status){
	 			if('email' in reqBody){
	 				const userEmailCheck = new User();
	 				userEmailCheck.getByEmail(reqBody.email).then(
	 					(userdata) => {
	 						response.message = 'Email already taken';
	 						response.data['email_taken'] = 'Email already taken';
	 						res.send(response);
	 					},
	 					(e) => {
	 						this.saveUser(reqBody, req, res, next, response);
	 					}
	 					);
	 			} else if ('user_email' in reqBody) {
	 				// checks if input is email
	 				if (validator.isEmail(reqBody.user_email)) {
	 					const userEmailCheck = new User();
	 					userEmailCheck.getByEmail(reqBody.user_email).then(
	 						(userdata) => {
	 							response.message = 'Email already taken';
	 							response.data['email_taken'] = 'Email already taken';
	 							return res.send(response);
	 						},
	 						(e) => {
	 							reqBody['email'] = reqBody['user_email'];
	 							this.saveUser(reqBody, req, res, next, response);
	 						}
	 						);
	 				} else {
	 					// a user name is entered
	 					// checks for illegal characters
	 					const username = reqBody.user_email;
	 					if (username.match(/[-\*'`\\\s]+/)) {
	 						response.message = 'Username should only contain alphanumeric characters only.';
	 						return res.send(response);
	 					}
	 					reqBody['user_name'] = reqBody.user_email;
	 					this.saveUser(reqBody, req, res, next, response);
	 				}
	 			} else {
	 				this.saveUser(reqBody, req, res, next, response);
	 			}
	 		} else {
	 			res.send(validatorResponse);
	 		}
	 	} else{
	 		response.message = 'Please complete required fields';
	 		res.send(response);
	 	}
	}

	private sendEmailForRegistration(userData, req, success, error, bodyEmail?, tokenParam?){
		let opts = {
	        from : 'allantaw2@gmail.com',
	        fromName : 'EvacConnect',
	        to : [],
	        body : '',
	        attachments: [],
	        subject : 'EvacConnect Signup Verification'
	    };

		let email = new EmailSender(opts),
			emailBody = email.getEmailHTMLHeader(),
			tokenModel = new Token(),
			token = (tokenParam) ? tokenParam : userData['user_id']+''+tokenModel.generateRandomChars(50),
			link = req.protocol + '://' + req.get('host') +'/token/'+token;

		if(!bodyEmail){
			emailBody += '<h3 style="text-transform:capitalize;">Hi '+userData.first_name+' '+userData.last_name+'</h3> <br/>';
			emailBody += '<h4>Thank you for using EvacConnect Compliance Management System</h4> <br/>';
			emailBody += '<h5>Please verify your account by clicking the link below</h5> <br/>';
			emailBody += '<a href="'+link+'" target="_blank" style="text-decoration:none; color:#0277bd;">'+link+'</a> <br/>';
		}else{
			emailBody += bodyEmail;
		}


		emailBody += email.getEmailHTMLFooter();

		email.assignOptions({
			body : emailBody,
			to: [userData.email]
		});

		let expDate = moment(),
			expDateFormat = '';
		expDate.add(24, 'hours');
		expDateFormat = expDate.format('YYYY-MM-DD HH-mm-ss');

		tokenModel.create({
			'token':token,
			'user_id': userData.user_id,
			'action': 'verify',
			'verified': 0,
			'expiration_date' : expDateFormat
		}).then(
			() => {
				email.send(
					(data) => { success(data); },
					(err) => { error(err); }
				);
			},
			() => {
				error('Unable to save token');
			}
		);
	}

	private saveUserExtend(reqBody, userRole, user, req, res, emailUserdata, response){
		let tokenModel = new Token(),
			userModel = user,
			userData = user.getDBData(),
			locationAccountUser,
			userEMrole = new UserEmRoleRelation(),
			responseData = {
				status : true,
				data : {
					token : {},
					user : {}
				},
				message : ''
			}

		let newUsersToken = (callBack) => {
			this.userVerificationNewUsersToken(
				tokenModel,
				userModel,
				() => {
					callBack();
				},
				(errorData) => {
					response.message = 'Unable to save user. See reference : '+errorData;
					res.send(response);
				}
			);
		};

		let emailCall = (callBack) => {
			this.sendEmailForRegistration(
				emailUserdata,
				req,
				(successData)=>{
					callBack();
				},
				(errorData) => {
					response.message = 'Unable to send email. See reference : '+errorData;
					res.send(response);
				}
			);
		};

		let loginCall = (callBack) => {
			this.userVerificationLogin(
				userData,
				(resp) => {
					callBack(resp);
				}
			);
		};

		let updateInviCode = (code, success, error) => {
			code.load().then(
				() => {
					locationAccountUser = new LocationAccountUser();
					locationAccountUser.create({
						'location_id' : code.get('location_id'),
						'account_id': code.get('account_id'),
						'user_id' : userData['user_id']
					}).then(
						() => {
							code.set('was_used', 1);
							code.write().then(
								() => {
									success();
								},
								() => {
									error();
								}
							);
						},
						() => {
							error();
						}
					);
				}
			);
		};

		let userTokenAndLoginCall = (callBack) => {
			newUsersToken(() => {
				loginCall((resp) => {
					callBack(resp);
				});
			});
		};

		let emailCallAndUserTokenLogin = () => {
			emailCall(() => {
				userTokenAndLoginCall((resp) => {
					responseData.status = true;
					responseData.data.token = resp.token;
					responseData.data.user = resp.data;
					responseData.message = 'Success!';

					res.statusCode = 200;
					res.send(responseData);
				});
			});
		};

		if(reqBody.role_id == 1 || reqBody.role_id == 2){

			userRole.create({
				'user_id' : user.ID(),
				'role_id' : reqBody.role_id
			}).then(
				() => {
					if('invi_code_id' in reqBody) {
						const code = new InvitationCode(reqBody.invi_code_id);
						code.load().then(
							() => {
								let c = code.getDBData();
								let multipleCodes = new InvitationCode();
								multipleCodes.getManyInvitationByCode( c['code'] ).then(
									(codes) => {
										for(let i in codes){
											const codeUpdate = new InvitationCode(codes[i].invitation_code_id);
											let updateSuccess;

											if( parseInt(i) == (Object.keys(codes).length - 1) ){
												updateSuccess = () => {
													userTokenAndLoginCall((resp) => {
														responseData.data.token = resp.token;
														responseData.data.user = resp.data;
														responseData.message = 'Successfully created user';
														res.statusCode = 200;
														responseData.data['code'] = code.get('code');
														res.send(responseData);
													});
												}
											}

											updateInviCode(
												codeUpdate,
												() => {
													if(typeof updateSuccess == 'function'){
														updateSuccess();
													}
												},
												() => {
													responseData.message = 'Location-Account-User saved unsuccessfully';
													res.send(responseData);
												}
											);


										}
									}
								);
							}
						);
					}else if('email' in reqBody){
						emailCallAndUserTokenLogin();
					}
				},
				() => {
					res.statusCode = 500;
					res.send('Unable to save user role');
				}
			);

		}else{
			userEMrole.create({
				user_id : user.ID(), em_role_id : 9
			}).then(() => {
				if('email' in reqBody){
					emailCallAndUserTokenLogin();
				}
			});
		}
	}

	private saveUser(reqBody, req: Request, res: Response, next: NextFunction, response){
    	// Save the data
		const user = new User();
		const userRole = new UserRoleRelation();

		reqBody.password = md5('Ideation'+reqBody.password+'Max');
    	reqBody.evac_role = ('evac_role' in reqBody) ? reqBody.evac_role : 'Client';

		user.create(reqBody).then(
			() => {
				user.load().then(
					() => {
						let emailUserdata = {
							user_id : user.ID(),
							first_name: this.capitalizeFirstLetter(reqBody.first_name.toLowerCase()),
							last_name: this.capitalizeFirstLetter(reqBody.last_name.toLowerCase()),
							email : reqBody.email || ''
						};
						emailUserdata['user_id'] = user.ID();

						if(reqBody.role_id == 3){
							let
							securityAnswersModel = new SecurityAnswers(),
							saveSecurityData = {
								'security_question_id' : reqBody.question_id,
								'answer' : md5(reqBody.security_answer.toLowerCase()),
								'user_id' : user.ID()
							};

							securityAnswersModel.create(saveSecurityData).then(
								() => {
									this.saveUserExtend(reqBody, userRole, user, req, res, emailUserdata, response);
								},
								() => {
									res.statusCode = 500;
									res.send('Unable to save security question');
								}
							);
						}else{
							this.saveUserExtend(reqBody, userRole, user, req, res, emailUserdata, response);
						}
					}
				);
			},
			() => {
				res.statusCode = 500;
				res.send('Unable to save');
			}
		);
	}

	public getUsers(req: Request, res: Response, next: NextFunction){
		let userModel = new User(),
			response = {
				status : false,
				data: {},
				message : ""
			},
			limit:any = 25;

		if('start' in req.query && 'end' in req.query){
			limit = req.query.start+','+req.query.end;
		}

		userModel.getAll(limit, 'user_id', 'DESC').then(
			(users) => {
				response.status = true;
				response.data = users;
				res.send(response);
			},
			(e) => {
				res.send(response);
			}
		);
	}

	private userVerificationLogin(userData, callBack){

		const token = jwt.sign(
          {
            user_db_token: userData.token,
            user: userData.user_id
          },
          process.env.KEY, { expiresIn: 7200 }
        );

        let reponse = {
        	status: 'Authentication Success',
            message: 'Successfully logged in',
            token: token,
            data: {
              userId: userData.user_id,
              name: userData.first_name+' '+userData.last_name,
              email: userData.email,
              accountId: userData.account_id,
              roles : {},
              profilePic : ''
            }
        };

        new UserRoleRelation().getByUserId(userData.user_id).then(
	        (userRoles) => {
	        	reponse.data['roles'] = userRoles;
	        	callBack(reponse);
	        },
	        (m) => {
	        	new UserEmRoleRelation().getEmRolesByUserId(userData.user_id).then(
                    (userRoles) => {
                        for(let i in userRoles){
                            reponse.data['roles'][ Object.keys( reponse.data['roles'] ).length ] = {
                                role_id : userRoles[i]['em_roles_id'],
                                description : userRoles[i]['role_name'],
                                is_warden_role : userRoles[i]['is_warden_role']
                            };
                        }
                        callBack(reponse);
                    },
                    (a) => {
                        callBack(reponse);
                    }
                );

	        }
        );
	}

	private userVerificationNewUsersToken(tokenModel, userModel, success, error, verified?){

		if(userModel.get('token') === null){
			let userNewToken = tokenModel.generateRandomChars(15);
			userModel.set('token', userNewToken);
		}

		userModel.dbUpdate().then(
			() => {
				if(verified){
					tokenModel.set('verified', verified);
				}else{
					tokenModel.set('verified', 1);
				}

				tokenModel.dbUpdate().then(
					() => {
						success();
					},
					() => {
						error('Error occured upon verification');
					}
				);
			},
			() => {
				error('Error occured upon user token update');
			}
		);
	}

	public userVerification(req: Request, res: Response, next: NextFunction){
		let token = req.params.token,
			userId = 0,
			redirect = true,
			tokenModel = new Token(),
			userModel = new User(),
			responseData = {
				status : false,
				message : '',
				data : {}
			},
			allTokens;

		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {

				if(tokenData['verified'] == 1){
					return res.redirect('/success-valiadation?account-validation-invalid-token=true');
				}

				let expDateMoment = moment(tokenData['expiration_date']),
					currentDateMoment = moment();

				userId = tokenData['user_id'];
				userModel.setID(userId);

				if(currentDateMoment.isBefore(expDateMoment)){
					let
					newUserTokenCallback = (userData) => {
						this.userVerificationNewUsersToken(
							tokenModel,
							userModel,
							() => {
								this.userVerificationLogin(
									userData,
									(loginData) => { loginCallback(loginData); }
								);
							},
							(msg) => {
								responseData.message = msg;
								res.send(responseData);
							}
						);
					},
					loginCallback = (loginData) => {
						res.statusCode = 200;
						responseData.status = true;
						responseData.data = {
							token : loginData.token,
							user : loginData.data
						};
						responseData.message = 'Auto login user';
						if(redirect){
            				return res.redirect('/success-valiadation');
						}else{
							res.send(responseData);
						}
					};

					userModel.load().then(
						(userData) => {
							newUserTokenCallback(userData);
						},
						() => {
							responseData.message = 'User is not existing';
							res.send(responseData);
						}
					);
				}else{
					responseData.message = 'Token already expired';
					res.send(responseData);
				}
			},
			() => {
				responseData.message = 'Invalid token';
				res.send(responseData);
			}
		);

	}

	public getSecurityQuestions(req: Request, res: Response, next: NextFunction){

		let secQuestModel = new SecurityQuestions(),
			response = {
				status : false,
				message : '',
				data : {}
			};

		res.statusCode = 400;

		secQuestModel.getAll().then(
			(questions) => {
				response.data = questions;
				res.statusCode = 200;
				res.send(response);
			}
		);
  	}

  	public async resendEmailVerification(req: Request, res: Response, next: NextFunction){
  		let userModel = new User(req.body.user_id),
  			tokenModel = new Token(),
			response = {
				status : false,
				message : '',
				data : {}
			},
			userData = {},
			allTokens:any = [];

		res.statusCode = 400;

		userData = await userModel.load();
	
		if(Object.keys(userData).length > 0){
			allTokens = await tokenModel.getAllByUserId(userData['user_id'], 'verify');
			if(allTokens.length > 0){
				for(let i in allTokens){
					let tokenDelete = new Token();
					tokenDelete.setID(allTokens[i]['token_id']);
					await tokenDelete.delete();
				}
			}

			let bodyEmail = '',
				token = userData['user_id']+''+tokenModel.generateRandomChars(50),
				link = req.protocol + '://' + req.get('host') +'/token/'+token;

			bodyEmail += '<h3 style="text-transform:capitalize;">Hi '+userData['first_name']+' '+userData['last_name']+'</h3> <br/>';
			bodyEmail += '<h4>You Requested Email Verification From EvacConnect Compliance Management System </h4> <br/>';
			bodyEmail += '<h5>Please verify your account by clicking the link below</h5> <br/>';
			bodyEmail += '<a href="'+link+'" target="_blank" style="text-decoration:none; color:#0277bd;">'+link+'</a> <br/>';

			this.sendEmailForRegistration(userData, req,
				() => {
					response.message = 'Success! email resent.';
					response.status = true;
					res.statusCode = 200;
					res.send(response);
				},
				(err) => {
					response.message = err;
					res.send(response);
				},
				bodyEmail,
				token
			);

		}else{
			response.message = 'No user found';
			res.send(response);
		}
  	}

}
