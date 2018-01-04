import { InvitationCode } from './../models/invitation.code.model';
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
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
const md5 = require('md5');
import * as moment from 'moment';

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

  public async addBulkWardenByForm(req: AuthRequest, res: Response) {
    console.log(req.body);
    console.log(typeof req.body.wardens);
    const wardens = JSON.parse(req.body.wardens);
    const userRoleRel = new UserRoleRelation();

    const role = await userRoleRel.getByUserId(req.user.user_id, true);

    for (let warden of wardens) {
      let inviCode = new InvitationCode();
      const tokenModel = new Token();
      const token = tokenModel.generateRandomChars(8);
      warden['code'] = token;
      warden['invited_by_user'] = req.user.user_id;
      // if (role !== 1) {
        warden['account_id'] = req.user.account_id;
      // }
      console.log(warden);
      await inviCode.create(warden);


      // generate and send email here
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
      const link = req.protocol + '://' + req.get('host') + '/signup/warden-profile-completion/' + token;
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
      }
    return;
  }
  public async retrieveWardenInvationInfo(req: Request, res: Response, next: NextFunction) {
    const inviCode = new InvitationCode();
    let locationsOnAccount = [];
    let location;
    let token = '';
    if (req.params.token) {
      token = req.params.token;
    }

    const dbData = await inviCode.getInvitationByCode(token);
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


    // create user
    const user  = new User();
    await user.create({
      'first_name': req.body.first_name,
      'last_name': req.body.last_name,
      'password': encryptedPassword,
      'email': req.body.email,
      'token': req.body.token,
      'account_id': req.body.account_id
    });

    // create record in token table
    const tokenObj = new Token();
    const expDate = moment();
    const expDateFormat = expDate.format('YYYY-MM-DD HH-mm-ss');

    await tokenObj.create({
      'token': req.body.token,
      'user_id': user.ID(),
      'action': 'verify',
      'verified': 1,
      'expiration_date': expDateFormat
    });

    // create a record em-role-user-location
    const EMRoleUserRole = new UserEmRoleRelation();
    await EMRoleUserRole.create({
      'user_id': user.ID(),
      'em_role_id': req.body.em_role,
      'location_id': req.body.sublocation
    });

    // delete entry in db once you accessed the token
    const inviCode = new InvitationCode();
    inviCode.delete(req.body.token);
    return;

  }
  public async addBulkWardenByEmail(req: AuthRequest, res: Response) {
    const emailsSubmitted = JSON.parse(req.body.wardensEmail);
    console.log(typeof emailsSubmitted);
    const objEmail = [];
    for (let x = 0; x < emailsSubmitted.length; x++ ) {
      if (validator.isEmail(emailsSubmitted[x])) {
        objEmail.push(emailsSubmitted[x]);
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
      const inviCode = new InvitationCode();
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


}
