import { UserInvitation } from './../models/user.invitation.model';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import * as fs from 'fs';
import * as path from 'path';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Token } from '../models/token.model';
import { FileUploader } from '../models/upload-file';
import { Utils } from './../models/utils.model';
import {EmailSender} from './../models/email.sender';
const validator = require('validator');
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { LocationAccountRelation } from '../models/location.account.relation';
const md5 = require('md5');
const defs = require('../config/defs');
import * as moment from 'moment';
import * as csv from 'fast-csv';



/**
 * / route
 *
 * @class User
 */
export class TeamRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    // add home page route
    router.get('/test', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().index(req, res);
    });

    router.post('/team/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByEmail(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {

      });
    });

    router.post('/team/form/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByForm(req, res).then(() => {
        return res.status(200).send({
          status: 'Success'
        });
      }).catch((e) => {
        return res.status(400).send({
          status: 'Fail'
        });
      });
    });

    router.get('/team/eco-role-list', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().getECOList(req, res).then((roles) => {
        return res.status(200).send(roles);
      }).catch((e) => {
        return res.status(400).send('Error generating list');
      });
    });

    router.post('/team/process-warden-invitation', (req: Request, res: Response, next: NextFunction) => {
      new TeamRoute().processWardenInvitation(req, res, next).then((data) => {
        res.status(200).send({status: 'Success'});
      }).catch((e) => {
        res.status(400).send({status: 'Fail'});
      });
    });

    router.get('/team/invitation-filled-form/:token/bulk', (req: Request, res: Response, next: NextFunction) => {
      new TeamRoute().retrieveWardenInvationInfo(req, res, next).then((data) => {
        return res.status(200).send(data);
      }).catch((err) => {
        return res.status(400).send({message: 'Internal error'});
      });
    });

    router.get('/team/list/wardens', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildWardenList(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((err) => {
        return res.status(400).send({
          message: 'Cannot build list'
        });
      });
    });

    router.post('/team/form/add-bulk-peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addMobilityImpairedPersons(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {
        return res.status(400).send({
          message: 'Internal Error. Cannot add mobility impaired person(s)'
        });
      });
    });

    router.get('/team/list/peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildPEEPList(req, res).then((peep) => {
        return res.status(200).send(peep);
      }).catch(() => {
        return res.status(400).send({
          message: 'Internal Error. Cannot build peep list'
        });
      });
    });

    router.post('/team/warden/csv-upload', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
    //  router.post('/team/warden/csv-upload', (req: AuthRequest, res: Response, next: NextFunction) => {
      new TeamRoute().processCSVUpload(req, res, next).then((data) => {
        console.log('I got ', data);
        return res.status(200).send(data);
      }).catch((e) => {
        res.status(400).send({
          message: 'Error processing CSV file.'
        });
      });
    });
  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: AuthRequest, res: Response) {
     console.log(req.token);
     console.log(req.user);
    // console.log(req.get('user'));
      // set options
    const options: Object = {
      'title': 'Evac Connect Platform',
      'message': 'Welcome To EvacConnect'
    };

    // render template
    this.render(req, res, 'index.hbs', options);
  }

  public async processCSVUpload(req: AuthRequest, res: Response, next: NextFunction) {
    const uploader = new FileUploader(req, res, next);
    const invalidEmails = [];
    const filename = await uploader.uploadFileToLocalServer();
    const utils = new Utils();
    let data;
    data = await utils.processCSVUpload(<string>filename);
    // data['override'] = req.body.override;

    for (let i = 0; i < data.length; i++) {
      const user = new User();
      try {
        let dbData = await user.getByEmail(data[i]['email']);
        invalidEmails.push(data[i]['email']);
      } catch(e) {
        if (validator.isEmail(data[i]['email'])) {
          // email and create
          const userInvitation = new UserInvitation();
          const tokenModel = new Token();
          const tokenStr = tokenModel.generateRandomChars(10);
          await userInvitation.create({
            'first_name': data[i]['first_name'],
            'last_name': data[i]['last_name'],
            'email': data[i]['email'],
            'location_id': 0,
            'account_id': req.user.user_id,
            'role_id': 0,
            'eco_role_id': 8,
            'contact_number': data[i]['mobile_number'],
            'phone_number': data[i]['phone_number'],
            'invited_by_user': req.user.user_id,
            'can_login': data[i]['can_login'],
            'time_zone': data[i]['time_zone'],
          });
          const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
          await tokenModel.create({
            'token': tokenStr,
            'action': 'invitation',
            'verified': 0,
            'expiration_date': expDate,
            'id': userInvitation.ID(),
            'id_type': 'user_invitations_id'
          });

          const opts = {
            from : 'allantaw2@gmail.com',
            fromName : 'EvacConnect',
            to : [],
            cc: [],
            body : '',
            attachments: [],
            subject : 'EvacConnect Warden Nomination'
          };
          const email = new EmailSender(opts);
          const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + tokenStr;
          let emailBody = email.getEmailHTMLHeader();
          emailBody += `<h3 style="text-transform:capitalize;">Hi ${data[i]['first_name']} ${data[i]['last_name']},</h3> <br/>
          <h4>You are nominated to be a Warden.</h4> <br/>
          <h5>Click on the link below to setup your password.</h5> <br/>
          <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

          emailBody += email.getEmailHTMLFooter();
          email.assignOptions({
            body : emailBody,
            to: [data[i]['email']],
            cc: ['erwin.macaraig@gmail.com']
          });
          email.send((data) => console.log(data),
                     (err) => console.log(err)
                    );

        } else {
          invalidEmails.push(data[i]['email']);
        }
      }
    }

    return invalidEmails;



  }
  public async addMobilityImpairedPersons(req: AuthRequest, res: Response) {
    console.log(JSON.parse(req.body.peep));
    const peep = JSON.parse(req.body.peep);
    const invalidPeep = [];
    for (const p of peep) {
      const userInvitation = new UserInvitation();
      const tokenModel = new Token();
      const tokenStr = tokenModel.generateRandomChars(10);
      const user = new User();
      try {
        const dbData = await user.getByEmail(p['email']);
        invalidPeep.push(p['email']);
      } catch (e) {
        if (validator.isEmail(p['email'])) {
          p['invited_by_user'] = req.user.user_id;
          p['account_id'] = req.user.account_id;
          const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
          await userInvitation.create(p);
          await tokenModel.create({
            'token': tokenStr,
            'action': 'invitation',
            'verified': 0,
            'expiration_date': expDate,
            'id': userInvitation.ID(),
            'id_type': 'user_invitations_id'
          });
        } else {
          invalidPeep.push(p['email']);
        }
      }
    }

    return invalidPeep;
  }

  public async addBulkWardenByForm(req: AuthRequest, res: Response) {
    const wardens = JSON.parse(req.body.wardens);
    const userRoleRel = new UserRoleRelation();
    const invalidWarden = [];
    const role = await userRoleRel.getByUserId(req.user.user_id, true);

    for (const warden of wardens) {
      const user = new User();
      try {
        const dbData = await user.getByEmail(warden['email']);
        invalidWarden.push(warden['email']);
      } catch (e) {
        if (validator.isEmail(warden['email'])) {
          const userInvitation = new UserInvitation();
          const tokenModel = new Token();
          const tokenStr = tokenModel.generateRandomChars(10);
          warden['invited_by_user'] = req.user.user_id;
          warden['account_id'] = req.user.account_id;
          console.log(warden);
          const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
          await userInvitation.create(warden);
          await tokenModel.create({
            'token': tokenStr,
            'action': 'invitation',
            'verified': 0,
            'expiration_date': expDate,
            'id': userInvitation.ID(),
            'id_type': 'user_invitations_id'
          });

          const opts = {
            from : 'allantaw2@gmail.com',
            fromName : 'EvacConnect',
            to : [],
            cc: [],
            body : '',
            attachments: [],
            subject : 'EvacConnect Warden Nomination'
          };
          const email = new EmailSender(opts);
          const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + tokenStr;
          let emailBody = email.getEmailHTMLHeader();
          emailBody += `<h3 style="text-transform:capitalize;">Hi ${warden['first_name']} ${warden['last_name']},</h3> <br/>
          <h4>You are nominated to be a Warden.</h4> <br/>
          <h5>Click on the link below to setup your password.</h5> <br/>
          <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

          emailBody += email.getEmailHTMLFooter();
          email.assignOptions({
            body : emailBody,
            to: [warden['email']],
            cc: ['erwin.macaraig@gmail.com']
          });
          email.send((data) => console.log(data),
                     (err) => console.log(err)
                    );
        } else {
          invalidWarden.push(warden['email']);
        }
      }
    }
    return invalidWarden;
  }
  public async retrieveWardenInvationInfo(req: Request, res: Response, next: NextFunction) {

    let locationsOnAccount = [];
    let location;
    let userInvitation;
    let token = '';
    let dbData;
    if (req.params.token) {
      token = req.params.token;
    }
    const tokenModel = new Token();
    const tokenDbData = await tokenModel.getByToken(token);

    if (tokenDbData['id_type'] === 'user_invitations_id' && !tokenDbData['verified']) {
      userInvitation = new UserInvitation(tokenDbData['id']);
      dbData = await userInvitation.load();
    } else {
      throw new Error('Invalid token');
    }
    const userRoleRel = new UserRoleRelation();

    // what is the highest rank role of the user who invited this warden
    const role = await userRoleRel.getByUserId(dbData['invited_by_user'], true);
    // the account of the user who invited this warden
    const account = new Account(dbData['account_id']);

    // locations tagged to the user who invited this warden
    locationsOnAccount = await account.getLocationsOnAccount(dbData['invited_by_user'], role);
    await account.load();
    dbData['account'] = account.get('account_name');
    if (!dbData['location_id']) {
      switch (role) {
        case 1:
          for (let loc of locationsOnAccount) {
            location = new Location(loc.location_id);
            loc['sublocations'] = await location.getSublocations();
          }
          // break;
          // return { 'locations' : locationsOnAccount };
          dbData['locations'] = locationsOnAccount;
          break;
        case 2:
          // get the parent or parents of these sublocation
          let results;
          // let objectOfSubs:{[key: number]: Array<Object>} = {};
          let objectOfSubs:{[key: number]: any[]} = {};
          let seenParents = []; // these are the parent ids
          let rootParents = [];
          let pId = 0;
          for (let loc of locationsOnAccount) {
            objectOfSubs[loc.parent_id] = [];
          }
          for (let loc of locationsOnAccount) {
            objectOfSubs[loc.parent_id].push(loc);

            if ((seenParents.indexOf(loc.parent_id) * 1)  === -1) {

              seenParents.push(loc.parent_id);
              let parentId = loc.parent_id;
              while (parentId !== -1) {
                location = new Location(parentId);
                await location.load();
                parentId = location.get('parent_id');
              }

              rootParents.push(location.getDBData());
              location.set('desc', loc.parent_id);
              location = undefined;
            }
          }

          let seenRoots = [];
          let processedRootParents = [];
          for (let r of rootParents) {
                if(seenRoots.indexOf(r['location_id']) == -1) {
                  r['sublocations'] = [];
                  r['sublocations'] = objectOfSubs[r['desc']];
                  r['sublocations']['total'] = 0;
                  r['total_subs'] = objectOfSubs[r['desc']].length;
                  seenRoots.push(r['location_id']);
                  processedRootParents.push(r);
                }
              }
          dbData['locations'] = processedRootParents;
          break;

      }
    } else {
      // get parent location details given a location id
       let locationInstance = new Location(dbData['location_id']);
       await locationInstance.load();
       dbData['location_name'] = locationInstance.get('name');
       let pId = <number>locationInstance.get('parent_id');
       console.log(dbData);

      while (pId !== -1) {
        locationInstance = new Location(pId);
        await locationInstance.load();
        pId = <number>locationInstance.get('parent_id');
      }
      dbData['parent_location_name'] = locationInstance.get('name') ? locationInstance.get('name') : locationInstance.get('formatted_address');
      dbData['parent_location_id'] = locationInstance.ID();

    }
    return dbData;


  }
  public async processWardenInvitation(req: Request, res: Response, next: NextFunction) {
    if (req.body.password !== req.body.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    const encryptedPassword = md5('Ideation' + req.body.password + 'Max');
    let invitation;
    let user;
    try {
      // create user
      user  = new User();
      const tokenObj = new Token();
      const tokenDbData = await tokenObj.getByToken(req.body.token);
      invitation = new UserInvitation(tokenDbData['id']);
      const userInvitation = await invitation.load();
      await user.create({
        'first_name': req.body.first_name,
        'last_name': req.body.last_name,
        'password': encryptedPassword,
        'email': req.body.email,
        'token': req.body.token,
        'account_id': req.body.account_id,
        'invited_by_user': userInvitation['invited_by_user'],
        'can_login': 1,
        'mobile_number': userInvitation['contact_number']
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
    } catch (e) {
      console.log(e);
      throw new Error('Internal Error');
    }

    // create a record em-role-user-location
    const EMRoleUserRole = new UserEmRoleRelation();
    await EMRoleUserRole.create({
      'user_id': user.ID(),
      'em_role_id': req.body.em_role,
      'location_id': req.body.sublocation
    });
    // create a record in location_account_user
    let locationAcctUser = new LocationAccountUser();
    await locationAcctUser.create({
      'location_id': req.body.sublocation,
      'account_id': req.body.account_id,
      'user_id': user.ID(),
      'role_id': req.body.em_role
    });

    if (req.body.role_id) {
      let theLocation = req.body.sublocation;
      if (req.body.role_id == defs['Manager']) {
        // get the root parent not the immediate parent - just to be sure
        let locationInstance = new Location(req.body.parent_location);
        await locationInstance.load();
        let pId = <number>locationInstance.get('parent_id');
        while (pId !== -1) {
          locationInstance = new Location(pId);
          await locationInstance.load();
          pId = <number>locationInstance.get('parent_id');
        }
        theLocation = locationInstance.ID();
      }
      locationAcctUser = new LocationAccountUser();


      await locationAcctUser.create({
        'location_id': theLocation,
        'account_id': req.body.account_id,
        'user_id': user.ID(),
        'role_id': req.body.role_id
      });

      const userRoleRel = new UserRoleRelation();
      await userRoleRel.create({
        'user_id': user.ID(),
        'role_id': req.body.role_id
      });

      const locationAccntRel = new LocationAccountRelation();

      try {
        const tmp = await locationAccntRel.getLocationAccountRelation({
          'location_id': theLocation,
          'account_id': req.body.account_id,
          'responsibility': defs['role_text'][req.body.role_id]
        });
     } catch (err) {
       await locationAccntRel.create({
        'location_id': theLocation,
        'account_id': req.body.account_id,
        'responsibility': defs['role_text'][req.body.role_id]
       });
     }
    }
    return;
  }
  public async addBulkWardenByEmail(req: AuthRequest, res: Response) {
    const emailsSubmitted = JSON.parse(req.body.wardensEmail);
    console.log(typeof emailsSubmitted);
    const invalidWardenEmails = [];
    const objEmail = [];
    const user = new User();
    for (let x = 0; x < emailsSubmitted.length; x++ ) {
      if (validator.isEmail(emailsSubmitted[x])) {
        try {
          const dbData = await user.getByEmail(emailsSubmitted[x]);
          invalidWardenEmails.push(emailsSubmitted[x]);
        } catch (e) {
          objEmail.push(emailsSubmitted[x]);
        }
      }
    }

    console.log(objEmail);
    // email notification here
    const opts = {
      from : 'allantaw2@gmail.com',
      fromName : 'EvacConnect',
      to : [],
      cc: [],
      body : '',
      attachments: [],
      subject : 'EvacConnect Warden Invitation'
    };
    const email = new EmailSender(opts);
    // add these emails to the database table

    for (let i = 0; i < objEmail.length; i++) {
      const inviCode = new UserInvitation();
      const tokenModel = new Token();
      const token = tokenModel.generateRandomChars(8);

      const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + token;
      await inviCode.create({
        'invited_by_user': req.user.user_id,
        'email': objEmail[i],
        'code': token,
        'role_id': 9,
        'account_id': req.user.account_id
      });
      let emailBody = email.getEmailHTMLHeader();
      emailBody += `<h3 style="text-transform:capitalize;">Hi,</h3> <br/>
      <h4>You are invited to be a Warden.</h4> <br/>
      <h5>Please update your profile to setup your account in EvacOS by clicking the link below</h5> <br/>
      <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

      emailBody += email.getEmailHTMLFooter();

    email.assignOptions({
      body : emailBody,
      to: [objEmail[i]],
      cc: ['erwin.macaraig@gmail.com']
    });
      email.send((data) => console.log(data),
                 (err) => console.log(err)
                );
    }
    return emailsSubmitted;
  }

  public async getECOList(req: AuthRequest, res: Response) {
    const utils = new Utils();
    try {
      const roles = utils.buildECORoleList();
      return roles;
    } catch (e) {
      throw new Error('There was a problem generating the list');
    }
  }

  public async buildWardenList(req: AuthRequest, res: Response) {

    // get all parent locations associated with this account
    const accountId = req.user.account_id;
    const account = new Account(accountId);
    const userRoleRel = new UserRoleRelation();
    const role = await userRoleRel.getByUserId(req.user.user_id, true);
    // what is the highest rank role of the user who invited this warden
    // const locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id);

    const result = await account.buildWardenList(req.user.user_id);
    const temp = JSON.stringify(result);
    const wardens = JSON.parse(temp);

    // get parent location details given a location id
     for (let warden of wardens) {
      let locationInstance = new Location(warden['parent_id']);
       await locationInstance.load();
      let pId = <number>locationInstance.get('parent_id');
      while (pId !== -1) {
        locationInstance = new Location(pId);
        await locationInstance.load();
        pId = <number>locationInstance.get('parent_id');
      }
      warden['parent_name'] = locationInstance.get('name') ? locationInstance.get('name') : locationInstance.get('formatted_address');
    }
    return wardens;
  }

  public async buildPEEPList(req: AuthRequest, res: Response) {
    const account = new Account(req.user.account_id);
    const result = await account.buildPEEPList(req.user.user_id);
    const temp = JSON.stringify(result);
    const peeps = JSON.parse(temp);
    for (const peep of peeps) {
      let locationInstance = new Location(peep['location_id']);
      await locationInstance.load();
      let pId = <number>locationInstance.get('parent_id');
      while (pId !== -1) {
        locationInstance = new Location(pId);
        await locationInstance.load();
        pId = <number>locationInstance.get('parent_id');
      }
      peep['parent_name'] = locationInstance.get('name') ? locationInstance.get('name') : locationInstance.get('formatted_address');
    }
    return peeps;
  }


}
