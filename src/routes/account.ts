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
const validator = require('validator');
const cryptoJs = require('crypto-js');
import * as moment from 'moment';
import { AuthenticateLoginRoute } from './authenticate_login';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
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
	
	public async performNotificationAction(req, res) {
		// console.log(req.body);
		const action = req.body.action;
		const notification_token_id = parseInt(req.body.notification_token_id, 10);
		const notificationTokenObj = new NotificationToken(notification_token_id);
		const notificationTokenDbData = await notificationTokenObj.load();
		
		if (Object.keys(notificationTokenDbData).length == 0) {
			return res.status(400).send({
				message: 'No such token exists'
			});
		}
    
		const notificationConfigObj = new NotificationConfiguration(notificationTokenDbData['notification_config_id']);
		const notificationConfigDbData = await notificationConfigObj.load();
		const user = new User(notificationTokenDbData['user_id']);
		const userDbData = await user.load();
		const buildingObj = new Location(notificationConfigDbData['building_id']);
		const buildingDbData = await buildingObj.load();		
		const sublocationObj = new Location(notificationTokenDbData['location_id']);
		const sublocationDbData = await sublocationObj.load();
		const account = new Account(userDbData['account_id']);
		const accountDbData = await account.load();
		switch(action) {
			case 'resend':
			let strToken = cryptoJs.AES.encrypt(`${Date.now()}_${notificationTokenDbData['user_id']}_${notificationTokenDbData['location_id']}_${notificationTokenDbData['notification_config_id']}`, process.env.KEY).toString();
      const opts = {
        from : '',
        fromName : 'EvacConnect',
				to: [userDbData['email']],
        cc: ['emacaraig@evacgroup.com.au', 'jmanoharan@evacgroup.com.au'],
        body : '',
        attachments: [],
        subject : 'EvacConnect Email Notification'
			};
			const email = new EmailSender(opts);
			const link = 'https://' + req.get('host') + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken);
      const yesLink = 'https://' + req.get('host') + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken);
      let emailBody = email.getEmailHTMLHeader();
			
			emailBody += `<pre>Hi ${userDbData['first_name']} ${userDbData['last_name']},</pre>`;
      emailBody += `<pre>Please confirm you are still the Tenant Responsible Person (TRP)* for ${accountDbData['account_name']} at ${buildingDbData['name']}, ${sublocationDbData['name']}</pre><br />`;
      emailBody += `<a href="${yesLink}" target="_blank" style="text-decoration:none; border: none; color: White; line-height: 36px; padding:15px 50px 15px 50px; background-color: #ff9800; box-sizing: border-box; border-radius: 5px;">Yes</a> &nbsp; <a href="${link}" target="_blank" style="text-decoration:none;border: none; color: White; width: 250px; line-height: 50px; padding: 15px 50px 15px 50px; background-color: #2196F3; box-sizing: border-box; border-radius: 5px;">No</a><br />
      <pre>${notificationConfigDbData['message']}</pre><br />`;
      emailBody += `<pre>Would you like more information on EvacConnect or Emergency Planning?</pre>

      <p style="margin-top: 30px;"><a href="https://www.evacservices.com.au/emergency-planning-101-why-plan-for-emergencies/" target="_blank" style="text-decoration:none; color: black; border:2px solid #ff9800; box-sizing: border-box; border-radius: 5px; line-height: 36px; padding:10px 203px 10px 20px;">The importance of planning for emergencies</a></p>
      <p style="margin-top: 35px;"><a href="https://www.evacservices.com.au/updating-and-managing-warden-lists-is-now-easier-with-evacconnect/" target="_blank" style="text-decoration:none; color: black; border:2px solid #2196F3; box-sizing: border-box; border-radius: 5px; line-height: 36px; padding:10px 45px 10px 20px;">EvacConnect for Tenant Responsible Persons - an instructional video</a></p>
      <p style="margin-top: 35px;"><a href="http://evachub.com/limesurvey/index.php/662295?newtest=Y&lang=en" target="_blank" style="text-decoration:none; color: black; border:2px solid black; box-sizing: border-box; border-radius: 5px; line-height: 36px; padding:10px 120px 10px 20px;">Provide feedback on your experience using EvacConnect</a></p>
      `;

			emailBody += email.getEmailHTMLFooter();
      email.assignOptions({
        body : emailBody
			});
			
			email.send(
				(data) => {
					console.log(data)					
				},
				(err) => console.log(err)
			);

			await notificationTokenObj.create({
        strToken: strToken,
				dtExpiration: moment().add(2, 'day').format('YYYY-MM-DD'),
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
    const theAnswers = req.body.query_responses;
    const responsesToQueryArr = JSON.parse(req.body.query_responses);
    const notification_token_id = req.body.notification_token_id;
    let nominatedUserName = '';
    let nominatedUserEmail = '';
    const completed = parseInt(req.body.completed, 10);
    const status = req.body.strStatus;
    const tokenObj = new NotificationToken(notification_token_id);
    const tokenDBData = await tokenObj.load();
    tokenDBData['strResponse'] = theAnswers;
    tokenDBData['completed'] = completed;
    tokenDBData['strStatus'] = status;

    if (completed) {
      tokenDBData['dtCompleted'] = moment().format('YYYY-MM-DD');
      tokenDBData['strToken'] = '';
    }
    try {
      await tokenObj.create(tokenDBData);

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
          cc: ['emacaraig@evacgroup.com.au'],
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

    if (!(Object.keys(userDbData)).length) {
      return res.redirect('/success-valiadation?query-notified-user=0');
    }
    try{
      await userRole.getByUserId(userDbData['user_id']);
      hasFrpTrpRole = true;
    } catch (e){
      hasFrpTrpRole = false;
    }
    const loginResponse = <any> await authRoute.successValidation(req, res, user, 7200, true);
    let stringUserData = JSON.stringify(loginResponse.data);
    stringUserData = stringUserData.replace(/\'/gi, '');
    const cipherText = cryptoJs.AES.encrypt(`${userDbData['user_id']}_${tokenDbData['location_id']}_${configId}_${tokenDbData['notification_token_id']}_${configDBData['building_id']}`, 'NifLed').toString();

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

    const redirectUrl = 'https://' + req.get('host') + '/dashboard/process-notification-queries/' + encodeURIComponent(cipherText);
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


  }
  public async verifyNotifiedUser(req: Request, res: Response) {
    let strToken = decodeURIComponent(req.query.token);
    const tokenObj = new NotificationToken();
    const  bytes = cryptoJs.AES.decrypt(''+strToken, process.env.KEY);
    const strTokenDecoded = bytes.toString(cryptoJs.enc.Utf8);
    const authRoute = new AuthenticateLoginRoute();

    const parts = strTokenDecoded.split('_');
    const uid = parts[1];
    const configId = parts[3];

    const user = new User(uid);
    await user.load();
    const userRole = new UserRoleRelation();
    let hasFrpTrpRole = false;

    const tokenDbData = await tokenObj.loadByContraintKeys(uid, configId);
    // console.log(tokenDbData);
    const configurator = new NotificationConfiguration(configId);
    const configDBData = await configurator.load();

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

    try{
      await userRole.getByUserId(uid);
      hasFrpTrpRole = true;
    } catch (e){
      hasFrpTrpRole = false;
    }

    const cipherText = cryptoJs.AES.encrypt(`${uid}_${tokenDbData['location_id']}_${configId}_${tokenDbData['notification_token_id']}_${configDBData['building_id']}`, 'NifLed').toString();
    // update record
    await tokenObj.create({
      strToken: '',
      strStatus: 'Validated',
      responded: 1,
      dtResponded: moment().format('YYYY-MM-DD'),
      completed: 1,
      dtCompleted: moment().format('YYYY-MM-DD')
    });

    const userResponded: Array<number> = configDBData['user_responded'].split(',');
    if (userResponded.indexOf(uid) == -1) {
      userResponded.push(uid);
      configDBData['responders'] = configDBData['responders'] + 1;
      configDBData['user_responded'] = userResponded.join(',');
      await configurator.create(configDBData);
    }

    const loginResponse = <any> await authRoute.successValidation(req, res, user, 7200, true);
    let stringUserData = JSON.stringify(loginResponse.data);
    stringUserData = stringUserData.replace(/\'/gi, '');

    if (hasFrpTrpRole) {
      const redirectUrl = 'https://' + req.get('host') + '/success-valiadation?verify-notified-user=1&token=' + encodeURIComponent(cipherText);
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
    } else {
      return res.redirect('/success-valiadation?verify-notified-user=1');
    }
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
    const list = await configurator.generateConfigData(req.user.account_id);

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
    let allUsers = [];
    const allUserIds = [];
    let allUserIdStr = '';
    let location_ids = [];
    const lauObj = new LocationAccountUser();
    const uemr = new UserEmRoleRelation();
    let accountModel = new Account(req.user.account_id);
    let account = <any> {
      account_name : ''
    };
    try{
      account = await accountModel.load();
    }catch(e){}


    // filter these sublevels that belongs to the account
    if (config['trp_user']) {
      userType = 'trp';
      allUsers = await lauObj.TRPUsersForNotification(sublevels);
    } else if (config['eco_user']) {
      userType = 'eco';
      allUsers = await uemr.emUsersForNotification(sublevels);
    } else if (config['all_users']) {
      userType = 'all';
      trp = await lauObj.TRPUsersForNotification(sublevels);
      eco = await uemr.emUsersForNotification(sublevels);
      allUsers = trp.concat(eco);
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

    // create token
    // for (let uid = 0; uid < allUserIds.length; uid++) {

    for (const u of allUsers) {
      let strToken = cryptoJs.AES.encrypt(`${Date.now()}_${u['user_id']}_${u['location_id']}_${configurator.ID()}`, process.env.KEY).toString();
      let notificationToken = new NotificationToken();
      await notificationToken.create({
        strToken: strToken,
        user_id: u['user_id'],
        location_id: u['location_id'],
        role_text: u['role_name'],
        notification_config_id: configurator.ID(),
        dtExpiration: moment().add(2, 'day').format('YYYY-MM-DD')
      });
      notificationToken = null;
      let 
      emailData = {
        message : config['message'].replace(/(?:\r\n|\r|\n)/g, '<br>'),
        users_fullname : this.toTitleCase(u['first_name']+' '+u['last_name']),
        account_name : account.account_name,
        location_name : locData.location_name,
        yes_link : 'https://' + req.get('host') + '/accounts/verify-notified-user/?token=' + encodeURIComponent(strToken),
        no_link : 'https://' + req.get('host') + '/accounts/query-notified-user/?token=' + encodeURIComponent(strToken)
      },
      emailType = 'warden-confirmation';
      if(u['role_name']){
        if(u['role_name'] == 'TRP'){
          emailType = 'trp-confirmation';
        }
      }
      const opts = {
        from : '',
        fromName : 'EvacConnect',
        to : [u['email']],
        cc: ['emacaraig@evacgroup.com.au', 'jmanoharan@evacgroup.com.au'],
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
	        from : 'allantaw2@gmail.com',
	        fromName : 'EvacConnect',
	        to : [],
	        body : '',
	        attachments: [],
	        subject : 'EvacConnect Invitation'
	    };

		let email = new EmailSender(opts),
			emailBody = email.getEmailHTMLHeader(),
			link = 'https://' + req.get('host') +'/custom-resolver?role_id='+inviData.role_id+'&invitation_code_id='+inviData.invitation_code_id+'&code='+inviData.code;

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

