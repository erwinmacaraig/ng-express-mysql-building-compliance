import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { UserInvitation } from './../models/user.invitation.model';
import {NotificationConfiguration } from '../models/notification_config.model';
import { NotificationToken } from '../models/notification_token.model';
import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { List } from '../models/list.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { AccountSubscription } from '../models/account.subscription.model';
import * as moment from 'moment';
import { AuthenticateLoginRoute } from './authenticate_login';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
import { Token } from '../models/token.model';
import { UtilsSync } from '../models/util.sync';
const validator = require('validator');
const cryptoJs = require('crypto-js');
const defs = require('../config/defs.json');
const RateLimiter = require('limiter').RateLimiter;

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

	   	router.post('/accounts/create', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new AccountRoute().create(req, res);
	   	});

	   	router.get('/accounts/get-all', (req: Request, res: Response) => {
	   		new AccountRoute().getAll(req, res);
	   	});

      router.get('/accounts/is-online-training-valid', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AccountRoute().isOnlineTrainingValid(req, res);
      });

      router.get('/accounts/search-building/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new AccountRoute().searchForBuildings(req, res);
      });

      router.post('/accounts/create-notification-config/', new MiddlewareAuth().authenticate,
      (req: AuthRequest, res: Response, next: NextFunction) => {
        new AccountRoute().notificationConfig(req, res);
      });

      router.get('/accounts/list-notification-config/', new MiddlewareAuth().authenticate,
      (req: AuthRequest, res: Response, next: NextFunction) => {
        new AccountRoute().listNotificationConfig(req, res);
      });

      router.get('/accounts/list-notified-users/', new MiddlewareAuth().authenticate,
      (req: AuthRequest, res: Response, next: NextFunction) => {
        new AccountRoute().listNotifiedUsers(req, res);
      });

      router.get('/accounts/verify-notified-user/', (req: Request, res: Response, next: NextFunction) => {
        new AccountRoute().verifyNotifiedUser(req, res);
      });

      router.get('/accounts/query-notified-user/', (req: Request, res: Response, next: NextFunction) => {
        new AccountRoute().queryNotifiedUser(req, res);
      });

    router.post('/accounts/process-query-notified-user-responses/',
      new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      new AccountRoute().processQueryResponses(req, res);
    });

    router.get('/accounts/notification-all-wardens/',
      new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
        new AccountRoute().listWardensOnNotificationScreen(req, res);
      }
    );

    router.get('/accounts/notification-all-peep/',
      new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
        new AccountRoute().listPEEPOnNotificationScreen(req, res);
      }
		);
		
		router.post('/accounts/notification-actions/',
		    new MiddlewareAuth().authenticate, (req: Request, res: Response, next: NextFunction) => {
				new AccountRoute().performNotificationAction(req, res);
			}			
		);
		
		router.get('/accounts/process-summary-link-token/',
			(req: Request, res: Response, next: NextFunction) => {
				new AccountRoute().processNotificationSummaryLink(req, res);
			}
		);

		router.post('/accounts/generate-notification-summary-list/',
			new MiddlewareAuth().authenticate, (req: AuthRequest, res:Response, next:NextFunction) => {
				new AccountRoute().generateUserListOfNotifiedUsers(req, res);
			}
		);

		router.post('/accounts/perform-notification-summ-action',
			new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
				new AccountRoute().performActionOnSummaryList(req, res);
			});

		router.get('/accounts/verify-as-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new AccountRoute().verifyIamWarden(req, res);
		});

		router.get('/accounts/location-listing/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new AccountRoute().getLocationListing(req, res);
		});

		router.get('/accounts/location/roles', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
			new AccountRoute().accountUsersInLocation(req, res);
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

	public async accountUsersInLocation(req: AuthRequest, res: Response) {
		let assignedLocations = [];
		let buildings = [];
		let sublocations = [];
		let tempArr = [];
		let whereLoc = [];
		const location = new Location();
		assignedLocations = JSON.parse(req.query.assignedLocations);
		
		if (assignedLocations.length == 0) {
			return res.status(500).send({
				account_roles: [],
				message: 'No account role'
			});
		}
		whereLoc.push( `location_id IN (${assignedLocations.join(',')})`);
		tempArr = await location.getWhere(whereLoc) as Array<object>;
		
		for (let index of tempArr) {
			if (buildings.indexOf(index['parent_id']) == -1 && index['parent_id'] != -1) {
				buildings.push(index['parent_id'])
			} else if(buildings.indexOf(index['location_id']) == -1 && index['parent_id'] == -1 && index['is_building'] == 1) {
				buildings.push(index['location_id']);
				sublocations.push(index['location_id']);
			}
		}

		whereLoc = [];
		tempArr = [];

		whereLoc.push(`parent_id IN (${buildings.join(',')})`);
		tempArr = await location.getWhere(whereLoc) as Array<object>;
		
		const locationAccountRelation = new LocationAccountRelation();
		const locsInAccount = await locationAccountRelation.getByAccountId(req.user.account_id);
		const locsInAccountArr = [];
		for (let loc of locsInAccount) {
			locsInAccountArr.push(loc['location_id']);
		}

		for (let loc of tempArr) {
			if (locsInAccountArr.indexOf(loc['location_id']) != -1) {
				sublocations.push(loc['location_id']);				
			}
		}
		
		tempArr = [];
		const locationAcctUser = new LocationAccountUser();
		let listArray = [];
		try {
			listArray = await locationAcctUser.generateUserAccountRoles(req.user.account_id, sublocations);
		} catch(e) {
			console.log(e);
			return res.status(500).send({
				account_roles: [],
				message: 'Cannot determine location from location account relation table'
			});
		}
		
		const userAccountRoleObj = {};
		
		for (let item of listArray) {
			item['account_roles'] = [];
			tempArr.push(item['user_id']);
			userAccountRoleObj[item['user_id']] = [];			
		}

		let accountRole: Object[] = await new UserRoleRelation().getManyByUserIds(tempArr.join(','));
		for (let role of accountRole) {
			if (role['user_id'] in userAccountRoleObj) {
				userAccountRoleObj[role['user_id']].push(defs['account_role_text'][role['role_id']]);
			}
		}
		
		for (let item of listArray) {
			item['account_roles'] = userAccountRoleObj[item['user_id']];
		}


		return res.status(200).send({
			account_roles: listArray
		});
	}

	public async getLocationListing(req: AuthRequest, res: Response) {

		const locationAccountRelation = new LocationAccountRelation();
		
		const buildings = [];
		const buildingObjArr = [];
		const locations = [];
		const locationObj:{ [i:number]: {} } = {};
		try {
			const allLocations = await locationAccountRelation.getTaggedLocationsOfAccount(req.user.account_id);
			for (let loc of allLocations) {
				if (loc['is_building'] == 1 && buildings.indexOf(loc['location_id']) == -1) {
					buildings.push(loc['location_id']);
					buildingObjArr.push(loc);				
				} else if (loc['parent_id'] != -1) {
					if (loc['parent_id'] in locationObj) {
						locationObj[loc['parent_id']]['sublocation'].push(loc);
					} else {
						locationObj[loc['parent_id']] = {							
							name: loc['parent_name'],
							location_id: loc['parent_id'],
							sublocation: [loc] 
						};
					}
				}
			}
			Object.keys(locationObj).forEach(key => {
				locations.push(locationObj[key]);
			});
			return res.status(200).send({
				buildings: buildingObjArr,
				locations: locations
			});
		} catch (e) {
			console.log(e);
			return res.status(500).send({
				message: 'No tagged location'
			});
		}

	}
	public async generateUserListOfNotifiedUsers(req: AuthRequest, res: Response) {
		const buildingId = req.body.building;
		const roleId = req.body.role;
		const accountId = req.user.account_id;
		const accountUsers = new LocationAccountUser();
		const accountUserIds = [];
		const emUserIds = [];
		const token = new NotificationToken();
		const emUsers = new UserEmRoleRelation();
		let list;
		// Get all sublevels from the building
		const buildingLocationObj = new Location(buildingId);
		const sublocations = await buildingLocationObj.getChildren(buildingId);
		const sublocationIds = [];
		for (let sub of sublocations) {
			sublocationIds.push(sub['location_id']);
		}
		// we still need to include the building itself
		sublocationIds.push(buildingId);
		
		if (roleId == 1) {
			// filter TRP users
			const trpUsers = await accountUsers.TRPUsersForNotification(sublocationIds);
			// console.log('=================== TRP ======================' , trpUsers);
			for (let tu of trpUsers) {
				accountUserIds.push(tu['user_id']);
			}
			list = await token.generateSummaryList({
				user_ids: accountUserIds,
				role_text: `= 'TRP'`
			});
		} else if (roleId == 2) {
			
			const emergencyUsers = await emUsers.emUsersForNotification(sublocationIds);
			// get only related to account and only GO and Warden
			// console.log('=================== EM ======================' ,emergencyUsers);
			for (let em of emergencyUsers) { 
				
				if (em['account_id'] == accountId && (em['em_role_id'] == 8  || em['em_role_id'] == 9)) {
					emUserIds.push(em['user_id']);
				}
			}
			list = await token.generateSummaryList({
				user_ids: emUserIds,
				role_text: `<> 'TRP'`
			});
		}

		return res.status(200).send({
			list: list
		});

	}
	public async processNotificationSummaryLink(req: Request, res: Response) {
		let strToken = decodeURIComponent(req.query.token);
		
		const bytes = cryptoJs.AES.decrypt(strToken, process.env.KEY);
		const strTokenDecoded = bytes.toString(cryptoJs.enc.Utf8);
		const parts = strTokenDecoded.split('_');
		console.log(parts);
		if (parts.length != 6) {
			return res.redirect('/success-valiadation?verify-notified-user=2');
		}

		const tk = new Token();
		try {
			const tkdbData = await tk.getByToken(strToken);
			tkdbData['verified'] = 1;
			await tk.create(tkdbData);
		} catch (e) {
			return res.redirect('/success-valiadation?verify-notified-user=2');
		}

		const uid = parts[0];
		const lid = parts[1];
		const bid = parts[2]
		const rid = parts[3];
		const aid = parts[4];

		const user = new User(uid);
		const userDbData = await user.load();
		const authRoute = new AuthenticateLoginRoute();
    const userRole = new UserRoleRelation();
		let hasFrpTrpRole = false;
		try{
      await userRole.getByUserId(userDbData['user_id']);
      hasFrpTrpRole = true;
    } catch (e){
      hasFrpTrpRole = false;
    }
    const loginResponse = <any> await authRoute.successValidation(req, res, user, 7200, true);
    let stringUserData = JSON.stringify(loginResponse.data);
		stringUserData = stringUserData.replace(/\'/gi, '');
		const cipherText = cryptoJs.AES.encrypt(`${userDbData['user_id']}_${lid}_${bid}_${rid}_${aid}`, 'NifLed').toString();
		const redirectUrl = 'http://' + req.get('host') + '/dashboard/notification-summary-view/' + encodeURIComponent(cipherText);
    const script = `
                <h4>Redirecting...</h4>
                <script>
                    localStorage.setItem('currentUser', '${loginResponse.token}');
                    localStorage.setItem('userData', '${stringUserData}');

                    setTimeout(function(){
                        window.location.replace("${redirectUrl}")
                    }, 500);
                </script>
            `;

    res.status(200).send(script);

	}
	public async performNotificationAction(req, res) {
		// console.log(req.body);
		const action = req.body.action;
		const notification_token_id = parseInt(req.body.notification_token_id, 10);
		const notificationTokenObj = new NotificationToken(notification_token_id);
		const notificationTokenDbData = await notificationTokenObj.load();
		
		let emailType;		
		if (Object.keys(notificationTokenDbData).length == 0) {
			return res.status(400).send({
				message: 'No such token exists'
			});
		}
		if (notificationTokenDbData['role_text'] == 'TRP') {
			emailType = 'trp-confirmation';
		} else if(notificationTokenDbData['role_text'] == 'FRP') {
			emailType = 'frp-confirmation';
		} else {
			emailType = 'warden-confirmation';
		}
    
		const notificationConfigObj = new NotificationConfiguration(notificationTokenDbData['notification_config_id']);
		const notificationConfigDbData = await notificationConfigObj.load();
		const user = new User(notificationTokenDbData['user_id']);
		const userDbData = await user.load();
		const buildingObj = new Location(notificationConfigDbData['building_id']);
		const buildingDbData = await buildingObj.load();		
		const sublocationObj = new Location(notificationTokenDbData['location_id']);
		const sublocationDbData = await sublocationObj.load();

		let locTextEmail;
		if (notificationConfigDbData['building_id'] == notificationTokenDbData['location_id']) {
			locTextEmail = buildingDbData['name'];
		} else {
			locTextEmail = `${buildingDbData['name']},  ${sublocationDbData['name']}`;
		}


		const account = new Account(userDbData['account_id']);
		const accountDbData = await account.load();
		switch(action) {
			case 'resend':
			let strToken = cryptoJs.AES.encrypt(`${Date.now()}_${notificationTokenDbData['user_id']}_${notificationTokenDbData['location_id']}_${notificationTokenDbData['notification_config_id']}`, process.env.KEY).toString();
      const opts = {
        from : '',
        fromName : 'EvacConnect',
				to: [userDbData['email']],
        cc: [],
        body : '',
        attachments: [],
        subject : 'EvacConnect Email Notification'
			};


			let 
      emailData = {
        message : notificationConfigDbData['message'].replace(/(?:\r\n|\r|\n)/g, '<br>'),
        users_fullname : this.toTitleCase(userDbData['first_name']+' '+ userDbData['last_name']),
        account_name : accountDbData['account_name'],
        location_name : locTextEmail,
        yes_link : 'http://' + req.get('host') + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken),
        no_link : 'http://' + req.get('host') + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken),
        role : notificationTokenDbData['role_text']
			};			
			const email = new EmailSender(opts);			
			email.sendFormattedEmail(emailType, emailData, res, 
				(data) => console.log(data),
				(err) => console.log(err)
			);

			await notificationTokenObj.create({
        strToken: strToken,
				dtExpiration: moment().add(21, 'day').format('YYYY-MM-DD'),
				strStatus: 'Pending',
				responded: 0,
				dtResponded: '0000-00-00',
				completed: 0,
				dtCompleted: '0000-00-00',
				strResponse: '',
				dtLastSent: moment().format('YYYY-MM-DD'),
				manually_validated_by: 0
      });

			return res.status(200).send({
				message: `Email sent to ${userDbData['first_name']} ${userDbData['last_name']} at ${userDbData['email']}`
			});
		
		case 'validate': 
			await notificationTokenObj.create({
				strToken: '',
				strStatus: 'Validated',
				responded: 1,
				dtResponded: moment().format('YYYY-MM-DD'),
				completed: 1,
				dtCompleted: moment().format('YYYY-MM-DD'),
				manually_validated_by: req.user.user_id
			});
		  return res.status(200).send({
         message: `${userDbData['first_name']} ${userDbData['last_name']} has been validated.`
			});
		}

	}

  public async listPEEPOnNotificationScreen(req, res) {
    const buildingId = req.query.building;
    let locations = [];
    const tempIds = [];
    let finalPeepList = [];
    let accountPeep = [];
    let emPeep = [];


    const locationObj = new Location();
    locations = await locationObj.getParentsChildren(buildingId, 0);
    locations.push(buildingId);

    const peepObj = new MobilityImpairedModel();
    accountPeep = await peepObj.listAllMobilityImpaired(req.user.account_id, locations, 'account');
    emPeep = await peepObj.listAllMobilityImpaired(req.user.account_id, locations, 'emergency');

    accountPeep = accountPeep.concat(emPeep);

    for (const peep of accountPeep) {
      if (tempIds.indexOf(peep['user_id']) == -1) {
        tempIds.push(peep['user_id']);
        if (peep['date_created'] == null) {
          peep['status'] = 'Not validated';
        } else {
          peep['status'] = 'Validated';
        }
        finalPeepList.push(peep);
      }
    }

    return res.status(200).send({
      message: 'Success',
      data: finalPeepList
    });


  }

  public async listWardensOnNotificationScreen(req, res) {
    const buildingId = req.query.building;
    let locations = [];

    const locationObj = new Location();
    locations = await locationObj.getParentsChildren(buildingId, 0);
    locations.push(buildingId);
    const EMRoleObj = new UserEmRoleRelation();
    const wardens = await EMRoleObj.getWardensInLocationIds(locations.join(','), 0, req.user.account_id);

    return res.status(200).send({
      message: 'Success',
      data: wardens
    });


  }

  public async processQueryResponses(req, res) {
		console.log(req.body);
		const uid = req.user.user_id;
		const configId = req.body.configId;		
		const theAnswers = req.body.query_responses;
		const tokenObj = new NotificationToken();
		const tokenDBData = await tokenObj.loadByContraintKeys(uid, configId);
    
    tokenDBData['strResponse'] = theAnswers;
    tokenDBData['completed'] = 1;
		tokenDBData['strStatus'] = 'Resigned';

		try {
			await tokenObj.create(tokenDBData);		
			const theAnswersObj = JSON.parse(theAnswers);
			const opts = {
				from : '',
				fromName : 'EvacConnect',
				to: [],
				cc: [],
				body: '',
				attachments: [],
				subject: 'EvacConnect Email Notification User Response'
			};
			let bodyStr = '';
			Object.keys(theAnswersObj).forEach((key) => {
				bodyStr += `<br>${key}: ${theAnswersObj[key]}`;
			});

			const email = new EmailSender(opts);
			const emailData = {
				full_name: `${req.user.first_name} ${req.user.last_name}`,
				status: `Resigned`,
				message: bodyStr				
			};
			
			email.sendFormattedEmail('notification-response', emailData, res, 
				(data) => console.log(data),
				(err) => console.log(err)
			);

			res.status(200).send({
				status: 'Success',
				data: tokenDBData
			});
		}catch(e) {
			console.log(e);
		}
		
		

		/*		
    
    const responsesToQueryArr = JSON.parse(req.body.query_responses);
    
    const update_token = req.body.update_token;
    let nominatedUserName = '';
    let nominatedUserEmail = '';
    let changeLocation = {
      from_location_id : 0,
      to_location_id : 0,
      user_em_roles_relation_id : 0
    };
    const completed = parseInt(req.body.completed, 10);
    const status = req.body.strStatus;
    

    if (completed) {
			tokenDBData['dtCompleted'] = moment().format('YYYY-MM-DD');
			tokenDBData['dtResponded'] = moment().format('YYYY-MM-DD');
			tokenDBData['responded'] = 1;
      tokenDBData['strToken'] = '';
    }
    try {
      if(update_token){
        await tokenObj.create(tokenDBData);
      }

      // email
      for (const item of responsesToQueryArr) {
        if (item['question'] == 'New person appointed name') {
          nominatedUserName = item['ans'];
        }
        if (item['question'] == 'New person appointed email') {
          nominatedUserEmail = item['ans'];
        }
      }

      if (nominatedUserName.length > 0 && nominatedUserEmail.length > 0) {
        const opts = {
          from : '',
          fromName : 'EvacConnect',
          to : [nominatedUserEmail],
          cc: [],
          body : '',
          attachments: [],
          subject : 'EvacConnect Email Notification'
        };

        const email = new EmailSender(opts);
        let emailBody = email.getEmailHTMLHeader();
        emailBody += `<h3 style="text-transform:capitalize;">Hi ${nominatedUserName},</h3>
        You are being nominated as ${tokenDBData['role_text']}.
        `;
        emailBody += email.getEmailHTMLFooter();
        email.assignOptions({
          body : emailBody
        });
        email.send(
          (data) => console.log(data),
          (err) => console.log(err)
        );

      }

      if(status == 'Location Changed'){
        for(let i in responsesToQueryArr){
          if(responsesToQueryArr[i]['question'] == 'Old location'){
            changeLocation.from_location_id = responsesToQueryArr[i]['ans'];
          }
          if(responsesToQueryArr[i]['question'] == 'New location'){
            changeLocation.to_location_id = responsesToQueryArr[i]['ans'];
          }
          if(responsesToQueryArr[i]['question'] == 'user_em_roles_relation_id'){
            changeLocation.user_em_roles_relation_id = responsesToQueryArr[i]['ans'];
          }
        }

        if(changeLocation.from_location_id > 0 && changeLocation.to_location_id > 0){
          let 
          locModel = new Location(),
          parentModel = new Location(),
          ids = [changeLocation.from_location_id, changeLocation.to_location_id],
          parentids = [],
          locationsFromAndTo = <any> await locModel.getByInIds( ids.join(',') ),
          parents = <any> [],
          fromLoc = <any> {},
          toLoc = <any> {},
          isDiffLoc = false,
          emRoleRelModel = new UserEmRoleRelation(changeLocation.user_em_roles_relation_id),
          arrWhereEmRole = [];

          arrWhereEmRole.push([ 'user_em_roles_relation_id = '+ changeLocation.user_em_roles_relation_id ]);
          let emData = <any> await emRoleRelModel.getWhere(arrWhereEmRole);
          if(emData[0]){
            emData = emData[0];
          }
          

          for(let loc of locationsFromAndTo){
            if(loc.location_id == changeLocation.from_location_id){
              fromLoc = loc;
            }
            if(loc.location_id == changeLocation.to_location_id){
              toLoc = loc;
            }
          }

          parentids = [fromLoc.parent_id, toLoc.parent_id];
          parents = await parentModel.getByInIds( parentids.join(',') );

          fromLoc['parent'] = <any> {};
          toLoc['parent'] = <any> {};
          for(let loc of parents){
            if(fromLoc.parent_id == loc.location_id){
              fromLoc['parent'] = loc;
            }
            if(toLoc.parent_id == loc.location_id){
              toLoc['parent'] = loc;
            }
          }

          if( toLoc.is_building == 1 && fromLoc.is_building == 1 ){
            if( fromLoc.location_id != toLoc.location_id ){
              isDiffLoc = true;
            }
          }else if(fromLoc.is_building == 1 && toLoc.is_building == 0){
            if(fromLoc.location_id != toLoc.parent_id){
              isDiffLoc = true;
						}
						if(fromLoc.location_id != toLoc.location_id){
              isDiffLoc = true;
						}
          }else if(fromLoc.is_building == 0 && toLoc.is_building == 1){
            if(fromLoc.parent_id != toLoc.location_id){
              isDiffLoc = true;
						}						
          } else if(fromLoc.parent_id != toLoc.parent_id){
            isDiffLoc = true;
          }
          //Send Email To TRP and Admin
          if(isDiffLoc){
            await this.sendChangeLocationEmails(fromLoc, toLoc, emData);
          }else{
            for(let i in emData){
              emRoleRelModel.set(i, emData[i]);
            }
            emRoleRelModel.set('location_id', toLoc.location_id);
            await emRoleRelModel.dbUpdate();
          }

        }

			} else if (status == 'Tenancy Moved Out') {
				const trpLocationToQuery = tokenObj['location_id'];
			}
			
		

      return res.status(200).send({
        message: 'Success',
        data: tokenDBData
      });
    } catch(e) {
      console.log('accounts route processQueryResponses()', e , tokenDBData);
      return res.status(400).send({
      message: 'Fail',
      data: tokenDBData
      });
		}
		*/

	}
	
	public async performActionOnSummaryList(req: AuthRequest, res: Response) {

		const reqData = JSON.parse(req.body.info);
		const role = req.body.role;
		
		const action = req.body.action;
		const tokenDbData = await new NotificationToken(reqData['notification_token_id']).load();
		let emailType = '';
		if (role == 1) {
			emailType = 'trp-confirmation';
		} else if (role == 2) {
			emailType = 'warden-confirmation';
		}
		const allData = { ...tokenDbData, 
			host: req.get('host'),
			emailType: emailType,
			role_name: reqData['role_name'],
			first_name: reqData['first_name'],
			last_name: reqData['last_name'],
			account_name: reqData['account_name'],
			parent: reqData['parent'],
			name: reqData['name']
		};		
		let util;

		switch(action) {
			case 'resend':
				
				util = new UtilsSync();
				util.sendToNotification(0,'resend-notification', 0, '', allData, res).then(() => {
					tokenDbData['lastActionTaken'] = 'Resend';
					new NotificationToken().create(tokenDbData).then(() => {
						return res.status(200).send({
							'message': 'Notification sent',
							'dbData': tokenDbData
						});
					}).catch((e) => {
						return res.status(400).send({
							'message': 'There was a problem resending notification.'							
						});
					});
					
				});

			break;
			case 'change-location':
				const responsesToQuery = JSON.parse(tokenDbData['strResponse']);
				console.log(responsesToQuery);
				let newLocationId = 0;
				let emRoleRelId = 0;
				for (let r of responsesToQuery) {
					if (r['question'] == 'New location') {
						newLocationId = r['ans'];
						console.log(`new location id = ${newLocationId}`);
					}
					if (r['question'] == 'user_em_roles_relation_id') {
						emRoleRelId = r['ans']; 
						// console.log(`em role id is ${emRoleRelId}`);
						const emRoleRel = new UserEmRoleRelation(emRoleRelId);
						const emData = await emRoleRel.load();
            // console.log(emData);
						if (emData['location_id'] != newLocationId) {
							emData['location_id'] = newLocationId;
							emRoleRel.create(emData).then(() => {
								res.status(200).send({
									message: 'Success re-assignment'
								});
							}).catch((e) => {
								res.status(400).send({
									message: e.toString()
								});
							});
						} else {
							res.status(200).send({
								message: 'User is already assigned to the location'
							});
						}						
					}
				}				
			break;

			case 'tenancy-moved-out':
				// get FRPs in the building
				const locationObj = await new Location(tokenDbData['location_id']).load();
				const parentLocationId = locationObj['parent_id'] == -1 ? tokenDbData['location_id'] : locationObj['parent_id'];
        const frpUsersInBuilding = await new LocationAccountUser().getFRPinBuilding(parentLocationId);
				// to improve
				console.log(frpUsersInBuilding);
				for (let frp of frpUsersInBuilding) {
					const opts = {
						from : '',
						fromName : 'EvacConnect',
						to : ['emacaraig@evacgroup.com.au'],
						cc: [],
						body : new EmailSender().getEmailHTMLHeader() + `
						Hi ${frp['first_name']} ${frp['last_name']}, <br><br>
						${reqData['first_name']} ${reqData['last_name']} of ${reqData['account_name']} has notified that their tenancy has moved out. <br>
						Confirmation is required. <br>`
						+ new EmailSender().getEmailHTMLFooter(),
						attachments: [],
						subject : 'EvacConnect Notification'
					};
					new EmailSender(opts).send(
						(data) => console.log(data),
						(err) => console.log(err)
					);
				} 
				return res.status(200).send({
					'message': 'Email sent',
					'FRP': frpUsersInBuilding 
				});
			
		}
	}

  private async sendChangeLocationEmails(fromLoc, toLocations, emData){
    let 
    locIds = [toLocations.location_id],
    locModel = new Location(),
    locAccUser = new LocationAccountUser(),
    trps = <any> [],
    userModel = new User(emData.user_id),
    user = <any> await userModel.load(),
    roleName = emData.role_name;

    if(toLocations.is_building == 1){
      let locs = <any> await locModel.getDeepLocationsByParentId(toLocations.location_id);
      for(let loc of locs){
        locIds.push(loc.location_id);
      }
    }

    trps = await locAccUser.getTrpByLocationIds(locIds.join(','));
    trps.push({
      'first_name' : 'Erwin',
      'last_name' : 'Macaraig',
      'email' : 'emacaraig@evacgroup.com.au'
    });

    for(let tr of trps){
      const opts = {
        from : '',
        fromName : 'EvacConnect',
        to : [tr.email],
        cc: [],
        body : '',
        attachments: [],
        subject : 'EvacConnect Change Location'
      };

      const email = new EmailSender(opts);
      let 
      fromLocationName = (fromLoc.parent.name) ? fromLoc.parent.name+', '+fromLoc.name : fromLoc.name,
      toLocationName = (toLocations.parent.name) ? toLocations.parent.name+', '+toLocations.name : toLocations.name,
      emailBody = email.getEmailHTMLHeader(),
      usersFullname = user.first_name+' '+user.last_name,
      fullname = tr.first_name+' '+tr.last_name;

      emailBody += `<h3 style="text-transform:capitalize;">Hi ${fullname},</h3>
        <p>
          ${usersFullname} would like to change his location from ${fromLocationName} to ${toLocationName} as ${roleName}. <br>
          Confirmation is needed.
        </p>
      `;
      emailBody += email.getEmailHTMLFooter();
      email.assignOptions({
        body : emailBody
      });
      await email.send(
        (data) => console.log(data),
        (err) => console.log(err)
      );
    }

  }

  public async queryNotifiedUser(req: Request, res: Response) {
    let strToken = decodeURIComponent(req.query.token);
    const tokenObj = new NotificationToken();
    const bytes = cryptoJs.AES.decrypt(strToken, process.env.KEY);
    const strTokenDecoded = bytes.toString(cryptoJs.enc.Utf8);

    const parts = strTokenDecoded.split('_');
    const uid = parts[1];
    const configId = parts[3];

    const tokenDbData = await tokenObj.loadByContraintKeys(uid, configId);

    const configurator = new NotificationConfiguration(configId);
    const configDBData = await configurator.load();

    const user = new User(uid);

    const userDbData = await user.load();
    const authRoute = new AuthenticateLoginRoute();
    const userRole = new UserRoleRelation();
    let hasFrpTrpRole = false;

    const loginAction = async (redirectUrl) => {
      const loginResponse = <any> await authRoute.successValidation(req, res, user, 7200, true);
      let stringUserData = JSON.stringify(loginResponse.data);
      stringUserData = stringUserData.replace(/\'/gi, '');

      const script = `
          <h4>Redirecting...</h4>
          <script>
            localStorage.setItem('currentUser', '${loginResponse.token}');
            localStorage.setItem('userData', '${stringUserData}');

            setTimeout(function(){
              window.location.replace("${redirectUrl}")
            }, 1000);
          </script>
      `;
      res.status(200).send(script);
    };


    if ( !(Object.keys(tokenDbData)).length) {
      return res.redirect('/success-valiadation?verify-notified-user=0');
    }
    if (tokenDbData['completed']) {
      return res.redirect('/success-valiadation?verify-notified-user=0');
    }
    // todo token expireds
    if (tokenDbData['expiration_status'] == 'expired') {
      return res.redirect('/success-valiadation?verify-notified-user=0');
    }

    if (!(Object.keys(userDbData)).length) {
      return res.redirect('/success-valiadation?query-notified-user=0');
		}
		


		const cipherText = cryptoJs.AES.encrypt(`${userDbData['user_id']}_${tokenDbData['location_id']}_${configId}_${configDBData['building_id']}_${tokenDbData['role_text']}`, 'NifLed').toString();
		
		// the fact that the user clicked the link, we should update the token
		tokenDbData['strStatus'] = 'Responded';
		tokenDbData['responded'] = 1;
		tokenDbData['dtResponded'] = moment().format('YYYY-MM-DD');
		try {
			await tokenObj.create(tokenDbData);
		} catch(e) {
			console.log(e);
		}			

    if(tokenDbData['role_text'] != 'TRP' && tokenDbData['role_text'] != 'FRP'){
			// const redirectUrl = 'http://' + req.get('host') + '/dashboard/warden-notification?userid='+tokenDbData['user_id']+'&locationid='+tokenDbData['location_id']+'&stillonlocation=no&token='+encodeURIComponent(cipherText);
			const redirectUrl = 'http://' + req.get('host') + '/dashboard/role-resignation?token='+encodeURIComponent(cipherText);
      await loginAction(redirectUrl);
    } else if (tokenDbData['role_text'] == 'FRP') {
			await tokenObj.create({
				responded: 1,
				completed: 1,
				strResponse: 'No',
        strStatus: 'Resigned',
				dtResponded: moment().format('YYYY-MM-DD'),
				dtCompleted: moment().format('YYYY-MM-DD')
			});
			const accountDbData = await new Account(userDbData['account_id']).load();
			const locationDbData = await new Location(tokenDbData['location_id']).load();

			// send email notification to admin
			const opts = {
				from : '',
				fromName : 'EvacConnect',
				to : ['rsantos.evacgroup.com.au'],				
				cc: ['emacaraig@evacgroup.com.au'],
				body : new EmailSender().getEmailHTMLHeader() + `<br> ${userDbData['first_name']} ${userDbData['last_name']} of ${accountDbData['account_name']} <br>
				says that he/she is <strong>NO LONGER</strong> the FRP at ${locationDbData['name']}.` + 
				new EmailSender().getEmailHTMLFooter(),
				attachments: [],
				subject : 'EvacConnect Email Notification'
			};
			const email = new EmailSender(opts);
			email.send((success) => {
				console.log('Sent successfully');
			}, (error) => {
				console.log('Email cannot be sent');
			});
			return res.redirect('/success-valiadation?verify-notified-user=3');
		} else {
      try{
        await userRole.getByUserId(userDbData['user_id']);
        hasFrpTrpRole = true;
      } catch (e){
        hasFrpTrpRole = false;
      }
      // update record
      await tokenObj.create({
        responded: 1,
        strStatus: 'In Progress',
        dtResponded: moment().format('YYYY-MM-DD')
  		});
  		
  		const userResponded: Array<number> = configDBData['user_responded'].split(',');
  		if (userResponded.indexOf(uid) == -1) {
  			userResponded.push(uid);
  			configDBData['responders'] = configDBData['responders'] + 1;
  			configDBData['user_responded'] = userResponded.join(',');
  			await configurator.create(configDBData);
			}
			
			
      const redirectUrl = 'http://' + req.get('host') + '/dashboard/process-notification-queries/' + encodeURIComponent(cipherText);
			await loginAction(redirectUrl);
			

    }



  }
  public async verifyNotifiedUser(req: Request, res: Response) {
		
		let strToken = decodeURIComponent(req.query.token);		
		
    const tokenObj = new NotificationToken();
    const  bytes = cryptoJs.AES.decrypt(strToken, process.env.KEY);
    const strTokenDecoded: string = bytes.toString(cryptoJs.enc.Utf8);

    console.log('strTokenDecoded', strTokenDecoded);
    const authRoute = new AuthenticateLoginRoute();
    
    const parts = strTokenDecoded.split('_');
    const uid = parseInt(parts[1], 10);
    const configId = parseInt(parts[3], 10);

    const user = new User(uid);
		const userDbData = await user.load();
		
    const userRole = new UserRoleRelation();
    let hasFrpTrpRole = false;

    const tokenDbData = await tokenObj.loadByContraintKeys(uid, configId);
    // console.log(tokenDbData);
    const configurator = new NotificationConfiguration(configId);
    const configDBData = await configurator.load();

    const loginAction = async (redirectUrl) => {
      const loginResponse = <any> await authRoute.successValidation(req, res, user, 7200, true);
      let stringUserData = JSON.stringify(loginResponse.data);
			stringUserData = stringUserData.replace(/\'/gi, '');			
      const script = `
          <h4>Redirecting...</h4>
          <script>
            localStorage.setItem('currentUser', '${loginResponse.token}');
            localStorage.setItem('userData', '${stringUserData}');
						localStorage.setItem('concfg', ${configId});
						
            setTimeout(function(){
              window.location.replace("${redirectUrl}")
            }, 2500);
          </script>
			`;			
      res.status(200).send(script);
    };

    if ( !(Object.keys(tokenDbData)).length) {
      return res.redirect('/success-valiadation?verify-notified-user=0');
    }
    if (tokenDbData['completed']) {
      return res.redirect('/success-valiadation?verify-notified-user=0');
    }
    // todo token expired
    if (tokenDbData['expiration_status'] == 'expired') {
      return res.redirect('/success-valiadation?verify-notified-user=0');
		}	
		
		// update record 	
		await tokenObj.create({	
			strToken: '',	
			strStatus: 'Validated',
			responded: 1,
			dtResponded: moment().format('YYYY-MM-DD'),
			completed: 1,
			dtCompleted: moment().format('YYYY-MM-DD')
		});
		const cipherText = cryptoJs.AES.encrypt(`${uid}_${tokenDbData['location_id']}_${configId}_${tokenDbData['notification_token_id']}_${configDBData['building_id']}`, 'NifLed').toString();			
		//const redirectUrl = 'http://' + req.get('host') + '/dashboard/person-info?confirmation=true&r='+encodeURIComponent(tokenDbData['role_text']);
		const redirectUrl = 'http://localhost:4200/dashboard/person-info?confirmation=true&r='+encodeURIComponent(tokenDbData['role_text'])+`&cfg=${configId}`;

		const userResponded: Array<number> = configDBData['user_responded'].split(',');
		if (userResponded.indexOf(uid) == -1) {
			userResponded.push(uid);
			configDBData['responders'] = configDBData['responders'] + 1;
			configDBData['user_responded'] = userResponded.join(',');
			await configurator.create(configDBData);
		}
		await loginAction(redirectUrl);

/*
    if(tokenDbData['role_text'] != 'TRP' && tokenDbData['role_text'] != 'FRP'){
			const redirectUrl = 'http://' + req.get('host') + '/dashboard/person-info?confirmation=true&r='+encodeURIComponent(tokenDbData['role_text']);
			//const redirectUrl = 'http://localhost:4200/dashboard/warden-notification?userid='+tokenDbData['user_id']+'&locationid='+tokenDbData['location_id']+'&stillonlocation=yes&step=1&token='+encodeURIComponent(cipherText);
			
			await loginAction(redirectUrl);
    }else{
      try{
        await userRole.getByUserId(uid);
        hasFrpTrpRole = true;
      } catch (e){
        hasFrpTrpRole = false;
      }

      

  		const userResponded: Array<number> = configDBData['user_responded'].split(',');
  		if (userResponded.indexOf(uid) == -1) {
  			userResponded.push(uid);
  			configDBData['responders'] = configDBData['responders'] + 1;
  			configDBData['user_responded'] = userResponded.join(',');
  			await configurator.create(configDBData);
  		}

			
      if (hasFrpTrpRole && tokenDbData['role_text'] != 'FRP') {
        const redirectUrl = 'http://' + req.get('host') + '/success-valiadation?verify-notified-user=1&token=' + encodeURIComponent(cipherText);
        await loginAction(redirectUrl);
      } else if (tokenDbData['role_text'] == 'FRP') {
				const accountDbData = await new Account(userDbData['account_id']).load();
				const locationDbData = await new Location(tokenDbData['location_id']).load();

				// send email notification to admin
				const opts = {
					from : '',
					fromName : 'EvacConnect',
					to : ['rsantos.evacgroup.com.au'],				
					cc: [],
					body : new EmailSender().getEmailHTMLHeader() + `<br> ${userDbData['first_name']} ${userDbData['last_name']} of ${accountDbData['account_name']} <br>
					says that he/she is <strong>STILL</strong> the FRP at ${locationDbData['name']}.` + 
					new EmailSender().getEmailHTMLFooter(),
					attachments: [],
					subject : 'EvacConnect Email Notification'
				};
				const email = new EmailSender(opts);
				email.send((success) => {
					console.log('Sent successfully');
				}, (error) => {
					console.log('Email cannot be sent');
				});
				return res.redirect('/success-valiadation?verify-notified-user=1');
			} else {
        return res.redirect('/success-valiadation?verify-notified-user=1');
      }
    }

		*/
	}
	
	public async verifyIamWarden(req: AuthRequest, res:Response) {
		const configId  = req.query.configId;
		if(configId == 0) {
			return res.status(500).send({
				message: 'config id cannot be null/void/0'
			});
		}
		const notificationTokenObj = new NotificationToken();
		const notificationConfigObj = new NotificationConfiguration(configId);
		const configData = await notificationConfigObj.load();
		configData['responders'] += 1;
		configData['user_responded'] =  `${configData['user_responded']},${req.user.user_id}`;
		const tokenData = await notificationTokenObj.loadByContraintKeys(req.user.user_id, configId);
		tokenData['strToken'] = null;
		tokenData['responded'] = 1;
		tokenData['completed'] = 1;
		tokenData['strStatus'] = 'Validated';
		tokenData['dtResponded'] = moment().format('YYYY-MM-DD');
		tokenData['dtCompleted'] = moment().format('YYYY-MM-DD');
		let message = 'Success';
		try {
			await notificationConfigObj.create(configData);
			await notificationTokenObj.create(tokenData);
		} catch(e) {
			console.log(e);
			message = e.toString();
		}

		return res.status(200).send({
			message: message,
			config: configData,
			token: tokenData
		});



	}


	
  public async listNotifiedUsers(req: AuthRequest, res: Response) {
    const notification_config_id = req.query.config_id;
	  const tokenObj = new NotificationToken();
    const notificationList: Array<object> = await tokenObj.generateNotifiedUsers(req.query.config_id);

    return res.status(200).send({
	    message: 'Success',
		  data: notificationList
	});
  }

  public async listNotificationConfig(req: AuthRequest, res: Response) {
    const configurator = new NotificationConfiguration();
		// todo: check first if the user is an admin or not,
		// if admin, no need to supply account id,
		// if not, supply account id

		let accountId = 0;
		if (req.user.evac_role != 'admin') {
			accountId = req.user.account_id;
		}
		const list = await configurator.generateConfigData(accountId);

		
    return res.status(200).send({
      data: list
    });
  }

  public async notificationConfig(req: AuthRequest, res: Response) {
    const config = JSON.parse(req.body.config);
    // get sub levels within the building that belongs to the account
    const location = new Location();
    const configurator = new NotificationConfiguration();
    const sublevels = [];
    let userType = '';
    // Allow 2 requests per second . Also understands
    // 'hour', 'minute', 'day', or a number of milliseconds
    // https://github.com/jhurliman/node-rate-limiter
    const limiter = new RateLimiter(2, 'second');

    const sublevelsObj = await location.getChildren(config['building_id']);
    for(const s of sublevelsObj) {
      sublevels.push(s['location_id']);
    }
    sublevels.push(config['building_id']);

    let 
    locModel = new Location(config['building_id']),
    locData = <any> {
      location_name : ''
    };
    try{
      locData = await locModel.load();
      locData.location_name = locData['name'];
    }catch(e){}

    let trp = [];
		let eco = [];
		let frp = [];
    let allUsers = [];
    const allUserIds = [];
    let allUserIdStr = '';
    let location_ids = [];
    const lauObj = new LocationAccountUser();
		const uemr = new UserEmRoleRelation();
		// const frpUsersInBuilding = await new LocationAccountUser().getFRPinBuilding(config['building_id']);
    let accountModel = new Account(req.user.account_id);
    let account = <any> {
      account_name : ''
    };
    try{
      account = await accountModel.load();
    }catch(e){}

    // filter these sublevels that belongs to the account
    try{
      if (config['user_type'] == 'trp') {
        userType = 'trp';
        allUsers = await lauObj.TRPUsersForNotification(sublevels);
      } else if (config['user_type'] == 'eco') {
        userType = 'eco';
        eco = await uemr.emUsersForNotification(sublevels);
      } else if (config['user_type'] == 'all_users') {
        userType = 'all';
        trp = await lauObj.TRPUsersForNotification(sublevels);
				eco = await uemr.emUsersForNotification(sublevels);
				frp = await new LocationAccountUser().FRPUsersForNotification(config['building_id']);
			
				allUsers = [...trp, ...eco, ...frp];
      } else if (config['user_type'] == 'frp') {
				userType = 'frp';
				allUsers = await new LocationAccountUser().FRPUsersForNotification(config['building_id']);
			}
    }catch(e){
      console.log(e);
    }

    for(let ec of eco){
      let isUserInAllUsers = false;
      for(let user of allUsers){
        if(ec['user_id'] == user['user_id']){
          isUserInAllUsers = true;
        }
      }
      if(!isUserInAllUsers){
        allUsers.push(ec);
      }

      for(let user of allUsers){
        if(ec['user_id'] == user['user_id']){
          if(!user['eco_roles']){
            user['eco_roles'] = [];
            user['eco_sublocation_names'] = [];
            user['eco_role_names'] = [];
          }

          if(user['eco_sublocation_names'].indexOf(ec['name']) == -1){
            user['eco_sublocation_names'].push(ec['name']);
          }

          if(user['eco_role_names'].indexOf(ec['role_name']) == -1){
            user['eco_role_names'].push(ec['role_name']);
          }

          user['eco_roles'].push({
            'role_id' : ec['em_roles_id'],
            'role_name' : ec['role_name'],
            'location_id' : ec['location_id'],
            'parent_id' : ec['parent_id'],
            'location_name' : ec['name']
          });
        }
      }
    }

    
    for (const u of allUsers) {

      if (allUserIds.indexOf(u['user_id']) == -1) {
        allUserIds.push(u['user_id']);
        location_ids.push(u['location_id']);
      }
    }
    if (allUserIds.length > 0) {
      allUserIdStr = allUserIds.join(',');
    }

    await configurator.create({
      building_id: config['building_id'],
      account_id: req.user.account_id,
      user_type: userType,
      users: allUserIdStr,
      message: config['message'],
      frequency: config['frequency'],
      recipients: allUserIds.length,
      building_manager: req.user.user_id,
      dtLastSent: moment().format('YYYY-MM-DD')
    });
    
    for (const u of allUsers) {
      let strToken = cryptoJs.AES.encrypt(`${Date.now()}_${u['user_id']}_${u['location_id']}_${configurator.ID()}`, process.env.KEY).toString();
      let notificationToken = new NotificationToken();
      await notificationToken.create({
        strToken: strToken,
        user_id: u['user_id'],
        location_id: u['location_id'],
        role_text: u['role_name'],
        notification_config_id: configurator.ID(),
				dtExpiration: moment().add(21, 'day').format('YYYY-MM-DD'),
				dtLastSent: moment().format('YYYY-MM-DD')
      });
			notificationToken = null;

      let locTextEmail = locData.location_name;
      let emailRole = '';
      if (u['eco_sublocation_names']) {
        locTextEmail = locTextEmail +' '+ u['eco_sublocation_names'].join(',');
        emailRole = u['eco_role_names'].join(',');
      }else{
  			if (u['name'] && u['name'].length > 0) {
  				locTextEmail = locData.location_name + ', ' + u['name'];
  			}
      }

      let 
      emailData = {
        message : config['message'].replace(/(?:\r\n|\r|\n)/g, '<br>'),
        users_fullname : this.toTitleCase(u['first_name']+' '+u['last_name']),
        account_name : u['account_name'],
        location_name : locTextEmail,
        yes_link : 'http://' + req.get('host') + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken),
        no_link : 'http://' + req.get('host') + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken),
        role : emailRole
      },
      emailType = 'warden-confirmation';
      if(u['role_name']){
        if(u['role_name'] == 'TRP'){
          emailType = 'trp-confirmation';
        } else if (u['role_name'] == 'FRP') {
					emailType = 'frp-confirmation';
				}
      }
      if (config['eco_user']) {
        emailType = 'warden-confirmation';
      }
      const opts = {
        from : '',
        fromName : 'EvacConnect',
				to : [u['email']],
        body : '',
        attachments: [],
        subject : 'EvacConnect Email Notification'
      };
      const email = new EmailSender(opts);
			
      limiter.removeTokens(1, (err, remainingRequests) => {
        email.sendFormattedEmail(emailType, emailData, res, 
          (data) => console.log(data),
          (err) => console.log(err)
        );
      });
			
    }

    return res.status(200).send({
      configId: configurator.ID()
    });

  }


  public async searchForBuildings(req: AuthRequest, res: Response) {
    let accountId = <any> req.user.account_id;
    const queryBldgName = req.query.bldgName;
    const larIds = [];

    if(req.user.evac_role == 'admin'){
        accountId = 'admin';
    }

    const list = new List();
    const lar = await list.listTaggedLocationsOnAccount(accountId, {
      is_building: 1,
      name: queryBldgName
    });

    for (const location of lar) {
      larIds.push(location['location_id']);
    }
    const locationsFromLAU: Array<object> = await list.listTaggedLocationsOnAccountFromLAU(accountId, {'exclusion_ids': larIds,
      is_building: 1,
      name: queryBldgName
    });

    const accountLocations = lar.concat(locationsFromLAU);
    return res.status(200).send({
      data: accountLocations
    });

  }

	public async getAll(req: Request, res: Response){
		let  response = {
			status : true,
			message : '',
			data : []
		},
		account = new Account();

		response.data = <any> await account.getAll();
		res.send(response);
	}

    public async isOnlineTrainingValid(req: AuthRequest, res: Response){
        let  response = { valid : false },
        account = new Account(req.user.account_id);

        try{

            let accData = <any> await account.load();
            if(accData.online_training == 1){
                response.valid = true;
            }

        }catch(e){}

        res.send(response);
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

	public async create(req: AuthRequest, res: Response){
		let reqBody = req.body,
			locationId = reqBody.location_id,
			response = {
				status : false,
				message : '',
				data : {}
			},
			accountModel = new Account(),
			locationAccountModel = new LocationAccountRelation(),
			locationModel = new Location();

		let locations = await locationModel.getAncestries(locationId);

		let mainParent = {};
		for(let i in locations){
			if(locations[i]['parent_id'] == -1){
				mainParent = locations[i];
			}
		}

		let assignChildToParent = (child, parentId) => {
			for(let i in locations){
				if(locations[i]['location_id'] == parentId){
					locations[i]['sublocations'].push(child);
				}
			}
		};

		try{

			await accountModel.create(reqBody);

			for(let i in locations){
				await locationAccountModel.create({
					location_id : locations[i]['location_id'],
					account_id : accountModel.ID(),
					responsibility : 'Tenant'
				});
			}

			response.status = true;
			response.message = 'Success';

		}catch(e){
			response.message = e;
		}


		res.send(response);
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
	        from : '',
	        fromName : 'EvacConnect',
	        to : [],
	        body : '',
	        attachments: [],
	        subject : 'EvacConnect Invitation'
	    };

		let email = new EmailSender(opts),
			emailBody = email.getEmailHTMLHeader(),
			link = 'http://' + req.get('host') +'/custom-resolver?role_id='+inviData.role_id+'&invitation_code_id='+inviData.invitation_code_id+'&code='+inviData.code;

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

                let limit = false;
                if(req.query.limit){
                    limit = req.query.limit;
                }

				account.searchByAccountName(req.params['name'], limit).then(
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

