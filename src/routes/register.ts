import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { EmailSender } from '../models/email.sender';
import { Token } from '../models/token.model';
import { InvitationCode  } from '../models/invitation.code.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { LocationAccountUser } from '../models/location.account.user';

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

	   	router.get('/users', (req: Request, res: Response, next: NextFunction) => {
	   		new RegisterRoute().getUsers(req, res, next);
	   	});

	   	// Verify user for first signed user
	   	router.get('/register/user-verification/:user_id/:token/:redirect', (req: Request, res: Response, next: NextFunction) => {
	   		new RegisterRoute().userVerification(req, res, next);
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

	public capitalizeFirstLetter(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
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

	private sendEmailForRegistration(userData, req, success, error){
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
			token = tokenModel.generateRandomChars(25),
			link = req.protocol + '://' + req.get('host') + req.originalUrl+'/user-verification/'+userData.user_id+'/'+token+'/true';

		emailBody += '<h3 style="text-transform:capitalize;">Hi '+userData.first_name+' '+userData.last_name+'</h3> <br/>';
		emailBody += '<h4>Thank you for using EvacConnect Compliance Management System</h4> <br/>';
		emailBody += '<h5>Please verify your account by clicking the link below</h5> <br/>';
		emailBody += '<a href="'+link+'" target="_blank" style="text-decoration:none; color:#0277bd;">'+link+'</a> <br/>';

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

	private saveUser(reqBody, req: Request, res: Response, next: NextFunction, response){
    // Save the data
		const user = new User();
		const userRole = new UserRoleRelation();
		reqBody.password = md5('Ideation'+reqBody.password+'Max');
    reqBody.evac_role = ('evac_role' in reqBody) ? reqBody.evac_role : 'Client';
		user.create(reqBody).then(
			() => {
				let emailUserdata = {
					user_id : user.ID(),
					first_name: this.capitalizeFirstLetter(reqBody.first_name.toLowerCase()),
					last_name: this.capitalizeFirstLetter(reqBody.last_name.toLowerCase()),
					email : reqBody.email || ''
				};
				emailUserdata['user_id'] = user.ID();

				userRole.create({
					'user_id' : user.ID(),
					'role_id' : reqBody.role_id
				}).then(
					() => {
						if('invi_code_id' in reqBody) {
							let tokenModel = new Token(),
								userModel = user,
								userData = user.getDBData();

							this.userVerificationNewUsersToken(
								tokenModel,
								userModel,
								() => {
									this.userVerificationLogin(userData,
										(resp) => {
											let responseData = {
												status : true,
												data : {
													token : resp.token,
                          user : resp.data
												},
												message : 'Successfully created user'
                      };

                      let locationAccountUser = new LocationAccountUser();


                       // update invitation code to be used
                      const code = new InvitationCode(reqBody.invi_code_id);

                      code.load().then(() => {
                          locationAccountUser.create({
                            'location_id' : code.get('location_id'),
                            'account_id': code.get('account_id'),
                            'user_id' : userData['user_id']
                          }).then(
                            () => {
                              res.statusCode = 200;
                              responseData.data['code'] = code.get('code');
                              return res.send(responseData);
                            },
                            () => {
                              responseData.message = 'Location-Account-User saved unsuccessfully';
                              return res.send(responseData);
                            }
                          );
                      });

										}
									);
								},
								(errorData) => {
									response.message = 'Unable to save user. See reference : '+errorData;
									return res.send(response);
								}
							);
						} else if('email' in reqBody) {
							this.sendEmailForRegistration(
								emailUserdata,
								req,
								(successData)=>{
									res.statusCode = 200;
									response.status = true;
									response.data = emailUserdata;
									response.data['user_id'] = user.ID();
									return res.send(response);
								},
								(errorData)=>{
									response.message = 'Unable to send email. See reference : '+errorData;
									return res.send(response);
								}
							);
						} else {
                            res.statusCode = 200;
                            response.status = true;
                            response.data['user_id'] = user.ID();
                            return res.send(response);
						}
						
					},
					() => {
						res.statusCode = 500;
						res.send('Unable to save user role');
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
              roleId : 3
            }
        };

        new UserRoleRelation().getByUserId(userData.user_id).then(
	        (userRole) => {
	        	reponse.data.roleId = userRole['role_id'];
	        	callBack(reponse);
	        },
	        (m) => {
	          	callBack(reponse);
	        }
        );
	}

	private userVerificationNewUsersToken(tokenModel, userModel, success, error){
		let userNewToken = tokenModel.generateRandomChars(15);
			userModel.set('token', userNewToken);
			userModel.dbUpdate().then(
				() => {
					tokenModel.set('verified', 1);
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
			userId = req.params.user_id,
			redirect = (req.params.redirect == 'true') ? true : false,
			tokenModel = new Token(),
			userModel = new User(userId),
			responseData = {
				status : false,
				message : '',
				data : {}
			};

		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {
				let expDateMoment = moment(tokenData['expiration_date']),
					currentDateMoment = moment();

				if(currentDateMoment.isBefore(expDateMoment)){
					if( tokenData['user_id'] == userId){

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
								/*let script = `
									<strong>Success! redirecting....</strong>
									<script type="text/javascript">
										setTimeout(function(){
											localStorage.setItem('currentUser', '`+loginData.token+`');
											localStorage.setItem('userData', '`+ JSON.stringify(loginData.data) +`');
											location.replace(location.origin);
										}, 2000);
									</script>
								`;
								res.send(script);*/
                return res.redirect('/success-valiadation');
								// this.render(req, res, 'success-verification.hbs');
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
						responseData.message = 'User is not valid';
						res.send(responseData);
					}
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

}
