
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
           // console.log(data);
           return res.status(200).send({
             'status': 'Success',
             'data': data[0],
             'total_warden': data[1]
           });
         }).catch((e) => {
           console.log(e);
           return res.status(400).send({
             'status': 'Fail',
             'error': e
           });
         });
       });

       router.post('/reports/location-trainings', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ReportsRoute().locationTrainings(req, res);
        });

       router.post('/reports/get-compliance-summary', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
         new ReportsRoute().getComplianceSummary(req, res);
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
        let wardenInTheWholeBuilding = 0;
        try {
          const temp = await location.getEMRolesForThisLocation(defs['em_roles']['WARDEN']);
          wardenInTheWholeBuilding = temp[defs['em_roles']['WARDEN']]['count'];
        } catch (e) {
          console.log(e);
          wardenInTheWholeBuilding = 0;
        }


        Object.keys(resultSet).forEach((key) => {
          resultSetArr.push(resultSet[key]);
        });
        let peepData;
        try {
          peepData = await new Account().generateReportPEEPList(sublocs);
        } catch (e) {
          peepData = {};
        }
        for (let j = 0; j < resultSetArr.length; j++) {
          if (resultSetArr[j]['account_id'].toString() in peepData) {
            resultSetArr[j]['peep_total'] = peepData[resultSetArr[j]['account_id']]['total'];
          } else {
            resultSetArr[j]['peep_total'] = 0;
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
        return [resultSetArr, wardenInTheWholeBuilding];
     }

    private mergeToParent(data){

        for(let p in data){
            let parent = data[p];

            if(parent.sublocations === undefined){
                parent['sublocations'] = [];
            }

            for(let c in data){
                let child = data[c];
                if('is_here' in child){
                  if(child.parent_id == parent.location_id && child.is_here === true){
                    parent.sublocations.push(child);
                  }
                }else{
                      if(child.parent_id == parent.location_id){
                          parent.sublocations.push(child);
                      }
                }
            }
        }

        let finalData = [];
        for(let i in data){
            if(data[i]['parent_id'] == -1){
                finalData.push(data[i]);
            }
        }

        return finalData;
    }


    public async locationTrainings(req: AuthRequest, res: Response){
        let response = {
            status : false, data : {
                location : {},
                sublocations : []
            }, message : ''
        },
        location_id = req.body.location_id,
        locationModel = new Location(location_id),
        sublocationModel = new Location();

        try{
            let location = await locationModel.load(),
                deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(location_id),
                allLocationIds = [location_id],
                allLocations = [location];

            location['name'] = (location['name'].length === 0) ? location['formatted_address'] : location['name'];

            for(let loc of deepLocations){
                allLocationIds.push(loc.location_id);
                allLocations.push(loc);
                loc['name'] = (loc['name'].length === 0) ? loc['formatted_address'] : loc['name'];
            }

            let locAccUser = new LocationAccountUser(),
                users = <any> await locAccUser.getUsersInLocationId( allLocationIds.join(',') ),
                allUserIds = [];

            for(let user of users){
                if(allUserIds.indexOf(user.user_id) == -1){
                    allUserIds.push(user.user_id);
                }
            }

            let trainCertModel = new TrainingCertification(),
                certificates = <any> await trainCertModel.getCertificatesByInUsersId( allUserIds.join(',') );

            for(let cert of certificates){
                for(let user of users){
                    if(user.user_id == cert.user_id){
                        cert['first_name'] = user.first_name;
                        cert['last_name'] = user.last_name;
                        cert['email'] = user.email;
                    }
                }

                cert['certification_date_formatted'] = moment(cert['certification_date']).format('DD/MM/YYYY');
            }

            response.data = certificates;

        }catch(e){
            response.message = 'No location found';
        }

        res.send(response);
    }


    public async getComplianceSummary(req: AuthRequest, res: Response){
        let location_id = req.body.location_id,
            response = {
                status : true, data : {
                    locations : [],
                    compliance_rating : '0/0'
                }, message : ''
            },
            locations = [],
            locationModel = new Location(location_id);

        if(location_id == 0){

            const account = new Account(req.user.account_id);
            locations = <any> await account.getRootLocationsOnAccount(req.user.user_id).catch((e) => {  });

        }else{

            try{
                let location = await locationModel.load();
                locations.push(location);
            }catch(e){
                response.status = false;
                response.message = 'No location found';
            }

        }

        for(let loc of locations){
            let sublocationModel = new Location();
            let deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(loc.location_id);

            loc['name'] = (loc['name'].length == 0) ? loc['formatted_address'] : loc['name'];

            loc['number_of_sublocations'] = deepLocations.length;
            loc['compliance_rating'] = '0/0';
            loc['status'] = 'Not Compliant';
        }


        response.data.locations = locations;

        res.send(response);
    }
}
