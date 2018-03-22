
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

       /**
        * @route
        * generate list for team
        */
       router.get('/reports/team/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
         new ReportsRoute().generateTeamReport(req, res, next).then((data) => {
           console.log(data);
           return res.status(200).send({
             'status': 'Success',
             'data': data
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

     /**
      * @generateTeamReport
      * process reporting info for a given root location
      */
     public async generateTeamReport(req: AuthRequest, res: Response, next: NextFunction) {
        // console.log(req.query.location_id);
        // create location object reference
        const location = new Location(req.query.location_id);
        // generate all sublocation from the given parent
        const sublocationsDbData = await location.getDeepLocationsByParentId(req.query.location_id);
        const sublocs = [];
        const EMRole = new UserEmRoleRelation();
        Object.keys(sublocationsDbData).forEach((i) => {
          sublocs.push(sublocationsDbData[i]['location_id']);
        });

        const locAcctUser = new LocationAccountUser();
        const resultSet = await locAcctUser.getAllAccountsInSublocations(sublocs);
        const resultSetArr = [];

        Object.keys(resultSet).forEach((key) => {
          resultSetArr.push(resultSet[key]);
        });
        let peepData;
        try {
          console.log(sublocs);
          peepData = await new Account().generateReportPEEPList(sublocs);
        } catch (e) {
          peepData = {};
        }
        console.log(peepData);
        for (let j = 0; j < resultSetArr.length; j++) {
          if (resultSetArr[j]['account_id'].toString() in peepData) {
            console.log('I am here');
            resultSetArr[j]['peep_total'] = peepData[resultSetArr[j]['account_id']]['total'];
          } else {
            resultSetArr[j]['peep_total'] = 0;
            console.log(resultSetArr[j]['account_id'].toString());
          }
          try {
            const temp = await EMRole.getEMRolesOnAccountOnLocation(
              defs['em_roles']['WARDEN'],
              resultSetArr[j]['account_id'],
              resultSetArr[j]['location_id']
            );
            resultSetArr[j]['total_wardens'] = temp['users'].length;
            resultSetArr[j]['wardens'] = temp['raw'];
          } catch (e) {
            resultSetArr[j]['total_wardens'] = 0;
            resultSetArr[j]['wardens'] = [];
          }
        }
        return resultSetArr;
     }

 }
