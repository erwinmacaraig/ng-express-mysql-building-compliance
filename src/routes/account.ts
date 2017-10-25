import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';

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

	   	router.post('/accounts/generate-invitation-code', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().generateInvitationCode(req, res);
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


	public generateInvitationCode(req: AuthRequest, res: Response){
		let reqBody = req.body,
			response = {
				status : false,
				message : '',
				data : {}
			},
			error = 0;

		res.statusCode = 400;

		if( !('location_id' in reqBody ) ){
			response.message = 'Location is required, ';
			error++;
		}else{
			if( !('account_id' in reqBody ) ){
				response.message = 'Account is required, ';
				error++;
			}else{
				if( !('roles' in reqBody ) ){
					response.message = 'Roles are required, ';
					error++;
				}
			}
		}

		if(error == 0){
			let responseCodes = {};
			for(let i in reqBody.roles){
				responseCodes[ Object.keys(responseCodes).length ] = {
					'role' : reqBody.roles[i], 'code' : this.generateRandomChars(25)
				};
			}

			response.data = responseCodes;
			res.statusCode = 200;
			res.send(response);
		}else{
			res.send(response);
		}
	}

	public capitalizeFirstLetter(string) {
	    return string.charAt(0).toUpperCase() + string.slice(1);
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
			reqBody = req.body,
			response = {
				status: false,
				message : '',
				data : {}
			},
			error = 0;

		res.statusCode = 400;
		if( ('account_id' in reqBody === false) || ('code' in reqBody === false) ){
			error++;
		}else{
			if(  (validator.isInt(''+reqBody.account_id+'') === false)  ){
				error++;
			}
		}

		if(error == 0){
			accountModel.setID(reqBody.account_id);
			accountModel.load().then(
				() => {
					accountModel.set('account_code', reqBody.code);
					accountModel.dbUpdate().then(
						() => {
							res.statusCode = 200;
							response.status = true;
							res.send(response);
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
			data.account_id = data.account_id.trim();
			if(validator.isEmpty(''+data.account_id+'')){
				error++;
			}
		}

		if( ('location_id' in data) === false ){
			error++;
		}else{
			data.location_id = data.location_id.trim();
			if(validator.isEmpty(''+data.location_id+'')){
				error++;
			}
		}

		if( ('account_type' in data) === false ){
			error++;
		}else{
			data.account_type = data.account_type.trim();
			if(validator.isEmpty(''+data.account_type+'')){
				error++;
			}
		}

		if( ('sublocations' in data) === false ){
			error++;
		}

		if( ('user_role_id' in data) === false ){
			error++;
		}else{
			data.user_role_id = data.user_role_id.trim();
			if(validator.isEmpty(''+data.user_role_id+'')){
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

	public sendUserInvitation(req: AuthRequest, res: Response){
		let userEmail = new User(),
			newUser = new User(),
			reqBody = req.body,
			validateResponse = this.validateSendUserInvitation(reqBody),
			response = {
				status : false,
				data: {},
				message : ''
			};

		res.statusCode = 400;

		if(validateResponse.status){

			userEmail.getByEmail(reqBody.email).then(
				() => {

					let invitationCode = this.generateRandomChars(25);


				},
				() => {
					response['emailtaken'] = true;
					response.message = 'Email is already taken';
					res.send(response);
				}
			);


		}else{
			response.message = validateResponse.message;
			res.send(response);
		}

	}

}

  