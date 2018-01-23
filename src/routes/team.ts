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
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';
import { Utils } from './../models/utils.model';
import {EmailSender} from './../models/email.sender';
const validator = require('validator');
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { LocationAccountRelation } from '../models/location.account.relation';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
import { BlacklistedEmails } from '../models/blacklisted-emails';

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

    router.post('/team/finalize-csv-record', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addUsersFromCSV(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {
        return res.status(400).send({status: 'Fail', message: e});
      });
    });

    router.post('/team/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByEmail(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {

      });
    });

    router.post('/team/form/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByForm(req, res).then((response) => {
        return res.status(200).send(response);
      }).catch((e) => {
        return res.status(400).send({
          status: 'Fail',
          message : e
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

    router.get('/team/list/archived-wardens', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildWardenList(req, res, 1).then((data) => {
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

    router.get('/team/list/archived-peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildPEEPList(req, res, 1).then((peep) => {
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
    const invalidRecords = [];
    const filename = await uploader.uploadFileToLocalServer();

    const utils = new Utils();
    let data;
    data = await utils.processCSVUpload(<string>filename);

    const validRecords = [];
    for (let i = 0; i < data.length; i++) {
      const user = new User();
      if ( ('ECO Role' in  data[i])   && ((data[i]['ECO Role']).length === 0) ) {
        data[i]['ECO Role'] = 'General Occupant';
      }
      try {
        const dbData = await user.getByEmail(data[i]['Email']);

        invalidRecords.push(data[i]);
      } catch (e) {
        if (validator.isEmail(data[i]['Email'])) {
          validRecords.push(data[i]);
        } else {
          invalidRecords.push(data[i]);
        }
      }
    }
    fs.unlink(<string>filename, () => {
      console.log(`Successfully delete file: ${filename}`);
    });
    return {
      'valid': validRecords,
      'invalid': invalidRecords,
      'data-override': req.body.override
    };
  }

  public async addUsersFromCSV(req: AuthRequest, res: Response) {
    const user_invitation_records = JSON.parse(req.body.invitations);
    const dataOverride = req.body.data_override;
    const utils = new Utils();
    let em_role = '';
    let account_role = '';
    let name = '';
    const allRolesObj = {};
    for (let i = 0; i < user_invitation_records.length; i++) {
      const userInvitation = new UserInvitation();
      const tokenModel = new Token();
      const tokenStr = tokenModel.generateRandomChars(10);
      if (('ECO Role' in   user_invitation_records[i])) {
        em_role = (user_invitation_records[i]['ECO Role']).toUpperCase();
      }
      if (('First Name' in user_invitation_records[i]) && ('Last Name' in user_invitation_records[i])) {
        name = ' ' + user_invitation_records[i]['First Name'] + ' ' + user_invitation_records[i]['Last Name'];
      }
      if(('Role' in user_invitation_records[i])) {
        // we still need to check if account role or eco role
        const ecos = await utils.buildECORoleList();
        for (let i in ecos ){
          allRolesObj[ecos[i]['role_name'].toUpperCase()] = ecos[i]['em_roles_id'];
        }
        if(user_invitation_records[i]['Role'].toUpperCase() in allRolesObj){
          em_role = user_invitation_records[i]['Role'].toUpperCase();
        } else if(user_invitation_records[i]['Role'].toUpperCase() in defs['account_roles']) {
          account_role = (user_invitation_records[i]['Role'].toUpperCase());
        }

      }
      await userInvitation.create({
        'first_name': ('First Name' in user_invitation_records[i]) ? user_invitation_records[i]['First Name'] : '',
        'last_name': ('Last Name' in user_invitation_records[i]) ? user_invitation_records[i]['Last Name'] : '',
        'email': user_invitation_records[i]['Email'],
        'location_id': 0,
        'account_id': req.user.account_id,
        'role_id': (account_role.length > 0 ) ? defs['account_roles'][account_role] : 0,
        'eco_role_id': (em_role.length > 0) ? defs['em_roles'][em_role] : 0,
        'contact_number': ('Mobile Number' in  user_invitation_records[i]) ? user_invitation_records[i]['Mobile Number'] : '',
        'phone_number': ('Phone Number' in  user_invitation_records[i]) ? user_invitation_records[i]['Phone Number'] : '',
        'invited_by_user': req.user.user_id
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
      em_role = '';
      account_role = '';
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
      emailBody += `<h3 style="text-transform:capitalize;">Hi${name},</h3> <br/>
      <h4>You are nominated to be a Warden.</h4> <br/>
      <h5>Click on the link below to setup your password.</h5> <br/>
      <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

      emailBody += email.getEmailHTMLFooter();
      email.assignOptions({
        body : emailBody,
        to: [user_invitation_records[i]['Email']],
        cc: ['erwin.macaraig@gmail.com']
      });
      await email.send((result) => console.log(result),
                 (err) => console.log(err)
                );
    }
    return true;
    /*
    const em_role = (data[i]['eco_role']).toUpperCase();
          // email and create
          const userInvitation = new UserInvitation();
          const tokenModel = new Token();
          const tokenStr = tokenModel.generateRandomChars(10);
          await userInvitation.create({
            'first_name': data[i]['first_name'],
            'last_name': data[i]['last_name'],
            'email': data[i]['email'],
            'location_id': 0,
            'account_id': req.user.account_id,
            'role_id': 0,
            'eco_role_id': defs['em_roles'][em_role],
            'contact_number': data[i]['mobile_number'],
            'phone_number': data[i]['phone_number'],
            'invited_by_user': req.user.user_id
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

           */
  }

  public async addMobilityImpairedPersons(req: AuthRequest, res: Response) {
    console.log(JSON.parse(req.body.peep));
    const peep = JSON.parse(req.body.peep);
    const invalidPeep = [];
    for (const p of peep) {
      p['errors'] = {};
      const userInvitation = new UserInvitation();
      const tokenModel = new Token();
      const tokenStr = tokenModel.generateRandomChars(10);
      const user = new User();
      const locModel = new Location();
      const parentLocModel = new Location();
      const userEmRole = new UserEmRoleRelation();
      const emRoles = await userEmRole.getEmRoles();
      try {
        const dbData = await user.getByEmail(p['email']);
        p['errors']['email_taken'] = true;
        invalidPeep.push(p);
      } catch (e) {
        if (validator.isEmail(p['email'])) {

          if(new BlacklistedEmails().isEmailBlacklisted(p['email'])){
            p['errors']['blacklisted'] = true;
            invalidPeep.push(p);
          }else{
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

            locModel.setID(p.location_id);
            let location = await locModel.load();
            let parentName = '';
            if(location['parent_id'] > -1){
              parentLocModel.setID(location['parent_id']);
              await parentLocModel.load();
              parentName = <string>parentLocModel.get('name');
            }
            let locText = '';
            if(parentName.length > 0){
              locText += parentName+', ';
            }
            locText += location['name'];

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

            let roleText = ``;
            if(p.role_id == 1){
              roleText += ' FRP '
            }else if(p.role_id == 2){
              roleText += ' TRP '
            }

            if(p.eco_role_id >= 8){
              let emRole = '';
              for(let i in emRoles){
                if(emRoles[i]['em_roles_id'] == p.eco_role_id){
                  emRole = emRoles[i]['role_name'];
                }
              }
              roleText += ' AND '+emRole;
            }

            emailBody += `<h3 style="text-transform:capitalize;">Hi ${p['first_name']} ${p['last_name']},</h3> <br/>
            <h4>You are invited to be ${roleText} in ${locText}.</h4> <br/>
            <h5>Click on the link below to setup your password.</h5> <br/>
            <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

            emailBody += email.getEmailHTMLFooter();
            email.assignOptions({
              body : emailBody,
              to: [p['email']],
              cc: ['erwin.macaraig@gmail.com']
            });
            email.send((data) => console.log(data),
                       (err) => console.log(err)
                      );
          }

        } else {
          p['errors']['invalid'] = true;
          invalidPeep.push(p);
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
      warden['errors'] = {};

      try {
        const dbData = await user.getByEmail(warden['email']);
        warden['errors']['email_taken'] = true;
        invalidWarden.push(warden);
      } catch (e) {

        if (validator.isEmail(warden['email'])) {
          if(new BlacklistedEmails().isEmailBlacklisted(warden['email'])){
            warden['errors']['blacklisted'] = true;
            invalidWarden.push(warden);
          }else{
            const userInvitation = new UserInvitation();
            const tokenModel = new Token();
            const tokenStr = tokenModel.generateRandomChars(10);
            warden['invited_by_user'] = req.user.user_id;
            warden['account_id'] = req.user.account_id;

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
          }
        } else {
          warden['errors']['invalid'] = true;
          invalidWarden.push(warden);
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
    try {
      // locations tagged to the user who invited this warden
      locationsOnAccount = await account.getLocationsOnAccount(dbData['invited_by_user'], role);
    } catch (e) {
      console.log(e);
      throw new Error(e);
    }

    const accountDB = await account.load();
    dbData['account'] = account.get('account_name');
    if (!dbData['location_id']) {
      switch (role) {
        case 1:
          for (let loc of locationsOnAccount) {
            location = new Location(loc.location_id);
            loc['sublocations'] = await location.getSublocations();
          }
          dbData['locations'] = locationsOnAccount; console.log('dbData = ', dbData);
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
    if(parseInt(req.body.em_role) > 2){
      const EMRoleUserRole = new UserEmRoleRelation();
      await EMRoleUserRole.create({
        'user_id': user.ID(),
        'em_role_id': req.body.em_role,
        'location_id': req.body.sublocation
      });
    }
    // create a record in location_account_user
    let locationAcctUser = new LocationAccountUser();
    await locationAcctUser.create({
      'location_id': req.body.sublocation,
      'account_id': req.body.account_id,
      'user_id': user.ID(),
      'role_id': (req.body.role_id == 1 || req.body.role_id == 2) ? req.body.role_id : req.body.em_role
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

      /*await locationAcctUser.create({
        'location_id': theLocation,
        'account_id': req.body.account_id,
        'user_id': user.ID(),
        'role_id': (req.body.role_id == 1 || req.body.role_id == 2) ? req.body.role_id : req.body.em_role
      });*/

      if(parseInt(req.body.role_id) == 1 || parseInt(req.body.role_id) == 2){
        const userRoleRel = new UserRoleRelation();
        await userRoleRel.create({
          'user_id': user.ID(),
          'role_id': req.body.role_id
        });
      }

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

  public async buildWardenList(req: AuthRequest, res: Response, archived?){
      let accountId = req['user']['account_id'],
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
            emRolesIndexedId = {};

        if(!archived){ archived = 0; }

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
        }

        let allowedRoleIds = [0];
        for(let i in emRoles){
            allowedRoleIds.push(emRoles[i]['em_roles_id']);
            emRolesIndexedId[ emRoles[i]['em_roles_id'] ] = emRoles[i];
        }

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
                LAU.account_id = ${accountId}
              AND
                locations.archived = 0
              AND
                LAU.user_id = ${userID}
              AND LAU.archived = 0
              GROUP BY
                locations.location_id
              ORDER BY
                locations.location_id
            )`;

        let arrWhere = [];
            arrWhere.push( ["account_id = "+accountId ] );
            arrWhere.push( ["lau.location_id IN "+sqlInLocation ] );
            arrWhere.push( ["lau.role_id IN ("+allowedRoleIds.join(',')+")" ] );

        let locations = await locationAccountUser.getMany(arrWhere);

        response['locations'] = locations;

        let allowedUsersId = [];
        for(let i in locations){
            if( allowedUsersId.indexOf( locations[i]['user_id'] ) == -1  ){
                allowedUsersId.push(locations[i]['user_id']);
            }
        }

        let toSendData = [];
        for(let user of allUsers){
            if( allowedUsersId.indexOf(user.user_id) > -1 ){
                user['locations'] = <any>[];
                for(let l in locations){
                    if( 
                        ( allowedRoleIds.indexOf( locations[l]['role_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['em_roles_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['location_role_id'] ) > -1 )  
                        && locations[l]['user_id'] == user.user_id
                        ){
                        user['locations'].push(locations[l]);
                    }
                }
                toSendData.push(user);
            }
        }

        for(let user of toSendData){
            let locs = user.locations;
            user['roles'] = [];
            let tempUserRoles = {};
            
            for(let loc of locs){
                let roleName = 'General Occupant',
                    roleId = 8;

                if( emRolesIndexedId[ loc.location_role_id ] ){
                    roleName = emRolesIndexedId[ loc.location_role_id ]['role_name'];
                    roleId = loc.location_role_id;
                }else if( emRolesIndexedId[ loc.em_roles_id ] ){
                    roleName = emRolesIndexedId[ loc.em_roles_id ]['role_name'];
                    roleId = loc.em_roles_id;
                }

                if(!tempUserRoles[roleId]){
                    tempUserRoles[roleId] = roleId;
                    user['roles'].push({
                        role_name : roleName, role_id : roleId
                    });
                }
            }

            user['training_applicable'] = true;
            for(let role of user['roles']){
                if(role.em_roles_id == 12 || role.em_roles_id == 13){
                    if(user['roles'].length == 1){
                        user['training_applicable'] = false;
                    }
                }
            }
        }

        response.data = toSendData;
        response.status = true;
        res.statusCode = 200;
        res.send(response);
  }

  /*public async buildWardenList(req: AuthRequest, res: Response, archived?) {

    // get all parent locations associated with this account
    const accountId = req.user.account_id;
    const account = new Account(accountId);
    const userRoleRel = new UserRoleRelation();
    const role = await userRoleRel.getByUserId(req.user.user_id, true);
    const emRoleRelation = new UserEmRoleRelation();
    let emroles = await emRoleRelation.getEmRoles();
    // what is the highest rank role of the user who invited this warden
    // const locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id);

    let result = <any>[];
    try {
      result = await account.buildWardenList(req.user.user_id);
    }catch (e) {

    }

    const temp = JSON.stringify(result);
    const wardens = JSON.parse(temp);

    // get parent location details given a location id
     for (let warden of wardens) {
      warden['profile_pic'] = '';
      if (warden['last_login']){
        warden['last_login'] = moment(warden['last_login'], ["YYYY-MM-DD HH:mm:ss"]).format("MMM. DD, YYYY hh:mmA");
      }
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

    let emroleids = [0];
    for(let i in emroles){
      if(emroles[i]['is_warden_role'] == 1){
        emroleids.push( emroles[i]['em_roles_id'] );
      }
    }

    let newWardenResponse = [];
    for(let warden of wardens){
      let locAccUserModel = new LocationAccountUser(),
        arrWhere = [];

      arrWhere.push([ "user_id = "+warden['user_id'] ]);
      arrWhere.push([ "location_id = "+warden['location_id'] ]);
      arrWhere.push([ "archived = 0 " ]);
      arrWhere.push([ "role_id IN ("+emroleids.join(",")+") " ]);

      try{
        let locAccUserRec = await locAccUserModel.getMany(arrWhere);

        warden['location_account_user_id'] = locAccUserRec[0]['location_account_user_id'];
        newWardenResponse.push(warden);
      }catch(e){

      }

    }

    return newWardenResponse;
  }*/

  public async buildPEEPList(req: AuthRequest, res:Response, archived?){
      let accountId = req['user']['account_id'],
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
        emRolesIndexedId = {};

    if(!archived){ archived = 0; }

    allUsers = await allUsersModel.getImpairedByAccountId(accountId, archived);

    for(let user of allUsers){
        allUsersIds.push(user.user_id);
        let filesModel = new Files();
        try{
            let profRec = await filesModel.getByUserIdAndType( user.user_id, 'profile' );
            user['profile_pic'] = profRec[0]['url'];
        }catch(e){
            user['profile_pic'] = '';
        }
    }

    let allowedRoleIds = [0,1,2];
    for(let i in emRoles){
        allowedRoleIds.push(emRoles[i]['em_roles_id']);
        emRolesIndexedId[ emRoles[i]['em_roles_id'] ] = emRoles[i];
    }

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
            LAU.account_id = ${accountId}
          AND
            locations.archived = 0
          AND
            LAU.user_id = ${userID}
          AND LAU.archived = 0
          GROUP BY
            locations.location_id
          ORDER BY
            locations.location_id
        )`;

    let arrWhere = [];
        arrWhere.push( ["account_id = "+accountId ] );
        arrWhere.push( ["lau.location_id IN "+sqlInLocation ] );
        arrWhere.push( ["lau.role_id IN ("+allowedRoleIds.join(',')+")" ] );

    let locations = await locationAccountUser.getMany(arrWhere);

    response['locations'] = locations;

    let allowedUsersId = [];
    for(let i in locations){
        if( allowedUsersId.indexOf( locations[i]['user_id'] ) == -1  ){
            allowedUsersId.push(locations[i]['user_id']);
        }
    }

    let toSendData = [];
    for(let user of allUsers){
        if( allowedUsersId.indexOf(user.user_id) > -1 ){
            user['locations'] = <any>[];
            for(let l in locations){
                if( 
                    ( allowedRoleIds.indexOf( locations[l]['role_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['em_roles_id'] ) > -1 || allowedRoleIds.indexOf( locations[l]['location_role_id'] ) > -1 )  
                    && locations[l]['user_id'] == user.user_id
                    ){
                    user['locations'].push(locations[l]);
                }
            }
            toSendData.push(user);
        }
    }

    for(let user of toSendData){
        let locs = user.locations,
          tempUserRoles = {},
          arrWhere = [];

        user['roles'] = [];
        arrWhere.push( "user_id = "+user["user_id"] );
        arrWhere.push( "duration_date > NOW()" );

        user['mobility_impaired_details'] = await new MobilityImpairedModel().getMany(arrWhere);
        for(let userMobil of user.mobility_impaired_details){
          userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
        }

        for(let loc of locs){
            let roleName = 'General Occupant',
                roleId = 8;

            if( emRolesIndexedId[ loc.location_role_id ] ){
                roleName = emRolesIndexedId[ loc.location_role_id ]['role_name'];
                roleId = loc.location_role_id;
            }else if( emRolesIndexedId[ loc.em_roles_id ] ){
                roleName = emRolesIndexedId[ loc.em_roles_id ]['role_name'];
                roleId = loc.em_roles_id;
            }

            if(!tempUserRoles[roleId]){
                tempUserRoles[roleId] = roleId;
                user['roles'].push({
                    role_name : roleName, role_id : roleId
                });
            }
        }

        user['training_applicable'] = true;
        for(let role of user['roles']){
            if(role.em_roles_id == 12 || role.em_roles_id == 13){
                if(user['roles'].length == 1){
                    user['training_applicable'] = false;
                }
            }
        }
    }

    if(!archived){
      let userInviModel = new UserInvitation(),
        whereInvi = [];

      whereInvi.push([ 'account_id = '+accountId ]);
      whereInvi.push([ 'mobility_impaired = 1' ]);
      whereInvi.push([ 'was_used = 0' ]);

      try{
        let usersInvited:any = await userInviModel.getWhere(whereInvi);
        for(let user of usersInvited){
          user['locations'] = [];
          user['profile_pic'] = '';
          user['mobility_impaired_details'] = [];
          user.locations.push({
            location_id : user.location_id,
            name : user.location_name,
            parent_name : user.parent_name
          });
          toSendData.push(user);
        }
      }catch(e){}
    }


    response.data = toSendData;
    response.status = true;
    res.statusCode = 200;
    res.send(response);
  }

  /**
  public async buildPEEPList(req: AuthRequest, res: Response, archived?) {
    const account = new Account(req.user.account_id);
    const result = await account.buildPEEPList(req.user.account_id, req.user.user_id, archived);
    const temp = JSON.stringify(result);
    const peeps = JSON.parse(temp);
    const emRoleRelation = new UserEmRoleRelation();
    let emroles = await emRoleRelation.getEmRoles();
    for (const peep of peeps) {
      peep['profile_pic'] = '';
      if(peep['last_login']){
        peep['last_login'] = moment(peep['last_login'], ["YYYY-MM-DD HH:mm:ss"]).format("MMM. DD, YYYY hh:mmA");
      }
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

    let emroleids = [0];
    for(let i in emroles){
      if(emroles[i]['is_warden_role'] == 1){
        emroleids.push( emroles[i]['em_roles_id'] );
      }
    }

    let newPeep = [];
    for(let peep of peeps){
      if(!archived && peep['location_account_user_id']){
        newPeep.push(peep);
      }else if(!archived && peep['user_invitations_id']){
        newPeep.push(peep);
      }else if(archived && peep['location_account_user_id']){
        newPeep.push(peep);
      }
    }

    for(let peep of newPeep){
      peep['mobility_impaired_details'] = {};
      if(peep['location_account_user_id']){
        let arrWhere = [];
        arrWhere.push( "user_id = "+peep["user_id"] );
        arrWhere.push( "location_id = "+peep["location_id"] );

        let mob = await new MobilityImpairedModel().getMany(arrWhere);
        peep['mobility_impaired_details'] = (mob[0]) ? mob[0] : {};
        if(mob[0]){
          peep['mobility_impaired_details']['date_created'] = moment(mob[0]['date_created']).format('MMM. DD, YYYY');
        }
      }
    }

    return newPeep;

  }
  */


}