
import { Account } from '../models/account.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { Location } from '../models/location.model';
import { LocationAccountUser } from '../models/location.account.user';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { Token } from '../models/token.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { TrainingCertification } from '../models/training.certification.model';
import { WardenBenchmarkingCalculator } from '../models/warden_benchmarking_calculator.model';
import * as fs from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
const validator = require('validator');
const md5 = require('md5');
const moment = require('moment');
const url = require('url');
const defs = require('../config/defs.json');
/**
 * / route
 *
 * @class ReportsRoute
 */

 export class ReportsRoute extends BaseRoute {
     /**
      * Create the routes
      *
      * @class ReportsRoute
      * @method create
      * @static
      */
     public static create(router: Router) {
       /**
        * @route
        * getting the list of parent locations for this user under his account
        */
       router.get('/reports/list-locations/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
          // get all parent locations
          const account = new Account(req.user.account_id);
          account.getRootLocationsOnAccount(req.user.user_id)
              .then((locations) => {
                Object.keys(locations).forEach((i) => {
                  if (locations[i]['name'].length === 0) {
                    locations[i]['name'] = locations[i]['formatted_address'];
                  }
                });
                console.log(locations);
                return res.status(200).send({
                  'status': 'Success',
                  'data': locations
                });
              }).catch((e) => {
                console.log(e);
                return res.status(400).send({
                  'status': 'Fail',
                  'error': e
                });
              });
       });
     }

 }
