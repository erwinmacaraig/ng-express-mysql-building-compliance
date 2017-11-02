import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { InvitationCode } from '../models/invitation.code.model';
import { EmailSender } from '../models/email.sender';


import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
const validator = require('validator');
import * as Promise from 'promise';

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

	private validateSetupNewAccount(reqBody, res: Response){
		let response = {
			status : false,
			message : '',
			data : {}
		},
		error = 0,
		arrValidField = [ 'creator_id', 'company_name', 'tenant_key_contact', 'building_name', 'unit_no', 'street', 'city', 'state', 'postal_code', 'country', 'time_zone' ];
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
		data.city = this.capitalizeFirstLetter(data.city.toLowerCase());
		data.state = this.capitalizeFirstLetter(data.state.toLowerCase());
		data.tenant_key_contact = this.capitalizeFirstLetter(data.tenant_key_contact.toLowerCase());
		data.unit_no = validator.isEmpty( ''+data['unit_no']+'' ) ? ' ' : data['unit_no'];
		return data;
	}

	private saveNewAccountAndLocation(data){
		return new Promise((resolve, reject) => {
			let accountModel = new Account(),
				locationModel = new Location(),
				accountData = {
					'account_name' : data.company_name,
					'billing_unit' : data.unit_no,
					'billing_street': data.street,
					'billing_city' : data.city,
					'billing_state': data.state,
					'billing_postal_code' : data.postal_code,
					'billing_country' : data.country
				},
				locationData = {
					'parent_id' : '-1',
					'name' : data.building_name,
					'unit' : data.unit_no,
					'street' : data.street,
					'city' : data.city,
					'state': data.state,
					'postal_code' : data.postal_code,
					'country' : data.country,
					'time_zone' : data.time_zone
				};

			accountModel.create(accountData).then(
				() => {
					locationModel.create(locationData).then(
						() => {
							locationModel.set('order', locationModel.get('location_id'));
							locationModel.dbUpdate().then(
								()=>{
									resolve({
										account : accountModel.getDBData(),
										location : locationModel.getDBData()
									});
								},
								()=>{
									reject('Location\'s order, was not able to update ');
								}
							);
						},
						() => {
							reject('Location was not saved');
						}
					);
				},
				() => {
					reject('Account was not saved');
				}
			);
		});
	}

	public saveNewAccountAndLocationRelation(user, account, location, success, error){
		let locationAccountRelation = new LocationAccountRelation(),
			userRoleRelation = new UserRoleRelation(),
			locationAccountUser = new LocationAccountUser();

		userRoleRelation.getByUserId(user.user_id).then(
			() => {
				userRoleRelation.set('location_id', location.location_id);
				userRoleRelation.dbUpdate().then(
					() => {
						let responsibility = ( userRoleRelation.get('role_id') == 1 ) ? 'Manager' : 'Tenant';
						locationAccountRelation.create({
							'location_id' : location.location_id,
							'account_id' : account.account_id,
							'responsibility' : responsibility
						}).then(
							() => {
								locationAccountUser.create({
									'location_id' : location.location_id,
									'account_id': account.account_id,
									'user_id' : user.user_id
								}).then(
									() => { success(); },
									() => { error('Location-Account-User saved unsuccessfully'); }
								);
							},
							() => {
								error('Location-Account relation saved unsuccessfully');
							}
						);
					},
					() => {
						error('User role update save unsuccessfully');
					}
				);
			},
			() => {
				// We are assuming this is a warden
				// Previous system has no warden lookup data in user role relation
				error('No role relation found assuming user is a warden');
			}
		);
	}

	public setupNewAccount(req: AuthRequest, res: Response){
		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			},
			validationData = this.validateSetupNewAccount(reqBody, res),
			account = new Account();

		res.statusCode = 400;

		if(validationData.status){
			reqBody = this.cleanNewAccountData(reqBody);

			account.getByUserId(reqBody.creator_id).then(
				(accountData) => {
					response.message = "User already have a company";
					res.send(response);
				},
				() => {
					this.saveNewAccountAndLocation(reqBody).then(
						(resAccLoc) => {
							let account = resAccLoc['account'],
								location = resAccLoc['location'],
								userModel = new User(reqBody.creator_id);

							userModel.load().then(
								(usersData) => {
									this.saveNewAccountAndLocationRelation(
										usersData,
										account,
										location,
										() => {
											userModel.set('account_id', account.account_id);
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
										},
										(msg) => {
											response.message = msg;
											res.send(response);
										}
									);
								}
							);
						},
						(msg) => {
							response.message = msg;
							res.send(response);
						}
					);
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
			inviCodeModel = new InvitationCode(),
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

								inviCodeModel.getInvitationByAccountId(reqBody.account_id, 3).then(
									(inviCodeData) => {

										inviCodeModel.set('code', reqBody.code);
										inviCodeModel.setID(inviCodeModel.ID());
										inviCodeModel.dbUpdate().then(
											success, error
										);

									},
									() => {
										inviCodeModel.create({
											'account_id' : reqBody.account_id,
											'location_id' : reqBody.location_id,
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

	public getRelatedAccounts(req: AuthRequest, res: Response){
		let accountModel = new Account(),
			response = {
				status: false,
				message : '',
				data : {}
			},
			account_id = req.params.account_id;

		res.statusCode = 400;

		accountModel.setID(account_id);
		accountModel.load().then(
			() => {
				response.status = true;
				response.data = [accountModel.getDBData()];
				res.statusCode = 200;
				res.send(response);
			},
			() => {
				response.message = 'No accounts found';
				res.send(response);
			}
		);

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
		}

		if( ('account_type' in data) === false ){
			error++;
		}else{
			data.account_type = ''+data.account_type+''.trim();
			if(validator.isEmpty(data.account_type)){
				error++;
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
			};

		res.statusCode = 400;

		if(validateResponse.status){

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

							let invitationCode = this.generateRandomChars(25),
								inviModel = new InvitationCode(),
								inviData = {
									'code' : invitationCode,
									'first_name' : reqBody.first_name,
									'last_name' : reqBody.last_name,
									'email' : reqBody.email,
									'location_id' : reqBody.location_id,
									'account_id' : reqBody.account_id,
									'role_id' : reqBody.account_type,
									'was_used' : 0
								};

							// SPECIFY THE LOCATION ID
							if(reqBody.account_type == 2 || reqBody.account_type == 3){
								if( Object.keys( reqBody.sublocations ).length > 0 ){
									inviData.location_id = reqBody.sublocations[0]['location_id'];
								}
							}

							for(let i in inviData){
								inviModel.set(i, inviData[i]);
							}

							inviModel.dbInsert().then(
								() => {
									let inviDataResponse = inviModel.getDBData();
									inviData = Object.assign(inviDataResponse, inviData);

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

						}
					);
				},
				() => {
					response.message = 'Invalid creator';
					res.send(response);
				}
			);

		}else{
			response.message = validateResponse.message;
			res.send(response);
		}

	}

}

