import { AccountTrainingsModel } from './../models/account.trainings';
import { TrainingRequirements } from './../models/training.requirements';
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
import { NotificationUserSettingsModel } from '../models/notification.user.settings';
import { NotificationToken } from '../models/notification_token.model';

import * as moment from 'moment';
import * as validator from 'validator';
import * as path from 'path';
import * as fs from 'fs';
import * as multer from 'multer';
import * as jwt from 'jsonwebtoken';
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

        router.post('/users/change-password', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
            new  UsersRoute().changePassword(req, res);
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

        router.get('/users/emroles', async (req: Request, res: Response, next: NextFunction) => {
            let emRolesModel = new UserEmRoleRelation();
            let data = await emRolesModel.getEmRoles();
            res.send(data);
        });

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

        router.post('/users/mobility-as-healthy', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
            new  UsersRoute().markMobilityAsHealthy(req, res, next);
        });

        router.get('/users/get-profile-by-token/:token', (req: Request, res: Response) => {
            new  UsersRoute().getProfileByToken(req, res);
        });

        router.post('/users/set-profile', (req: Request, res: Response) => {
            new  UsersRoute().setProfile(req, res);
        });

        router.post('/users/location-role-assignment', new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
            new  UsersRoute().locationRoleAssignments(req, res, next);
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

      router.get('/users/get-all-locations/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = new User(req.user.user_id);
        const emrolerelationObj = new UserEmRoleRelation();

        const locations = await user.getAllMyEMLocations();
        const locIds = [];
        for (const loc of locations) {
          locIds.push(loc['location_id']);
        }
        const em_roles_in_location = await emrolerelationObj.getEmergencyRolesOfUsersInLocations([req.user.user_id], locIds);
        // attached emrgency roles to the locations
        for (const loc of locations) {
          if (loc['location_id'] in em_roles_in_location) {
            loc['em_roles'] = em_roles_in_location[loc['location_id']]['data'];
          } else {
            loc['em_roles'] = [];
          }
        }
        return res.status(200).send({
          'locations': locations
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

      router.get('/users/em/dashboard/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        // get assigned courses
        const course = new CourseUserRelation();
        const user = new User(req.user.user_id);
        const em_roles = new UserEmRoleRelation();
        const trainingCert = new TrainingCertification();
        const hadNotTakenCourse = [];
        let numOfRequiredTrainings = [];
        let trainings, assignedCourses, required_trainings,
        em_role, cert_req, req_trainings_count = 0, percentage_training;
        let numberOfRequiredTrainingsHeld, mobilityImpairedDetails, tempVar, locations;
        try {
          assignedCourses = await course.getAllCourseForUser(req.user.user_id);
        } catch (e) {
          assignedCourses = [];
        }

        // get roles and get required trainings for the SPECIFIED ROLE
        //
        try {
          tempVar  = await em_roles.getEmRolesFilterBy({
            'user_id': req.user.user_id,
            'distinct': 'em_role_id'
          });
          em_role = tempVar[0];
          locations = tempVar[1];
        } catch(e) {
          em_role = [];
          locations = [];
        }
        try {
          cert_req = await trainingCert.getRequiredTrainings();
          for (let i = 0; i < em_role.length; i++) {
            if (em_role[i] in cert_req) {
              req_trainings_count += cert_req[em_role[i]]['training_requirement_id'].length;
              numOfRequiredTrainings = numOfRequiredTrainings.concat(cert_req[em_role[i]]['training_requirement_id']);
            }
          }
          numberOfRequiredTrainingsHeld = await trainingCert.getNumberOfTrainings([req.user.user_id], {
            'pass': 1,
            'current': 1,
            'training_requirement': numOfRequiredTrainings
          });
          if (req.user.user_id in numberOfRequiredTrainingsHeld) {
            percentage_training = Math.round((req_trainings_count / numberOfRequiredTrainingsHeld[req.user.user_id]['count']) * 100).toFixed(0);
          } else {
            percentage_training = 0;
          }
        } catch (e) {
          cert_req = {};
        }
        // get valid taken trainings
        try {
          trainings = await user.getAllCertifications({
            'pass': 1,
            'current': 1,
            'training_requirement_id': numOfRequiredTrainings
          });
        } catch (e) {
          trainings = [];
        }
        // loop through assigned courses
        for ( const c of assignedCourses) {
          if (!(c['training_requirement_id'] in numOfRequiredTrainings)) {
            hadNotTakenCourse.push(c);
          }
        }

        let toTake = [];
        for(let co of hadNotTakenCourse){
          let taken = false;
          for( let tr of trainings ){
            if( tr['training_requirement_id'] == co['training_requirement_id'] && tr['status'] == 'valid' ){
              taken = true;
            }
          }
          if(!taken){
            toTake.push(co);
          }
        }
        

        //
        try {
          await user.load();
          if (user.get('mobility_impaired') === 1) {
            const peepDetails = new MobilityImpairedModel();
            mobilityImpairedDetails = await peepDetails.getMany([[`user_id = ${req.user.user_id}`]]);
          }
        } catch(e) {
          mobilityImpairedDetails = {};
        }
        return res.status(200).send({
          'em_roles': em_role,
          'locations': locations,
          'trainings': trainings,
          'courses': toTake,
          'toTake': toTake,
          'peepDetails': mobilityImpairedDetails,
          'required_trainings_count': req_trainings_count,
          'required_trainings_held': (req.user.user_id in numberOfRequiredTrainingsHeld) ? numberOfRequiredTrainingsHeld[req.user.user_id]['count'] : 0,
          'percentage_training': percentage_training
        });

      });

      router.post('/users/update-notification-settings', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new  UsersRoute().updateNotificationSettings(req, res);
      });

      router.get('/users/get-notification-token/:userid', async (req: AuthRequest, res: Response) => {
        res.send( await new NotificationToken().getByUserId(req.params.userid) );
      });

      router.post('/users/user-info/', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res: Response) => {
            new UsersRoute().getUserInfo(req, res);
        }
      );

      router.post('/users/update-trp-assigned-location', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res: Response ) => {
            new UsersRoute().updateLocationAccountUser(req, res);
        }
      );

      router.post('/users/training-info', new MiddlewareAuth().authenticate,
        (req: AuthRequest, res: Response) => {
            new UsersRoute().userTrainingInfo(req, res);
        }
      )

    }

    public userTrainingInfo(req: AuthRequest, res: Response) {
        const emergencyRoles = JSON.parse(req.body.roles);
        const user = req.body.user;
        let requiredTrainings = [];
        let requiredTrainingIds = [];
        let validTrainings = [];
        let invalidTrainings = [];
        let invalidTrainingIds = [];

        // get required trainings for the given role        
        new TrainingRequirements().allEmRolesTrainings()
            .then((trainingRequirements) => {
                for (let tr of trainingRequirements) {
                    if (emergencyRoles.indexOf(tr['em_role_id']) != -1) {
                        requiredTrainingIds.push(tr['training_requirement_id']);
                        requiredTrainings.push(tr);
                    }                     
                }
                // search certifications
                return new TrainingCertification().getCertificationsInUserIds(user);
            })
            .then((certificates) => {                
                console.log(requiredTrainingIds);
                for (let rtid of requiredTrainingIds) {                    
                    const i = certificates.findIndex(cert => cert['training_requirement_id'] == rtid);                    
                    const j = requiredTrainings.findIndex(rt => rt['training_requirement_id'] == rtid);                    
                    
                    if (i == -1) {
                        invalidTrainings.push({
                            'validity': 'non-compliant',                            
                            ...requiredTrainings[j]
                        });
                        invalidTrainingIds.push(rtid);
                    } else if (certificates[i]['validity'] == 'expired') {
                        invalidTrainings.push({
                            ...certificates[i],
                            ...requiredTrainings[j]
                        });
                        invalidTrainingIds.push(rtid);
                    } else {                        
                        validTrainings.push({
                            ...certificates[i],
                            ...requiredTrainings[j]
                        });
                    }

                }
                if (invalidTrainings.length == 0) {
                    return res.status(200).send({
                        message: 'Success',
                        required_trainings: requiredTrainings,
                        valid_trainings: validTrainings,
                        invalid_trainings: invalidTrainings
                    });
                }
               /*
               return new CourseUserRelation().getRelation({
                    user: user,
                    bulk_training_requirement: invalidTrainingIds
               });
               */
              
               
              return new CourseUserRelation().getAllCourseForUser(user);
                
                
            })            
            .then((rels:Array<object>) => {
                const invalidTrainingsWithCourse = [];
                for (let trainings of invalidTrainings) {
                    const i = rels.findIndex(r => r['training_requirement_id'] == trainings['training_requirement_id']);
                    if (i == -1) {
                        invalidTrainingsWithCourse.push({
                            course_user_relation_id: 0,
                            ...trainings
                        });
                    } else {
                        invalidTrainingsWithCourse.push({
                            ...rels[i],
                            ...trainings
                        });
                    }
                }
                return res.status(200).send({
                    message: 'Success',
                    required_trainings: requiredTrainings,
                    valid_trainings: validTrainings,
                    invalid_trainings: invalidTrainingsWithCourse
                });
            })            
            .catch((error_rel) => {
                console.log(error_rel);
                return res.status(400).send({
                    message: 'cannot get relationships'
                });
            })
            .catch((error_ct) => {
                console.log(error_ct);
                console.log('Error in getting certifications');
                return res.status(400).send({
                    message: 'cannot get certifications'
                });
            })
            .catch((error_tr) => {
                console.log('Error in getting training requirements');
                return res.status(400).send({
                    message: 'cannot get training requirements'
                });
            })

    }


    public updateLocationAccountUser(req: AuthRequest, res: Response) {
        const locationAcctUserId = req.body.location_account_user;
        const newLevelLocation = req.body.level_location;

        const locAcctUserObj = new LocationAccountUser(locationAcctUserId);
        locAcctUserObj.load().then((dbData) => {
            dbData['location_id'] = newLevelLocation;
            return locAcctUserObj.create(dbData);
        })
        .then(() => {
            return res.status(200).send({
                message: 'Update Successful'
            });
        })
        .catch((e) => {
            console.log('cannot update location account user data');
            return res.status(400).send({
                message: 'Unable to update location account user data'
            });
        })
        .catch((e) => {
            console.log('cannot load location account user data');
            return res.status(400).send({
                message: 'Unable to retrieve location account user data'
            });
        });

    }


    public getUserInfo(req: AuthRequest, res: Response) {
        const userId = req.body.user;
        const userObj = new User(userId);
        userObj.load().then((data) => {
            res.status(200).send({
                user_id: data['user_id'],
                first_name: data['first_name'],
                last_name: data['last_name'],
                email: data['email'],
                phone_number: data['phone_number'],
                mobile_number: data['mobile_number'],
                mobility_impaired: data['mobility_impaired'], 
                evac_role: data['evac_role']
            });
        }).catch((e) => {
            res.status(400).send({
                message: 'There was an error retrieving user info'
            });
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

    public async changePassword(req: Request , res: Response){
        let
        response = {
            status : false,
            data : {},
            message : ''
        },
        oldPassword = req.body.old_password,
        newPassword = req.body.new_password,
        confirmPassword = req.body.confirm_password,
        errorLength = 0;

        if( newPassword.length < 6 || confirmPassword.length < 6){
            errorLength++;
        }

        if(errorLength == 0){
            if(confirmPassword == newPassword){
                try{
                    let
                    userModel = new User(req.body.user_id),
                    userData = await userModel.load(),
                    hasPass = false;

                    if( md5('Ideation'+oldPassword+'Max') == userData['password']){
                        userModel.set('password', md5('Ideation'+newPassword+'Max'));
                        userModel.setID(req.body.user_id);

                        await userModel.dbUpdate();
                        response.data = userData;
                        response.status = true;
                    }else{
                        response.message = 'Invalid old password';
                    }
                }catch(e){
                    response.message = 'No user found';
                }
            }else{
                response.message = 'Password mismatch';
            }
        }else{
            response.message = 'All fields must be greater than 6 characters';
        }

        res.send(response);
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
			userData = await userModel.load(),
            hasPass = false;

			for(let i in userData){
				if(i in req.body){
					if(i == 'password'){
						req.body[i] = md5('Ideation'+req.body[i]+'Max');
                        hasPass = true;
					}
					userData[i] = req.body[i];
				}
			}

			userModel.setID(req.body.user_id);

			await userModel.dbUpdate();

            if(hasPass){
                let tokenModel = new Token();
                try{
                    await tokenModel.getAllByUserId(req.body.user_id, 'verify');
                }catch(e){
                    tokenModel.create({
                        'token' : this.generateRandomChars(30),
                        'action' : 'verify',
                        'verified' : 1,
                        'id' : req.body.user_id,
                        'id_type' : 'user_id'
                    });
                }
            }

            if(req.body.location_id && req.body.role_id){
                if(req.body.role_id > 2){

                    let 
                    locAccModel = new LocationAccountRelation(),
                    locAccData = await locAccModel.getByAccountIdAndLocationId(userData['account_id'], req.body.location_id);

                    if(locAccData.length == 0){
                        await locAccModel.create({
                            'account_id' : userData['account_id'],
                            'location_id' : req.body.location_id,
                            'responsibility' : 'Tenant'
                        });
                    }

                    let
                    userEmModel = new UserEmRoleRelation(),
                    emData = <any> await userEmModel.getEmRolesByUserId(req.body.user_id),
                    hasRecord = false;

                    if(emData.length > 0){
                        for(let em of emData){
                            if(em.location_id == req.body.location_id && em.em_roles_id == req.body.role_id){
                                hasRecord = true;
                            }
                        }
                    }

                    if(!hasRecord){
                        await userEmModel.create({
                            'user_id' : req.body.user_id,
                            'em_role_id' : req.body.role_id,
                            'location_id' : req.body.location_id
                        });
                    }

                }
            }

            if('training_reminder' in req.body){
                let notiTokenModel = new NotificationToken(),
                tokens = <any> await notiTokenModel.getByUserId(req.body.user_id);
                if(tokens.length > 0){
                    for(let tok of tokens){
                        let updateTokenModel = new NotificationToken(tok['notification_token_id']);
                        for(let i in tok){
                            updateTokenModel.set(i, tok[i]);
                        }
                        updateTokenModel.set('training_reminder', req.body.training_reminder);
                        await updateTokenModel.dbUpdate();
                    }
                }
            }

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
		fu.uploadFile(false, 'ProfilePic/').then(
			(data: object) => {
				
				let filesModel = new Files(),
					fileUserModel = new FileUser();

				filesModel.create({
					file_name : data['filename'],
					url : data['link'],
					directory : 'ProfilePic',
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
								response.data['url'] = data['link'];
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
        childForTenant = [],
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
            limit : <any> 10,
            order : 'users.first_name ASC',
            group : false
        },
        archived : 0,
        queryRoles = query.roles.split(','),
        userIds = [],
        userIdObj = [],
        noGeneralOcc = (queryRoles.indexOf('no_gen_occ') > -1) ? true : false,
        emRolesDef = defs.em_roles,
        getFRP = ( queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1 ) ? true : false,
        getTRP = ( queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1 ) ? true : false,
        emRoleIds = [8,9,10,11,12,13,14,15,16,18],
        emRoleIdSelected = [],
        getUSERS = ( queryRoles.indexOf('users') > -1 || queryRoles.indexOf() > -1 ) ? true : false,
        getPendings = (queryRoles.indexOf('pending') > -1) ? true : false,
        getUsersByEmRoleId = false,
        locationId = (query.location_id) ? (query.location_id > 0) ? query.location_id : false : false,
        locationsModel = new Location(),
        locModelHier = new Location(),
        selectedLocIds = <any> [],
        userRoleRel = new UserRoleRelation(),
        userRole = <any> '',
        roleOfAccountInLocationObj = {},
        locations = <any> [], 
        queryAccountRoles = false;



        const idsOfBuildingsForFRP = [];
        const idsOfLocationsForTRP = [];
        try {
            let role = await userRoleRel.getByUserId(userID);
            for(let r of role){
                if(userRole == ''){
                    if(userRole != 'frp' && r.role_id == 2){
                        userRole = 'trp'
                    }
                }
    
                if(r.role_id == 1){
                    userRole = 'frp';
                }
            }
        } catch(e) {
            console.log('At users route queryUsers endpoint ', e);
            userRole = 'trp';
        }
        
        roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(accountId);
        // console.log(roleOfAccountInLocationObj);  
        if(locationId) { 
            try {
                // determine if you are a building manager or tenant in these locations - response.locations                          
                if (locationId in roleOfAccountInLocationObj) {            
                    userRole = (roleOfAccountInLocationObj[locationId]['account_role']).toLowerCase();   
                } else {
                    userRole = 'trp';
                }
            } catch (e) {
                console.log('Getting the account role for a location error');
            }

            if (userRole == 'frp') {
                selectedLocIds.push(locationId);
                let locs = <any> await locModelHier.getDeepLocationsMinimizedDataByParentId(locationId);
                for(let loc of locs){ 
                    selectedLocIds.push(loc.location_id);
                }
            } else if (userRole == 'trp') {
                try {                
                    childForTenant = await new LocationAccountRelation().getTenantAccountRoleOfBlgSublocs(locationId, accountId);
                    
                } catch(e) {
                    // this is at the case of malls where in a tenant is assign to the building               
                    try {
                        childForTenant = await new LocationAccountRelation().getTenantAccountRoleAssignToBuilding(locationId, accountId);                         
                    } catch(sub_e) {
    
                    }
                }
                for (let c of childForTenant) {                    
                    selectedLocIds.push(c['location_id']);
                }
                 
            }


            
        } else {
            selectedLocIds = [];
            
            Object.keys(roleOfAccountInLocationObj).forEach((locId) => {                             
                if (roleOfAccountInLocationObj[locId]['role_id'] == 2 ) {
                    idsOfLocationsForTRP.push(parseInt(locId, 10));
                } else if (roleOfAccountInLocationObj[locId]['role_id'] == 1) {
                    idsOfBuildingsForFRP.push(parseInt(locId, 10));
                }
            });
            // console.log('idsOfLocationsForTRP ' + idsOfLocationsForTRP.join(', '));
            // console.log('idsOfBuildingsForFRP ' + idsOfBuildingsForFRP.join(', '));
            for (let loc of idsOfBuildingsForFRP) {
                
                let hier = <any> await locModelHier.getDeepLocationsMinimizedDataByParentId(loc);
                
                for(let h of hier){ 
                    selectedLocIds.push(h.location_id);
                }
            }
            // GET EM USERS FOR THIS LOCATIONS (FRP ACCOUNT)
            selectedLocIds = selectedLocIds.concat(idsOfLocationsForTRP);

            // THERE ARE EM THAT IS ASSIGNED TO THE BUILDING SO WE NEED TO INCLUDE THEM
            selectedLocIds = selectedLocIds.concat(idsOfBuildingsForFRP);
          
        }
        // console.log('SELECTED IDS ' +  selectedLocIds.join(',') + ' ***');
        locations = await locationsModel.getByInIds(selectedLocIds, false, true);
       
        for(let id of emRoleIds){
            if(queryRoles.indexOf(''+id) > -1){
                getUsersByEmRoleId = true;
                emRoleIdSelected.push(id);
            }
        }

        modelQueries.select['users'] = ['first_name', 'last_name', 'account_id', 'user_id', 'user_name', 'email', 'mobile_number', 'phone_number', 'mobility_impaired', 'last_login', 'archived', 'profile_completion'];
       
        if(query.archived){
            archived = query.archived;
        }
        

        modelQueries.where.push('users.archived = '+archived);
        if(userRole != 'frp'){
            // modelQueries.where.push('users.account_id = '+accountId);
        }
        if(getPendings){
            modelQueries.where.push('users.profile_completion = 0');
        }

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
        
        if(query.roles){

            let emRoleIdInQuery = '';
            if(getUsersByEmRoleId){
                emRoleIdInQuery = ' AND em_role_id IN ('+emRoleIdSelected.join(',')+') ';
            }

            let inLocIdQuery = '';
            if(selectedLocIds.length > 0){
                inLocIdQuery = 'AND location_id IN ('+selectedLocIds.join(',')+')';
            }

            if( (queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1) || ( queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1 ) ){
                queryAccountRoles = true;
                modelQueries.joins.push(`
                    LEFT JOIN file_user ON users.user_id = file_user.user_id
                    LEFT JOIN files ON files.file_id = file_user.file_id
                    INNER JOIN accounts ON users.account_id = accounts.account_id
                `);

                let roleIdsQ = ' WHERE role_id IN (1,2) ';
                if(getFRP && !getTRP){
                    roleIdsQ = ' WHERE role_id IN (1) '
                }
                if(!getFRP && getTRP){
                    roleIdsQ = ' WHERE role_id IN (2) '
                }
                modelQueries.where.push(' users.user_id IN (SELECT user_id FROM user_role_relation '+roleIdsQ+' ) ');
                if(query.search){
                    modelQueries.where.push(' users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ');
                }

                if(getPendings){
                    modelQueries.where.push(' users.profile_completion = 0 ');
                }
            } else {
                modelQueries.select['user_em_roles_relation'] = ['location_id'];
                modelQueries.select['locations'] = ['parent_id'];
                modelQueries.joins.push(`
                    INNER JOIN user_em_roles_relation ON users.user_id = user_em_roles_relation.user_id
                    INNER JOIN locations ON user_em_roles_relation.location_id = locations.location_id         
                    LEFT JOIN file_user ON users.user_id = file_user.user_id
                    LEFT JOIN files ON files.file_id = file_user.file_id
                    INNER JOIN accounts ON users.account_id = accounts.account_id
                `);
            }

            if( (queryRoles.indexOf('users') > -1 || getUsersByEmRoleId) && ( (queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1) || ( queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1 ) ) == true ){
                if(noGeneralOcc){
                    modelQueries.orWhere.push(' OR users.user_id IN (SELECT user_id FROM user_em_roles_relation WHERE location_id > -1 AND em_role_id > 8 '+emRoleIdInQuery+' '+inLocIdQuery+' ) ');
                }else{
                    modelQueries.orWhere.push(' OR users.user_id IN (SELECT user_id FROM user_em_roles_relation WHERE location_id > -1 '+emRoleIdInQuery+' '+inLocIdQuery+' ) ');
                }

                modelQueries.orWhere.push(' AND users.archived = '+archived);
                if(userRole != 'frp'){
                    modelQueries.orWhere.push(' AND users.account_id = '+accountId);
                }
                if(query.impaired){
                    if(query.impaired > -1){
                        if(query.impaired == 1){
                            modelQueries.orWhere.push(' AND users.mobility_impaired = 1');
                        }else if(query.impaired == 0){
                            modelQueries.orWhere.push(' AND users.mobility_impaired = 0');
                        }
                    }
                }
                if(query.search){
                    modelQueries.orWhere.push(' AND users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ');
                }
                if(getPendings){
                    modelQueries.orWhere.push(' AND users.profile_completion = 0');
                }
            } else if( queryRoles.indexOf('users') > -1 || getUsersByEmRoleId && ( (queryRoles.indexOf('frp') == -1 || queryRoles.indexOf('1') == -1) && ( queryRoles.indexOf('trp') == -1 || queryRoles.indexOf('2') == -1 ) ) == true){
                if(noGeneralOcc){
                    modelQueries.where.push(' users.user_id IN (SELECT user_id FROM user_em_roles_relation WHERE location_id > -1 AND em_role_id > 8 '+emRoleIdInQuery+' '+inLocIdQuery+' ) ');
                }else{
                    modelQueries.where.push(' users.user_id IN (SELECT user_id FROM user_em_roles_relation WHERE location_id > -1 '+emRoleIdInQuery+' '+inLocIdQuery+' ) ');
                }
                if(query.search){
                    modelQueries.where.push(' users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ');
                }

                if(getPendings){
                    modelQueries.where.push('users.profile_completion = 0');
                }
            }

            if( queryRoles.indexOf('no_roles') > -1 ){
                let isImpairedQuery = '';
                if(query.impaired){
                    if(query.impaired > -1){
                        if(query.impaired == 1){
                            isImpairedQuery = ' AND users.mobility_impaired = 1 ';
                        }else if(query.impaired == 0){
                            isImpairedQuery = ' AND users.mobility_impaired = 0 ';
                        }
                    }
                }

                let noEmrole = ' OR users.user_id NOT IN (SELECT user_id FROM user_em_roles_relation) AND users.archived = '+archived+' AND users.account_id = '+accountId;
                if(query.search){
                    noEmrole += ' AND users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ';
                }
                noEmrole += isImpairedQuery;
                if(getPendings){
                    noEmrole += ' AND users.profile_completion = 0 ';
                }

                let noRole = ' OR users.user_id NOT IN (SELECT user_id FROM user_role_relation) AND users.archived = '+archived+' AND users.account_id = '+accountId;
                if(query.search){
                    noRole += ' AND users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ';
                }
                noRole += isImpairedQuery;
                if(getPendings){
                    noRole += ' AND users.profile_completion = 0 ';
                }

                modelQueries.orWhere.push(noEmrole);
                modelQueries.orWhere.push(noRole);
            }

        } else{
            if(query.search){
                modelQueries.where.push(' users.user_id IN (SELECT user_id FROM users WHERE CONCAT(users.first_name, " ", users.last_name) LIKE "%'+query.search+'%" OR users.email LIKE "%'+query.search+'%" ) ');
            }
        }

        modelQueries.select['custom'] = [" IF(files.url IS NULL, '', files.url) as profile_pic, accounts.account_name "];

        if(query.limit){
            modelQueries.limit = query.limit;
        }

        if(query.offset){
            modelQueries.limit = query.offset+','+modelQueries.limit;
        }

        if(selectedLocIds.length > 0){
            if( (queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1) || ( queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1 ) ){
                modelQueries.where.push(`users.user_id IN (SELECT user_id FROM location_account_user WHERE location_id IN (`+selectedLocIds.join(',')+`) ) `);
            }
        }
        response.data['users'] = [];
        
        if (!locationId && !queryAccountRoles) {
            // console.log('Here at locationId ' + locationId + ' and queryAccountRoles = ' +  queryAccountRoles, modelQueries);
            let tempUsers = [];
            tempUsers = await userModel.query(modelQueries);                        
            for (let u of tempUsers) {
                let parentId = parseInt(u['parent_id'], 10);
                let subId = parseInt(u['location_id'], 10);
                
                if (idsOfBuildingsForFRP.indexOf(parentId) != -1) {
                    response.data['users'].push(u);
                } else if (idsOfBuildingsForFRP.indexOf(u['location_id']) != -1 && parentId == -1) {
                    response.data['users'].push(u);
                }
                if (idsOfLocationsForTRP.indexOf(subId) != -1 && u['account_id'] == accountId) {                    
                    response.data['users'].push(u);
                }

            }           

        } else {
             response.data['users'] = await userModel.query(modelQueries);
        }         

        // response.data['users'] = await userModel.query(modelQueries);
        

        const training_requirements = await new TrainingCertification().getRequiredTrainings(); 
        for(let user of response.data['users']){
            userIds.push(user.user_id);
            
            
            let lastLoginMoment = moment(user.last_login);
            if(lastLoginMoment.isValid()){
                user.last_login = lastLoginMoment.format('DD/MM/YYYY hh:mma');
            }else{
                user.last_login = '';
            }
            
           user.profilePic = '';
           user.profile_pic = '';
           user.last_login = '';

            user['mobility_impaired_details'] = [];

            if(query.impaired){
                if(query.impaired > -1){
                    if( user['mobility_impaired'] == 1 ){
                        let mobilityModel = new MobilityImpairedModel(),
                        arrWhere = [];

                        arrWhere.push( ["user_id = " + user.user_id] );
                        arrWhere.push( "duration_date > NOW()" );
                        try {
                            let mobilityDetails = await mobilityModel.getMany( arrWhere );
                            user['mobility_impaired_details'] = mobilityDetails;
                            for(let userMobil of user.mobility_impaired_details){
                                userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
                            }

                        } catch (e) {
                            console.log(e);
                            user['mobility_impaired_details'] = [];
                        }
                    }
                }
            }
        }

        if(query.roles && query.users_locations && userIds.length > 0){
            let frptrpIds = [];
            if(getFRP){ frptrpIds.push(1); }
            if(getTRP){ frptrpIds.push(2); }

            let accountModel = new Account(),
                locAccUserModel = new LocationAccountUser(),
                emRolesModel = new UserEmRoleRelation(),
                frpTrp = <any> await locAccUserModel.getByUserIds(userIds.join(',')),
                ems = <any> await emRolesModel.getManyByUserIds(userIds.join(',')),
                frpTrpRel = <any> await new UserRoleRelation().getManyByUserIds(userIds.join(',')),
                frpTrpEms = frpTrp.concat(ems);

            for(let user of response.data['users']){
                if('locations' in user == false){ user['locations'] = []; }
                if('locs' in user == false){ user['locs'] = []; }
                if('frpTrpEms' in user == false){ user['frpTrpEms'] = []; }

                 for(let ft of frpTrpEms){
                    if(ft.user_id == user.user_id){

                        if( ((queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1) || ( queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1 )) && ft['location_account_user_id'] ){
                            user['frpTrpEms'].push(ft);
                        }

                        if( (queryRoles.indexOf('users') > -1 || getUsersByEmRoleId) && ft['user_em_roles_relation_id'] ){
                            if(queryRoles.indexOf('users') > -1){
                                user['frpTrpEms'].push(ft);
                            }else if(getUsersByEmRoleId){
                                if( emRoleIdSelected.indexOf(ft['em_role_id']) > -1 ){
                                    user['frpTrpEms'].push(ft);
                                }
                            }
                        }
                    }
                }
                
                for(let ft of user['frpTrpEms']){
                    let locFound = false;
                    for(let loc of locations){
                        if(ft.location_id == loc.location_id){
                            let 
                            hasFrpTrp = false,
                            frpTrpRoleId = 0;
                            for(let ftrole of frpTrpRel){
                                if(ftrole.user_id == ft.user_id){
                                    hasFrpTrp = true;
                                }
                            }

                            if(hasFrpTrp){
                                for(let ftrole of frpTrpRel){
                                    if(ftrole.user_id == ft.user_id && frpTrpRoleId != 2 && ftrole.role_id == 1){
                                        frpTrpRoleId = 1;
                                    }else if(ftrole.user_id == ft.user_id){
                                        frpTrpRoleId = ftrole.role_id;
                                    }
                                }
                            }

                            let userLocData = {
                                user_id : user.user_id,
                                location_id : loc.location_id,
                                name : loc.name,
                                parent_id : -1,
                                parent_name : '',
                                sublocations_count : 0,
                                role_id : (frpTrpRoleId) ? frpTrpRoleId : (ft['em_role_id']) ? ft['em_role_id'] : 0
                            };

                            if(ft.parent_id > -1){
                                for(let par of locations){
                                    if(par.location_id == ft.parent_id){
                                        userLocData.parent_name = par.name;
                                    }
                                }
                            }

                            let exst = false;
                            for(let ul of user['locations']){
                                if( ul.location_id == loc.location_id ){
                                    exst = true;
                                }
                            }

                            let locSubModel = new Location();
                            userLocData.sublocations_count =  <any> await locSubModel.countSubLocations(loc.location_id)

                            if(!exst){ 
                                user['locations'].push(userLocData); 
                            }

                            user['locs'].push(loc);
                            locFound = true;
                        }
                    }
                    ft['locFound'] = locFound;
                }
            }

            let userRoleModel = new UserRoleRelation(),
                usersRolesRelation = <any> await userRoleModel.getManyByUserIds(userIds.join(','), (frptrpIds.length > 0) ? frptrpIds.join(',') : false ),
                userEmRoleModel = new UserEmRoleRelation(),
                usersEmRoles = (noGeneralOcc && !getUsersByEmRoleId) ? <any> await userEmRoleModel.getManyByUserIds(userIds.join(','), '8') : (!getUsersByEmRoleId) ? <any> await userEmRoleModel.getManyByUserIds(userIds.join(',')) : [];

            if(getUsersByEmRoleId){
                usersEmRoles = <any> await userEmRoleModel.getManyByUserIds(userIds.join(','), false, emRoleIdSelected.join(','));
            }

            // response['usersEmRoles'] = usersEmRoles;

            for(let user of response.data['users']){
                if('roles' in user == false){ user['roles'] = []; }
                if('account_roles' in user == false){ user['account_roles'] = []; }
                if('em_roles' in user == false){ user['em_roles'] = []; }
                if('trids' in user == false){ user['trids'] = []; }
                if('locations' in user == false){ user['locations'] = []; }

                let usersRolesIds = [];

                for(let rol of usersRolesRelation){
                    let role = { role_name : '', role_id : 0 };
                    if(rol.user_id == user.user_id && ( (queryRoles.indexOf('frp') > -1 || queryRoles.indexOf('1') > -1) || (queryRoles.indexOf('trp') > -1 || queryRoles.indexOf('2') > -1) ) 
                        && usersRolesIds.indexOf(rol.role_id) == -1 ){
                        role.role_name = (rol.role_id == 1) ? 'FRP' : 'TRP';
                        role.role_id = (rol.role_id == 1) ? 1 : 2;
                        user['roles'].push(role);
                        usersRolesIds.push(rol.role_id);
                        user['account_roles'].push(role);
                    }
                }

                for(let em of usersEmRoles){
                    let role = { role_name : '', role_id : 0 , trids: []};

                    if((queryRoles.indexOf('users') > -1 || getUsersByEmRoleId)  && em.user_id == user.user_id && usersRolesIds.indexOf(em.em_role_id) == -1){
                        role.role_name = em.role_name;
                        role.role_id = em.em_role_id;
                        user['roles'].push(role);
                        usersRolesIds.push(em.em_role_id);
                        if (em.em_role_id in training_requirements) {
                          role.trids = role.trids.concat(training_requirements[em.em_role_id]['training_requirement_id']);
                          user['trids'] = user['trids'].concat(training_requirements[em.em_role_id]['training_requirement_id']);
                        }
                        user['em_roles'].push(role);
                    }
                }

            }
        }
        // console.log(response.data['users']);
        if(query.user_training){

            let user_course_total,
                user_training_total,
                training = new TrainingCertification(),
                userCourseRel = new CourseUserRelation();
           
          for(let user of response.data['users']) {
              try {
              user_training_total = await training.getNumberOfTrainings([user.user_id], {
                'pass': 1,
                'current': 1,
                'training_requirement': user['trids']
              });
              user['trainings'] = user_training_total[user.user_id]['count'];

            } catch(e) {
              user_training_total = {};
              user['trainings'] = 0;
            }
            try {
              user_course_total = await userCourseRel.getNumberOfAssignedCourses([user.user_id]);              
              if (user_course_total[user.user_id]) {
                user['assigned_courses'] = user_course_total[user.user_id]['count'];
                user['assigned_courses_tr'] = user_course_total[user.user_id]['trids'];
                user['misc_trainings'] = user['trids'].filter(x => !user['assigned_courses_tr'].includes(x))
                .concat(user['assigned_courses_tr'].filter(x => !user['trids'].includes(x)));
              } else {
                user['assigned_courses'] = 0;
                user['assigned_courses_tr'] = [];
                user['misc_trainings'] = [];                
              }             
            } catch (e) {
                console.log('users route get queryUsers endpoint getNumberOfAssignedCourses', e);
                user_course_total = {};
                user['assigned_courses'] = 0;
                user['assigned_courses_tr'] = [];
                user['misc_trainings'] = [];
            }
          }
          
        }

        if(query.impaired && queryRoles.indexOf('users') > -1){
            if(query.impaired > -1){

                let userInviModel = new UserInvitation(),
                whereInvi = [];

                whereInvi.push([ 'account_id = '+accountId ]);
                whereInvi.push([ 'mobility_impaired = 1' ]);
                whereInvi.push([ 'was_used = 0' ]);

                if(!archived){
                    whereInvi.push([ 'archived = 0' ]);
                }else{
                    whereInvi.push([ 'archived = '+archived ]);
                }

                try{
                    let usersInvited = <any> await userInviModel.getWhere(whereInvi);
                    for(let user of usersInvited){
                        user['locations'] = [];
                        user['profile_pic'] = '';
                        user['mobility_impaired_details'] = [];

                        let arrWhere = [];
                        arrWhere.push( "user_invitations_id = "+user["user_invitations_id"] );

                        user['mobility_impaired_details'] = await new MobilityImpairedModel().getMany(arrWhere);
                        for(let userMobil of user.mobility_impaired_details){
                            userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
                        }

                        user.locations.push({
                            location_id : user.location_id,
                            name : user.location_name,
                            parent_name : (user.parent_name == null) ? '' : user.parent_name
                        });

                        response.data['users'].push(user);
                    }
                }catch(e){}
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

            if(pagination.pages == 0 && pagination.total <= limit && pagination.total > 0){
                pagination.pages = 1;
            }

            response.data['pagination'] = pagination;
        }

        res.status(200).send(response);
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

	public async getUserLocationsTrainingsEcoRoles(req: Request, res: Response, next: NextFunction, toReturn?, userIdParam?){
        const user_em_roles = [];
        let training_requirement_ids = [];
        let training_requirement_ids_obj;
        let required_missing_trainings;
		let response = {
			status : false,
			data : {
				user : {
                    profilePic : '',
                    badge_class : '',
                    last_login : '',
                    first_name : '',
                    last_name : ''
                },
                locations : {},
                valid_trainings: [],
				trainings : <any>[],
				certificates : <any>[],
                eco_roles : <any>[],
                required_trainings: []
			},
			message : ''
		},
		userId = (userIdParam) ? userIdParam : req.params['user_id'],
		userModel = new User(userId),
		locationAccountUserModel = new LocationAccountUser(),
		fileModel = new Files(),
		user = {},
		emRolesModel = new UserEmRoleRelation(),
		emRoles = await emRolesModel.getEmRoles(),
		mobilityModel = new MobilityImpairedModel(),
        userRoleModel = new UserRoleRelation(),
        locAccUserModel = new LocationAccountUser();

		response.data.eco_roles = emRoles;
        const training_requirements = await new TrainingCertification().getRequiredTrainings();
        // console.log(training_requirements);
        try {

            let user = await userModel.load(),
            locations = <any>[];

            if( Object.keys(user).length > 0 ) {
                user['mobility_impaired_details'] = [];
                // user['last_login'] = (user['last_login'] == null) ? '' : user['last_login'];
                user['last_login'] = '';
                user['password'] = null;

                locations = await userModel.getAllMyEMLocations();


                // we need to get the roles regardless of what the location is because
                // what is important here is the corresponding training to the role attached to the user
                for (const em_on_loc of locations) {
                  if (user_em_roles.indexOf(em_on_loc['em_role_id']) == -1) {
                    user_em_roles.push(em_on_loc['em_role_id']);
                    if (em_on_loc['em_role_id'] in training_requirements) {
                      for (let i = 0; i < training_requirements[em_on_loc['em_role_id']]['training_requirement_id'].length; i++) {
                        if (training_requirement_ids.indexOf(training_requirements[em_on_loc['em_role_id']]['training_requirement_id'][i]) == -1) {
                          training_requirement_ids.push(training_requirements[em_on_loc['em_role_id']]['training_requirement_id'][i]);
                        }
                      }
                    }
                  }
                }

                // you will need to find the corresponding training in the certifications table
                required_missing_trainings  = await new TrainingCertification().getTrainings(userId, training_requirement_ids);

                const tr = new TrainingRequirements();
                try {
                  response.data.required_trainings = await tr.requirements_details(required_missing_trainings, user_em_roles);
                } catch (e) {
                    console.log('users route requirements_details() ', e);
                }

                for (const t of response.data.required_trainings) {
                  try {
                    const course_user_rel = new CourseUserRelation();
                    const temp = await course_user_rel.getRelationDetails({'user': userId, 'training_requirement': t['training_requirement_id']});
                    t['course_user_relation_id'] = temp['course_user_relation_id'];
                    t['course_launcher'] = temp['course_launcher'];
                    t['disabled'] = temp['disabled'];
                  } catch (e) {
                    t['course_user_relation_id'] = 0;
                    t['course_launcher'] = '';
                    t['disable'] = 1;
                  }
                }
                if( user['mobility_impaired'] == 1 ){
                    let mobilityModel = new MobilityImpairedModel(),
                    arrWhere = [];

                    arrWhere.push( ["user_id = " + userId] );
                    arrWhere.push( " (duration_date > NOW() OR duration_date IS NULL) " );

                    try {
                        let mobilityDetails = <any> await mobilityModel.getMany( arrWhere );

                        for(let mob of mobilityDetails){
                            mob['date_created_formatted'] = moment(mob['date_created']).format('MMM. DD, YYYY');
                            mob['duration_date_formatted'] = (moment(mob['duration_date']).isValid()) ? moment(mob['duration_date']).format('MMM. DD, YYYY') : '';
                        }

                        user['mobility_impaired_details'] = mobilityDetails;
                    } catch (e) {
                        console.log('users route mobility impaired getMany()', e);
                        user['mobility_impaired_details'] = [];
                    }
                }
                /*
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
                */

                try {
                    const fileData = await fileModel.getByUserIdAndType(userId, 'profile');
                    fileData[0].url = await new Utils().getAWSSignedURL(`${fileData[0].directory}/${fileData[0].file_name}`);
                    user['profilePic'] = fileData[0].url;
                } catch(e) {
                    user['profilePic'] = '';
                }


                try {

                    for (const loc of locations) {
                        if ('em_role_id' in loc) {
                            loc['training_requirement_name'] = training_requirements[loc['em_role_id']]['training_requirement_name'];
                            loc['training_requirement_id'] = training_requirements[loc['em_role_id']]['training_requirement_id'];
                        }
                    }

                }catch(er){}


                let isFRP = false,
                    isTRP = false;
                try{
                    let frptrpRoles = <any> await userRoleModel.getByUserId(user['user_id']);
                    for(let ftrole of frptrpRoles){
                        if(ftrole.role_id == 1){
                            isFRP = true;
                        }
                        if(ftrole.role_id == 2){
                            isTRP = true;
                        }
                    }
                }catch(e){}

                try{
                    let frptrpLocations = <any> await locAccUserModel.getLocationsByUserIds([user['user_id']]);
                    for(let frptrp of frptrpLocations){
                        frptrp['em_role_id'] = 0;
                        frptrp['role_name'] = '';
                        if(isFRP && frptrp.is_building){
                            frptrp['role_id'] = 1;
                            frptrp['role_name'] = 'Building Manager';
                        }else if(isTRP){
                            frptrp['role_id'] = 2;
                            frptrp['role_name'] = 'Tenancy Responsible Personnel';
                        }
                        locations.push(frptrp);
                    }
                }catch(e){}
            }

            let filteredLocs = [];

            for(let loc of locations){
                if(loc['role_id']){
                    filteredLocs.push(loc);
                }
            }

            response.data.locations = filteredLocs;



			response.data.user = <any> user;
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

        try{
            let certificates = await userModel.getAllCertifications({'pass': 1, 'em_roles': user_em_roles});
            for (let c of certificates) {
              c['token'] = md5(userModel.ID().toString() + userModel.get('first_name') + userModel.get('last_name') + c['certification_date']);
            }
            response.data.certificates = certificates;
            certificates = null;
            certificates = await userModel.getAllCertifications({
              'pass': 1,
              'training_requirement_id': training_requirement_ids,
              'current': 1,
              'em_roles': user_em_roles
            });
            response.data.valid_trainings = certificates;

        } catch(e){
            console.log(e, 'UsersRoute.getUserLocationsTrainingsEcoRoles');
        }

        res.statusCode = 200;
        if(toReturn){
            return response;
        }else{
            res.send(response);
        }
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

    public async setProfile(req: Request, res: Response){
        let token = req.body.token,
            password = req.body.password,
            tokenModel = new Token(),
            response = {
                status : false,
                message : '',
                token : '',
                data : {
                    userId : 0,
                    name : '',
                    email : '',
                    accountId : 0,
                    roles : [],
                    profilePic : ''
                }
            };

        try{
           let tokenData = <any> await tokenModel.getByToken(token),
               today = moment(),
               expirationDate = moment(tokenData.expiration_date);
            if(tokenData.action == 'setup-password') {

                let userId = tokenData.id,
                    userModel = new User(userId);

                try{
                    let user = <any> await userModel.load(),
                        useRoleModel = new UserRoleRelation(),
                        emRoleModel = new UserEmRoleRelation(),
                        roleData = {
                            role_id : 0, role_name : '', location_id : 0
                        },
                        encPass = md5('Ideation' +password + 'Max');

                    userModel.set('profile_completion', 1);
                    userModel.set('can_login', 1);
                    userModel.set('password', encPass);
                    userModel.set('last_login', today.format('YYYY-MM-DD HH-mm-ss'));

                    await userModel.dbUpdate();

                    tokenModel.set('action', 'verify');
                    tokenModel.set('expiration_date', today.format('YYYY-MM-DD HH-mm-ss'));
                    tokenModel.set('verified', 1);

                    await tokenModel.dbUpdate();

                    const token = jwt.sign(
                        {
                            user_db_token: user.token,
                            user: user.user_id
                        },
                        process.env.KEY, { expiresIn: 7200 }
                    );

                    response.data.userId = user.user_id;
                    response.data.name = user.first_name+' '+user.last_name;
                    response.data.email = user.email;
                    response.data.accountId = user.account_id;

                    response['token'] = token;

                    try{
                        let trpfrp = <any> await useRoleModel.getByUserId(userId);

                        roleData.role_id = trpfrp[0]['role_id'];
                        roleData.role_name = (trpfrp[0]['role_id'] == 1)? 'Building Manager' : 'Tenant';

                    }catch(e){ }

                    try{
                        let emroles = <any> await emRoleModel.getEmRolesByUserId(userId);
                        roleData.role_id = emroles[0]['role_id'];
                        roleData.role_name = emroles[0]['role_name'];
                        roleData['is_warden_role'] = emroles[0]['is_warden_role'];
                    }catch(e){ }

                    response.data.roles.push(roleData);

                    response.status = true;

                }catch(e){
                    console.log(e);
                    response.message = 'User not found';
                }

            }else{
                response.message = 'Invalid Token';
            }

        }catch(e){
            response.message = 'Invalid Token';
        }


        res.status(200).send(response);
    }

    public async getProfileByToken(req: Request, res: Response){
        let token = req.params.token,
            tokenModel = new Token(),
            response = { status : false, message : '', data : <any>{ user : {}, account : {}, location : {}, role : {} } };

        try{
           let tokenData = <any> await tokenModel.getByToken(token),
               today = moment(),
               expirationDate = moment(tokenData.expiration_date);

            if(tokenData.action == 'setup-password'){
                response.data = tokenData;

                let userId = tokenData.id,
                    userModel = new User(userId);

                try{
                    let user = <any> await userModel.load(),
                        useRoleModel = new UserRoleRelation(),
                        emRoleModel = new UserEmRoleRelation(),
                        roleData = {
                            role_id : 0, role_name : '', location_id : 0
                        };

                    response.data['user'] = user;

                    try{
                        let trpfrp = <any> await useRoleModel.getByUserId(userId),
                            locAccntUserModel = new LocationAccountUser(),
                            locations = <any> await locAccntUserModel.getByUserId(userId);

                        if( locations.length > 0 ){
                            roleData.role_id = trpfrp[0]['role_id'];
                            roleData.role_name = (trpfrp[0]['role_id'] == 1)? 'Building Manager' : 'Tenant';
                            roleData.location_id = locations[0]['location_id'];
                        }

                    }catch(e){
                        console.log(e);
                    }

                    try{
                        let emroles = <any> await emRoleModel.getEmRolesByUserId(userId);
                        roleData.role_id = emroles[0]['em_roles_id'];
                        roleData.role_name = emroles[0]['role_name'];
                        roleData.location_id = emroles[0]['location_id'];
                    }catch(e){
                        console.log(e);
                    }

                    let accountModel = new Account(user.account_id);
                    try{
                        let account = await accountModel.load();
                        response.data['account'] = account;
                    }catch(e){
                        response.message = 'Account not found';
                    }

                    if( roleData.role_id > 0 && roleData.location_id > 0 ){
                        response.data['role'] = roleData;

                        let locationModel = new Location(roleData.location_id);

                        try{
                            let location = <any> await locationModel.load();

                            location['parent_name'] = '';

                            try{
                                let parentLocModel = new Location(location.parent_id);
                                await parentLocModel.load();
                                location['parent_name'] = parentLocModel.get('name');
                            }catch(e){}

                            response.status = true;
                            response.data['location'] = location;

                        }catch(e){
                            response.message = 'Location not found';
                        }


                    }else{
                        response.message = 'Role not found';
                    }


                }catch(e){
                    response.message = 'User not found';
                }

            }else{
                response.message = 'Invalid Token';
            }

        }catch(e){
            response.message = 'Invalid Token';
        }


        res.status(200).send(response);
    }

	public async createBulkUsers(req: AuthRequest, res: Response, next: NextFunction){
		let response = {
			status : false, data : [], message: ''
		},
		users = JSON.parse(req.body.users),
        accountId = req.user.account_id,
        accountModel = new Account(accountId),
		returnUsers = [],
        account = <any> {
            account_name : ''
        },
        isAccountEmailExempt = false,
        hasOnlineTraining = false,
        userModel = new User(req.user.user_id),
        accountTrainings = [];

        try{
            let account = <any> await accountModel.load();
            isAccountEmailExempt = (account.email_add_user_exemption == 1) ? true : false;
            hasOnlineTraining = (account.online_training == 1) ? true : false;

            let
            user = <any> await userModel.load(),
            userFullname = this.toTitleCase(user.first_name+' '+user.last_name),
            emRoles = <any> await new UserEmRoleRelation().getEmRoles();

    		for (let i in users) {
    			let userModel = new User(),
    				userRoleRelation = new UserRoleRelation(),
    				userEmRole = new UserEmRoleRelation(),
    				isEmailValid = this.isEmailValid(users[i]['email']),
    				isBlackListedEmail = false,
    				hasError = false,
                    selectedRoles = (users[i]["selected_roles"]) ? users[i]["selected_roles"] : [];

                const locationAccntRel = new LocationAccountRelation();
    			users[i]['errors'] = {};

    			if(isEmailValid) {
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

    			if(!hasError) {
                    accountTrainings = [];
    				let
    				token = this.generateRandomChars(30),
    				inviSaveData = {
    					'first_name' : this.toTitleCase(users[i]['first_name']),
    					'last_name' : this.toTitleCase(users[i]['last_name']),
    					'email' : users[i]['email'],
    					'contact_number' : users[i]['mobile_number'],
    					'location_id' : users[i]['account_location_id'],
    					'account_id' : req['user']['account_id'],
    					'role_id' : (users[i]['account_role_id'] == 1 || users[i]['account_role_id'] == 2) ? users[i]['account_role_id'] : 0,
    					'eco_role_id' : (users[i]['eco_role_id'] > 0) ? users[i]['eco_role_id'] : users[i]['account_role_id'],
    					'invited_by_user' : req['user']['user_id'],
                        'mobility_impaired' : (users[i]['mobility_impaired']) ? users[i]['mobility_impaired'] : 0,
                        'was_used' : (isAccountEmailExempt) ? 1 : 0
    				},
                    userSaveModel  = new User(),
                    encryptedPassword = md5('Ideation' + defs['DEFAULT_USER_PASSWORD'] + 'Max'),
                    userSaveData = {
                        'first_name' : this.toTitleCase(users[i]['first_name']),
                        'last_name' : this.toTitleCase(users[i]['last_name']),
                        'password': '',
                        'email': users[i]['email'],
                        'token': token,
                        'account_id': accountId,
                        'invited_by_user': req['user']['user_id'],
                        'can_login': 0,
                        'mobile_number': users[i]['mobile_number'],
                        'mobility_impaired' : (users[i]['mobility_impaired']) ? users[i]['mobility_impaired'] : 0,
                        'profile_completion' : 0
                    },
                    tokenSaveData = {
                        'token' : token,
                        'action' : 'verify',
                        'id' : 0,
                        'id_type' : 'user_id',
                        'verified' : 0
                    },
                    tokenModel = new Token(),
                    emailLink = 'https://' + req.get('host'),
                    locationModel = new Location(),
                    acestrieIds = <any> await locationModel.getAncestryIds(users[i]['account_location_id']),
                    idsLocation = [],
                    bodyOfEmail = '',
                    subjectOfEmail = '',
                    emailRole = `Warden`,
                    locationFullName = '';

                    idsLocation.push(users[i]['account_location_id']);
                    idsLocation = idsLocation.concat(acestrieIds[0]['ids']);

                    let locations = <any> await locationModel.getByInIds(idsLocation.join(','), 0),
                        building = <any> {},
                        location = <any> {},
                        trps = <any> [],
                        frp = <any> user,
                        emailData = <any> {
                            users_fullname : this.toTitleCase(inviSaveData['first_name']+' '+inviSaveData['last_name']),
                            nominators_fullname : userFullname,
                            nominators_account_name : account.account_name,
                            account_name : account.account_name,
                            location_name : '',
                            frequency : '3 months',
                            setup_link : '',
                            footer : '',
                            role : ''
                        },
                        emailType = '';

                    for(let loc of locations){
                        if(loc.is_building == 1){
                            building = loc;
                        }else if(loc.parent_id == -1){
                            building = loc;
                        }

                        if(users[i]['account_location_id'] == loc.location_id){
                            location = loc;
                        }
                    }

                    if(Object.keys(building).length > 0){
                        if(building.location_id != location.location_id){
                            locationFullName = building.name + ', '+location.name;
                        }else{
                            locationFullName = building.name;
                        }
                    }else{
                        locationFullName = location.name;
                    }

                    emailData.location_name = locationFullName;

                    if(isAccountEmailExempt){
                        userSaveData.password = encryptedPassword;
                        userSaveData.can_login = 1;
                        userSaveData.profile_completion = 1;
                        tokenSaveData.verified = 1;
                    }else{
                        tokenSaveData.action = 'setup-password';
                        emailLink += '/signup/profile-completion/' + token;
                    }

                    await userSaveModel.create(userSaveData);
                    tokenSaveData.id = userSaveModel.ID();

                    let 
                    saveLocAccUser = async (user, roleid) => {
                        let locationAcctUser = new LocationAccountUser();
                        await locationAcctUser.create({
                            'location_id': user['account_location_id'],
                            'account_id': accountId,
                            'user_id': userSaveModel.ID(),
                            'role_id': roleid
                        });

                        emailRole = (roleid == 1) ? 'Building Manager' : 'Tenant Responsible Person';

                        const userRoleRel = new UserRoleRelation();
                        await userRoleRel.create({
                            'user_id': userSaveModel.ID(),
                            'role_id': roleid
                        });
                    },
                    saveEmUser = async (user, roleid) => {
                        // get account trainings
                        accountTrainings = await new AccountTrainingsModel().getAccountTrainings(accountId, {
                          role: roleid
                        });

                        for (const training of accountTrainings) {
                          await new AccountTrainingsModel().assignAccountUserTraining(
                            userSaveModel.ID(),
                            training['course_id'],
                            training['training_requirement_id']
                          );
                        }

                        const EMRoleUserRole = new UserEmRoleRelation();
                        await EMRoleUserRole.create({
                            'user_id': userSaveModel.ID(),
                            'em_role_id': roleid,
                            'location_id': user['account_location_id']
                        });
                    };

                    if(selectedRoles.length > 0){
                        for(let role of selectedRoles){
                            if(parseInt(role['role_id']) == 1 || parseInt(role['role_id']) == 2){
                                try {
                                    await locationAccntRel.getLocationAccountRelation({
                                        'location_id': users[i]['account_location_id'],
                                        'account_id': accountId,
                                        'responsibility': defs['role_text'][role['role_id']]
                                    });
                                } catch (err) {
                                    await locationAccntRel.create({
                                        'location_id': users[i]['account_location_id'],
                                        'account_id': accountId,
                                        'responsibility': defs['role_text'][role['role_id']]
                                    });
                                }                                
                                await saveLocAccUser(users[i], role['role_id']);

                            }else{
                                await saveEmUser(users[i], role['role_id']);
                            }
                        }
                    }else{
                        if(parseInt(users[i]['account_role_id']) == 1 || parseInt(users[i]['account_role_id']) == 2){
                            await saveLocAccUser(users[i], users[i]['account_role_id']);
                        } else {
                            let roleid = (users[i]['eco_role_id'] > 0) ? users[i]['eco_role_id'] : users[i]['account_role_id'];
                            await saveEmUser(users[i], roleid);
                        }
                    }


                    emailData.setup_link = emailLink;

                    /*if(hasOnlineTraining || isAccountEmailExempt){


                    }else{
                        let invitation = new UserInvitation();
                        await invitation.create(inviSaveData);

                        tokenSaveData.id_type = 'user_invitations_id';
                        tokenSaveData.id = invitation.ID();
                        emailLink += '/signup/warden-profile-completion/'+token;
                    }*/

                    await tokenModel.create(tokenSaveData);

                    if(!isAccountEmailExempt){

                        let isGenOccupant = false,
                            isWarden = false;

                        if(parseInt(users[i]['account_role_id']) == 1 || parseInt(users[i]['account_role_id']) == 2){
                            emailType = 'frp';
                            if(parseInt(users[i]['account_role_id']) == 2){
                                emailType = 'trp';
                            }
                        }else{
                            emailType = 'warden';
                            let roles = [];

                            for(let i in selectedRoles){
                                if(selectedRoles[i]['role_id'] == 8){
                                    isGenOccupant = true;
                                }else if(selectedRoles[i]['role_id'] == 9){
                                    isWarden = true;
                                }
                                roles.push( selectedRoles[i]['role_name'] );
                            }

                            emailData.role = roles.join(', ');
                        }

                        if(isGenOccupant){
                            if(hasOnlineTraining){
                                emailType = 'general-occupant-with-online';
                            }else{
                                emailType = 'general-occupant-without-online';
                            }
                        }

                        if(isWarden){
                            if(hasOnlineTraining){
                                emailType = 'warden-with-online';
                            }else{
                                emailType = 'warden-without-online';
                            }
                        }

                        const opts = {
                           from : '',
                           fromName : 'EvacConnect',
                           to : [],
                           cc: [],
                           body : '',
                           attachments: [],
                           subject : ''
                        };
                        const email = new EmailSender(opts);

                        email.assignOptions({
                            to: [inviSaveData['email']],
                            cc: []
                        });
                        email.sendFormattedEmail(emailType, emailData, res, 
                            (data) => console.log(data),
                            (err) => console.log(err)
                        );
                    }

    			}else{
    				returnUsers.push( users[i] );
    			}
    		}


        }catch(e){}

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

		try {
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
        user,
		mobilityImpairedModel = new MobilityImpairedModel();

		let saveData = {
			'is_permanent' : req.body.is_permanent,
			'assistant_type' : req.body.assistant_type,
			'equipment_type' : req.body.equipment_type,
			'duration_date' : null,
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
            user = new User(req.body.user_id);
            try {
                await user.load();

                console.log( user.getDBData() );

                await user.create({
                    'mobility_impaired': 1
                });
            } catch(e) {
                console.log(e);
                user = {};
            }
		}else if('user_invitations_id' in req.body){
			saveData['user_invitations_id'] = req.body.user_invitations_id;
			saveData['date_created'] = moment().format('YYYY-MM-DD HH:mm:00');
		}

        await mobilityImpairedModel.create(saveData);

        let arrWhere = [];

        arrWhere.push( "user_id = " + req.body.user_id );
        arrWhere.push( "duration_date > NOW()" );

        try {
            let mobilityDetails = <any> await mobilityImpairedModel.getMany( arrWhere );
            for(let userMobil of mobilityDetails){
                userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
            }

            response.data = mobilityDetails;

        } catch (e) {
            console.log(e);
            user['mobility_impaired_details'] = [];
        }

        // retrieve TRP
        // send notification to TRP
        const location = new Location();
        console.log(req.body.locations);
        console.log(typeof req.body.locations);
        if (req.body.locations) {
            try {
                const trpOnLoc = await location.getTRPOnLocation([req.body.locations], defs['Tenant']);
                const trps = [];
                for (let t of trpOnLoc) {
                    trps.push(t['email']);
                }
                const opts = {
                    from : '',
                    fromName : 'EvacConnect',
                    to : trps,
                    cc: [],
                    body : '',
                    attachments: [],
                    subject : 'EvacConnect - Mobility Impaired Registration'
                };
                const email = new EmailSender(opts);
                let emailBody = email.getEmailHTMLHeader();
                emailBody += `<h3 style="text-transform:capitalize;">Hi,</h3> <br/>
                <h4> ${user.get('first_name')} ${user.get('last_name')} has registered as mobility impaired.</h4> <br/>

                `;

                emailBody += email.getEmailHTMLFooter();
                email.assignOptions({
                    body : emailBody
                });
                email.send((data) => {
                    console.log(data);
                },(err) => {
                    console.log(err);
                });
            } catch (e) {
                console.log(e);
                console.log('cannot send notification');
            }
        }

		res.send(response);
	}

    public async markMobilityAsHealthy(req: AuthRequest, res: Response, next: NextFunction){
        let
        response = {
            status : true, message : ''
        },
        userModel = new User(req.body.user_id);
        try{
            await userModel.load();
            userModel.set('mobility_impaired', 0);
            await userModel.dbUpdate();
        }catch(e){
            response.message = 'No user found';
        }

        res.status(200).send(response);
    }


    //////
    // For Enhancement //
    // This is for listing Tenants(Accounts) in a location
    // Current : We only list who have TRP in the account
    //////
	public async getLocationsTenants(req: AuthRequest, res: Response, next: NextFunction) {
        const location_id = req.params.location_id;
        const locationAccountUserObj = new LocationAccountUser();
        let canLoginTenants = {};
        // Determine role of user
        const userRoleRel = new UserRoleRelation();
        const role = await userRoleRel.getByUserId(req.user.user_id, true);

        if (role == defs['Manager'] || req.user.evac_role == 'admin') {
            let accountIds = [];            
            const location = new Location();
            const accounts = await location.getAllAccountsInLocation(location_id);
            for (let account of accounts) {
                accountIds.push(account['account_id']);
                let stringIndex = account['account_id'].toString();
                canLoginTenants[stringIndex] = {
                    'account_name': account['account_name'],
                    'account_id': account['account_id'],
                    'trp': [],
                    'wardens': []
                };
            }
            try {
                const tenants =  await locationAccountUserObj.listRolesOnLocation(defs['Tenant'], location_id, accountIds);
                for (let id of accountIds) {
                    if ((id in tenants)) {
                        canLoginTenants[id]['trp'] = tenants[id]['trp'];
                    }
                }

            } catch(e) {
                console.log(e);
            }
            

        } else {
            // listing of roles is implemented here because we are only listing roles on a sub location                    
            try {
                canLoginTenants = await locationAccountUserObj.listRolesOnLocation(defs['Tenant'], location_id, [req.user.account_id]);
            } catch(e) {
                const accntObj = new Account(req.user.account_id);
                const accntDetails = await accntObj.load();
                canLoginTenants[req.user.account_id] = {
                'account_name': accntDetails['account_name'],
                'account_id': req.user.account_id,
                'trp': [],
                'wardens': []
                };
            }
        }
        const canLoginTenantArr = [];
        let tempWardenUsers = [];
        const tempFloorWardenUsers = [];
        let trainedWardensObj = {};
        let trainedFloorWardensObj = {};
        Object.keys(canLoginTenants).forEach((key) => {
          canLoginTenantArr.push(canLoginTenants[key]);
        });
        for (let i = 0; i < canLoginTenantArr.length; i++) {
          // get all wardens for this location on this account
          const EMRole = new UserEmRoleRelation();
          const trainingCert = new TrainingCertification();
          let temp;
          try {
            temp =
            await EMRole.getEMRolesOnAccountOnLocation(
              defs['em_roles']['WARDEN'],
              canLoginTenantArr[i]['account_id'],
              location_id
            );
            canLoginTenantArr[i]['total_wardens'] = temp['users'].length;
            canLoginTenantArr[i]['wardens'] = temp['raw'];
            tempWardenUsers = tempWardenUsers.concat(temp['users']);
            trainedWardensObj = await
            trainingCert.getEMRUserCertifications(temp['users'], {'em_role_id': defs['em_roles']['WARDEN']});
          } catch (e) {
            console.log('users route getLocationsTenants()',e);
            temp = {};
            canLoginTenantArr[i]['total_wardens'] = 0;
            canLoginTenantArr[i]['wardens'] = [];
            trainedWardensObj = {
              'total_passed': 0,
              'passed': [],
              'failed': [],
              'percentage': ''
            };
          }

          try {
            temp = null; // reset
            temp =
            await EMRole.getEMRolesOnAccountOnLocation(
              defs['em_roles']['FLOOR_WARDEN'],
              canLoginTenantArr[i]['account_id'],
              location_id
            );
            for (let fw of temp['raw']) {
              if (tempWardenUsers.indexOf(fw['user_id']) == -1) {
                tempFloorWardenUsers.push(fw['user_id']);
                canLoginTenantArr[i]['wardens'].push(fw);
              }
            }

            canLoginTenantArr[i]['total_wardens'] += tempFloorWardenUsers.length;
            trainedFloorWardensObj = await
            trainingCert.getEMRUserCertifications(tempFloorWardenUsers, {'em_role_id': defs['em_roles']['FLOOR_WARDEN']});

          } catch (e) {
            console.log('users route getLocationsTenants()',e);
            trainedFloorWardensObj = {
              'total_passed': 0,
              'passed': [],
              'failed': [],
              'percentage': ''
            };
          }

          let tempPercentage = Math.round(((trainedWardensObj['passed'].length + trainedFloorWardensObj['passed']) / (tempWardenUsers.length + tempFloorWardenUsers.length)) * 100);
          let tempPercentageStr = '0%';
          if (tempPercentage > 0) {
            tempPercentageStr =  tempPercentage.toFixed(0).toString() + '%';
          }

          // get trained wardens
          canLoginTenantArr[i]['trained_wardens'] = {
            'failed': trainedWardensObj['failed'].concat(trainedFloorWardensObj['failed']),
            'passed': trainedWardensObj['passed'].concat(trainedFloorWardensObj['passed']),
            'total_passed': trainedWardensObj['passed'].length + trainedFloorWardensObj['passed'],
            'percentage':  tempPercentageStr
          };
        }

        return canLoginTenantArr;
	}

    public async locationRoleAssignments(req:AuthRequest, res:Response, next: NextFunction){

        let
        response = {
            status : false, message : '', data : {}
        },
        userId = req.body.user_id,
        assignments = JSON.parse(req.body.assignments),
        userModel = new User(userId),
        locAccRelationModel = new LocationAccountRelation(),
        locAccModel = new LocationAccountUser(),
        userEmModel = new UserEmRoleRelation(),
        userRoleModel = new UserRoleRelation(),
        deleteAssignment = async (assignment) => {
            if('user_em_roles_relation_id' in assignment){
                userEmModel.setID(assignment.user_em_roles_relation_id);
                await userEmModel.delete();
                userEmModel = new UserEmRoleRelation();
            }

            if('location_account_user_id' in assignment){
                locAccModel.setID(assignment.location_account_user_id);
                await locAccModel.delete();
                locAccModel = new LocationAccountUser();
            }
        },
        createFrpTrp = async (assign) => {
            try{
                await locAccRelationModel.getLocationAccountRelation({
                    'location_id' : assign.location_id,
                    'account_id' : assign.account_id,
                    'responsibility' : (assign.role_id == 1) ? 'Manager' : 'Tenant'
                });
            }catch(e){
                await locAccRelationModel.create({
                    'location_id' : assign.location_id,
                    'account_id' : assign.account_id,
                    'responsibility' : (assign.role_id == 1) ? 'Manager' : 'Tenant'
                });
            }

            try{
                await locAccModel.getByLocationIdAndUserId(assign.location_id, userId);
            }catch(errLoc){
                locAccModel.set('location_id', assign.location_id);
                locAccModel.set('user_id', userId);
                locAccModel.set('account_id', assign.account_id);
                await locAccModel.dbInsert();
                locAccModel = new LocationAccountUser();
            }

            try{
                let roles = await userRoleModel.getByUserId(userId),
                hasSame = false;
                for(let ro of roles){
                    if(ro.role_id == assign.role_id){
                        hasSame = true;
                    }
                }

                if(!hasSame){
                    userRoleModel.set('user_id', userId);
                    userRoleModel.set('role_id', assign.role_id);
                    userRoleModel.dbInsert();
                    userRoleModel = new UserRoleRelation();
                }

            }catch(err){
                userRoleModel.set('user_id', userId);
                userRoleModel.set('role_id', assign.role_id);
                userRoleModel.dbInsert();
                userRoleModel = new UserRoleRelation();
            }
        };


        try{
            let user = <any> await userModel.load();
            response.status = true;

            for(let assign of assignments){

                assign['account_id'] = user.account_id;

                if( 'deleted' in assign ){
                    if( assign.deleted == true ){
                        await deleteAssignment(assign);
                    }
                }else if( 'user_em_roles_relation_id' in assign ){
                    if(assign.role_id == 1 || assign.role_id == 2){
                        await deleteAssignment(assign);
                        await createFrpTrp(assign);
                    }else{
                        userEmModel.setID(assign.user_em_roles_relation_id);
                        try{
                            await userEmModel.load();
                            userEmModel.set('em_role_id', assign.role_id);
                            userEmModel.set('location_id', assign.location_id);
                            await userEmModel.dbUpdate();
                            userEmModel = new UserEmRoleRelation();
                        }catch(errEm){
                        }
                    }

                }else if( 'location_account_user_id' in assign ){

                    if(assign.role_id == 1 || assign.role_id == 2){
                        locAccModel.setID(assign.location_account_user_id);
                        try{
                            await locAccModel.load();
                            locAccModel.set('location_id', assign.location_id);
                            await locAccModel.dbUpdate();
                            locAccModel = new LocationAccountUser();
                        }catch(errLoc){}

                        try{
                            await userRoleModel.getByUserId(userId);
                            userRoleModel = new UserRoleRelation();
                        }catch(er){
                            await userRoleModel.create({
                                'user_id' : userId,
                                'role' : assign.role_id
                            });
                            userRoleModel = new UserRoleRelation();
                        }
                    }else{
                        await deleteAssignment(assign);

                        userEmModel.set('user_id', userId);
                        userEmModel.set('location_id', assign.location_id);
                        userEmModel.set('em_role_id', assign.role_id);
                        await userEmModel.dbInsert();
                    }

                }else{
                    if( assign.role_id == 1 || assign.role_id == 2 ){
                        await createFrpTrp(assign);
                    }else{
                        let arrWhere = [];
                        arrWhere.push([ ' em.user_id = '+userId ]);
                        arrWhere.push([ ' em.location_id = '+assign.location_id ]);
                        arrWhere.push([ ' em.em_role_id = '+assign.role_id ]);
                        let emroles = <any> await userEmModel.getWhere(arrWhere);

                        if( emroles.length == 0 ){
                            userEmModel = new UserEmRoleRelation();
                            userEmModel.set('user_id', userId);
                            userEmModel.set('location_id', assign.location_id);
                            userEmModel.set('em_role_id', assign.role_id);
                            await userEmModel.dbInsert();
                        }

                    }
                }

            }

        }catch(e){
            response.message = 'No user found';
        }

        response = <any> await this.getUserLocationsTrainingsEcoRoles(req, res, next, true, userId);

        res.send(response);

    }

  public async updateNotificationSettings(req:AuthRequest, res:Response){
    let 
    notifiUserSettingsModel = new NotificationUserSettingsModel(),
    response = {
      status : true, data : <any> [], message : ''
    },
    body = req.body;

    let records = <any> await notifiUserSettingsModel.getWhereUserId(body.user_id);
    if(records.length == 0){
      await notifiUserSettingsModel.create({
        'user_id' : body.user_id,
        'frequency' : body.frequency,
        'one_month_training_reminder' : body.one_month_training_reminder
      });
    }else{
      let latestId = 0;
      for(let i in records){
        if(parseInt(i) > 0){
          let deleteModel = new NotificationUserSettingsModel( records[i]['notification_user_settings_id'] );
          await deleteModel.delete();
        }else if(parseInt(i) == 0){
          let updateModel = new NotificationUserSettingsModel( records[i]['notification_user_settings_id'] );
          updateModel.set('frequency', body.frequency);
          updateModel.set('one_month_training_reminder', body.one_month_training_reminder);
          updateModel.set('user_id', body.user_id);
          updateModel.set('date_created', moment().format('YYYY-MM-DD'));
          await updateModel.dbUpdate();
        }
      }
    }

    res.send(response);

  }

}
