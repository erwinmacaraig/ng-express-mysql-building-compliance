import { TrainingCertification } from './../models/training.certification.model';
import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Token } from '../models/token.model';
import { Account } from '../models/account.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { UserInvitation } from './../models/user.invitation.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';
import { LocationAccountUser } from '../models/location.account.user';
import { LocationAccountRelation } from '../models/location.account.relation';
import { Location } from '../models/location.model';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { EmailSender } from './../models/email.sender';
import { UserRequest } from '../models/user.request.model';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
import { CourseUserRelation } from '../models/course-user-relation.model';


import * as moment from 'moment';
import * as validator from 'validator';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';
const md5 = require('md5');
const defs = require('./../config/defs.json');


export class UsersRoute extends BaseRoute {

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
        router.get('/users/query', new MiddlewareAuth().authenticate,  (req: Request, res: Response) => {
            new UsersRoute().queryUsers(req, res);
        });

		router.get('/users/is-admin/:user_id',  (req: Request, res: Response) => {
			new UsersRoute().checkIfAdmin(req, res);
		});

		router.post('/users/update', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
	    	new  UsersRoute().updateUser(req, res, next);
	    });

		router.post('/users/upload-profile-picture', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().uploadProfilePicture(req, res, next);
	    });

	    router.post('/users/check-is-verified', (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().checkVerifiedUser(req, res, next);
	    });

	    router.get('/users/get-roles/:user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserRole(req, res, next);
	    })

	    router.get('/users/get-users-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountId(req, res, next);
	    });

	    router.get('/users/get-users-by-account-none-auth/:account_id', (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountIdNoneAuth(req, res);
	    });

	    router.get('/users/get-user-locations-trainings-ecoroles/:user_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUserLocationsTrainingsEcoRoles(req, res, next);
	    })

	    router.post('/users/archive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToArchive(req, res, next);
	    });

	    router.post('/users/archive-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setUsersToArchive(req, res, next);
	    });

	    router.post('/users/unarchive-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeUsersFromArchive(req, res, next);
	    });

	    router.post('/users/archive-invited-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setInvitedUsersToArchive(req, res, next);
	    });

	    router.post('/users/unarchive-invited-users', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeInvitedUsersFromArchive(req, res, next);
	    });

	    router.get('/users/get-archived-users-by-account-id/:account_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getUsersByAccountId(req, res, next, 1);
	    });

	    router.post('/users/unarchive-location-account-user', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().setLocationAccountUserToUnArchive(req, res, next);
	    });

	    router.post('/users/create-bulk-users', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
	    	new  UsersRoute().createBulkUsers(req, res, next);
	    });

	    router.post('/users/remove-user-from-location', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().removeUserFromLocation(req, res, next);
	    });

	    router.post('/users/get-my-warden-team', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getMyWardenTeam(req, res, next);
	    });

	    router.post('/users/request-as-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().requestAsWarden(req, res, next);
	    });

	    router.post('/users/get-warden-request', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getWardenRequest(req, res, next);
	    });

	    router.post('/users/resign-as-chief-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().resignAsChiefWarden(req, res, next);
	    });

	    router.post('/users/resign-as-warden', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().resignAsWarden(req, res, next);
	    });

	    router.post('/users/mobility-impaired-info', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().saveMobilityImpairedDetails(req, res, next);
	    });

	    router.get('/users/get-tenants/:location_id', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
	    	new  UsersRoute().getLocationsTenants(req, res, next).then((data) => {
          res.status(200).send({
            'data': data
          });
        }).catch((e) => {
          console.log(e);
          res.status(400).send({
            'status': 'Fail'
          })
        });
      });

      router.post('/users/send-trp-invitation/', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {

        new UsersRoute().sendTRPInvitation(req, res, next).then(() => {
          return res.status(200).send({
            'status': 'Success'
          })
        }).catch((e) => {
          console.log(e);
          console.log(typeof e);
          return res.status(400).send({
            'status': 'Fail',
            'message': e.toString()
          });
        });
      });

      router.get('/tenant/invitation-filled-form/:token', (req: Request, res: Response, next: NextFunction) => {
          new UsersRoute().retrieveTenantInvitationInfo(req, res, next).then((info) => {
	    return res.status(200).send({
	      'status': 'Success',
	      'data': info
	    });
          }).catch((e) => {
	    return res.status(400).send({
	      'status': 'Fail',
	      'message': 'Unable to retrieve tenant invitation info'
	    });
          });

      });

      router.post('/tenant/process-invitation-form/', (req: Request, res: Response, next: NextFunction) => {
        new UsersRoute().processTenantInvitationForm(req, res, next).then(() => {
          return res.status(200).send({
            'status': 'Success'
          });
        }).catch((e) => {
          return res.status(400).send({
            'status': 'Fail'
          });
        });
      });

      router.get('/users/get-all-locations/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = new User(req.user.user_id);
        user.getAllMyLocations().then((locations) => {
          return res.status(200).send({
            'locations': locations
          });
        });

      });

      router.post('/users/email-certificate/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
          const user = new User(req.body.userId);
          const userDbData = await user.load();
          const certDbData = await user.getAllCertifications({
            'certifications_id': req.body.certId
          });

          const link = `https://mycompliancegroup.evacconnect.com/tenant/my_training/Certificate.php?s=${certDbData[0]['scorm_course_id']}&amp;c=${req.body.certId}`;
          const opts = {
            from : '',
            fromName : 'EvacConnect',
            to : [],
            cc: [],
            body : '',
            attachments: [],
            subject : 'EvacConnect Training Certificate'
          };
          const email = new EmailSender(opts);
          let emailBody = email.getEmailHTMLHeader();
          emailBody += `<h3 style="text-transform:capitalize;">Hi ${userDbData['first_name']} ${userDbData['last_name']},</h3> <br/>
            <h4>Please click on the link below to access your certificate.</h4> <br/>

            Access your ${certDbData[0]['training_requirement_name']} certificate <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">here</a> <br/>`;

          emailBody += email.getEmailHTMLFooter();
          email.assignOptions({
            body : emailBody,
            to : [userDbData['email']],
            cc: [],
          });
          email.send((data) => {
            return res.status(200).send({
              'status': 'Success',
              'msg': 'Certificate sent successfully'
            });
          },(err) => {
            console.log(err, 'UsersRoute.email-certificate. Error sending certificate via email');
            res.status(400).send({
              'status': 'Fail',
              'msg': 'Problem sending certificate'
            });
          });
        } catch(e) {
          console.log(e, 'UsersRoute.email-certificate');
          res.status(400).send({
            'status': 'Fail',
            'msg': 'Problem sending certificate'
          });
        }
      });
  }

  public async checkIfAdmin(req: Request , res: Response){
		let userModel = new User(req.params.user_id),
			response = {
				status : false, message : ''
			};

		try{
			let user = await userModel.load();
			if(user['evac_role'] == 'admin'){
				response.status = true;
			}
		}catch(e){}

		res.send(response);

    }

  public async processTenantInvitationForm(req: Request, res: Response, next: NextFunction){
    const encryptedPassword = md5('Ideation' + req.body.str_password + 'Max');
    let user;
    let invitation;
    let account;
    let locAccntUser;
    try {
      user = new User();
      const tokenObj = new Token();
      const tokenDbData = await tokenObj.getByToken(req.body.token);
      invitation = new UserInvitation(tokenDbData['id']);
      const userInvitation = await invitation.load();
      account = new Account();
      locAccntUser = new LocationAccountUser();
      await account.create({
        'account_name': req.body.account_name,
        'building_number': req.body.building_number,
        'account_domain': req.body.account_domain,
        'billing_city': req.body.billing_city,
        'billing_country': req.body.billing_country,
        'billing_postal_code': req.body.billing_postal_code,
        'billing_street': req.body.billing_street,
        'billing_state': req.body.billing_state
      });
      await user.create({
        'first_name': req.body.first_name,
        'last_name': req.body.last_name,
        'password': encryptedPassword,
        'email': req.body.email,
        'token': req.body.token,
        'account_id': account.ID(),
        'invited_by_user': userInvitation['invited_by_user'],
        'can_login': 1,
      });
      await tokenObj.create({
        'action': 'verify',
        'verified': 1,
        'id': user.ID(),
        'id_type': 'user_id'
      });
      await invitation.create({
        'was_used': 1
      });
      await locAccntUser.create({
        'location_id': invitation.get('location_id'),
        'account_id': account.ID(),
        'user_id': user.ID(),
        'role_id': defs['Tenant'],
      });
      return true;
    } catch(e) {
      console.log(e);
      throw new Error('There was a problem processing tenant information');
    }
  }
  public async retrieveTenantInvitationInfo(req: Request, res: Response, next: NextFunction) {
    const tokenModel = new Token();
    let dbData;
    let userInvitation;
    let locationModel;
    let locationParent;
    const token = req.params.token;
    console.log(token);
    try {
      const tokenDbData = await tokenModel.getByToken(token);
      if (tokenDbData['id_type'] === 'user_invitations_id' && !tokenDbData['verified']) {
	userInvitation = new UserInvitation(tokenDbData['id']);
	dbData = await userInvitation.load();

	// get parent location
	locationModel = new Location(dbData['location_id']);
	await locationModel.load();
	let parentId = locationModel.get('parent_id');
	while (parentId !== -1) {
	  locationParent = new Location(parentId);
	  await locationParent.load();
	  parentId = locationParent.get('parent_id');
	}
	dbData['parent_location_name'] = (locationParent.get('name').toString().length > 0) ?
  locationParent.get('name') : locationParent.get('formatted_address');
	dbData['parent_location_id'] = locationParent.ID();
  dbData['sub_location_name'] = locationModel.get('name');
	dbData['sub_location_id'] = locationModel.ID();
	return dbData;

      } else {
	throw new Error('Invalid token');
      }
    } catch(e) {
      console.log(e);
      throw new Error('Cannot get invitation data');

    }



  }
  public async sendTRPInvitation(req: AuthRequest , res: Response, next: NextFunction) {

    // check first if email is existing
    let dbData = {};
    try {
      const user = new User();
      dbData = await user.getByEmail(req.body.email);
    } catch(e) {

    }

    if (Object.keys(dbData).length > 0) {
      throw Error('Email taken');
    } else {
      console.log('Checkpoint catch');
      const inviCode = new UserInvitation();
      const inviDetails = req.body;
      inviDetails['account_id'] = req['user'].account_id;
      inviDetails['role_id'] = defs['Tenant'];
      inviDetails['invited_by_user'] = req['user'].user_id;
      const tokenModel = new Token();
      const token = tokenModel.generateRandomChars(8);

      const link = req.protocol + '://' + req.get('host') + '/signup/trp-profile-completion/' + token;
      const expDate = moment().format('YYYY-MM-DD HH-mm-ss');

      try {
        console.log(inviDetails);
        await inviCode.create(inviDetails);

        await tokenModel.create({
          'token': token,
          'action': 'invitation',
          'verified': 0,
          'expiration_date': expDate,
          'id': inviCode.ID(),
          'id_type': 'user_invitations_id'
        });

        // email notification here
        const opts = {
          from : '',
          fromName : 'EvacConnect',
          to : [],
          cc: [],
          body : '',
          attachments: [],
          subject : 'EvacConnect TRP Invitation'
        };
        const email = new EmailSender(opts);
        let emailBody = email.getEmailHTMLHeader();
          emailBody += `<h3 style="text-transform:capitalize;">Hi,</h3> <br/>
          <h4>You are being assigned as a Tenant.</h4> <br/>
          <h5>Please update your profile to setup your account in EvacOS by clicking the link below</h5> <br/>
          <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

        emailBody += email.getEmailHTMLFooter();
        email.assignOptions({
          body : emailBody,
          to: [inviDetails['email']],
          cc: []
        });

        email.send((data) => {
          console.log(data);
          return true;
        },(err) => {
          console.log(err);
          return false;
        });
      } catch (e) {
        console.log(e);
        return false;
      }

    }





  }
	public async updateUser(req: Request , res: Response, next: NextFunction){
		let
		response = {
			status : false,
			data : {},
			message : ''
		};

		try{
			let
			userModel = new User(req.body.user_id),
			userData = await userModel.load();

			for(let i in userData){
				if(i in req.body){
					if(i == 'password'){
						req.body[i] = md5('Ideation'+req.body[i]+'Max');
					}
					userData[i] = req.body[i];
				}
			}

			userModel.setID(req.body.user_id);

			await userModel.dbUpdate();

			response.status = true;
			response.data = userData;
		}catch(e){
			response.message = 'No user found';
		}


		res.send(response);
	}

	public uploadProfilePicture(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			data : {},
			message : ''
		};

		const fu = new FileUploader(req, res, next);
		const link = fu.uploadFile().then(
			() => {
				console.log(req.body.user_id);

				let filesModel = new Files(),
					fileUserModel = new FileUser(),
					awsPath = fu.getUploadedFileLocation();

				filesModel.create({
					file_name : req['file']['filename'],
					url : awsPath,
					directory : 'uploads',
					uploaded_by : req.body.user_id,
					datetime : moment().format('YYYY-MM-DD HH:mm:ss')
				}).then(
					() => {
						fileUserModel.create({
							user_id : req.body.user_id,
							file_id : filesModel.ID(),
							type : 'profile'
						}).then(
							() => {
								response.status = true;
								response.data['url'] = awsPath;
								res.send(response);
							},
							() => {
								response.message = 'Error on saving file';
								res.end(response);
							}
						);
					},
					() => {
						response.message = 'Error on saving file';
						res.end(response);
					}
				);
			}
		).catch((e) => {
			response.message = 'Error on uploading';
			res.end(response);
		});
	}

	public checkVerifiedUser(req: Request, res: Response, next: NextFunction) {
		let response = {
			status : false,
			data : {},
			message : ''
		},
		tokenModel = new Token();
		res.statusCode = 400;

		tokenModel.getkUserVerified(req.body.user_id).then(
			(token) => {
				res.statusCode = 200;
				response.status = true;
				response.message = 'User is verified';
				res.send(response);
			},
			() => {
				response.message = 'not verified';
				res.send(response);
			}
		);
	}

	public getUserRole(req: Request, res: Response, next: NextFunction){
		let userRoleRelation = new UserRoleRelation(),
			response = {
				status : false,
				message : '',
				data : {}
			},

			getWardenRoles = (callBack) => {
				new UserEmRoleRelation().getEmRolesByUserId(req.params['user_id']).then(
                    (userRoles) => {
                        for(let i in userRoles){
                            response.data[ Object.keys( response.data ).length ] = {
                                role_id : userRoles[i]['em_roles_id'],
                                role_name : userRoles[i]['role_name'],
                                is_warden_role : userRoles[i]['is_warden_role']
                            };
                        }
                        callBack();
                    },
                    (a) => {
                        callBack();
                    }
                );
			}

		res.statusCode = 400;
		userRoleRelation.getByUserId(req.params['user_id']).then(
			(roles) => {
				for(let i in roles){
					if(roles[i]['role_id'] == 1){
						roles[i]['role_name'] = 'Building Manager';
					}else if(roles[i]['role_id'] == 2){
						roles[i]['role_name'] = 'Tenant';
					}
				}

				response.data = roles;

				getWardenRoles(() => {
					response.status = true;
					res.statusCode = 200;
					res.send(response);
				});
			},
			() => {
				getWardenRoles(() => {
					response.status = true;
					res.statusCode = 200;
					res.send(response);
				});
			}
		);
	}

    public async queryUsers(req: Request, res: Response){
        let 
        accountId = parseInt(req['user']['account_id']),
        userID = req['user']['user_id'],
        query = req.query,
        response = {
            status : true,
            data : <any>{},
            message : ''
        },
        userModel = new User(),
        modelQueries = {
            select : <any>{},
            where : [],
            orWhere : [],
            joins : [],
            limit : '0,10',
            order : 'users.user_id ASC',
            group : false
        },
        archived : 0,
        queryRoles = [],
        userIds = [0],
        emRolesDef = defs.em_roles;

        modelQueries.select['users'] = ['first_name', 'last_name', 'account_id', 'user_id', 'user_name', 'email', 'mobile_number', 'phone_number', 'mobility_impaired', 'last_login'];

        if(query.archived){
            archived = query.archived;
        }
        modelQueries.where.push('users.archived = '+archived);
        modelQueries.where.push('users.account_id = '+accountId);
        if(query.impaired){
            if(query.impaired > -1){
                if(query.impaired == 1){
                    modelQueries.where.push('users.mobility_impaired = 1');
                }else if(query.impaired == 0){
                    modelQueries.where.push('users.mobility_impaired = 0');
                }
            }
        }

        if(query.type){
            switch (query.type) {
                case "client":
                    modelQueries.where.push('users.evac_role = "Client"');
                    break;
                
                case "admin":
                    modelQueries.where.push('users.evac_role = "admin"');
                    break;
            }
        }

        modelQueries.joins.push(' LEFT JOIN file_user ON users.user_id = file_user.user_id LEFT JOIN files ON files.file_id = file_user.file_id ');

        if(query.roles){
            queryRoles = query.roles.split(',');
            if( queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('trp') > -1){
                modelQueries.where.push(' users.user_id IN (SELECT user_id FROM user_role_relation) ');
            }
            if( queryRoles.indexOf('users') > -1 && (queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('trp') > -1) == true ){
                modelQueries.orWhere.push(' OR users.user_id IN (SELECT user_id FROM user_em_roles_relation) ');
                modelQueries.orWhere.push(' AND users.archived = '+archived);
                modelQueries.orWhere.push(' AND users.account_id = '+accountId);
                if(query.impaired){
                    if(query.impaired > -1){
                        if(query.impaired == 1){
                            modelQueries.orWhere.push(' AND users.mobility_impaired = 1');
                        }else if(query.impaired == 0){
                            modelQueries.orWhere.push(' AND users.mobility_impaired = 0');
                        }
                    }
                }
            }else if(queryRoles.indexOf('users') > -1 && (queryRoles.indexOf('frp') == -1 && queryRoles.indexOf('trp') == -1) == true){
                modelQueries.where.push(' users.user_id IN (SELECT user_id FROM user_em_roles_relation) ');
            }
        }

        modelQueries.select['custom'] = [" IF(files.url IS NULL, '', files.url) as profile_pic "];

        if(query.limit){
            modelQueries.limit = query.limit;
        }

        if(query.offset){
            modelQueries.limit = query.offset+','+modelQueries.limit;
        }

        response.data['users'] = await userModel.query(modelQueries);
        for(let user of response.data['users']){
            userIds.push(user.user_id);

            let lastLoginMoment = moment(user.last_login);
            if(lastLoginMoment.isValid()){
                user.last_login = lastLoginMoment.format('DD/MM/YYYY hh:mma');
            }else{
                user.last_login = '';
            }
        }

        if(query.roles && query.users_locations){
            let accountModel = new Account(),
                locationsDB = await accountModel.getLocationsOnAccount(userID, 1, 0),
                locations = <any> [];
            
            for (let loc of locationsDB) {
                locations.push(loc);
            }

            let locationsData = [];
            for (let loc of locations) {
                let
                    deepLocModel = new Location(),
                    deepLocations = <any> [];
                
                if(loc.parent_id == -1){
                    deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);
                    deepLocations.push(loc);
                }else{
                    let ancLocModel = new Location(),
                        ancestores = <any> await ancLocModel.getAncestries(loc.location_id);

                    for(let anc of ancestores){
                        if(anc.parent_id == -1){
                            deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(anc.location_id);
                            deepLocations.push(anc);
                        }
                    }
                }

                let isIn = false;
                for(let dl of deepLocations){
                    for(let ld of locationsData){
                        if(dl.location_id == ld.location_id){
                            isIn = true;
                        }
                    }

                    if(!isIn){
                        locationsData.push(dl);
                    }
                }
            }

            // response.data['locationsData'] = locationsData;

            let locAccUserModel = new LocationAccountUser(),
                usersLocsMap = <any> await locAccUserModel.getManyLocationsByAccountIdAndUserIds(accountId, userIds.join(','));

            // response.data['usersLocsMap'] = usersLocsMap;

            for(let map of usersLocsMap){
                for(let user of response.data['users']){
                    let userLocData = {
                        user_id : user.user_id,
                        location_id : 0,
                        name : '',
                        parent_id : -1,
                        parent_name : '',
                        location_role_id : 0
                    };

                    if('locations' in user == false){ user['locations'] = []; }
                    if(map.user_id == user.user_id){
                        for(let loc of locationsData){
                            if(loc.location_id == map.location_id){
                                userLocData.location_id = loc.location_id;
                                userLocData.name = loc.name;
                                userLocData.parent_id = loc.parent_id;
                                userLocData.location_role_id = map.role_id;

                                if(loc.parent_id > -1){
                                    for(let par of locationsData){
                                        if(par.location_id == loc.parent_id){
                                            userLocData.parent_name = par.name;
                                        }
                                    }
                                }

                                let exst = false;
                                for(let ul of user['locations']){
                                    if(ul.location_id == loc.location_id && ul.location_role_id == map.role_id){
                                        exst = true;
                                    }
                                }

                                if(!exst){ user.locations.push(userLocData); }
                            }
                        }
                    }
                }
            }

            for(let user of response.data['users']){
                if('roles' in user == false){ user['roles'] = []; }
                
                for(let loc of user.locations){
                    let role = {
                        role_name : 'General Occupant', role_id : 8
                    };

                    if( loc.location_role_id == 1 && queryRoles.indexOf('frp') > -1 ){
                        role.role_name = 'FRP';
                        role.role_id = 1;
                    }else if( loc.location_role_id == 2 && queryRoles.indexOf('trp') > -1 ){
                        role.role_name = 'TRP';
                        role.role_id = 2;
                    }else{
                        for(let i in emRolesDef){

                            if(queryRoles.indexOf('users') > -1 && emRolesDef[i] == loc.location_role_id && i !== 'FSA' && i.trim().length > 0 && i !== 'AREA WARDEN' && i !== 'EPC'){
                                role.role_name = this.capitalizeFirstLetter( i.toLowerCase() );
                                role.role_id = emRolesDef[i];
                            }
                        }
                    }

                    let exst = false;
                    for(let ro of user['roles']){
                        if(ro.role_id == role.role_id){
                            exst = true;
                        }
                    }
                    if(!exst){
                        user['roles'].push(role);
                    }

                }
                
            }
        }

        if(query.user_training){

            let user_course_total,
                user_training_total,
                training = new TrainingCertification(),
                userCourseRel = new CourseUserRelation();
            try {
                user_course_total = await userCourseRel.getNumberOfAssignedCourses(userIds);
            } catch (e) {
                user_course_total = {};
            }
            try {
                user_training_total = await training.getNumberOfTrainings(userIds);
            } catch(e) {
                user_training_total = {};
            }


            for(let user of response.data['users']){
                if (user.user_id in user_course_total) {
                    user['assigned_courses'] = user_course_total[user.user_id]['count'];
                } else {
                    user['assigned_courses'] = 0;
                }
                if (user.user_id in user_training_total) {
                    user['trainings'] = user_training_total[user.user_id]['count'];
                } else {
                    user['trainings'] = 0;
                }
            }
        }

        if(query.pagination){
            let 
            countUserModel = new User(),
            countResponse = <any> await countUserModel.query({
                select : { count : true },
                where : modelQueries.where,
                orWhere : modelQueries.orWhere,
                joins : modelQueries.joins
            }),
            pagination = {
                total : parseInt(countResponse[0]['count']),
                pages : 0
            },
            limit = (query.limit) ? parseInt(query.limit) : 10;

            if(pagination.total > limit){
                let div = pagination.total / limit,
                    rem = (pagination.total % limit) * 1,
                    totalpages = Math.floor(div);

                if(rem > 0){
                    totalpages++;
                }

                pagination.pages = totalpages;
            }
            
            response.data['pagination'] = pagination; 
        }

        res.send(response);
    }

	public async getUsersByAccountIdNoneAuth(req: Request, res: Response){
		let accountId = req.params.account_id,
			userModel = new User();

		res.send({
			status : true,
			data : await userModel.getByAccountId(accountId),
			message : ''
		});
	}

	public async getUsersByAccountId(req: Request, res: Response, next: NextFunction, archived?){
		let accountId = req.params.account_id,
			userID = req['user']['user_id'],
			locationAccountUser = new LocationAccountUser(),
			response = {
				data : <any>[],
				status : false,
				message : ''
			},
			allParents = [],
			allUsersModel = new User(),
			allUsers = <any>[],
			allUsersIds = [],
			emRolesModel = new UserEmRoleRelation(),
			emRoles = await emRolesModel.getEmRoles(),
			emRolesIndexedId = {},
            accountModel = new Account();

        archived = (archived) ? archived : 0;

        let allowedRoleIds = [0,1,2];
        for(let i in emRoles){
            allowedRoleIds.push(emRoles[i]['em_roles_id']);
            emRolesIndexedId[ emRoles[i]['em_roles_id'] ] = emRoles[i];
        }

        let locationsOnAccount = await accountModel.getLocationsOnAccount(userID, 1, archived),
            locations = <any> [];

        for (let loc of locationsOnAccount) {
            locations.push(loc);
        }

        let locationsData = [];
        for (let loc of locations) {
            let
                deepLocModel = new Location(),
                deepLocations = <any> [];

            if(loc.parent_id == -1){
                deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);
                deepLocations.push(loc);
            }else{
                let ancLocModel = new Location(),
                    ancestores = <any> await ancLocModel.getAncestries(loc.location_id);

                for(let anc of ancestores){
                    if(anc.parent_id == -1){
                        deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(anc.location_id);
                        deepLocations.push(anc);
                    }
                }
            }

            let isIn = false;
            for(let dl of deepLocations){
                for(let ld of locationsData){
                    if(dl.location_id == ld.location_id){
                        isIn = true;
                    }
                }

                if(!isIn){
                    locationsData.push(dl);
                }
            }
        }

		allUsers = await allUsersModel.getByAccountId(accountId, archived);

		for(let user of allUsers){
			allUsersIds.push(user.user_id);
			let filesModel = new Files();
			try{
				let profRec = await filesModel.getByUserIdAndType( user.user_id, 'profile' );
				user['profile_pic'] = profRec[0]['url'];
			}catch(e){
				user['profile_pic'] = '';
			}

            user['locations'] = [];
            user['roles'] = [];
		}

        const userIds = [];
        let toSendData = [];
        const userCourseRel = new CourseUserRelation();
        // get assigned trainings
        for (let user of allUsers) {
            userIds.push(user.user_id);
        }
        let user_course_total;
        let user_training_total;
        // get trainings from certifications table
        const training = new TrainingCertification();
        try {
            user_course_total = await userCourseRel.getNumberOfAssignedCourses(userIds);

        } catch (e) {
            user_course_total = {};
        }
        try {
            user_training_total = await training.getNumberOfTrainings(userIds, {
              'pass': 1,
              'current': 1
            });
        } catch(e) {
            user_training_total = {};
        }

        for(let user of allUsers){
            let locAccUserModel = new LocationAccountUser(),
                usersLocsMap = <any> await locAccUserModel.getByUserId(user.user_id),
                userLocData = {
                    user_id : user.user_id,
                    location_id : 0,
                    name : '',
                    parent_id : -1,
                    parent_name : '',
                    location_role_id : 0
                };

            for(let map of usersLocsMap){
                for(let loc of locationsData){
                    if(loc.location_id == map.location_id){
                        userLocData.location_id = loc.location_id;
                        userLocData.name = loc.name;
                        userLocData.parent_id = loc.parent_id;
                        userLocData.location_role_id = map.role_id;

                        if(loc.parent_id > -1){
                            for(let par of locationsData){
                                if(par.location_id == loc.parent_id){
                                    userLocData.parent_name = par.name;
                                }
                            }
                        }
                    }
                }
            }

            user['locations'].push(userLocData);

            if (user.user_id in user_course_total) {
                user['assigned_courses'] = user_course_total[user.user_id]['count'];
            } else {
                user['assigned_courses'] = 0;
            }
            if (user.user_id in user_training_total) {
                user['trainings'] = user_training_total[user.user_id]['count'];
            } else {
                user['trainings'] = 0;
            }

            toSendData.push(user);
        }

		for(let user of toSendData){
			let locs = user.locations;

			let tempUserRoles = {};
			for(let loc of locs){
				let roleName = 'General Occupant',
					roleId = 8;

                if( emRolesIndexedId[ loc.location_role_id ] ){
                    roleName = emRolesIndexedId[ loc.location_role_id ]['role_name'];
                    roleId = loc.location_role_id;
                }else if( loc.location_role_id == 1  ){
                    roleName = 'FRP';
                    roleId = 1;
                }else if( loc.location_role_id == 2  ){
                    roleName = 'TRP';
                    roleId = 2;
                }

				user['roles'].push({
                    role_name : roleName, role_id : roleId
                });

			}
		}

		response.data = toSendData;
		response['locations'] = locationsData;
		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async getUserLocationsTrainingsEcoRoles(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false,
			data : {
				user : {},
				locations : {},
				trainings : <any>[],
				certificates : <any>[],
				eco_roles : <any>[]
			},
			message : ''
		},
		userId = req.params['user_id'],
		userModel = new User(userId),
		locationAccountUserModel = new LocationAccountUser(),
		fileModel = new Files(),
		user = {},
		emRolesModel = new UserEmRoleRelation(),
		emRoles = await emRolesModel.getEmRoles(),
		mobilityModel = new MobilityImpairedModel();

		response.data.eco_roles = emRoles;
        const training_requirements = await new TrainingCertification().getRequiredTrainings();
        // console.log(training_requirements);
        try {

            let user = await userModel.load(),
            locations = <any>[];

            if( Object.keys(user).length > 0 ) {
                user['mobility_impaired_details'] = [];

                let sqlInLocation = ` (
                SELECT
                locations.location_id
                FROM
                locations
                INNER JOIN
                location_account_user LAU
                ON
                locations.location_id = LAU.location_id
                WHERE
                LAU.account_id = `+user['account_id']+`
                AND
                locations.archived = 0
                AND
                LAU.user_id = `+req['user']['user_id']+`
                AND LAU.archived = 0
                GROUP BY
                locations.location_id
                ORDER BY
                locations.location_id
                )`;
                let arrWhere = [];
                arrWhere.push(['user_id = '+userId]);
                arrWhere.push( ["lau.location_id IN "+sqlInLocation ] );
                locations = await locationAccountUserModel.getMany(arrWhere);

                if( user['mobility_impaired'] == 1 ){
                    let mobilityModel = new MobilityImpairedModel(),
                    arrWhere = [];

                    arrWhere.push( ["user_id = " + userId] );
                    arrWhere.push( "duration_date > NOW()" );
                    try {
                        let mobilityDetails = await mobilityModel.getMany( arrWhere );
                        user['mobility_impaired_details'] = mobilityDetails;
                    } catch (e) {
                        console.log(e);
                        user['mobility_impaired_details'] = [];
                    }
                }

                try {
                    await fileModel.getByUserIdAndType(userId, 'profile').then(
                        (fileData) => {
                            user['profilePic'] = fileData[0].url;
                        },
                        () => {
                            user['profilePic'] = '';
                        }
                        );
                }catch(e) {
                    console.log(e);
                }

                try {
                    user['mobility_impaired_details'] = <any> await mobilityModel.getMany([ [ "user_id = "+userId] ]);

                    for(let i in user['mobility_impaired_details']) {
                        user['mobility_impaired_details'][i]['date_created_formatted'] = moment(user['mobility_impaired_details'][i]['date_created']).format('MMM. DD, YYYY');
                        user['mobility_impaired_details'][i]['duration_date_formatted'] = moment(user['mobility_impaired_details'][i]['duration_date']).format('MMM. DD, YYYY');
                    }
                } catch(e) {
                    console.log(e);
                }
            }

            Object.keys(locations).forEach((key) => {
                if ('em_roles_id' in locations[key] && locations[key]['em_roles_id']) {
                    locations[key]['training_requirement_name'] = training_requirements[locations[key]['em_roles_id']]['training_requirement_name'];
                    locations[key]['training_requirement_id'] = training_requirements[locations[key]['em_roles_id']]['training_requirement_id'];
                }
            });


            response.data.locations = locations;
			// response.data.user = user;
			response.status = true;
		}catch(e){
            response.status = false;
            console.log(e);
        }

        try{

            let courseModel = new CourseUserRelation(),
            trainings = await courseModel.getAllCourseForUser(userId);
            response.data.trainings = trainings;

        }catch(e){
          console.log(e, 'UsersRoute.getUserLocationsTrainingsEcoRoles');
        }


        try {
          const userModel = new User(userId)
          response.data.user = await userModel.load();
        } catch(e) {
          console.log(e, ' Cannot load user.', 'UsersRoute.getUserLocationsTrainingsEcoRoles');
        }
        try {
          await fileModel.getByUserIdAndType(userId, 'profile').then(
              (fileData) => {
                  response.data.user['profilePic'] = fileData[0].url;
              },
              () => {
                  response.data.user['profilePic'] = '';
              }
              );
        } catch(e) {
          console.log(e, 'UsersRoute.getUserLocationsTrainingsEcoRoles');
        }
        try{
            let certificates = await userModel.getAllCertifications({'pass': 1});
            response.data.certificates = certificates;
        } catch(e){
          console.log(e, 'UsersRoute.getUserLocationsTrainingsEcoRoles');
        }

        res.statusCode = 200;
        res.send(response);
    }

	public async setLocationAccountUserToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['location_account_user_id']){
			let locAccountUser = new LocationAccountUser(req.body['location_account_user_id'][i]);
			await locAccountUser.load();
			console.log(locAccountUser.getDBData());
			locAccountUser.set('archived', 1);
			await locAccountUser.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async setUsersToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['user_ids']){
			let userModel = new User(req.body['user_ids'][i]);
			await userModel.load();

			userModel.set('archived', 1);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async removeUsersFromArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['user_ids']){
			let userModel = new User(req.body['user_ids'][i]);
			await userModel.load();

			userModel.set('archived', 0);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async setInvitedUsersToArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['ids']){
			let userModel = new UserInvitation(req.body['ids'][i]);
			await userModel.load();

			userModel.set('archived', 1);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async removeInvitedUsersFromArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['ids']){
			let userModel = new UserInvitation(req.body['ids'][i]);
			await userModel.load();

			userModel.set('archived', 0);
			await userModel.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async setLocationAccountUserToUnArchive(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true,
			data : <any>[],
			message : ''
		};

		for(let i in req.body['location_account_user_id']){
			let locAccountUser = new LocationAccountUser(req.body['location_account_user_id'][i]);
			await locAccountUser.load();
			console.log(locAccountUser.getDBData());
			locAccountUser.set('archived', 0);
			await locAccountUser.dbUpdate();
		}

		response.message = 'Success';
		res.statusCode = 200;
		res.send(response);
	}

	public async getArchivedUsersByAccountId(req: Request, res: Response, next: NextFunction){
		let accountId = req.params.account_id,
			locationAccountUser = new LocationAccountUser(),
			response = {
				data : <any>[],
				status : false,
				message : ''
			},
			allParents = [];

		let arrWhere = [];
			arrWhere.push( ["account_id = "+accountId ] );
			arrWhere.push( ["archived = "+1 ] );

		let locations = await locationAccountUser.getMany(arrWhere);
		for(let l in locations){
			let userModel = new User(locations[l]['user_id']);
			let parentLocation = new Location(locations[l]['parent_id']);

			if(allParents.indexOf(locations[l]['parent_id']) == -1){
				await parentLocation.load().then(() => {
					allParents[ locations[l]['parent_id'] ] = parentLocation.getDBData();
					locations[l]['parent_data'] = parentLocation.getDBData();
				}, () => {
					locations[l]['parent_data'] = {};
				});
			}else{
				locations[l]['parent_data'] = allParents[ locations[l]['parent_id'] ];
			}

			await userModel.load().then(()=>{
				locations[l]['user_info'] = userModel.getDBData();
			},()=>{
				locations[l]['user_info'] = {};
			});

		}

		response.data = locations;
		response.status = true;
		res.statusCode = 200;
		res.send(response);
	}

	public async createBulkUsers(req: AuthRequest, res: Response, next: NextFunction){
		let response = {
			status : false, data : [], message: ''
		},
		users = JSON.parse(req.body.users),
        accountId = req.user.account_id,
        accountModel = new Account(accountId),
		returnUsers = [],
        account = {},
        isAccountEmailExempt = false;

        try{
            let account = <any> await accountModel.load();
            isAccountEmailExempt = (account.email_add_user_exemption == 1) ? true : false;
        }catch(e){

        }

		for(let i in users){
			let userModel = new User(),
				userRoleRelation = new UserRoleRelation(),
				userEmRole = new UserEmRoleRelation(),
				emRoles = await new UserEmRoleRelation().getEmRoles(),
				isEmailValid = this.isEmailValid(users[i]['email']),
				isBlackListedEmail = false,
				hasError = false;

			users[i]['errors'] = {};

			if(isEmailValid){
				// isBlackListedEmail = new BlacklistedEmails().isEmailBlacklisted(users[i]['email']);
				// if(!isBlackListedEmail){

				await userModel.getByEmail(users[i]['email']).then(
					() => {
						console.log(userModel.getDBData());
						hasError = true;
						users[i]['errors']['email_taken'] = true;
					},
					() => {}
				);


				// }else{
				// 	users[i]['errors']['blacklisted'] = true;
				// 	hasError = true;
				// }
			}else{
				users[i]['errors']['invalid'] = true;
				hasError = true;
			}

			if(!hasError){
				let
				token = this.generateRandomChars(30),
				saveData = {
					'first_name' : users[i]['first_name'],
					'last_name' : users[i]['last_name'],
					'email' : users[i]['email'],
					'contact_number' : users[i]['mobile_number'],
					'location_id' : users[i]['account_location_id'],
					'account_id' : req['user']['account_id'],
					'role_id' : (users[i]['account_role_id'] == 1 || users[i]['account_role_id'] == 2) ? users[i]['account_role_id'] : 0,
					'eco_role_id' : (users[i]['account_role_id'] != 1 && users[i]['account_role_id'] != 2) ? users[i]['account_role_id'] : 0,
					'invited_by_user' : req['user']['user_id'],
                    'was_used' : (isAccountEmailExempt) ? 1 : 0
				};

				let invitation = new UserInvitation();
				await invitation.create(saveData);

                if(isAccountEmailExempt){

                    let user  = new User(),
                        encryptedPassword = md5('Ideation' + defs['DEFAULT_USER_PASSWORD'] + 'Max');

                    await user.create({
                        'first_name': users[i]['first_name'],
                        'last_name': users[i]['last_name'],
                        'password': encryptedPassword,
                        'email': users[i]['email'],
                        'token': token,
                        'account_id': accountId,
                        'invited_by_user': req['user']['user_id'],
                        'can_login': 1,
                        'mobile_number': users[i]['mobile_number']
                    });

                    let tokenModel = new Token();
                    await tokenModel.create({
                        'token' : token,
                        'action' : 'verify',
                        'id' : user.ID(),
                        'id_type' : 'user_id',
                        'verified' : 1
                    });

                    let locationAcctUser = new LocationAccountUser();
                    await locationAcctUser.create({
                        'location_id': users[i]['account_location_id'],
                        'account_id': accountId,
                        'user_id': user.ID(),
                        'role_id': users[i]['account_role_id']
                    });

                    if(parseInt(users[i]['account_role_id']) == 1 || parseInt(users[i]['account_role_id']) == 2){
                        const userRoleRel = new UserRoleRelation();
                        await userRoleRel.create({
                            'user_id': user.ID(),
                            'role_id': users[i]['account_role_id']
                        });
                    }else{
                        const EMRoleUserRole = new UserEmRoleRelation();
                        await EMRoleUserRole.create({
                            'user_id': user.ID(),
                            'em_role_id': users[i]['account_role_id'],
                            'location_id': users[i]['account_location_id']
                        });
                    }
                }


                if(isAccountEmailExempt == false){

                    let tokenModel = new Token();
                    await tokenModel.create({
                        'token' : token,
                        'action' : 'invitation',
                        'id' : invitation.ID(),
                        'id_type' : 'user_invitations_id',
                        'verified' : 0
                    });

    				const opts = {
    					from : 'allantaw2@gmail.com',
    					fromName : 'EvacConnect',
    					to : [],
    					cc: [],
    					body : '',
    					attachments: [],
    					subject : 'EvacConnect Notification'
    				};
    				const email = new EmailSender(opts);
    				const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + token;
    				let emailBody = email.getEmailHTMLHeader();
    				emailBody += `<h3 style="text-transform:capitalize;">Hi ${saveData['first_name']} ${saveData['last_name']},</h3> <br/>
    				<h4>You were added to EvacConnect Compliance Management System.</h4> <br/>
    				<h5>Click on the link below to setup your password.</h5> <br/>
    				<a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

    				emailBody += email.getEmailHTMLFooter();

    				email.assignOptions({
    					body : emailBody,
    					to: [saveData['email']],
    					cc: ['erwin.macaraig@gmail.com']
    				});
    				email.send(
    					(data) => console.log(data),
    					(err) => console.log(err)
    				);
                }

			}else{
				returnUsers.push( users[i] );
			}

		}

		res.statusCode = 200;
		response.status = true;
		response.data = returnUsers;
		res.send(response);
	}

	public async removeUserFromLocation(req: Request, res: Response, next: NextFunction){
		let response = {
			status : false, data : <any>[], message : ''
		},
		id = req.body['location_account_user_id'],
		locAccUserModel = new LocationAccountUser(id),
		locAccUser = await locAccUserModel.load(),
		emRoleModel = new UserEmRoleRelation();

		await locAccUserModel.delete();

		/*let emRolesRec = await emRoleModel.getEmRolesByUserId(locAccUser['user_id']),
			hasGenOcc = false,
			hasOtherWarden = false;

		for(let i in emRolesRec){
			emRolesRec[i]['deleted'] = false;
			if(emRolesRec[i]['location_id'] == locAccUser['location_id']){
				const deleteEmRoleModel = new UserEmRoleRelation( emRolesRec[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
				emRolesRec[i]['deleted'] = true;
			}

			if(
				(emRolesRec[i]['is_warden_role'] == 1) &&
				(emRolesRec[i]['location_id'] != locAccUser['location_id']) &&
				!emRolesRec[i]['deleted']
				){
				hasOtherWarden = true;
			}

			if(emRolesRec[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasOtherWarden && !hasGenOcc){
			let createEmRole = new UserEmRoleRelation();
			await createEmRole.create({
				'user_id' : locAccUser['user_id'],
				'location_id' : locAccUser['location_id'],
				'em_role_id' : 8
			});

			let createLoctionRelation = new LocationAccountUser();
			await createLoctionRelation.create({
				'user_id' : locAccUser['user_id'],
				'account_id' : locAccUser['account_id'],
				'location_id' : locAccUser['location_id'],
				'role_id' : 8
			});
		}*/

		response.status = true;
		res.send(response);
	}

	public async getMyWardenTeam(req: Request, res: Response, next: NextFunction){
		let response = {
			status : true, data : {
				user : {},
				eco_role : {},
				location : {},
				team : <any>[]
			}, message : ''
		},
		roleId = req.body.role_id,
		emRoleRelation = new UserEmRoleRelation(),
		emRoles = await emRoleRelation.getEmRoles(),
		myEmRoleRelation = new UserEmRoleRelation(),
		myEmRoles,
		locationAccountUser = new LocationAccountUser(),
		locationModel = new Location();

		try{
			myEmRoles = await myEmRoleRelation.getEmRolesByUserId(req['user']['user_id']);
			for(let i in emRoles){
				if(emRoles[i]['em_roles_id'] == roleId){
					response.data.eco_role = emRoles[i];
				}
			}

			response.data['myEmRoles'] = myEmRoles;

			/*const accountsLocations = await locationAccountUser.getMany([
				[ "account_id = "+req['user']['account_id'] ]
			]);*/

			let myEmRoleRecord = {};
			for(let i in myEmRoles){
				if(myEmRoles[i]['em_roles_id'] == roleId){
					myEmRoleRecord = myEmRoles[i];
				}
			}

			if(myEmRoleRecord['location_id']){
				myEmRoleRecord['related_locations'] = await locationModel.getAncestries(myEmRoleRecord['location_id']);

				response.data.location = {
					'location_id' : myEmRoleRecord['location_id'],
					'parent_id' : myEmRoleRecord['parent_id'],
					'name' : myEmRoleRecord['location_name'],
					'formatted_address' : myEmRoleRecord['formatted_address'],
					'google_place_id' : myEmRoleRecord['google_place_id'],
					'google_photo_url' : myEmRoleRecord['google_photo_url'],
					'related_locations' : myEmRoleRecord['related_locations'],
					'parent_location' : {}
				};

				let mainParentLocationId,
					mainParent = {};

				for(let i in myEmRoleRecord['related_locations']){
					if(myEmRoleRecord['related_locations'][i]['parent_id'] == -1){
						mainParent = myEmRoleRecord['related_locations'][i];
						mainParentLocationId = myEmRoleRecord['related_locations'][i]['location_id'];
					}
				}

				response.data['myEmRoleRecord'] = myEmRoleRecord;
				response.data['mainParentLocationId'] = mainParentLocationId;
				response.data['mainParent'] = mainParent;

				if(myEmRoleRecord['parent_id'] == response.data.location['parent_id']){
					if(response.data.location['parent_id'] > -1){
						response.data.location['parent_location'] = mainParent;
					}
				}

				let deepLocation = new Location(),
					subLocations = await deepLocation.getDeepLocationsByParentId(mainParentLocationId),
					subLocationsIds = [0];

				response.data['subLocations'] = subLocations;

				for(let i in subLocations){
					subLocationsIds.push(subLocations[i]['location_id']);
				}

				let userEmRoleRelationTeam = new UserEmRoleRelation(),
					teamEmRoles = <any>[];

                console.log( req['user']['account_id'], subLocationsIds.join(',') );

                teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], subLocationsIds.join(','));

                /*
				if(  roleId == 11 || roleId == 15 || roleId == 16 || roleId == 18 ){
					//Chief Wardens //Deputy Chief Warden //Building Warden //Deputy Building Warden
					teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], subLocationsIds.join(','));
				}else if(roleId == 8 || roleId == 9 ||  roleId == 10 || roleId == 12 || roleId == 13 || roleId == 14){
					//Gen Occupant //Warden //Fire Safety Advisor //Emergency Planning Committee Member //First Aid Officer
					teamEmRoles = await userEmRoleRelationTeam.getUserLocationByAccountIdAndLocationIds(req['user']['account_id'], myEmRoleRecord['location_id']);
				}else{

				}
                */

				response.data['teamEmRoles'] = teamEmRoles;

				let team = [];
				for(let i in teamEmRoles){
					if(teamEmRoles[i]['user_id'] != req['user']['user_id']){
						teamEmRoles[i]['parent_location'] = {};
						if(teamEmRoles[i]['parent_id'] == mainParentLocationId){
							teamEmRoles[i]['parent_location'] = mainParent;
						}else{
							for(let x in subLocations){
								if(teamEmRoles[i]['parent_id'] == subLocations[x]['location_id']){
									teamEmRoles[i]['parent_location'] = subLocations[x];
								}
							}
						}
						team.push(teamEmRoles[i]);
					}
				}
				response.data.team = team;

				/*response.data['accntlocations'] = accountsLocations;
				response.data['emRoles'] = emRoles;
				response.data['myEmRoles'] = myEmRoles;
				response.data['myEmRoleRecord'] = myEmRoleRecord;*/
				response.data.user = req['user'];

				let fileModel = new Files();
		        await fileModel.getByUserIdAndType(req['user']['user_id'], 'profile').then(
		            (fileData) => {
		                response.data['user']['profilePic'] = fileData[0].url;
		            },
		            () => {
		                response.data['user']['profilePic'] = '';
		            }
		        );
			}else{
				response.status = false;
			}

		}catch(e){
			response.status = false;
		}

		res.send(response);
	}

	public async requestAsWarden(req: Request, res: Response, next: NextFunction){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		locationModel = new Location(req.body.location),
		userModel = new User(req.body.user),
		approverModel = new User(req.body.approver),
		token1Model = new Token(),
		token2Model = new Token(),
		token1 = this.generateRandomChars(30),
		token2 = this.generateRandomChars(30),
		currentDate = moment(),
		expirationDate = currentDate.add(1, 'day'),
		expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss');

		try{
			let location = await locationModel.load();
			await userModel.load();
			await approverModel.load();

			await requestModel.create({
				'user_id' : req.body.user,
				'requested_role_id' : 9,
				'location_id' : req.body.location,
				'approver_id' : req.body.approver
			});

			await token1Model.create({
				'token' : token1,
				'action' : 'user-request-approve',
				'verified' : 0,
				'expiration_date' : expDateFormat,
				'id' : requestModel.ID(),
				'id_type' : 'user_requests_id'
			});

			await token2Model.create({
				'token' : token2,
				'action' : 'user-request-decline',
				'verified' : 0,
				'expiration_date' : expDateFormat,
				'id' : requestModel.ID(),
				'id_type' : 'user_requests_id'
			});

			let parentLocationModel = new Location( location['parent_id'] ),
				parentLocation;
			if(location['parent_id'] > -1){
				parentLocation = await parentLocationModel.load();
			}

			const
			opts = {
				from : '',
				fromName : 'EvacConnect',
				to : [ approverModel.get('email') ],
				cc: [],
				body : '',
				attachments: [],
				subject : 'EvacConnect Warden Request'
			},
			email = new EmailSender(opts),
			approvelink = req.protocol + '://' + req.get('host') + '/token/' + token1,
			declinelink = req.protocol + '://' + req.get('host') + '/token/' + token2;


			let
			emailBody = email.getEmailHTMLHeader(),
			userName = userModel.get('first_name')+' '+userModel.get('last_name'),
			approverName = approverModel.get('first_name')+' '+approverModel.get('last_name'),
			locationString =  '';

			if(Object.keys(parentLocation).length > 0){
				locationString += parentLocation['name']+', ';
			}

			locationString += location['name'];

			emailBody += `<h3 style="text-transform:capitalize;">Hi ${approverName},</h3> <br/>
			<h4> ${userName} requested to be a warden in location '${locationString}' </h4> <br/>
			<h5>Click on the link below for corresponding response </h5> <br/>
			<a href="${approvelink}" target="_blank" style="text-decoration:none; color:#0277bd;">Approve</a> |
			<a href="${declinelink}" target="_blank" style="text-decoration:none; color:#f44336;">Decline</a>
			<br>`;
			emailBody += email.getEmailHTMLFooter();

			email.assignOptions({
				body : emailBody
			});

			email.send(
				(data) => console.log(data),
				(err) => console.log(err)
			);

		}catch(e){
			response.status = false;
			response.message = e;
		}

		res.send(response);
	}

	public async getWardenRequest(req: Request, res: Response, next: NextFunction){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		arrWhere = [];

		arrWhere.push('user_id = '+req.body.user_id);
		response.data = await requestModel.getWhere(arrWhere);

		res.send(response);
	}

	public async userRequestHandler(req: Request, res: Response, tokenData, fromEmail:boolean){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		requestModel = new UserRequest(),
		tokenModel = new Token(),
		arrWhere = [],
		action = 'approved',
		status = 1,
		currentDate = moment().format('YYYY-MM-DD HH:mm:ss');

		if(tokenData['verified'] == 0){

			if(tokenData['action'].indexOf('decline') > -1){
				action = 'declined';
				status = 2;
			}

			arrWhere.push('user_requests_id = '+tokenData['id']);
			let requests = await requestModel.getWhere(arrWhere);
			if(Object.keys(requests).length > 0){
				let allToken = await tokenModel.getAllByUserId(tokenData['id'], undefined, 'user_requests_id');
				for(let i in allToken){
					let tokenModify = new Token(allToken[i]['token_id']);
					await tokenModify.load();
					tokenModify.set('verified', 1);
					await tokenModify.dbUpdate();
				}

				let request = requests[0],
					requestModify = new UserRequest(request['user_requests_id']);
				await requestModify.load();
				requestModify.set('status', status);
				requestModify.set('date_responded', currentDate);
				requestModify.set('viewed', 1);

				let locationId = parseInt(request['location_id']),
					userId = request['user_id'],
					approverId = request['approver_id'],
					roleId = parseInt(request['requested_role_id']);

				let locationModel = new Location(locationId),
					userModel = new User(userId),
					approverModel = new User(approverId),
					parentLocationModel = new Location(),
					parentLoc = <any>{};

				const location = await locationModel.load(),
					user = await userModel.load(),
					approver = await approverModel.load();

				if(location['parent_id'] > -1){
					parentLocationModel.setID(location['parent_id']);
					parentLoc = await parentLocationModel.load();
				}

				let validRole = false,
					isWarden = false,
					isTRPFRP = false,
					roleName = '';

				if(roleId <= 2){
					// await requestModify.dbUpdate();
					//validRole = true;
					//isTRPFRP = true;
					// if (roleId == 1){
					//		roleName = 'FRP'
					// }else{
					// 		roleName = 'TRP';
					// }
				}else if(roleId >= 9 && roleId <= 18){
					validRole = true;
					isWarden = true;
					let emRoleModel = new UserEmRoleRelation();
					let emroles = await emRoleModel.getEmRoles();
					for(let i in emroles){
						if(emroles[i]['em_roles_id'] == roleId){
							roleName = emroles[i]['role_name'];
						}
					}
				}

				if(validRole){
					await requestModify.dbUpdate();

					if(status == 1){
						let locAccUser = new LocationAccountUser(),
							emRoleModel = new UserEmRoleRelation(),
							userRoleModel = new UserRoleRelation();

						await locAccUser.create({
							'location_id' : locationId,
							'account_id' : user['account_id'],
							'user_id' : user['user_id'],
							'role_id' : roleId
						});

						if(isWarden){
							await emRoleModel.create({
								'user_id' : user['user_id'],
								'em_role_id' : roleId,
								'location_id' : locationId
							});
						}
					}

					const
					opts = {
						from : '',
						fromName : 'EvacConnect',
						to : [ userModel.get('email') ],
						cc: [],
						body : '',
						attachments: [],
						subject : 'EvacConnect '+roleName+' Request '
					},
					email = new EmailSender(opts);

					let
					emailBody = email.getEmailHTMLHeader(),
					userName = userModel.get('first_name')+' '+userModel.get('last_name'),
					approverName = approverModel.get('first_name')+' '+approverModel.get('last_name'),
					locationString =  '';

					if(Object.keys(parentLoc).length > 0){
						locationString += parentLoc['name']+', ';
					}

					locationString += location['name'];

					emailBody += `<h3 style="text-transform:capitalize;">Hi ${userName},</h3> <br/>
					<h4> ${approverName} has ${action} your ${roleName} request in location '${locationString}' </h4> <br/>
					<br>`;
					emailBody += email.getEmailHTMLFooter();

					email.assignOptions({
						body : emailBody
					});

					email.send(
						(data) => console.log(data),
						(err) => console.log(err)
					);

					response.message = 'Success!';

				}else{
					response.message = 'Role is invalid';
				}


			}else{
				response.message = 'No record found';
			}

		}else{
			response.message = 'Sorry, this has already been used';
		}

		if(fromEmail){
			res.send('<h2>'+response.message+'</h2> <script>  setTimeout(function(){ window.close(); }, 2000); </script>');
		}

		res.send(response);
	}

	public async resignAsChiefWarden(req: Request, res: Response, next: NextFunction){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		userId = req.body.user_id,
		emRoleRelationModel = new UserEmRoleRelation(),
		usersEmRoles = await emRoleRelationModel.getEmRolesByUserId(userId);
		response.data = usersEmRoles;

		let hasGenOcc = false,
			deletedEmRole = {};
		for(let i in usersEmRoles){
			if(usersEmRoles[i]['em_roles_id'] == 11){
				deletedEmRole = JSON.parse(JSON.stringify(usersEmRoles[i]));
				let deleteEmRoleModel = new UserEmRoleRelation(  usersEmRoles[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
			}

			if(usersEmRoles[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasGenOcc){
			let createEmRoleGenOccModel = new UserEmRoleRelation();
			await createEmRoleGenOccModel.create({
				'user_id' : userId,
				'em_role_id' : 8,
				'location_id' : deletedEmRole['location_id']
			});
		}

		res.send(response);
	}

	public async resignAsWarden(req: Request, res: Response, next: NextFunction){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		userId = req.body.user_id,
		locationId = req.body.location_id,
		emRoleRelationModel = new UserEmRoleRelation(),
		usersEmRoles = await emRoleRelationModel.getEmRolesByUserId(userId);
		response.data = usersEmRoles;

		let hasGenOcc = false,
			deletedEmRole = {};
		for(let i in usersEmRoles){
			if( usersEmRoles[i]['is_warden_role'] == 1 && usersEmRoles[i]['location_id'] == locationId){
				deletedEmRole = usersEmRoles[i];
				let deleteEmRoleModel = new UserEmRoleRelation(  usersEmRoles[i]['user_em_roles_relation_id'] );
				await deleteEmRoleModel.delete();
			}

			if(usersEmRoles[i]['em_roles_id'] == 8){
				hasGenOcc = true;
			}
		}

		if(!hasGenOcc){
			let createEmRoleGenOccModel = new UserEmRoleRelation();
			await createEmRoleGenOccModel.create({
				'user_id' : userId,
				'em_role_id' : 8,
				'location_id' : deletedEmRole['location_id']
			});
		}

		res.send(response);
	}

	public async saveMobilityImpairedDetails(req: AuthRequest, res: Response, next: NextFunction){
		let
		response = <any>{
			status : true, data : [], message : ''
		},
		mobilityImpairedModel = new MobilityImpairedModel();

		let saveData = {
			'is_permanent' : req.body.is_permanent,
			'assistant_type' : req.body.assistant_type,
			'equipment_type' : req.body.equipment_type,
			'duration_date' : '',
			'evacuation_procedure' : req.body.evacuation_procedure
		};

		if('mobility_impaired_details_id' in req.body){
			saveData['mobility_impaired_details_id'] = req.body.mobility_impaired_details_id;
		}

		if(saveData['is_permanent'] == 0){
			saveData['duration_date'] = req.body.duration_date;
		}

		if('user_id' in req.body){
			saveData['user_id'] = req.body.user_id;
			saveData['date_created'] = moment().format('YYYY-MM-DD HH:mm:00');
		}else if('user_invitations_id' in req.body){
			saveData['user_invitations_id'] = req.body.user_invitations_id;
			saveData['date_created'] = moment().format('YYYY-MM-DD HH:mm:00');
		}

		await mobilityImpairedModel.create(saveData);

		res.send(response);
	}


    //////
    // For Enhancement //
    // This is for listing Tenants(Accounts) in a location
    // Current : We only listing who have TRP in the account
    //////
	public async getLocationsTenants(req: AuthRequest, res: Response, next: NextFunction){
        const location_id = req.params.location_id;
        const locationAccountUserObj = new LocationAccountUser();
        // listing of roles is implemented here because we are only listing roles on a sub location
        const canLoginTenants = await locationAccountUserObj.listRolesOnLocation(defs['Tenant'], location_id);
        const canLoginTenantArr = [];

        Object.keys(canLoginTenants).forEach((key) => {
          canLoginTenantArr.push(canLoginTenants[key]);
        });

        for (let i = 0; i < canLoginTenantArr.length; i++) {
          // get all wardens for this location on this account
          const EMRole = new UserEmRoleRelation();
          const trainingCert = new TrainingCertification();
          const temp =
            await EMRole.getEMRolesOnAccountOnLocation(
              defs['em_roles']['WARDEN'],
              canLoginTenantArr[i]['account_id'],
              location_id
          );
          canLoginTenantArr[i]['total_wardens'] = temp['users'].length;
          canLoginTenantArr[i]['wardens'] = temp['raw'];

          // get trained wardens
          canLoginTenantArr[i]['trained_wardens'] = await
               trainingCert.getEMRUserCertifications(temp['users']);
        }
        console.log(canLoginTenantArr);

        return canLoginTenantArr;
	}

}
