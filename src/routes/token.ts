import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';

import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';

import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';

import * as moment from 'moment';
import * as validator from 'validator';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';

import { RegisterRoute } from './register';
import { ForgotPasswordRequestRoute } from './forgot.password';
import { UsersRoute } from './users';
import { LocationRoute } from './location';
import { CourseRoute } from './course';

import { Location } from '../models/location.model';
import { LocationAccountRelation  } from '../models/location.account.relation';
import { LocationAccountUser  } from '../models/location.account.user';


export class TokenRoute extends BaseRoute {

	/**
	* Constructor
	*
	* @class RegisterRoute
	* @constructor
	*/
	constructor() {	
		super();
	}


	public static create(router: Router) {
		router.get('/token/:token', (req: Request, res: Response, next: NextFunction) => {
			new TokenRoute().handle(req, res, next);
		});

        router.get('/token/request/add-location-to-user', (req: Request, res: Response) => {
            new TokenRoute().addLocationToUser(req, res);
        });
	}

	public handle(req: Request, res: Response, next: NextFunction){
		let token = req.params.token,
			response = {
				status : false,
				message : '',
				data : {}
			},
			tokenModel = new Token();

		res.statusCode = 400;

		tokenModel.getByToken(token).then(
			(tokenData) => {

				this.callModules(tokenData, req, res, next);

			},
			() => {
				res.send('<h2>Invalid action</h2>');
			}
		);
	}

	public callModules(tokenData, req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			message : '',
			data : {}
		},
		action = tokenData['action'];

		switch (action) {
			case "verify":
				new RegisterRoute().userVerification(req, res, next);
				break;
			case "forgot-password":
				new ForgotPasswordRequestRoute().changePasswordRequest(req, res, next);
				break;
			case "user-request-approve":
				new UsersRoute().userRequestHandler(req, res, tokenData, true);
				break;
			case "user-request-decline":
				new UsersRoute().userRequestHandler(req, res, tokenData, true);
				break;
			case "locationverification":
				new LocationRoute().verifyNewLocation(req, res, tokenData);
				break;
            case "training-invite":
                new CourseRoute().trainingInviteEmailAction(req, res, tokenData);
                break;
			default:
				response.message = 'No action found';
				res.send(response);
				break;
		}
	}

    public async addLocationToUser(req: Request, res: Response){
        let 
        locationId = req.query.location,
        userId = req.query.user,
        action = req.query.action,
        userModel = new User(userId),
        locModel = new Location(),
        locAccRelModel = new LocationAccountRelation(),
        locAccUserModel = new LocationAccountUser();

        try{
            await locAccUserModel.getByLocationIdAndUserId(locationId, userId);
            res.send('Location is already tagged in the user');
        }catch(e){

            if(action){
                try{
                    let locHie = await locModel.locationHierarchy(locationId);
                    let location = (locHie[0]) ? locHie[0] : {};

                    if(locHie[0]){
                        await userModel.load();

                        let accRelations = <any> await locAccRelModel.getByAccountId(<number>userModel.get('account_id'));
                        let hasLocInAcc = false;
                        for(let rel of accRelations){
                            if(rel['location_id'] == locationId){
                                hasLocInAcc = true;
                            }
                        }

                        if(!hasLocInAcc){
                            await locAccRelModel.create({
                                account_id : userModel.get('account_id'),
                                location_id : locationId,
                                responsibility : (location['is_building'] == 1) ? 'Manager' : (location['p1_is_building'] == 1) ? 'Tenant' : 'Tenant'
                            });
                        }

                        await locAccUserModel.create({
                            location_id : locationId,
                            account_id : userModel.get('account_id'),
                            user_id : userId
                        });

                        res.send('Success!');
                    }else{
                        res.send('No location');
                    }
                }catch(e2){
                    res.send('Invalid user');
                }
            }else{
                res.send('Declined');
            }
        }
 
        
    }

}