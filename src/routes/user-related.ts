import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { UserRequest } from '../models/user.request.model';
import { Account } from '../models/account.model';
import { UserInvitation } from './../models/user.invitation.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { UtilsSync } from '../models/util.sync';
import * as validator from 'validator';
import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { Location } from '../models/location.model';
import { Token } from '../models/token.model';
import { UserLocationValidation } from '../models/user-location-validation.model';
import * as moment from 'moment';
import { LocationAccountUser } from '../models/location.account.user';

const defs = require('../config/defs.json');


export class UserRelatedRoute extends BaseRoute {
  public static create(router: Router) {
    router.get('/person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new  UserRelatedRoute().getUserPersonalInfo(req, res);
    });

    router.patch('/update-person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().updateUserPersonalInfo(req, res);
    });

    router.get('/person-invi-code', (req: Request, res: Response, next: NextFunction) => {
      new UserRelatedRoute().getUserUserInvitation(req, res, next);
    });

    router.get('/listAllFRP', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().listAllFRP(req, res).then((list) => {
        res.status(200).send({
          status: 'Success',
          data: list
        });
      }).catch((e) => {
        res.status(400).send();
      });
    });

    router.get('/listAllTRP', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().listAllTRP(req, res);
    });

    router.post('/verify-location-user', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().processValidation(req, res).then((data) => {
        return res.status(200).send({
          message: 'Verification send successfully',
          status: 'Success'
        });
      }).catch((e) => {
        return res.status(400).send({
          message: 'Internal Server Error. Problem sending verification request'
        });
      });
    });
    router.get('/location/user-verification', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().checkUserVerifiedInLocation(req, res);
    } );


    router.post('/eco-user/request-update-location', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().requestLocationUpdate(req, res);
    });

    router.get('/mail-info-graphic', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().mailInfoGraphic(req, res);
    });

    router.post('/account-user/request-update-location', new MiddlewareAuth().authenticate,  (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().requestAccountUserLocationUpdate(req, res);
    });
  }


  public async requestAccountUserLocationUpdate(req, res) {
    let requestData = {
      user_id: 0,
      requested_role_id: 0,
      location_id: 0,
      provided_info: '',
      remarks: ''
    };
    const user_role = req.body.role_id;
    const oldLocation = JSON.parse(req.body.oldLocation);
    const newLocation = JSON.parse(req.body.newLocation);
    let oldLocationRecord = [];
    let newLocationRecord = [];
    for (let oLoc of oldLocation) {
      const rec = await new Location(oLoc).load();
      oldLocationRecord.push(rec);
    }

    for (let nLoc of newLocation) {
      const rec = await new Location(nLoc).load();
      newLocationRecord.push(rec);
    }

    oldLocationRecord = await new UtilsSync().getRootParent(oldLocationRecord);
    newLocationRecord = await new UtilsSync().getRootParent(newLocationRecord);
   
    const oldLocationStrArr = [];
    for (let oLoc of oldLocationRecord) {
      if (oLoc['root_parent_loc_id'] == oLoc['location_id']) {
        oldLocationStrArr.push(oLoc['name']);
      } else {
        oldLocationStrArr.push(`${oLoc['name']}, ${oLoc['root_parent_name']}`);
      }
    }

    const newLocationStrArr = [];
    for (let nLoc of newLocationRecord) {
      if (nLoc['root_parent_loc_id'] == nLoc['location_id']) {
        newLocationStrArr.push(nLoc['name']);
      } else {
        newLocationStrArr.push(`${nLoc['name']}, ${nLoc['root_parent_name']}`);
      }
    }

    let remarks =`
    ${req.user.first_name} ${req.user.last_name} (${req.user.email}) is requesting for a location update.
    Account Role: ${defs['roles'][user_role]}
    From location: 
    ${oldLocationStrArr.join('\r\n')}

    To location: 
    ${newLocationStrArr.join('\r\n')}
    
    Additional Info: 
    
    `;


    for (let nLoc of newLocation) { 
      requestData = {
        user_id: 0,
        requested_role_id: 0,
        location_id: 0,
        provided_info: '',
        remarks: ''
      }

      requestData['user_id'] = req.user.user_id;
      requestData['requested_role_id'] = user_role;
      requestData['location_id'] = nLoc;
      
      requestData['remarks'] = remarks;
      
      try {
        await new UserRequest().create(requestData);
      } catch(e) {
        console.log(e);
      }      
    }

    try {
      for (let l of oldLocation) {
       await new LocationAccountUser().deleteAccountUserFromLocation(req.user.user_id, l);       
      }
      for (let a of newLocation) {
        await new LocationAccountUser().create({
          'location_id': a,
          'account_id': req.user.account_id,
          'user_id': req.user.user_id
        });
      }
    } catch(e) {
      console.log(e);
    }
    const opts = {
      from : '',
      fromName : 'EvacConnect',
      to : ['emacaraig@evacgroup.com.au', 'rsantos.evacgroup.com.au'],
      cc: [],
      body : `<pre> ${remarks} </pre>`,
      attachments: [],
      subject : 'EvacConnect Location Update Notification'
    };
    const email = new EmailSender(opts);
    email.send(
      (data) => {
          console.log('Email sent successfully');					
      },
      (err) => console.log(err)
    );

    const assignedLocations = await new LocationAccountUser().getByUserId(req.user.user_id, true);
    
    return res.status(200).send({
      message: 'Success',
      assigned_locations: assignedLocations
    });




  }
  public mailInfoGraphic(req: AuthRequest, res:Response) {
    const emailData = {
      users_fullname: `${req.user.first_name} ${req.user.last_name}`
    };

    let emailType= 'stay_go_info';

    const opts = {
      from: '',
      fromName: 'EvacConnect',
      to: [`${req.user.email}`],
      cc: [],
      body : '',
      attachments: [],
      subject : 'EvacConnect Email Notification'
    };

    const email = new EmailSender(opts);
    email.sendFormattedEmail(emailType, emailData, res, 
      (data) =>{
        console.log(data);
        
        return res.status(200).send({
          message: 'Sent'
        });
      },
      (err) => {
        console.log('Error', err);
        return res.status(200).send({
          message: 'Failed'
        });
      }
    );
      

  }


  public async requestLocationUpdate(req: AuthRequest, res: Response) {
    const util = new Utils();
    let requestData = {
      user_id: 0,
      requested_role_id: 0,
      location_id: 0,
      provided_info: '',
      remarks: ''
    };

    const user_role = req.body.em_role_id;
    const oldLocation = JSON.parse(req.body.oldLocation);
    const newLocation = JSON.parse(req.body.newLocation);
    const info = req.body.info;
    
    
    let oldLocationRecord = [];
    let newLocationRecord = [];
    for (let oLoc of oldLocation) {
      const rec = await new Location(oLoc).load();
      oldLocationRecord.push(rec);
    }

    for (let nLoc of newLocation) {
      const rec = await new Location(nLoc).load();
      newLocationRecord.push(rec);
    }

    oldLocationRecord = await new UtilsSync().getRootParent(oldLocationRecord);
    newLocationRecord = await new UtilsSync().getRootParent(newLocationRecord);
   
    const oldLocationStrArr = [];
    for (let oLoc of oldLocationRecord) {
      if (oLoc['root_parent_loc_id'] == oLoc['location_id']) {
        oldLocationStrArr.push(oLoc['name']);
      } else {
        oldLocationStrArr.push(`${oLoc['name']}, ${oLoc['root_parent_name']}`);
      }
    }

    const newLocationStrArr = [];
    for (let nLoc of newLocationRecord) {
      if (nLoc['root_parent_loc_id'] == nLoc['location_id']) {
        newLocationStrArr.push(nLoc['name']);
      } else {
        newLocationStrArr.push(`${nLoc['name']}, ${nLoc['root_parent_name']}`);
      }
    }

    let remarks =`
    ${req.user.first_name} ${req.user.last_name} (${req.user.email}) is requesting for a location update.
    Emergency Role: ${defs['roles'][user_role]}
    From location: 
    ${oldLocationStrArr.join('\r\n')}

    To location: 
    ${newLocationStrArr.join('\r\n')}
    
    Additional Info: 
    ${info}
    `;


    for (let nLoc of newLocation) { 
      requestData = {
        user_id: 0,
        requested_role_id: 0,
        location_id: 0,
        provided_info: '',
        remarks: ''
      }

      requestData['user_id'] = req.user.user_id;
      requestData['requested_role_id'] = user_role;
      requestData['location_id'] = nLoc;
      requestData['provided_info'] = info;
      requestData['remarks'] = remarks;
      
      try {
        await new UserRequest().create(requestData);
      } catch(e) {
        console.log(e);
      }      
    }

    try {
      for (let l of oldLocation) {
        let res = await new UserEmRoleRelation().getByWhere({
            user_id: req.user.user_id,
            em_role_id: user_role,
            location_id: l
        });
        await new UserEmRoleRelation(res[0]['user_em_roles_relation_id']).delete();
      }
      for (let a of newLocation) {
        await new UserEmRoleRelation().create({
            user_id: req.user.user_id,
            em_role_id: user_role,
            location_id: a
        });
      }

    } catch(e) {
      console.log(e);
    }

    const opts = {
      from : '',
      fromName : 'EvacConnect',
      to : ['emacaraig@evacgroup.com.au', 'rsantos.evacgroup.com.au'],
      cc: [],
      body : `<pre> ${remarks} </pre>`,
      attachments: [],
      subject : 'EvacConnect Location Update Notification'
    };
    const email = new EmailSender(opts);
    /*
    email.send(
      (data) => {
          console.log('Email sent successfully');					
      },
      (err) => console.log(err)
    );
    */

    
    return res.status(200).send({
      message: 'Success'
    });

  }
  public checkUserVerifiedInLocation(req: AuthRequest, res: Response) {
    const utils = new Utils();
    utils.checkUserValidInALocation(req.user.user_id).then((data) => {
      res.status(200).send({
        count: data
      });
    }).catch((e) => {
      res.status(400).send((<Error>e).message);
    });
  }

  public getUserUserInvitation(req: Request, res: Response, next: NextFunction) {
    const queryParamCode = req.query.code;
    const invitation_code = new UserInvitation();


    invitation_code.getInvitationByCode(queryParamCode, false).then((dbData) => {
      console.log('dbData', dbData);
      return res.status(200).send({
        status: 'OK',
        message: 'Query Successful',
        data: {
          invitation_code_id: dbData['invitation_code_id'],
          code: dbData['code'],
          first_name: dbData['first_name'],
          last_name: dbData['last_name'],
          email: dbData['email'],
          location_id: dbData['location_id'],
          account_id: dbData['account_id'],
          role_id: dbData['role_id'],
          was_used: dbData['was_used']
        }
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
      });
    });

  } // end getUserUserInvitation
  public getUserPersonalInfo(req: AuthRequest, res: Response) {

    const queryParamUser = req.query.userId;
    const user = new User(queryParamUser);
    const account = new Account();

    user.load().then(() => {
      account.getByUserId(queryParamUser).then(() => {
        return res.status(200).send({
          first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: account.get('account_name'),
          occupation: user.get('occupation')
        });
      }).catch((e) => {
        return res.status(200).send({
          first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: '',
          occupation: user.get('occupation')
          });
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
        });
      });
  }

  public updateUserPersonalInfo(req: AuthRequest, res: Response) {

    // validation checks
    let isValid = true;
    let errMessage = 'Invalid ';

    if (!validator.isEmail(req.body.email)) {
      isValid = false;
      errMessage += 'email ';
    }
    if (validator.isEmpty(req.body.first_name)) {
      isValid = false;
      errMessage += ' person name';
    }
    if (validator.isEmpty(req.body.last_name)) {
      isValid = false;
      errMessage += ' last name';
    }
    if (!isValid) {
      return res.status(400).send({
        status: 'Bad Request',
        message: errMessage
      });
    }

    const saveAction = () => {
      const user = new User(req.user.user_id);
      user.load().then(() => {
        user.create(req.body).then(() => {
          return res.status(200).send({
            'message': 'Success'
          });
        }).catch((e) => {
          return res.status(400).send({
            status: 'Bad Request',
            message: e
            });
        });
      }).catch((e) => {
        return res.status(400).send({
          status: 'Bad Request',
          message: e
          });
      });
    };

    const blacklistedEmails = new BlacklistedEmails();
      //isBlacked = blacklistedEmails.isEmailBlacklisted(req.body.email);
    const isBlacked = false;
    if(!isBlacked){
      const userEmail = new User();
      userEmail.getByEmail(req.body.email).then(
        (userData) => {
          if(userData['user_id'] == req.user.user_id){
            saveAction();
          }else{
            return res.status(400).send({
              status: false,
              message: 'Email taken'
            });
          }
        },
        () => {
          saveAction();
        }
      );
    } else {
      return res.status(400).send({
        status: false,
        message: 'Domain blacklisted'
      });
    }
  }

  public async listAllFRP(req: AuthRequest, res: Response) {
    const utils = new Utils();
    // const queryParamUser = req.query.userId;
    let account_id = 0;
    account_id = req.user.account_id;
    const location_id = req.query.location_id;
    console.log(req.query);
    let location;
    // get parent location
    let parentId = location_id;
    while (parentId !== -1) {
      location = new Location(parentId);
      await location.load();
      parentId = location.get('parent_id');
    }
    console.log(location.get('location_id'));
    const list = await utils.listAllFRP(location.get('location_id'), req.user.user_id);

    return list;
  }

  public listAllTRP(req: AuthRequest, res: Response) {
    const utils = new Utils();
    if (!('location_id' in req.query)) {
      return res.status(400).send({
        message: 'Bad Request. Invalid parameters.'
      });
    }
    const location_id = req.query.location_id;
    let account_id = 0;
    account_id = req.user.account_id;

    utils.listAllTRP(location_id, account_id, req.user.user_id).then((list) => {
      return res.status(200).send({
        status: 'Success',
        data: list
      });
    }).catch((e) => {
      return res.status(400).send({
        message: e
      });
    });
  }

  public async processValidation(req: AuthRequest, res: Response) {

    // we need to check the role(s)
    const userRoleRel = new UserRoleRelation();
    const roles = await userRoleRel.getByUserId(req.user.user_id);
    // what is the highest rank role
    let r = 100;
    for (let i = 0; i < roles.length; i++) {
      if (r > parseInt(roles[i]['role_id'], 10)) {
        r = roles[i]['role_id'];
      }
    }
    const roles_text = ['', 'Manager', 'Tenant'];

    const user = req.user;
    // const role_id = req.body.role_id;
    const location_id = req.body.location_id;
    const account_id = req.body.account_id;
    const userDomain =  user['email'].substr( user['email'].indexOf('@') + 1,  user['email'].length);

    const criteria = req.body.criteria;

    let approvers = [],
      lastApproverId = 0;
    if(criteria == 'trp_enable'){
      for(let i in req.body.approver){
        approvers.push({
          approver_id : req.body.approver[i]['approver'],
          location_id : req.body.approver[i]['location']
        });
      }
    }else if(criteria == 'frp_enable'){
      for(let i in location_id){
        approvers.push({
          approver_id : req.body.approver,
          location_id : location_id[i]
        });
      }
    }

    lastApproverId = approvers[ approvers.length - 1 ]['approver_id'];

    for(let i in approvers){

      let
        token_string = this.generateRandomChars(5),
        approver = new User(parseInt(approvers[i]['approver_id'])),
        utils = new Utils(),
        location = new Location(parseInt(approvers[i]['location_id'])),
        token = new Token(),
        locationValidation = new UserLocationValidation(),
        expDate = moment(),
        expDateFormat = '';

      expDate.add(24, 'hours');
      expDateFormat = expDate.format('YYYY-MM-DD HH-mm-ss');

      await location.load();
      await approver.load();

      await token.create({
        id: req.user.user_id,
        id_type: 'user_id',
        token: token_string,
        action: 'location access',
        verified: 0,
        expiration_date: expDateFormat
      });

      await locationValidation.create({
        user_id: req.user.user_id,
        approver_id: approvers[i]['approver_id'],
        role_id: r,
        location_id: approvers[i]['location_id'],
        token_id: token.ID()
      });

      const emailOpts = {
        'from':       'allantaw2@gmail.com',
        'fromName':   'EvacConnect Compliance Management System',
        'to':          [approver.get('email')],
        'subject':     'User Verification',
        'body': `
          Hi <strong>${approver.get('first_name')} ${approver.get('last_name')}</strong>,
          <br /> <br />
          This person is trying to register as a <strong>${roles_text[r]}</strong> to <strong>${location.get('formatted_address')}</strong>.
          <br /><br />Please refer to the information below:<br />
          Name: <strong>${user['first_name']}</strong><br />
          Last Name: <strong>${user['last_name']}</strong> <br />
          Email: <strong> ${user['email']}</strong> <br />
          Email Domain Name Submitted: <strong> ${userDomain}</strong> <br />
          Please click on the link below to verify this user or just ignore this message. <br />
          <a href="${req.protocol}://${req.get('host')}/user-location-verification/${token_string}"
          target="_blank" style="text-decoration:none; color:#0277bd;">
          ${req.protocol}://${req.get('host')}/user-location-verification/${token_string}
          </a>
          <br /><br />
          Thank you.
        `,
      };

      const email = new EmailSender(emailOpts);
      email.send(
        (d) => () => {
          if(lastApproverId == approver.get('user_id')){
            return {
              message: 'Success'
            };
          }
        },
        (err) => {
          console.log(err)
          throw new Error('There was problem sending the email verification');
        }
      );

    }
  }
}
