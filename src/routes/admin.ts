
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { List } from '../models/list.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { User } from './../models/user.model';
import { Token } from './../models/token.model';
import { parse } from 'url';
import { LocationAccountRelation } from '../models/location.account.relation';
import { LocationAccountUser } from '../models/location.account.user';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { UtilsSync } from '../models/util.sync';
import { FileUploader } from '../models/upload-file';
import { ComplianceDocumentsModel } from '../models/compliance.documents.model';
import { ComplianceModel } from '../models/compliance.model';
import { ComplianceKpisModel } from '../models/comliance.kpis.model';
import { CourseUserRelation } from '../models/course-user-relation.model';
import * as moment from 'moment';
import { UserRoleRelation } from '../models/user.role.relation.model';
const md5 = require('md5');
const defs = require('../config/defs.json');
const validator = require('validator');
const cryptoJs = require('crypto-js');
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as async from 'async';
import { TrainingRequirements } from '../models/training.requirements';
import { TrainingCertification } from '../models/training.certification.model';
import { AccountTrainingsModel } from '../models/account.trainings';
import { Course } from '../models/course.model';
import { PaperAttendanceDocumentModel } from '../models/paper.attendance.doc.model';
import {NotificationToken } from '../models/notification_token.model';
import { NotificationConfiguration } from '../models/notification_config.model';
import {EmailSender} from '../models/email.sender';
import { Utils } from '../models/utils.model';
const RateLimiter = require('limiter').RateLimiter;
const AWSCredential = require('../config/aws-access-credentials.json');

export class AdminRoute extends BaseRoute {

  public static create(router: Router) {    

    router.post('/admin/send-message-to-admin/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const message = req.body.message;
      const opts = {
        from : '',
        fromName : 'EvacConnect',
        to : ['adelfin@evacgroup.com.au', 'emacaraig@evacgroup.com.au'],
        cc: [],
        body : ` ${req.get('Host')} says: <pre>{{}}</pre>`,
        attachments: [],
        subject : 'EvacConnect Developer Notification'
      };
      const email = new EmailSender(opts);
      email.send(
        (data) => {
            console.log('Email sent successfully');					
        },
        (err) => console.log(err)
      );
      res.status(200).send({
        message: 'Email sent to devs'
      });
    });

    router.post('/admin/create-new-location/',new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      let sublocs = [];
      let location = new Location();
      let locationAccountRelationObj; 
      let sublocation;
      await location.create({
        name: req.body.name,
        is_building: 1,
        parent_id: -1,
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
        location_directory_name: (req.body.name).replace(/\s/g, ''),
        admin_verified: 1
      });
      locationAccountRelationObj = new LocationAccountRelation();
        await locationAccountRelationObj.create({
          location_id: location.ID(),
          account_id: req.body.account_id,
          responsibility: req.body.role
        });
        locationAccountRelationObj = null;
      if (req.body.role == 'Tenant') {
        sublocs = JSON.parse(req.body.sublocs);        
        
        for(const sublevel of sublocs) {
          let sublocation = new Location();

          await sublocation.create({
            name: sublevel,
            is_building: 0,
            parent_id: location.ID(),
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
            location_directory_name: (sublevel).replace(/\s/g, ''),
            admin_verified: 1
          });
          locationAccountRelationObj = new LocationAccountRelation();
          await locationAccountRelationObj.create({
            location_id: sublocation.ID(),
            account_id: req.body.account_id,
            responsibility: 'Tenant'
          });

          locationAccountRelationObj = null;
          sublocation = null;
        } 
      }
      else if(req.body.role == 'Manager') {
        console.log(req.body);
         // if (req.body.occupiable_levels != null || parseInt(req.body.occupiable_levels, 10) != 0) {
        if (req.body.occupiable_levels) {
          let occupiableLevels = parseInt(req.body.occupiable_levels, 10);
          for (let i = 0; i < occupiableLevels; i++) {
            let sublocation = new Location();
            await sublocation.create({
              name: `Level ${i+1}`,
              is_building: 0,
              parent_id: location.ID(),
              street: req.body.street,
              city: req.body.city,
              state: req.body.state,
              formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
              location_directory_name: `Level${i+1}`,
              admin_verified: 1
            });
            locationAccountRelationObj = new LocationAccountRelation();
            await locationAccountRelationObj.create({
              location_id: sublocation.ID(),
              account_id: req.body.account_id,
              responsibility: 'Manager'
            });
            locationAccountRelationObj = null;
            sublocation = null;
          }
         }

         if (req.body.carpark) {
          let carpark = parseInt(req.body.carpark, 10);
          for (let i = 0; i < carpark; i++) {
            let sublocation = new Location();
            await sublocation.create({
              name: `Carpark ${i+1}`,
              is_building: 0,
              parent_id: location.ID(),
              street: req.body.street,
              city: req.body.city,
              state: req.body.state,
              formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
              location_directory_name: `Carpark${i+1}`,
              admin_verified: 1
            });
            locationAccountRelationObj = new LocationAccountRelation();
            await locationAccountRelationObj.create({
              location_id: sublocation.ID(),
              account_id: req.body.account_id,
              responsibility: 'Manager'
            });
            locationAccountRelationObj = null;
            sublocation = null;
          }
         }

         if (req.body.plantroom) {
          let plantroom = parseInt(req.body.plantroom, 10);
          for (let i = 0; i < plantroom; i++) {
            let sublocation = new Location();
            await sublocation.create({
              name: `Plantroom ${i+1}`,
              is_building: 0,
              parent_id: location.ID(),
              street: req.body.street,
              city: req.body.city,
              state: req.body.state,
              formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
              location_directory_name: `Plantroom${i+1}`,
              admin_verified: 1
            });
            locationAccountRelationObj = new LocationAccountRelation();
            await locationAccountRelationObj.create({
              location_id: sublocation.ID(),
              account_id: req.body.account_id,
              responsibility: 'Manager'
            });
            locationAccountRelationObj = null;
            sublocation = null;
          }
         }

         if (req.body.others) {
          let others = parseInt(req.body.others, 10);
          for (let i = 0; i < others; i++) {
            let sublocation = new Location();
            await sublocation.create({
              name: `Others ${i+1}`,
              is_building: 0,
              parent_id: location.ID(),
              street: req.body.street,
              city: req.body.city,
              state: req.body.state,
              formatted_address: `${req.body.street}, ${req.body.city}, ${req.body.state}`,
              location_directory_name: `Others${i+1}`,
              admin_verified: 1
            });
            locationAccountRelationObj = new LocationAccountRelation();
            await locationAccountRelationObj.create({
              location_id: sublocation.ID(),
              account_id: req.body.account_id,
              responsibility: 'Manager'
            });
            locationAccountRelationObj = null;
            sublocation = null;
          }
         }
      }

      return res.status(200).send({
        message: 'Success'
      });

    });
    
    router.post('/admin/set-passwd-invite/',
    new MiddlewareAuth().authenticate,
    (req: AuthRequest, res: Response, next: NextFunction) => {
      new AdminRoute().setInvitePassword(req, res, next);
    });
    

    router.post('/admin/send-notification/',
      new MiddlewareAuth().authenticate,
      async (req: AuthRequest, res: Response, next: NextFunction) => {
        // get account roles
        const user = new User(req.body.user);
        const dbDataAccountRoles: object[] = await user.getAccountRoles();
        console.log(dbDataAccountRoles);
        for (const accountRole of dbDataAccountRoles) {
          const configurator = new NotificationConfiguration();
          let theBuilding = accountRole['building_id'];  
          if (accountRole['building_id'] == null && accountRole['locationIsAlreadyABuilding']) {
            theBuilding = accountRole['location_id'];
          }
          console.log('Target Location is: ' + theBuilding);
          const dbConfigData = await configurator.loadByBuilding(theBuilding);
          const notificationToken = new NotificationToken();
          if (dbConfigData.length == 0) {
              // create config
              await configurator.create({
                building_id:accountRole['building_id'],
                users: req.body.user,
                frequency: 30,
                recipients: 1,
                dtLastSent: moment().format('YYYY-MM-DD'),
                message: `Thank you again for your active participation and commitment to promote proactive safety within your building. Sincerely,
  
                The EvacConnect Engagement team
                Email: systems@evacgroup.com.au
                Phone: 1300 922 437
                
                * The TRP for a tenancy is the person responsible for ensuring that emergency planning is
                being managed in your tenancy. You receive these confirmation emails every 3 months to
                help us ensure that tenant and warden lists remain up to date.`
              });
          }
          // send email
          let strToken = cryptoJs.AES.encrypt(`${Date.now()}_${user.ID()}_${accountRole['location_id']}_${configurator.ID()}`, process.env.KEY).toString();
          await notificationToken.create({
            strToken: strToken,
            user_id: user.ID(),
            location_id: accountRole['location_id'],
            role_text: defs['notification_role_text'][accountRole['role_id']],
            notification_config_id: configurator.ID(),
            dtExpiration: moment().add(2, 'day').format('YYYY-MM-DD')
          });
          const emailData = {
            message : configurator.get('message').toString().replace(/(?:\r\n|\r|\n)/g, '<br>'),
            users_fullname : accountRole['first_name'] +' '+accountRole['last_name'],
            account_name : accountRole['account_name'],
            location_name: accountRole['building_name'] + " " + accountRole['name'] ,
            yes_link : 'https://' + req.get('host') + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken),
            no_link : 'https://' + req.get('host') + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken)
          };
          let emailType = 'warden-confirmation';
          
          if(defs['notification_role_text'][accountRole['role_id']] == 'TRP'){
            emailType = 'trp-confirmation';
          }
          const opts = {
            from : '',
            fromName : 'EvacConnect',
            to : [accountRole['email']],
            cc: ['emacaraig@evacgroup.com.au', 'jmanoharan@evacgroup.com.au'],
            body : '',
            attachments: [],
            subject : 'EvacConnect Email Notification'
          };
          const email = new EmailSender(opts);
          email.sendFormattedEmail(emailType, emailData, res, 
            (data) => console.log(data),
            (err) => console.log(err)
          );
        }
        return res.status(200).send({
          message: `Notification sent.`
        });
    });

    router.post('/admin/new/account/',
      new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        //  console.log(req.body);
        let account;
        let message = '';
        if (parseInt(req.body.account_id, 10) > 0) {
          message = 'Account successfully updated';
          account = new Account(req.body.account_id);
          await account.load();
          await account.create(req.body);
        } else {
          message = 'Account successfully created';
          account = new Account();
          await account.create(req.body);
        }
        const dbData = await account.load();
        return res.status(200).send({
          message: message,
          data: dbData
        });
      });

    router.post('/admin/assign-default-training/',
    new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {

      const onlineTrainingAccess = parseInt(req.body.online_access, 10);
      let em_users = [];
      let user_assignment = [];
      console.log(req.body);
      if (req.body.account != null) {
        const accountId = req.body.account;
        const acctTraining = new AccountTrainingsModel();
        let temp: any;
        const arrayOfRolesCourseRelation = [{
          'role': 8,
          'course': 7,
          'requirement': 16
        },
        {
          'role': 9,
          'course': 1,
          'requirement': 17
        }, {
          'role': 10,
          'course': 1,
          'requirement': 17
        }];

        // update account
        const accountObj = new Account(accountId);
        await accountObj.load();
        await accountObj.create({
          online_training: onlineTrainingAccess
        });

        // assign default training to this account
        if (onlineTrainingAccess) {
          // create/update record in account_trainings
          for (const dref of arrayOfRolesCourseRelation) {
            try {
              temp = await acctTraining.checkAssignedTrainingOnAccount(accountId, dref.course, dref.role, dref.requirement);
              console.log(temp);
            } catch (e) {
              console.log('Creating training record', dref.role);
              await new AccountTrainingsModel().create({
                account_id: accountId,
                course_id: dref.course,
                role: dref.role,
                training_requirement_id: dref.requirement
              });
            }
            await acctTraining.assignAccountRoleTraining(accountId,
              dref.course,
              dref.requirement,
              dref.role
            );
          }

        } else {
          await acctTraining.removeAssignedTrainingOnAccount(accountId);
          for (const dref of arrayOfRolesCourseRelation) {
            // console.log(dref);
            await acctTraining.assignAccountRoleTraining(accountId,
              dref.course,
              dref.requirement,
              dref.role,
              1
            );
          }
        }
      } // end if account
      if (req.body.location != null) {
        const locationArrObjects = <Array<object>> await new Location().getParentsChildren(req.body.location, 1);
        const locIds = [req.body.location];
        for (const location of locationArrObjects) {
          locIds.push(location['location_id']);
        }
        await new Location().toggleBulkOnlineTrainingAccess(locIds, onlineTrainingAccess);

        // get users from these location ids
        em_users = await new UserEmRoleRelation().getUsersInLocationIds(locIds.join(','));
        // console.log(em_users);
        for (const user of em_users) {
          const account_trainings = await new AccountTrainingsModel().getAccountTrainings(user['account_id'], {'role': user['em_role_id']});
          for (const training of account_trainings) {
              user_assignment.push({
                user_id: user['user_id'],
                name: user['first_name'] + ' ' + user['last_name'],
                role: user['em_role_id'],
                course: training['course_id'],
                trid: training['training_requirement_id'],
                online_access: onlineTrainingAccess
              });
              let disable = 1;
              if (onlineTrainingAccess) {
                disable = 0;
              }
              await new AccountTrainingsModel().assignAccountUserTraining(
                user['user_id'],
                training['course_id'],
                training['training_requirement_id'],
                disable
              );
          }
        }
      }
      return res.status(200).send({
        message: 'Success',
        users: em_users,
        assigned: user_assignment
      });

    });

    router.post('/admin/create-training-for-account/',
    new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      console.log(req.body);
      const acctTraining = new AccountTrainingsModel();
      let temp;
      try {
        temp = await acctTraining.checkAssignedTrainingOnAccount(req.body.account, req.body.course, req.body.role, req.body.trid);
        console.log(temp);
        return res.status(400).send({
          message: 'Training course already exists'
        });
      } catch (e) {
        console.log('Creating training record');
        await acctTraining.create({
          account_id: req.body.account,
          course_id: req.body.course,
          role: req.body.role,
          training_requirement_id: req.body.trid
        });
        const trainings = await acctTraining.getAccountTrainings(req.body.account);
        // update account
        const accountObj = new Account(req.body.account);
        await accountObj.load();
        await accountObj.create({
          online_training: 1
        });

        return res.status(200).send({
          message: 'Record created',
          trainings: trainings
        });
      }
    });

    router.post('/admin/assign-account-roles-training/',
    new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const acctTraining = new AccountTrainingsModel();

      await acctTraining.assignAccountRoleTraining(req.body.accountId,
        req.body.courseId,
        req.body.trid,
        req.body.role
      );
      return res.status(200).send({
        message: 'Success'
      });
    });

    router.post('/admin/assign-user-training/',
    new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const userId = req.body.userId;
      const trid = req.body.trid;
      const courseId = req.body.courseId;
      const accountTraining = new AccountTrainingsModel();
      await accountTraining.assignAccountUserTraining(userId, courseId, trid);
      return res.status(200).send({
        message: 'Success'
      });
    });

    router.post('/admin/validate-training/', new MiddlewareAuth().authenticate,
    async(req: AuthRequest, res: Response, next: NextFunction) => {
      const users: Array<object> = JSON.parse(req.body.users);
      const validUsers = [];
      const invalidUsers = [];
      const takenEmailAdress = [];
      for (const u of users) {
       if (parseInt( u['user_id'], 10) == 0) {
         const user = new User();
         const token = new Token();
         let accountId = u['account_id'];
         const locationAccntRel = new LocationAccountRelation();
         if (accountId == 0) {
           // checks if the account with the given name is existing
           const accountDetails = await new Account().getAccountDetailsUsingName(u['account_name']);
           if (accountDetails.length > 0) {
              accountId = accountDetails['account_id'];
           } else {
              // create an account
              const accountObj = new Account();
              const location = new Location(u['location_id']);
              await location.load();
              await accountObj.create({
               account_name: u['account_name'],
               location_id: u['location_id'],
               billing_street: location.get('street'),
               billing_city: location.get('city'),
               billing_state: location.get('state'),
               billing_postal_code: location.get('postal_code'),
               billing_country: location.get('country')
              });
              accountId = accountObj.ID();

              // tag this new account to location_account_relation
              try {
                await locationAccntRel.getLocationAccountRelation({
                    'location_id': u['location_id'],
                    'account_id': accountId,
                    'responsibility': defs['role_text'][2]
                });
              } catch (err) {
                await locationAccntRel.create({
                  'location_id': u['location_id'],
                  'account_id': accountId,
                  'responsibility': defs['role_text'][2]
                });
              }
           }
         }
         if (validator.isEmail(u['email'])) {
           try {
             await user.getByEmail(u['email']);
             takenEmailAdress.push(u['email']);
           } catch (e) {
              const locationAccntUser = new LocationAccountUser();
               await user.create({
                first_name: u['first_name'],
                last_name: u['last_name'],
                email: u['email'],
                password: md5('Password123456'),
                can_login: 1,
                invited_by_user: req.user.user_id,
                token: md5(u['email']),
                account_id: accountId
               });

               await token.create({
                id: user.ID(),
                id_type: 'user_id',
                token: md5(u['email']),
                action: 'verify',
                verified: 1,
                expiration_date: moment().format('YYYY-MM-DD HH-mm-ss')
              });

              if (parseInt(u['role_id'], 10) > 2) {
                // EM Roles UserEmRoleRelation
                try {
                  const em_user = new UserEmRoleRelation();
                  em_user.create({
                    user_id: user.ID(),
                    em_role_id: u['role_id'],
                    location_id: u['location_id']
                  });
                } catch (e) {
                  console.log('Unable to create emergency role', e);
                }

              } else {
                try {
                  await locationAccntUser.create({
                    location_id: u['location_id'],
                    account_id: accountId,
                    user_id: user.ID()
                  });

                } catch (e) {
                    console.log('Cannot create entry in db');
                }
                /*
                try {
                  await locationAccntRel.getLocationAccountRelation({
                      'location_id': u['location_id'],
                      'account_id': accountId,
                      'responsibility': defs['role_text'][u['role_id']]
                  });
                } catch (err) {
                  await locationAccntRel.create({
                    'location_id': u['location_id'],
                    'account_id': accountId,
                    'responsibility': defs['role_text'][u['role_id']]
                  });
                }
                */
                // User Role Relation
                const userRoleRelObj = new UserRoleRelation();
                let accountRole = [];
                accountRole = await userRoleRelObj.getUserRoleRelationId({
                  user_id: user.ID(),
                  role_id: u['role_id']
                });
                if (accountRole.length === 0) {
                  await userRoleRelObj.create({
                    user_id: user.ID(),
                    role_id: u['role_id']
                  });
                }
              }
              try {
                await new TrainingCertification().checkAndUpdateTrainingCert({
                  'user_id': user.ID(),
                  'certification_date': u['certification_date'],
                  'training_requirement_id': u['training_requirement_id'],
                  'course_method': u['course_method'],
                  'pass': '1',
                  'registered': '1',
                  'description': 'Training validated by user ' + req.user.user_id + ' on ' + moment().format('YYYY-MM-DD HH:mm:ss')
                });
                validUsers.push(u['email']);
               } catch (e) {
                 console.log(e, u);
                 invalidUsers.push(u['email'])
               }
           }
         } else {
          invalidUsers.push(u['email']);
         }
       } else {
         try {
          await new TrainingCertification().checkAndUpdateTrainingCert({
            'user_id': u['user_id'],
            'certification_date': u['certification_date'],
            'training_requirement_id': u['training_requirement_id'],
            'course_method': u['course_method'],
            'pass': '1',
            'registered': '1',
            'description': 'Training validated by user ' + req.user.user_id + ' on ' + moment().format('YYYY-MM-DD HH:mm:ss')
          });
          validUsers.push(u['email']);
         } catch (e) {
           console.log(e, u);
           invalidUsers.push(u['email']);
         }
       }
      }
      return res.status(200).send({
        invalid_users: invalidUsers,
        validUsers: validUsers,
        takenEmailAdress: takenEmailAdress
      });
    });

    router.get('/admin/list/training-requirements/', new MiddlewareAuth().authenticate,
    (req: AuthRequest, res: Response, next: NextFunction) => {
      const t = new TrainingRequirements();
      t.getWhere([]).then((trainings) => {
        return res.status(200).send({
            data: trainings
        });
      }).catch((e) => {
        console.log(e);
      });
    });

    router.get('/admin/location/search/',
    new MiddlewareAuth().authenticate,
    async(req: AuthRequest, res: Response, next: NextFunction) => {
      const
      searchKey: object = <any> {
        name: req.query.name
      },
      location = new Location(),
      locAccModel = new LocationAccountRelation();

      let
      limit = undefined,
      accountId = undefined;
      if(req.query['limit']){
         limit = req.query.limit;
      }
      if(req.query['account_id']){
         if(req.query.account_id > 0){
             accountId = req.query.account_id;
         }
      }

      let searchResult = <any> [];

      if(accountId){
          searchResult = await locAccModel.listAllLocationsOnAccount(accountId,  {
              'archived' : 0, 'name' : req.query.name, 'limit' : limit, 'no_parent_name' : true
          })
      }else{
          searchResult = await location.searchLocation(searchKey, limit, accountId);
      }

      for (const s of searchResult) {
        s['type'] = 'location';
        s['id'] = s['location_id'];
        if(req.query.sublocations){
            let subLocModel = new Location(s['location_id']);
            s['sublocations'] = await subLocModel.getSublocations();
        }
      }
      return res.status(200).send({
        message: 'Success',
        data: searchResult
      });
    });

    router.get('/admin/training-validation-location-users/',
    async (req: Request, res: Response, next: NextFunction) => {
      // get children
      const sublocations = await new Location().getChildren(req.query.location);
      const lauObj = new LocationAccountUser();
      const emrrObj = new UserEmRoleRelation();
      let tempArr = [req.query.location];
      for (const s of sublocations) {
        tempArr.push(s['location_id']);
        s['id'] = s['location_id'];
      }

      const userAccountRoles = await lauObj.getUsersInLocationId(tempArr);
      const userEMRoles = await emrrObj.getUsersInLocationIds(tempArr.join(','));
      const allUsers = userAccountRoles.concat(userEMRoles);
      tempArr = [];
      
      const uniqUsers = [];
      for (const u of allUsers) {
        if (tempArr.indexOf(u['user_id']) == -1) {
          tempArr.push(u['user_id']);
          uniqUsers.push(u);
        }
      }
      res.status(200).send({
        sublocations: sublocations,
        users: uniqUsers
      });
    });

    router.get('/admin/get/location-details/:location/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const locationObj = new Location(req.params.location);
      const lauObj = new LocationAccountUser();
      const emrrObj = new UserEmRoleRelation();
      const all_location_data = await locationObj.load();
      const parent_traverse_data = await locationObj.locationHierarchy();
      const children = await locationObj.getChildren(locationObj.ID());
      for (const child of children) {
        child['sublocations_count'] = await locationObj.countSubLocations(child['location_id']);
      }
      const people = {};
      const userAccountRoles = await lauObj.getUsersInLocationId([req.params.location]);
      const userEMRoles = await emrrObj.getUsersInLocationIds(req.params.location);
      const allUsers = userAccountRoles.concat(userEMRoles);
      const account = await new LocationAccountRelation().getByLocationId(req.params.location, true);

      for (const user of allUsers) {
        if (user['user_id'] in people) {
          if (user['em_role_id']) {
            people[user['user_id']]['em_role'].push(user['role_name']);
          }
          if (user['role_id']) {
            people[user['user_id']]['account_role'].push(user['role_name']);
          }
        } else {
          people[user['user_id']] = {
            name: `${user['first_name']} ${user['last_name']}`,
            user_id: user['user_id'],
            account_name: user['account_name'],
            account_role: [],
            em_role: []
          };
          if (user['em_role_id']) {
            people[user['user_id']]['em_role'].push(user['role_name']);
          }
          if (user['role_id']) {
            people[user['user_id']]['account_role'].push(user['role_name']);
          }
        }
      }


      return res.status(200).send({
        data: {
          details: all_location_data,
          traversal: parent_traverse_data,
          children: children,
          people: people,
          account: account
        }
      });

    });

    router.post('/admin/compliance/FSAByEvac/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      // account id
      const accountId = req.body.account;
      const status = req.body.status;
      const account = new Account(accountId);      
      const list = new List();
      // get all locations related to this account
      const bldgsOnAccount = <any> await list.listAllTaggedBuildingsOfAccount(accountId);
      const locations = [];
      const compliance = new ComplianceModel();
      for (const building of bldgsOnAccount) {
        // checks if building exists else insert
        try {
          await compliance.getComplianceRecord(3, building['location_id'], accountId);
          locations.push(building['location_id']);

        } catch (e) {
          console.log(e);
          await compliance.create({
            compliance_kpis_id: 3,
            compliance_status: status,
            building_id: building['location_id'],
            account_id: accountId,
            note: 'FSA Training by Evac',
            dtLastUpdated: moment().format('YYYY-MM-DD')
          });
        }
        
      }
      
      try {
        await compliance.FSATrainingByEvac(accountId, locations, status);
        await account.load();
        account.set('fsa_by_evac', status);
        await account.write();
        return res.status(200).send({
          message: 'Success',
          status: status,
          locations: locations
        });
      } catch(e) {
        console.log(e);
        return res.status(400).send({
          message: 'Fail',
          status: status,
          locations: locations
        });
      }

    });

    router.get('/admin/compliance/FSA-EvacExer/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const compliance = new ComplianceModel();
      let complianceData: any;
      if (req.query.ctrl === 'set') {
        complianceData =
          await compliance.setComplianceRecordStatus(req.query.compliance_kpis_id,
            req.query.building_id,
            req.query.account_id,
            req.query.compliance_status);
      }
      try {
        complianceData =
            await compliance.getComplianceRecord(req.query.compliance_kpis_id, req.query.building_id, req.query.account_id);
        return res.status(200).send({
          message: 'Success',
          data: complianceData
        });

      } catch(e) {
        return res.status(200).send({
          message: 'Fail',
          data: {}
        });
      }
      
    });

    router.get('/admin/account-locations/:accountId/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const 
        list = new List(),
        accountId = req.params.accountId,
        allLocations = {},
        filteredLocations = [],
        archived = (req.query.archived) ? 1 : 0,
        allTaggedLocationsAccounts = <any> await list.listAllTaggedBuildingsOfAccount(accountId, archived);
       
      return res.status(200).send({
        data: allTaggedLocationsAccounts
      });
    });

    router.get('/admin/account-sublocations/:parent_id/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const locationObj = new Location();
      const sublocations = await locationObj.getChildren(req.params['parent_id']);
      return res.status(200).send({
        message: 'Success',
        data: sublocations
      });
    });

    router.get('/admin/accounts/list/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const accountList = new List();
      const account = new Account();
      let accountIds = [];
      let page_num = 0;
      let row_count = await account.getAll({'count': true});

      row_count = parseInt(row_count, 10);
      let pages = 0;
      const item_per_page = 10;
      if (row_count) {
        pages = Math.ceil( row_count / item_per_page);
      }
      if (req.query.page_num) {
        page_num = parseInt(req.query.page_num, 10);
        accountIds = await account.getAll({'page': page_num});
      }
      if (req.query.search_key) {
        accountIds = await account.getAll({'query': req.query.search_key});
      }
      if (req.query.criteria) {
        accountIds = await account.getAll({'all': 1});
      }

      const list = await accountList.generateAccountsAdminList(accountIds);
      const listFromLAU = await accountList.generateAccountsAdminListFromLAU(accountIds);

      // loop through listFromLAU
      Object.keys(listFromLAU).forEach((key) => {
        if (key in list) {
          list[key]['locations'] = list[key]['locations'].concat(listFromLAU[key]['locations']);
          list[key]['locations'] = Array.from(new Set(list[key]['locations']));
        } else {
          list[key] = listFromLAU[key];
        }
      });
      return res.status(200).send({
        'message': 'Success',
        'data': {
          'list': list,
          'total_pages': pages
        }
      });
    });

    router.get('/admin/account-information/:accountId/',
        new MiddlewareAuth().authenticate,
        async (req: AuthRequest, res: Response, next: NextFunction) => {
        const account = new Account(req.params.accountId);
        try {
          const accntDbData = await account.load();
          return res.status(200).send({
            'message': 'Success',
            data: accntDbData
          });
        } catch (e) {
          return res.status(200).send({
            'message': 'Fail',
            data: {}
          });
        }
    });

    router.get('/admin/account-users/:accountId/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const account = new Account(req.params.accountId);
      const user = new User();

      const user_filter = {
        'page': 0,
        'query': ''
      };

      if (req.query.page_num) {
        user_filter['page'] = req.query.page_num;
      }
      if (req.query.search_key) {
        user_filter['query'] = req.query.search_key;
      }
      let selectedUsers = [],
        countUsers = <any> [],
        totalResult = 0;
      selectedUsers = await user.getSpliceUsers(req.params.accountId, user_filter);
      
      user_filter['count'] = true;
      countUsers =  await user.getSpliceUsers(req.params.accountId, user_filter);
      
      if(countUsers.length > 0){
        let count = countUsers[0]['count'];
        totalResult = Math.ceil( count / 10 );
      }


      let pages = 0;
      const item_per_page = 10;
      if (selectedUsers.length > 0) {
        pages = Math.ceil( selectedUsers.length / item_per_page);
      }

      let allUsers = [];
      allUsers = await account.generateAdminAccountUsers(req.params.accountId, selectedUsers);
      allUsers = allUsers.concat(await account.generateAdminEMUsers(req.params.accountId, selectedUsers));
      // console.log(allUsers);
      const accountUsers = [];
      const allUserObject = {};
      const locations = {};
      
      for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i]['user_id'] in allUserObject) {
          if ( (allUserObject[allUsers[i]['user_id']]['allAccountRoles']).indexOf(allUsers[i]['role_id']) == -1 && allUsers[i]['role_id'] != null &&  allUsers[i]['role_id'] < 3) {
            (allUserObject[allUsers[i]['user_id']]['allAccountRoles']).push(allUsers[i]['role_id']);
          }
          if (allUsers[i]['location_id'] in allUserObject[allUsers[i]['user_id']]['locations']) {
            if (allUsers[i]['account_role'] && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {

              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                allUsers[i]['account_role']
              );
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role-id'].push(
                allUsers[i]['role_id']
              );

            }
            if (allUsers[i]['role_name'] && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role-id'].push(allUsers[i]['role_id']);
            }
          } else {
            if (allUsers[i]['location_id'] !== null) {
              if ((allUserObject[allUsers[i]['user_id']]['location-ids']).indexOf(allUsers[i]['location_id']) == -1) {
                allUserObject[allUsers[i]['user_id']]['location-ids'].push(allUsers[i]['location_id']);
              }
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
                'em-role': [],
                'account-role': [],
                'location-name': allUsers[i]['name'],
                'location-parent': allUsers[i]['parent_name'],
                'account-role-id': [],
                'em-role-id': []
              };
              if ((allUsers[i]['account_role']) && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                  allUsers[i]['account_role']
                );
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role-id'].push(
                  allUsers[i]['role_id']
                );
              }
              if ( (allUsers[i]['role_name']) && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role-id'].push(allUsers[i]['role_id']);
              }

            }

          }
        } else {
          allUserObject[allUsers[i]['user_id']] = {
            'location-ids': [allUsers[i]['location_id']],
            'first_name': allUsers[i]['first_name'],
            'last_name': allUsers[i]['last_name'],
            'user_id': allUsers[i]['user_id'],
            'email': allUsers[i]['email'],
            'account': allUsers[i]['account_name'],
            'account_id': allUsers[i]['account_id'],
            'mobile_number': allUsers[i]['mobile_number'],
            'locations': {},
            'locations-arr': [],
            'allAccountRoles': []
          };

          if (allUsers[i]['role_id'] != null && allUsers[i]['role_id'] < 3) {
            allUserObject[allUsers[i]['user_id']]['allAccountRoles'].push(allUsers[i]['role_id']);
          }
          // console.log(typeof allUsers[i]['location_id']);
          // console.log(allUsers[i]['location_id'] === null);
          if (allUsers[i]['location_id'] && allUsers[i]['location_id'] != null) {
            allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
              'location-name': allUsers[i]['name'],
              'location-parent': allUsers[i]['parent_name'],
              'account-role': [],
              'em-role': [],
              'account-role-id': [],
              'em-role-id': []

            };
            if (allUsers[i]['account_role'] && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                allUsers[i]['account_role']
              );
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role-id'].push(
                allUsers[i]['role_id']
              );
            }
            if (allUsers[i]['role_name'] && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role-id'].push(allUsers[i]['role_id']);
            }
          }
        }
      }
      Object.keys(allUserObject).forEach((key) => {
        if (Object.keys(allUserObject[key]['locations']).length > 0) {
          allUserObject[key]['locations-arr'] =
            Object.keys(allUserObject[key]['locations']).map((k) => {
              return allUserObject[key]['locations'][k];
            });
        }
        accountUsers.push(allUserObject[key]);
      });

      return res.status(200).send({
        data: {
          'selectedUsers' : selectedUsers,
          'list': accountUsers,
          'total_pages': totalResult,
        },

      });
    });

    router.get('/admin/location-listing/:accountId/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        new AdminRoute().getLocationListing(req, res);
    });

    router.get('/admin/check-user-email/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = new User();
      const emailInput = req.query.user_email;
      user.getByEmail(emailInput).then((data) => {
        return res.status(200).send({
          forbidden: true
        });
      }).catch((e) => {
        return res.status(200).send({
          forbidden: false
        });
      });
    });

    router.post('/admin/add-new-user/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const userForm = JSON.parse(req.body.users);
      // console.log(userForm);
      let accountTrainings = [];
      const invalidUsers = [];
      let createData = {
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        can_login: 1,
        password: '',
        invited_by_user: req.user.user_id,
        account_id: 0,
        token: '',
        location_id: 0
      };

      for (const u of userForm) {
        const user = new User();
        const token = new Token();
        const locationAccntRel = new LocationAccountRelation();
        // check here again for email
        if (validator.isEmail(u['email'])) {
          try {
            await user.getByEmail( u['email']);
          } catch (e) {
          //
            accountTrainings = [];
            createData.first_name = u['first_name'];
            createData.last_name = u['last_name'];
            createData.email = u['email'];
            createData.mobile_number = u['contact'];
            createData.password = md5('Ideation' + u['password'] + 'Max');
            createData.account_id = u['account_id'];
            createData.can_login = 1;
            createData.invited_by_user =  req.user.user_id;
            createData.token = md5(u['email']);
            createData.location_id = u['location'];
            const locationAccntUser = new LocationAccountUser();

            await user.create(createData);
            createData = {
              first_name: '',
              last_name: '',
              email: '',
              mobile_number: '',
              can_login: 1,
              password: '',
              invited_by_user: req.user.user_id,
              account_id: 0,
              token: '',
              location_id: 0
            };
            await token.create({
              id: user.ID(),
              id_type: 'user_id',
              token: md5(u['email']),
              action: 'verify',
              verified: 1,
              expiration_date: moment().format('YYYY-MM-DD HH-mm-ss')
            });

            if (parseInt(u['role'], 10) > 2) {
              // EM Roles UserEmRoleRelation
              try {
                const em_user = new UserEmRoleRelation();
                em_user.create({
                  user_id: user.ID(),
                  em_role_id: u['role'],
                  location_id: u['location']
                });

                // get account trainings
                accountTrainings = await new AccountTrainingsModel().getAccountTrainings(u['account_id'], {
                  role: u['role']
                });
                for (const training of accountTrainings) {
                  await new AccountTrainingsModel().assignAccountUserTraining(
                    user.ID(),
                    training['course_id'],
                    training['training_requirement_id']
                  );
                }
              } catch (e) {
                console.log('Unable to create emergency role', e, createData);
              }

            } else {
              // Account
                // create entry in location account user
                try {
                await locationAccntUser.create({
                  location_id: u['location'],
                  account_id: u['account_id'],
                  user_id: user.ID()
                });

                } catch (e) {
                  console.log('Cannot create entry in db with ', createData);
                }
                /*
                try {
                    await locationAccntRel.getLocationAccountRelation({
                        'location_id': u['location'],
                        'account_id': u['account_id'],
                        'responsibility': defs['role_text'][u['role']]
                    });
                } catch (err) {
                    await locationAccntRel.create({
                        'location_id': u['location'],
                        'account_id': u['account_id'],
                        'responsibility': defs['role_text'][u['role']]
                    });
                }
                */
                // User Role Relation
                const userRoleRelObj = new UserRoleRelation();
                let accountRole = [];
                accountRole = await userRoleRelObj.getUserRoleRelationId({
                  user_id: user.ID(),
                  role_id: u['role']
                });
                if (accountRole.length === 0) {
                  await userRoleRelObj.create({
                    user_id: user.ID(),
                    role_id: u['role']
                  });
                }
            }
          } // end catch clause for making sure email is unique
        } else {
          invalidUsers.push(u['email']);
        }
      }

      return res.status(200).send({
        'message': 'Success',
        'invalid-users': invalidUsers
      });
    });

    router.get('/admin/compliance/kpis/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const kpis =  await new ComplianceKpisModel().getAllKPIs(true);
        return res.status(200).send({
          message: 'Success',
          data: kpis
        });
      } catch (e) {
        console.log(e);
        return res.status(400).send({
          message: 'Fail'          
        });
      }
      
    });

    router.post('/admin/upload/paper-attendance/',
    new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response, next: NextFunction) => {
      // get the last id and increment it
      const attendance = new PaperAttendanceDocumentModel();
      let idDir = await attendance.getLastInsertedId();
      idDir = idDir + 1;
      let filename;

      // process upload
      // const fu = new FileUploader(req, res, next);
      // console.log(req);
      /*
      console.log(req['files']);
      console.log(req.body);
      console.log(idDir);
      */
    const multerConfig = multer.diskStorage({
      destination: (rq, file, callback) => {
          callback(null, __dirname + '/../public/temp');
      },
      filename: (rq, file, callback) => {
          filename = `${Date.now()}_` + file.originalname.replace(/\s+/g, '-');
          callback(null, filename);
      }
    });

    AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
    AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
    AWS.config.region = AWSCredential.AWS_REGION;
    const aws_bucket_name = AWSCredential.AWS_Bucket;
    const aws_s3 = new AWS.S3();
    const paperAttendanceUploader = multer({storage: multerConfig}).single('file');
    paperAttendanceUploader(req, res, async (err) => {
      if (err) {
        console.log('This is the error', err);
        return res.status(400).send({
          message: 'There was a problem uploading the file'
        });
      }
      // console.log(req['file']);
      // console.log(req.body);

      const dataStream = await fs.readFileSync(req['file']['path']);
      // console.log(`paper_attendance/${idDir}/${filename}`);
      // console.log(req['file']['path']);

      const params = {
        Bucket: aws_bucket_name,
        Key: `paper_attendance/${filename}`,
        ACL: 'public-read',
        Body: dataStream
      };
      aws_s3.putObject(params, async (e, d) => {
        if (e) {
          console.log(`error reading file from path`);
          return res.status(400).send({
            message: 'Upload Failed'
          });
        } else {
          // console.log(d);
          let compliance_kpis_id = 0;
          switch(parseInt(req.body.training, 10)) {
            case 16: 
              compliance_kpis_id = 8;
            break;
            case 17:
              compliance_kpis_id = 6;
            break;            
            case 23:
            case 24: 
            case 25:
              compliance_kpis_id = 12;
            break;
            default: 
              compliance_kpis_id = 13;
            break;
          }
          await attendance.create({
            dtTraining: req.body.dtTraining,
            intTrainingCourse: req.body.training,
            intUploadedBy: req.user.user_id,
            strOriginalfilename: filename,
            id: req.body.id,
            type: req.body.type,
            compliance_kpis_id: compliance_kpis_id
          });
        }
      });
    });
    return res.status(200).send({
      message: 'File uploaded successfully'
    });
  });

    router.post('/admin/upload/compliance/evac-diagrams/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        const
            evacDiagramFiles = [],
            errMsgs = [],
            rejectedFiles = [];

        let
            filename = '',
            temp,
            dirPath = '',
            account_id = 0,
            location_id = 0;

        const multerConfig = multer.diskStorage({
            destination: (rq, file, callback) => {
                callback(null, __dirname + '/../public/temp');
            },
            filename: (rq, file, callback) => {
                filename = file.originalname.replace(/\s+/g, '-');
                callback(null, filename);
            }
        });

        AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
        AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
        AWS.config.region = AWSCredential.AWS_REGION;
        const aws_bucket_name = AWSCredential.AWS_Bucket;
        const aws_s3 = new AWS.S3();
        const complianceDocsUploader = multer({storage: multerConfig}).array('file', 100);
        const complianceModel = new ComplianceModel();
        complianceDocsUploader(req, res, async (err) => {
            if (err) {
                console.log('This is the error', err);
                return res.status(400).send({
                    message: 'There was a problem uploading the evacuation diagrams'
                });
            }
            // console.log(req['files']);
            // do file processing here
            let file_parts = [];

            for (const f of req['files']) {
                file_parts = [];
                dirPath = '';
                let parentId = 0;
                temp = null;
                file_parts = f['originalname'].split(/\s+/);

                let
                accntName ='',
                buildingName = '',
                levelName = '',
                dateOfActivity = '';

                if (file_parts.length < 4 && file_parts.length > 5) {
                    rejectedFiles.push(f['filename']);
                    errMsgs.push(`${f['filename']} does not have the correct format`);
                    continue;
                }
                // console.log(file_parts);
                const account = new Account();
                const location = new Location();
                if (file_parts[0] != null) {
                    accntName = file_parts[0].replace(/_/g, ' ');
                    console.log('accntName', accntName);
                    temp = await account.getAccountDetailsUsingName(accntName);
                    if (temp.length > 0) {
                        dirPath += `${temp[0]['account_directory_name']}/`;
                        account_id = temp[0]['account_id'];
                        temp = null;
                    } else {
                        rejectedFiles.push(f['filename']);
                        errMsgs.push(`Cannot get the account directory for ${file_parts[0]}`);
                        continue;
                    }
                }
                // this is the main (building location)
                if (file_parts[1] != null) {
                    buildingName = file_parts[1].replace(/_/g, ' ');
                    console.log('buildingName', buildingName);
                    temp = await location.getLocationDetailsUsingName(buildingName);
                    if (temp.length > 0) {
                        location_id = parentId = temp[0]['location_id'];
                        if (temp[0]['location_directory_name'] == null || temp[0]['location_directory_name'].length == 0) {
                            dirPath += file_parts[1].replace(/\s/g, '') + '/';
                            const myLocation = new Location(temp[0]['location_id']);
                            await myLocation.load();
                            await myLocation.create({
                                location_directory_name: file_parts[1].replace(/\s/g, '')
                            });
                        } else {
                            dirPath += `${temp[0]['location_directory_name']}/`;
                        }
                        temp = null;
                    } else {
                        rejectedFiles.push(f['filename']);
                        errMsgs.push(`Cannot get the location directory for ${file_parts[1]}`);
                        continue;
                    }
                }
                // this is the level part
                if (file_parts[2] != null && file_parts.length == 5) {
                    levelName = file_parts[2].replace(/_/g, ' ');
                    console.log('levelName', levelName);
                    temp = await location.getLocationDetailsUsingName(levelName, parentId);
                    if (temp.length > 0) {
                        // lets update the location directory
                        const myLocation = new Location(temp[0]['location_id']);
                        dirPath += file_parts[2].replace(/\s/g, '') + '/EmergencyEvacuationDiagrams/Primary/';
                        location_id = temp[0]['location_id'];
                        temp = null;
                        await myLocation.load();
                        await myLocation.create({
                            location_directory_name: file_parts[2].replace(/\s/g, '')
                        });
                    } else {
                        errMsgs.push(`There is no such sublocation with the name -  ${file_parts[2]}`);
                        rejectedFiles.push(f['filename']);
                        continue;
                    }
                }
                
                // this is the date part
                if (file_parts[4] != null) {
                    dateOfActivity = file_parts[4].replace(/_/g, ' ');
                    console.log('dateOfActivity', dateOfActivity);
                    if (moment(dateOfActivity, 'DDMMYYYY').isValid()) {
                        temp = moment(dateOfActivity, 'DDMMYYYY').format('YYYY-MM-DD');
                        // console.log(temp);
                    } else {
                        errMsgs.push(`Invalid date format -  ${file_parts[4]}`);
                        rejectedFiles.push(f['filename']);
                        continue;
                    }
                }
                if (file_parts.length == 4) {
                  dateOfActivity = (file_parts[3].split(/\./))[0];
                  // console.log("DATE OF ACTIVITY: " , dateOfActivity);
                  if (moment(dateOfActivity, 'DDMMYYYY').isValid()) {
                    temp = moment(dateOfActivity, 'DDMMYYYY').format('YYYY-MM-DD');
                    // console.log("FORMATTED DATE (via moment): " + temp);
                    dirPath += 'EmergencyEvacuationDiagrams/Primary/';
                  } else {
                    errMsgs.push(`Invalid date format -  ${dateOfActivity}`);
                    rejectedFiles.push(f['filename']);
                    continue;
                  }
                }
                const filteredName = f['filename'].replace(/\s+/g, '-');
                f['key'] = `${dirPath}${filteredName}`;
                f['dtActivity'] = moment(dateOfActivity, 'DDMMYYYY').format('YYYY-MM-DD');
                evacDiagramFiles.push(f);
                console.log(dirPath);
                // console.log(evacDiagramFiles);
                // console.log(errMsgs);
            }



            let marker = 0;
            try {
              async.each(evacDiagramFiles, async (item: object, cb) => {
                const dataStream = await fs.readFileSync(item['path']);
                const params = {
                    Bucket: aws_bucket_name,
                    Key: item['key'],
                    ACL: 'public-read',
                    Body: dataStream
                };
                console.log('Processing ', item['path']);
                aws_s3.putObject(params, async (e, d) => {
                    if (e) {
                        console.log(`error reading file from path`);
                        return res.status(400).send({
                            message: 'Upload Failed'
                        });
                    }
                    const complianceDocObj = new ComplianceDocumentsModel();
                    await complianceDocObj.create({
                        account_id: account_id,
                        building_id: location_id,
                        compliance_kpis_id: '5',
                        override_document: '-1',
                        document_type: 'Primary',
                        file_name: item['filename'],
                        date_of_activity: item['dtActivity'],
                        viewable_by_trp: '1',
                        description: 'Admin upload',
                        file_size: item['size'],
                        file_type: item['mimetype'],
                        timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                    });
                    const today = moment();
                    // const dtActivityValidity = moment(dtActivity).add(validityDuration, 'months');
                    const status = 1;
                    /*
                    let status = 0;
                    if (dtActivityValidity.isAfter(today)) {
                    status = 1;
                    }
                    */

                    await complianceModel.create({
                        compliance_kpis_id: 5,
                        compliance_status: status,
                        building_id: location_id,
                        account_id: account_id,
                        required: 1,
                        override_by_evac: 0
                    });
                    marker++;
                    // console.log(d);
                    // console.log(marker);
                    if (marker == evacDiagramFiles.length) {
                        return res.status(200).send({
                            message: 'Success'
                        });
                    }
                });
              });
            } catch (e) {
               console.log(e, 'Async for in uploading evac diagrams');
            }

            return res.status(200).send({
                account_id : account_id,
                location_id : location_id,
                message: '',
                rejected: rejectedFiles,
                errorMsgs: errMsgs
            });
        });
    });

    router.post('/admin/utility/signedURL/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const utils = new Utils();
      const key = req.body.key;
      let signedUrl = '';
      try {
        signedUrl = await utils.getAWSSignedURL(key);
        return res.status(200).send({
          message: 'Success',
          url: signedUrl
        });
      } catch (e) {
        console.log(`The file ${key} is not found`);
        return res.status(400).send({
          message: `File not found - ${key}`
        });
      }

    });


    router.get('/admin/list/compliance-documents/',
    new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response, next: NextFunction) => {
      const list = new List();
      let tempNameParts = [];
      const hie_locations = [];
      const location = new Location(req.query.location);
      const utils = new Utils();
      // get sublocations if any
      let children = [];
      const sublocations = [];
      sublocations.push(req.query.location);
      if (req.query.kpi == 5 || req.query.kpi == 9) {
        children = await location.getChildren(req.query.location);
        for (const c of children) {
          sublocations.push(c['location_id']);
        }
      }      
      const documents = await list.generateComplianceDocumentList(req.query.account, sublocations, req.query.kpi);
      const location_data = await location.locationHierarchy();
      let details: object = {};
      for (const loc of location_data) {
        loc['display_name'] = '';
        // loop through the assumed heirarchy
        tempNameParts = [];
        let tempColName = '';

        for (let p = 5; p > 0; p--) {
          tempColName = `p${p}_name`;
          if (loc[tempColName] != null) {
            tempNameParts.push(loc[tempColName]);
            details[loc[`p${p}_location_id`]] = loc[tempColName];
            hie_locations.push(details);
            details = {};
          }
        }
        
        details[loc['location_id']] = loc['name'];
        hie_locations.push(details);
        tempNameParts.push(loc['name']);
        loc['display_name'] = tempNameParts.join(' >> ');
      }
      return res.status(200).send({
        data: documents,
        location: location_data,
        displayName: tempNameParts,
        detailsObj: hie_locations,
        children: children,       
        sublocations: sublocations
      });    
    });

    router.post('/admin/upload/compliance-documents/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      let filename = '';
      let dirUploadPath = '';
      const multerConfig = multer.diskStorage({
        destination: (rq, file, callback) => {
          callback(null, __dirname + '/../public/temp');
        },
        filename: (rq, file, callback) => {
          filename = file.originalname.replace(/\s+/g, '_');
          callback(null, filename);
        }
      });
      AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
      AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
      AWS.config.region = AWSCredential.AWS_REGION;
      const aws_bucket_name = AWSCredential.AWS_Bucket;
      const aws_s3 = new AWS.S3();

      let account_id,
        building_id,
        kpis,
        dtActivity,
        description,
        viewable_by_trp,
        account_role,
        document_type,
        override_document,
        compliances = [];
      const arrWhereCompliance = [];



      const complianceDocsUploader = multer({storage: multerConfig}).array('file', 100);
      let validityDuration;
      const kpisModels = await new ComplianceKpisModel().getAllKPIs();
      const complianceModel = new ComplianceModel();
      complianceDocsUploader(req, res, async (err) => {
        if (err) {
          console.log('This is the error', err);
          return res.status(400).send({
            message: 'There was a problem uploading the file'
          });
        }

        // console.log(Object.keys(req.body));
        // console.log(req['files']);
        // console.log(req.body);
        account_role = 'Manager'; // to change
        account_id = req.body.account_id;
        building_id = req.body.building_id;
        kpis = req.body.compliance_kpis_id;
        document_type = req.body.document_type;
        dtActivity = req.body.date_of_activity;
        description = req.body.description;
        viewable_by_trp = 1; // to change
        validityDuration = kpisModels[kpis]['validity_in_months'];
        override_document = req.body.override_document;

        arrWhereCompliance.push([`compliance_kpis_id = ${kpis}`]);
        arrWhereCompliance.push([`building_id = ${building_id}`]);
        arrWhereCompliance.push([`account_role = '${account_role}'`]);
        arrWhereCompliance.push([`account_id = ${account_id} GROUP BY compliance_kpis_id`]);
        compliances = await complianceModel.getWhere(arrWhereCompliance);
        // build upload path directory
        const util = new UtilsSync();
        try {
          dirUploadPath = await util.getAccountUploadDir(account_id, building_id, kpis, document_type);
        } catch (e) {
          console.log('Cannot build directory structure', e);
          return res.status(400).send({
            message: 'Failed. Cannot build directory structure'
          });
        }
        let marker = 0;
        async.each(req['files'], async (item: object, cb) => {
          const dataStream = await fs.readFileSync(item['path']);
          filename = item['originalname'].replace(/\s+/g, '_');
          const params = {
            Bucket: aws_bucket_name,
            Key: `${dirUploadPath}${filename}`,
            ACL: 'public-read',
            Body: dataStream
          };
          console.log('Processing ', item['path'], filename);
          aws_s3.putObject(params, async (e, d) => {
            if (e) {
              console.log(`error reading file from path`);
              return res.status(400).send({
                message: 'Upload Failed'
              });
            }
            // console.log(i, params);
            const complianceDocObj = new ComplianceDocumentsModel();
              await complianceDocObj.create({
                account_id: account_id,
                building_id: building_id,
                compliance_kpis_id: kpis,
                override_document: override_document,
                document_type: document_type,
                file_name: item['originalname'].replace(/\s+/g, '_'),
                date_of_activity: dtActivity,
                viewable_by_trp: viewable_by_trp,
                description: description,
                file_size: item['size'],
                file_type: item['mimetype'],
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
              });
              const today = moment();
              const dtActivityValidity = moment(dtActivity).add(validityDuration, 'months');
              let status = 0;
              if (dtActivityValidity.isAfter(today)) {
                status = 1;
              }
              await complianceModel.create({
                compliance_kpis_id: kpis,
                compliance_status: status,
                building_id: building_id,
                account_id: account_id,
                valid_till: dtActivityValidity.format('YYYY-MM-DD'),
                required: kpisModels[kpis]['required'],
                account_role: account_role,
                override_by_evac: 0
              });
            marker++;
            // console.log(d);
            // console.log(marker);
            if (marker == req['files'].length) {
              return res.status(200).send({
                message: 'Success'
              });
            }
          });

        });
       });
      });




    router.get('/admin/account/trainings/:accountId', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next:NextFunction) => {
        let
        accountId = req.params.accountId,
        response = {
            status : true, data : [], message : '', accountId : accountId, trqmts: [], courses: [], em_roles: []
        };
        const trqmt = new TrainingRequirements();
        const course = new Course();
        const em_roles = new UserEmRoleRelation();
        response.trqmts = await trqmt.getWhere([]);
        response.courses = await course.getWhere([]);
        response.em_roles = <Array<object>> await em_roles.getEmRoles();


        response.data = <any> await new AccountTrainingsModel().getAccountTrainings(accountId);

        res.send(response);
    });

    router.get('/admin/account/location-heirarchy/:accountId', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next:NextFunction) => {
        let
        accountId = req.params.accountId,
        locAccModel = new LocationAccountRelation(accountId),
        response = {
            status : true, data : [], locations : [], message : ''
        },
        filter = {},
        locationsAccount = [];

        filter['archived'] = 0;
        filter['is_building'] = 1;
        locationsAccount = await locAccModel.listAllLocationsOnAccount(accountId, filter);

        let addChildrenLocationToParent = (data) => {
            for(let i in data){
                if('sublocations' in data[i] == false){
                    data[i]['sublocations'] = [];
                }

                for(let x in data){
                    if(data[x]['parent_id'] == data[i]['location_id']){
                        if('sublocations' in data[i] == false){
                            data[i]['sublocations'] = [];
                        }

                        let d = {};
                        for(let l in data[x]){
                            if(l.indexOf('@pi') == -1){
                                d[l] = data[x][l];
                            }
                        }

                        data[i]['sublocations'].push(d);
                    }
                }
            }

            let finalData = [];
            for(let i in data){
                let hasParent = false;
                for(let x in data){
                    if( data[i]['parent_id'] == data[x]['location_id'] ){
                        hasParent = true;
                    }
                }
                if(!hasParent){
                    finalData.push( data[i] );
                }
            }

            return finalData;
        }

        let responseLocations = [];
        for(let loc of locationsAccount){
            let
            deepLocModel = new Location(),
            deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);

            deepLocations.push(loc);

            let locMerged = addChildrenLocationToParent(deepLocations),
                respLoc = (locMerged[0]) ? locMerged[0] : false;

            if(respLoc){

                let alreadyHave = false;
                for(let resloc of responseLocations){
                    if(resloc.location_id == respLoc.location_id){
                        alreadyHave = true;
                    }
                }

                if(!alreadyHave){
                    responseLocations.push(respLoc);
                }
            }
        }

        response.locations = responseLocations;

        res.send(response);
    });


    router.post('/admin/generate-admin-report', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AdminRoute().generateAdminReport(req, res);
    });

    router.get('/admin/search/user/location/account/:keyword', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AdminRoute().searchUsersLocationsAndAccount(req, res);
    });

    router.get('/admin/user-information/:userId', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AdminRoute().getUserInformation(req, res);
    });

    router.get('/admin/get-tagged-locations-from-account/:accountId', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AdminRoute().getTaggedLocationsFromAccount(req, res);
    });

    router.post('/admin/tag-account-to-existing-loc/', new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
      new AdminRoute().tagAccountToExistingLocation(req, res);
    });

    router.post('/admin/manual-send-notification-summary-link/', new MiddlewareAuth().authenticate, 
    (req: AuthRequest, res: Response) => {
      new AdminRoute().manualSendNotificationSummaryLink(req, res);
    });
  // ===============
  }

  public async manualSendNotificationSummaryLink(req: AuthRequest, res: Response) {
    const user = req.body.userId;
    const role = req.body.roleId;
    const account = req.body.accountId;

    // get the location based on the role and account.
    const userObj = new User();
    const userInLocations = await userObj.getUserInLocationByRole(role, account, user);
    
    let strToken;
    const limiter = new RateLimiter(2, 'second');
    for (let u of userInLocations) {
      strToken = cryptoJs.AES.encrypt(`${user}_${u['location_id']}_${u['building_id']}_${role}_${account}_${Date.now()}`, process.env.KEY).toString();      
      u['token'] = strToken;
      // send the email to user
      const opts = {
        from : '',
        fromName : 'EvacConnect',
        to : ['emacaraig@evacgroup.com.au'],
        cc: [],
        body : '',
        attachments: [],
        subject : ''
      };
      const email = new EmailSender(opts);
      
      limiter.removeTokens(1, (err, remainingRequests) => {
        email.sendFormattedEmail('send-summary-notification-link', {
          users_fullname: `${u['first_name']} ${u['last_name']}`,
          link: 'http://' + req.get('host') + '/accounts/process-summary-link-token/?token=' + encodeURIComponent(u['token']),
          role: defs['summary_role_label'][role],
          location: `${u['name']} ${u['Building']}`,
          account: u['account_name']
        }, res, 
          (data) => {
            console.log(data);
            const token = new Token();
            token.create({
              token: u['token'],
              action: 'view',
              verified: 0,
              expiration_date: moment().add(2, 'day').format('YYYY-MM-DD HH:MM:ss'),
              id: u['location_id'],
              id_type: 'location_account_user.location_id'
            }).then(() => {             
              strToken = null;
            });
          },
          (err) => console.log(err)
        );
      });
    }
    res.status(200).send({
      message: 'Success'
    });

    

  }

  public async tagAccountToExistingLocation(req: AuthRequest, res: Response) {
     const accountId = req.body.accountId;
     const managingRole = req.body.managing_role;

     const buildingLocation = req.body.building;
     const sublocations = JSON.parse(req.body.sublocs);
     console.log(req.body);
     let locAcctRel = new LocationAccountRelation();
      let filter = {};
     if (managingRole == 'Manager') {       
      try {
        filter['location_id'] = buildingLocation;
        filter['account_id'] = accountId;
        filter['responsibility'] = 'Manager';
        await locAcctRel.getLocationAccountRelation(filter);
      } catch (e) {
        console.log(e, 'Creating building record');
        await new LocationAccountRelation().create(filter);
      }
    } 
    for( let sub of sublocations) {
      filter = {};
      try {
        locAcctRel = new LocationAccountRelation();
        filter['location_id'] = sub;
        filter['account_id'] = accountId;
        filter['responsibility'] = 'Tenant';
        await locAcctRel.getLocationAccountRelation(filter);
        locAcctRel = null;
      } catch (e) {
        console.log(e);
        console.log('creating sublocation record');
        await new LocationAccountRelation().create(filter);
      }          
    }

    res.status(200).send({
       message: 'Success'
    });

  }



    private async getUsersOfReport(req: AuthRequest, frptrp?){
        let
        accountId = (req.body.account_id) ? req.body.account_id : 0,
        locationId = (req.body.location_id) ? req.body.location_id : 0,
        type = (req.body.type) ? req.body.type : '',
        locationModel = new Location(locationId),
        sublocationModel = new Location(),
        accountModel = new Account(),
        usersModel = new User(),
        users = <any> [],
        allAccountIds = [],
        accounts = <any> [],
        locations = <any> [],
        allLocationIds = [],
        limit = (req.body.limit) ? req.body.limit : 25,
        offset = (req.body.offset) ? (req.body.offset > -1) ? req.body.offset : 0  : 0,
        offLimit = (limit == -1) ? false : offset+','+limit,
        usersCount = [];

        if(locationId > 0){
            try{
                let
                loc = await locationModel.load(),
                deepLocations = [];
                locations.push(loc);
                allLocationIds.push(locationId);

                deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(locationId);
                for(let deeploc of deepLocations){
                    allLocationIds.push(deeploc.location_id);
                }
            }catch(e){}
        }else{
            let whereLoc = [];
            whereLoc.push(' archived = 0 ');
            try{
                locations = <any> await locationModel.getWhere( whereLoc );
                for(let loc of locations){
                    allLocationIds.push(loc.location_id);
                }
            }catch(e){  }
        }

        if(type == 'face'){
            users = <any> await usersModel.getAllActive(accountId);
            usersCount = <any> await usersModel.getAllActive(accountId, true);
        }else{
            if(frptrp){
                users = <any> await usersModel.getIsFrpTrp(accountId, false, offLimit, allLocationIds.join(','));
                usersCount = <any> await usersModel.getIsFrpTrp(accountId, true, undefined, allLocationIds.join(','));
            }else{
                users = <any> await usersModel.getIsEm(accountId, false, offLimit, allLocationIds.join(','));
                usersCount = <any> await usersModel.getIsEm(accountId, true, undefined, allLocationIds.join(','));
            }
        }


        let total = (usersCount[0]) ? usersCount[0]['count'] : 0;
        let pages = 0;

        if(total > limit){
            let div = total / limit,
                rem = (total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            pages = totalpages;
        }

        if(pages == 0 && total <= limit && total > 0){
            pages = 1;
        }

        return {
            'users' : users,
            'total' : (usersCount[0]) ? usersCount[0]['count'] : 0,
            'pages' : pages
        };
    }

    private async getLocationsOfUsersReport(req: AuthRequest, userIds, frptrp?){
        let
        locationId = (req.body.location_id) ? req.body.location_id : 0,
        locAccUser = new LocationAccountUser(),
        userEmModel = new UserEmRoleRelation(),
        locations = <any> [];

        if(userIds.length > 0){
            if(frptrp){
                locations = <any> await locAccUser.getLocationsByUserIds(userIds.join(','), locationId);
            }else{
                locations = <any> await userEmModel.getLocationsByUserIds(userIds.join(','), locationId);
            }
        }

        return locations;
    }

    private async getUsersAndPaginations(req: AuthRequest){
        let
        response = <any> {
            pagination : <any> {
                total : 0,
                pages : 0
            },
            data : <any>[],
            certificates : <any>[],
            message : '',
        },
        accountId = (req.body.account_id) ? req.body.account_id : 0,
        type = (req.body.type) ? req.body.type : '',
        users = <any> [],
        allUserIds = [],
        isFrpTrp = (type == 'account') ? true : false,
        locationModel = new Location(),
        locations = <any> [];

        let useraAndCountResponse = <any> await this.getUsersOfReport(req, isFrpTrp);

        users = useraAndCountResponse.users;

        for(let user of users){
            allUserIds.push(user.user_id);
        }

        locations = <any> await this.getLocationsOfUsersReport(req, allUserIds, isFrpTrp);
        response['locations'] = locations;

        for(let user of users){
            if(!user['locations']){
                user['locations'] = [];
            }

            if(!user['roles']){
                user['roles'] = [];
            }

            for(let loc of locations){
                if(loc.user_id == user.user_id){
                    if(user['locations'].indexOf(loc.name) == -1){
                        user['locations'].push(loc.name);
                    }
                    if(user['roles'].indexOf(loc.role_name) == -1){
                        user['roles'].push(loc.role_name);
                    }
                }
            }
        }

        response['users'] = users;
        response.pagination.total = useraAndCountResponse.total;
        response.pagination.pages = useraAndCountResponse.pages;
        return response;
    }

    public async generateAdminReport(req: AuthRequest, res: Response){
        let
        response = <any> {
            pagination : <any> {
                total : 0,
                pages : 0
            },
            data : <any>[],
            message : '',
        },
        accountId = (req.body.account_id) ? req.body.account_id : 0,
        type = (req.body.type) ? req.body.type : '';

        if(type.trim().length > 0){
            let data = <any> await this.getUsersAndPaginations(req);
            response['data'] = data.users;

            for(let user of data.users){
                user['full_name'] = user.first_name+' '+user.last_name;
            }

            if(type == 'training'){
                for(let user of data.users){
                    let
                    trainCertModel = new TrainingCertification(),
                    certificates = <any> await trainCertModel.getCertificatesByInUsersId(user.user_id, null, null, null, null, user.training_requirement_id);

                    user['certificates'] = certificates;
                    user['status'] = (certificates.length > 0) ? certificates[0]['status'] : 'Invalid';
                    let expDate;
                    user['expiry_date_formatted'] = '';
                    if (certificates.length > 0 && 'expiry_date' in certificates[0]) {
                      expDate = moment(certificates[0]['expiry_date']);
                      user['expiry_date_formatted'] = (certificates.length > 0) ? (expDate.isValid()) ?  expDate.format('DD/MM/YYYY') : '' : '';
                    } 
                    
                }
            }else if(type == 'face'){
                let
                allAccountIds = [],
                userModel = new User(),
                frptrps = <any> [];

                for(let user of data.users){
                    if(allAccountIds.indexOf(user.account_id) == -1){
                        allAccountIds.push(user.account_id);
                    }
                }

                response['allAccountIds'] = allAccountIds;

                frptrps = <any> await userModel.getIsFrpTrp(allAccountIds.join(','));
                let emails = [];
                for(let frp of frptrps){
                    if(emails.indexOf(frp.email) == -1){
                        emails.push(frp.email);
                    }
                }

                for(let user of data.users){
                    user['cc_emails'] = emails.join(', ');
                }
            }

            response.pagination.total = data.pagination.total;
            response.pagination.pages = data.pagination.pages;
        }


        res.send(response);
    }

    public async getLocationListing(req: AuthRequest, res: Response, toReturn?){
      const locAccntRelObj = new LocationAccountRelation();
      let locationsForManager;
      let locationsForTRP;
      const buildingIds = [];

      const listModel = new List();


      // locationsForManager = await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Manager']});
      locationsForManager = await listModel.listAllTaggedBuildingsOfAccount(req.params.accountId);
      // console.log('LocationForManager',locationsForManager );
      for (const location of locationsForManager) {
        buildingIds.push(location['location_id']);
      }
      // GET ALL SUBLEVELS
      const list = new List();
      let levelLocations: Object = {
        resultArray: [],
        resultObject: {},
        resultLocationIds: []
      };

      if (buildingIds.length == 0) {
        locationsForTRP = await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Tenant']});
        for (const location of locationsForTRP) {
          buildingIds.push(location['parent_id']);
        }
        const locationObj = new Location();
        locationsForManager = await locationObj.bulkLocationDetails(buildingIds);
      }
      levelLocations = await list.generateSublocationsForListing(buildingIds);
      /*
      console.log('======================= BUILDING IDS ======================== ');
      console.log(buildingIds);
      console.log('*********************** LEVEL LOCATIONS ***************************');
      console.log(levelLocations);
      */
      // get locations for location_account_relation and merged it in buildingIds
      const locationsForTrpFromLAR =
        await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Tenant']});

      const uniqLocationsUnderFRP = [];
      for (const location of locationsForTrpFromLAR) {
        if (levelLocations['resultLocationIds'].indexOf(location['location_id']) === -1) {
          uniqLocationsUnderFRP.push(location['location_id']);
        }
      }

      const locationInLAR = await list.generateLocationDetailsForAddUsers(uniqLocationsUnderFRP);
      if(!toReturn){
          return res.status(200).send({
            data: {
              buildings: locationsForManager,
              levels: levelLocations['resultArray'].concat(locationInLAR),
              lar: locationInLAR
            }
          });
      }else{
          return {
            data: {
              buildings: locationsForManager,
              levels: levelLocations['resultArray'].concat(locationInLAR),
              lar: locationInLAR
            }
          };
      }
       
    }

    public async searchUsersLocationsAndAccount(req: AuthRequest, res: Response){
        let 
        keyword = req.params.keyword,
        filter = (req.query.filter) ? req.query.filter : 'global',
        userModel = new User(),
        results = <any> [];

        results = await userModel.searchUsersLocationsAndAccount(keyword, filter);

        res.send(results);
    }

    public async getUserInformation(req: AuthRequest, res: Response){
        let 
        userId = req.params.userId,
        userModel = new User(userId),
        user = <any> {},
        account = <any> {},
        response = {
            status : false, data : <any> {}, message : ''
        },
        userRoleModel = new User(),
        userLocationAndRoles = new User(),
        accountModel = new Account();

        try{
            user = await userModel.load();
            user['last_login'] = moment(user['last_login']).format('MMM. DD, YYYY hh:mm A');

            response.data['user'] = user;
            response.data['roles'] = await userRoleModel.getAllRoles(user['user_id']);
            response.data['location_roles'] = await userLocationAndRoles.getAllRolesAndLocations(user['user_id']);

            accountModel.setID(user['account_id'])
            account = await accountModel.load();
            response.data['account'] = account;

            
            let trainingModel = new TrainingCertification();
            response.data['trainings'] = <any> await trainingModel.getCertificatesByInUsersId([user['user_id']]);

        }catch(e){
            response.message = 'No user found';
        }


        res.send(response);

    }

    public async getTaggedLocationsFromAccount(req: AuthRequest, res: Response){
        let 
        accountId = req.params.accountId,
        locAccRel = new LocationAccountRelation();

        let data = await locAccRel.getTaggedLocationsOfAccount(accountId);

        res.send(data);
    }

    public async setInvitePassword(req: AuthRequest, res: Response, next: NextFunction) {
      const user = new User(req.body.user);
      const dbData = await user.getAllRolesAndLocations(req.body.user); 
      const roleArr = [];
      const locNameArr = [];
      let roleStr = '';
      let locStr = '';
      let tkString = '';
      const newToken  = new Token();
      for (let data of dbData) {
        if (roleArr.indexOf(data['role']) == -1) {
          roleArr.push(data['role']);
        }
        if (locNameArr.indexOf(data['name']) == -1) {
          locNameArr.push(data['name']);
        }
      }
      roleStr = roleArr.join(' and ');
      locStr = locNameArr.join(' and ');
      const userData = await user.load();
      const account = new Account(userData['account_id']);
      const accountData = await account.load();
      // create token
      let tokenObj = new Token();
      let tokenDbData = <any>[];
      try {
        tokenDbData = await tokenObj.getAllByUserId(req.body.user);
        for (const t of tokenDbData) {
          if(t['action'] == 'setup-invite-passwd') {
            let tokenDeleteObj = new Token(t['token_id']);
            await tokenDeleteObj.delete();
            tokenDeleteObj = null;
          }
        }
      } catch(e) {
        console.log(e);
      }
      tkString = userData['user_id']+ '' + this.generateRandomChars(15);
      if (userData['token'] == null) {
        user.set('token', tkString);
        await user.write();
      }
      await newToken.create({
        id: userData['user_id'],
        id_type: 'user_id',
        token: tkString,
        action: 'setup-invite-passwd',
        expiration_date:  moment().add(1, 'day').format('YYYY-MM-DD')
      });
      const opts = {
        from : '',
        fromName : 'EvacConnect',
        to : [userData['email']],
        cc: ['emacaraig@evacgroup.com.au', 'jmanoharan@evacgroup.com.au'],
        body : '',
        attachments: [],
        subject : 'EvacConnect Email Notification'
      };
      const email = new EmailSender(opts);
      const emailData = {
        users_fullname: userData['first_name'] + ' ' + userData['last_name'],
        account_name: accountData['account_name'],
        role: roleStr,
        location_name: locStr,
        setup_link: 'https://' + req.get('host') + '/change-user-password/'+tkString 
      };
      email.sendFormattedEmail('set-passwd-invite', emailData, res, 
        (data) => console.log(data),
        (err) => console.log(err)
      );
    
    return res.status(200).send({
      message: 'Success'
    });
  }

}
