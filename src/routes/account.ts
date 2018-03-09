import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { UserInvitation } from './../models/user.invitation.model';

import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';

import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
const validator = require('validator');

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

	   	router.get('/accounts/get/:id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().getAccountById(req, res);
	   	});

	   	router.post('/accounts/create/setup', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().setupNewAccount(req, res);
	   	});

	   	router.post('/accounts/save-account-code', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().saveAccountCode(req, res);
	   	});

	   	router.get('/accounts/get-realated-accounts/:account_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().getRelatedAccounts(req, res);
	   	});

	   	router.post('/accounts/send-user-invitation/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().sendUserInvitation(req, res);
	   	});

	   	router.get('/accounts/search/:name', (req: AuthRequest, res: Response) => {
	   		new AccountRoute().searchByName(req, res);
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

	public getAccountById(req: AuthRequest, res: Response){
		let  response = {
				status : false,
				message : '',
				data : {}
      },
      accntId = 0;
      if (req.params['id'] === 'undefined') {
        accntId = req.user.account_id;
      } else {
        accntId = req.params['id'] * 1;
      }

			const account = new Account(accntId);
		// Default status code
		res.statusCode = 400;

		account.load().then(
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

	private validateSetupNewAccount(reqBody, res: Response){
		let response = {
			status : false,
			message : '',
			data : {}
		},
		error = 0,
		arrValidField = [ 'creator_id', 'company_name', 'building_name', 'unit_no', 'street', 'city', 'state', 'postal_code', 'country', 'time_zone'  ];
		arrValidField.forEach((val)=>{ if( val in reqBody === false ){ error++; } });

		if(error == 0){

			arrValidField.forEach((val) => {
				if( validator.isEmpty( ''+reqBody[val]+'' ) && val !== 'unit_no' ){
					error++; response.data[val] = 'Empty';
				}
			});

		}

		response.status = (error == 0) ? true : false;
		return response;
	}

	private cleanNewAccountData(data){
		data.creator_id = parseInt(data.creator_id);
		data.company_name = this.capitalizeFirstLetter(data.company_name.toLowerCase());
		data.building_name = this.capitalizeFirstLetter(data.building_name.toLowerCase());
		data.building_number = validator.isEmpty(''+data.building_number+'') ? '' : data.building_number;
		data.city = this.capitalizeFirstLetter(data.city.toLowerCase());
		data.state = this.capitalizeFirstLetter(data.state.toLowerCase());
		data.key_contact = (data.key_contact != null) ? this.capitalizeFirstLetter(data.key_contact.toLowerCase()) : '';
		data.unit_no = validator.isEmpty( ''+data['unit_no']+'' ) ? ' ' : data['unit_no'];

		return data;
	}

	public setupNewAccount(req: AuthRequest, res: Response){
		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			},
			validationData = this.validateSetupNewAccount(reqBody, res),
			account = new Account(),
			userModel = new User(reqBody.creator_id);

		res.statusCode = 400;

		if(validationData.status){
			reqBody = this.cleanNewAccountData(reqBody);

			userModel.load().then(
				(usersData) => {
					if(usersData['account_id'] == 0){
						let userUpdateAccountId = (account) => {
							userModel.set('account_id', account.ID());
							userModel.dbUpdate().then(
								() => {
									response.data = {
										'account' : account
									};
									res.statusCode = 200;
									response.status = true;
									res.send(response);
								},
								() => {
									response.message = 'User was not able to update account id';
									res.send(response);
								}
							);
						};

						if(reqBody.account_id > 0){
							account.setID(reqBody['account_id']);
							account.load().then(
								() => {
									userUpdateAccountId(account);
								}
							);
						}else{
							account.create({
								'account_name' : reqBody.company_name,
								'billing_unit' : reqBody.unit_no,
								'building_number' : reqBody.building_number,
								'billing_street': reqBody.street,
								'billing_city' : reqBody.city,
								'billing_state': reqBody.state,
								'billing_postal_code' : reqBody.postal_code,
								'billing_country' : reqBody.country,
								'trp_code' : reqBody.trp_code,
								'account_domain' : reqBody.account_domain,
								'time_zone' : reqBody.time_zone,
								'key_contact' : reqBody.key_contact
							}).then(
								() => {
									userUpdateAccountId(account);
								},
								() => {
									response.message = 'Unable to save account';
									res.send(response);
								}
							);
						}

					}else{
						response.message = 'User already have a company';
						res.send(response);
					}
				},
				() => {
					response.message = 'User not found';
					res.send(response);
				}
			);

		}else{
			response.message = "There's an invalid field";
			response.data = validationData.data;
			res.send(response);
		}
	}

	public saveAccountCode(req: AuthRequest, res: Response){
		let accountModel = new Account(),
			inviCodeModel = new UserInvitation(),
			reqBody = req.body,
			response = {
				status: false,
				message : '',
				data : {}
			},
			error = 0;

		res.statusCode = 400;
		if( ('account_id' in reqBody === false) || ('code' in reqBody === false) || ('location_id' in reqBody === false) ){
			error++;
		}else{
			if(  (validator.isInt(''+reqBody.account_id+'') === false)  ){
				error++;
			}
			if(  (validator.isInt(''+reqBody.location_id+'') === false)  ){
				error++;
			}
		}

		if(error == 0){

			let canSaveCallBack = () => {
				accountModel.setID(reqBody.account_id);
				accountModel.load().then(
					() => {
						accountModel.set('account_code', reqBody.code);
						accountModel.dbUpdate().then(
							() => {

								let
								success = () => {
									res.statusCode = 200;
									response.status = true;
									res.send(response);
								},
								error = () => {
									response.message = 'Update unsuccessful';
									res.send(response);
								};

								let Where = [];
								Where.push( ["account_id", "=", reqBody.account_id] );
								Where.push( ["role_id", "=", "3"] );
								Where.push( ["was_used", "=", "0"] );
								Where.push( ["first_name", "=", ""] );
								Where.push( ["last_name", "=", ""] );

								inviCodeModel.getWhere(Where).then(
									(inviCodeData) => {

										let updateInvi = new UserInvitation();
										updateInvi.set('code', reqBody.code);
										updateInvi.set('invitation_code_id', inviCodeData[0]['invitation_code_id']);
										updateInvi.set('account_id', inviCodeData[0]['account_id']);
										updateInvi.set('location_id', 0);
										updateInvi.set('role_id', 3);
										updateInvi.set('was_used', 0);
										updateInvi.set('first_name', "");
										updateInvi.set('last_name', "");
										updateInvi.setID(inviCodeData[0]['invitation_code_id']);


										updateInvi.dbUpdate().then(
											success, error
										);

									},
									() => {

										inviCodeModel.create({
											'account_id' : reqBody.account_id,
											'location_id' : 0,
											'role_id': 3,
											'first_name' : '',
											'last_name' : '',
											'email' : '',
											'code' : reqBody.code
										}).then(
											success, error
										);
									}
								);
							},
							() => {
								response.message = 'Update unsuccessful';
								res.send(response);
							}
						);
					},
					() => {
						response.message = 'No account found';
						res.send(response);
					}
				);
			}

			let cannotSaveCallBack = () => {
				response.message = 'The code is invalid or is been used by others';
				res.send(response);
			}

			accountModel.getByAccountCode(reqBody.code).then(
				(accountData) => {
					if( accountData['account_id'] == reqBody.account_id ){
						canSaveCallBack();
					}else{
						cannotSaveCallBack();
					}
				},
				canSaveCallBack
			);




		}else{
			response.message = 'Invalid fields';
			res.send(response);
		}
	}

	public async getRelatedAccounts(req: AuthRequest, res: Response){
		let accountModel = new Account(),
			response = {
				status: true,
				message : '',
				data : {}
			},
			account_id = req.params.account_id;

		res.statusCode = 200;

		response.data = await accountModel.getRelatedAccounts(account_id);
		res.send(response);
	}

	public validateSendUserInvitation(data){
		let response = {
			status : false,
			message : ''
		},
		error = 0;

		if( ('creator_id' in data) === false ){
			error++;
		}else{
			data.creator_id = ''+data.creator_id+''.trim();
			if(validator.isEmpty(data.creator_id)){
				error++;
			}
		}

		if( ('first_name' in data) === false ){
			error++;
		}else{
			data.first_name = data.first_name.trim();
			if(validator.isEmpty(data.first_name)){
				error++;
			}
		}

		if( ('last_name' in data) === false ){
			error++;
		}else{
			data.last_name = data.last_name.trim();
			if(validator.isEmpty(data.last_name)){
				error++;
			}
		}

		if( ('email' in data) === false ){
			error++;
		}else{
			data.email = data.email.trim();
			if(!validator.isEmail(data.email)){
				error++;
			}
		}


		if( ('account_id' in data) === false ){
			error++;
		}else{
			data.account_id = ''+data.account_id+''.trim();
			if(validator.isEmpty(data.account_id)){
				error++;
			}
		}

		if( ('location_id' in data) === false ){
			error++;
		}else{
			data.location_id = ''+data.location_id+''.trim();
			if(validator.isEmpty(data.location_id)){
				error++;
			}
			if(data.location_id < 1){
				error++;
				response.message = 'Location is required';
			}
		}

		if( ('sublocations' in data) === false ){
			error++;
		}

		if( ('user_role_id' in data) === false ){
			error++;
		}else{
			data.user_role_id = ''+data.user_role_id+''.trim();
			if(validator.isEmpty(data.user_role_id)){
				error++;
			}
			if(data.user_role_id == 3){
				if(Object.keys(data.sublocations).length == 0){
					error++;
					response.message = 'Specific location is required';
				}
			}
		}

		if(error > 0){
			response.message = (response.message.length > 0) ? response.message : 'Invalid fields';
		}else{
			response.status = true;
		}

		return response;
	}

	public sendUserInvitationEmail(req, inviData, creatorData, success, error){
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
			link = req.protocol + '://' + req.get('host') +'/custom-resolver?role_id='+inviData.role_id+'&invitation_code_id='+inviData.invitation_code_id+'&code='+inviData.code;

		emailBody += '<h3 style="text-transform:capitalize;">Hi '+this.capitalizeFirstLetter(inviData.first_name)+' '+this.capitalizeFirstLetter(inviData.last_name)+'</h3> <br/>';
		emailBody += '<h4> '+this.capitalizeFirstLetter(creatorData.first_name)+' '+this.capitalizeFirstLetter(creatorData.last_name)+' sents you an invitation code. </h4> <br/>';
		emailBody += '<h5> Please go to the link below and fill out the fields. <br/>   </h5> ';
		emailBody += '<h5><a href="'+link+'" target="_blank" style="text-decoration:none; color:#0277bd;">'+link+'</a>  <br/></h5>';
		emailBody += '<h5>Thank you!</h5>';

		emailBody += email.getEmailHTMLFooter();

		email.assignOptions({
			body : emailBody,
			to: [inviData.email]
		});

		email.send(success, error);
	}

	public sendUserInvitation(req: AuthRequest, res: Response){
		let userEmail = new User(),
			newUser = new User(),
			creatorModel = new User(),
			reqBody = req.body,
			validateResponse = this.validateSendUserInvitation(reqBody),
			response = {
				status : false,
				data: {},
				message : ''
			},
			validSubloc = false;

		res.statusCode = 400;

		if(validateResponse.status){
			if( reqBody.user_role_id == 2 || reqBody.user_role_id == 3 ){
				if(Object.keys(reqBody.sublocations).length > 0){
					validSubloc = true;
				}
			}else{
				validSubloc = true;
			}

			if(validSubloc){
				creatorModel.setID(reqBody.creator_id);
				creatorModel.load().then(
					(creatorData) => {
						userEmail.getByEmail(reqBody.email).then(
							() => {
								response['emailtaken'] = true;
								response.message = 'Email is already taken';
								res.send(response);
							},
							() => {

								const blacklistedEmails = new BlacklistedEmails();
								if(!blacklistedEmails.isEmailBlacklisted(reqBody.email)){
									let invitationCode = this.generateRandomChars(25),
										inviModel = new UserInvitation(),
										inviData = {
											'code' : invitationCode,
											'first_name' : reqBody.first_name,
											'last_name' : reqBody.last_name,
											'email' : reqBody.email,
											'location_id' : reqBody.location_id,
											'account_id' : reqBody.account_id,
											'role_id' : reqBody.user_role_id,
											'was_used' : 0
										};

									// SPECIFY THE LOCATION ID
									if( reqBody.user_role_id == 2 || reqBody.user_role_id == 3){
										inviData.location_id = reqBody.sublocations[0]['location_id'];
									}

									for(let i in inviData){
										inviModel.set(i, inviData[i]);
									}

									inviModel.dbInsert().then(
										() => {
											let inviDataResponse = inviModel.getDBData();
											inviData = Object.assign(inviDataResponse, inviData);

											if( Object.keys(reqBody.sublocations).length > 1 ){
												for(let x in reqBody.sublocations){
													if(parseInt(x) > 0){
														let inviModelSub = new UserInvitation();
														for(let i in inviData){
															if(i == 'location_id'){
																inviModelSub.set(i, reqBody.sublocations[x]['location_id']);
															}else{
																inviModelSub.set(i, inviData[i]);
															}
														}
														inviModelSub.dbInsert();
													}
												}
											}

											this.sendUserInvitationEmail(
												req,
												inviData,
												creatorData,
												() => {
													res.statusCode = 200;
													response.status = true;
													response.message = 'Success';
													res.send(response);
												},
												(msg) => {
													response.message = 'Error on sending email';
													res.send(response);
												}
											);
										},
										() => {
											response.message = 'Error on saving invitation code';
											res.send(response);
										}
									);
								}else{
									response.status = false;
									response['domain_blacklisted'] = true;
									response.message = "Email's domain must be non-commercial";
									res.send(response);
								}


							}
						);
					},
					() => {
						response.message = 'Invalid creator';
						res.send(response);
					}
				);
			}else{
				response.message = 'Select specific location';
				res.send(response);
			}


		}else{
			response.message = validateResponse.message;
			res.send(response);
		}
	}

	public searchByName(req: AuthRequest, res: Response){
		let  response = {
				status : false,
				message : '',
				data : {}
			},
			account = new Account();

		// Default status code
		res.statusCode = 400;

		if(req.params['name']){

			if(!validator.isEmpty(req.params['name'])){

				account.searchByAccountName(req.params['name']).then(
					(results) => {
						res.statusCode = 200;
						response.data = results;
						res.send(response);
					},
					(err) => {
						response.message = 'Error on searching';
						res.send(response);
					}
				);

			}else{
				response.message = 'must have a value to search';
				res.send(response);
			}

		}else{
			response.message = 'search a name, invalid field';
			res.send(response);
		}
	}

}

