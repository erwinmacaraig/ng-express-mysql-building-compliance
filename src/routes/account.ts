import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
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
				(accountResponseData) => {
					locationModel.create(locationData).then(
						(locationResponseData) => {

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

}

  