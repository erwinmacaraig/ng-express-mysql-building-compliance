
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
import { ComplianceModel } from '../models/compliance.model';
import { ComplianceKpisModel } from '../models/comliance.kpis.model';
import { ComplianceDocumentsModel } from '../models/compliance.documents.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { TrainingCertification } from '../models/training.certification.model';
import { Utils } from '../models/utils.model';
import { WardenBenchmarkingCalculator } from '../models/warden_benchmarking_calculator.model';
import { ComplianceRoute } from './compliance';

import { PDFDocumentWithTables } from '../models/pdftable';
import * as PDFDocument from 'pdfkit';

import * as fs from 'fs';
import * as path from 'path';
import * as CryptoJS from 'crypto-js';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
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
        router.get('/reports/list-locations',
            new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
                const 
                locAccntRelObj = new LocationAccountRelation(),
                userRoleRel = new UserRoleRelation(),
                filter = {};

                let 
                r = 0,
                locationListing,
                accountId = (req.query.account_id) ? req.query.account_id : req.user.account_id,
                userId = (req.body.user_id) ? req.body.user_id : (req.user.user_id) ? req.user.user_id : 0;

                if(req.user.evac_role == 'admin'){
                    r = 1;
                }else{
                    try {
                        r = await userRoleRel.getByUserId(userId, true);
                    } catch (e) {
                        console.log('location route get-parent-locations-by-account-d', e);
                        r = 0;
                    }
                }

                let 
                    roles = [],
                    isPortfolio = false;

                try {
                  roles = await userRoleRel.getByUserId(userId);
                  for(let role of roles){
                      if(role['is_portfolio'] == 1){
                          isPortfolio = true;
                      }
                  }
                } catch(e) { }

                filter['isPortfolio'] = isPortfolio;
                filter['userId'] = userId;


                filter['responsibility'] = r;
                if (r === defs['Tenant']) {
                    locationListing = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
                } else if (r === defs['Manager']) {
                    // filter['is_building'] = 1;
                    locationListing = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
                }

                // console.log(locationListing);
                return  res.send({
                    data : locationListing
                });
            }
        );

       /**
        * @route
        * generate list for team
        */
       router.post('/reports/team', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
         new ReportsRoute().generateTeamReport(req, res);
       });

       router.post('/reports/location-trainings', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ReportsRoute().locationTrainings(req, res);
        });

       router.post('/reports/get-compliance-summary', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
         new ReportsRoute().getComplianceSummary(req, res);
       });

       router.get('/reports/get-statement-of-compliance/:location_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
         new ReportsRoute().getStatementOfCompliance(req, res);
       });

       router.post('/reports/get-activity-report', new MiddlewareAuth().authenticate, (req: AuthRequest, res:Response) => {
           new ReportsRoute().getActivityReport(req, res);
       });

        router.post('/reports/warden-list', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
          new ReportsRoute().generateWardenReport(req, res);
        })

       router.get('/reports/pdf-activity-report/:locids/:limit/:account/:userid/:isadmin', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = req.params.limit;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           req.body['isadmin'] = req.params.isadmin;
           new ReportsRoute().getActivityReport(req, res, true);
       });

       router.get('/reports/csv-activity-report/:locids/:limit/:account/:userid/:isadmin', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = req.params.limit;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           req.body['isadmin'] = req.params.isadmin;
           new ReportsRoute().getActivityReport(req, res, false, true);
       });

       router.get('/reports/pdf-team/:locids/:limit/:account/:userid', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           new ReportsRoute().generateTeamReport(req, res, true);
       });

       router.get('/reports/csv-team/:locids/:limit/:account/:userid', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = req.params.limit;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           new ReportsRoute().generateTeamReport(req, res, false, true);
       });

       router.get('/reports/pdf-location-trainings/:locids/:limit/:account/:userid/:searchkey/:trainingid/:coursemethod/:compliant', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = req.params.limit;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           req.body['course_method'] = req.params.coursemethod;
           req.body['training_id'] = req.params.trainingid;
           req.body['searchKey'] = req.params.searchkey;
           req.body['compliant'] = req.params.compliant;
           
           new ReportsRoute().locationTrainings(req, res, true);
       });

       router.get('/reports/csv-location-trainings/:locids/:limit/:account/:userid/:searchkey/:trainingid/:coursemethod/:compliant', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = req.params.limit;
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = req.params.account;
           req.body['user_id'] = req.params.userid;
           req.body['course_method'] = req.params.coursemethod;
           req.body['training_id'] = req.params.trainingid;
           req.body['searchKey'] = req.params.searchkey;
           req.body['compliant'] = req.params.compliant;
           
           new ReportsRoute().locationTrainings(req, res, false, true);
       });


       router.get('/reports/pdf-warden-list/:locids/:limit/:account/:userid/:searched_name/:roleids', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = parseInt(req.params.limit);
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = (req.params.account == 'null') ? null : req.params.account;
           req.body['user_id'] = parseInt(req.params.userid);
           req.body['searchKey'] = req.params.searched_name.trim();
           req.params.roleids = req.params.roleids.split(",");
           req.params.roleids.forEach(function(item, index){
             req.params.roleids[index] = parseInt(item);
           });
           req.body['eco_role_ids'] = req.params.roleids;
           new ReportsRoute().generateWardenReport(req, res, true);
       });

       router.get('/reports/csv-warden-list/:locids/:limit/:account/:userid/:searched_name/:roleids', (req: AuthRequest, res:Response) => {
           req.body['offset'] = 0;
           req.body['limit'] = parseInt(req.params.limit);
           req.body['location_id'] = req.params.locids;
           req.body['account_id'] = (req.params.account == 'null') ? null : req.params.account;
           req.body['user_id'] = parseInt(req.params.userid);
           req.body['searchKey'] = req.params.searched_name.trim();
           req.params.roleids = req.params.roleids.split(",");
           req.params.roleids.forEach(function(item, index){
             req.params.roleids[index] = parseInt(item);
           });
           req.body['eco_role_ids'] = req.params.roleids;
           new ReportsRoute().generateWardenReport(req, res, false, true);
       });

    }

   /**
    * @generateTeamReport
    * process reporting info for a given root location
    */
   

    public async generateWardenReport(req: AuthRequest, res: Response, toPdf?, toCsv?){
      let
        response = {
            status : false, data : [], message : '',
            pagination : {
                total : 0,
                pages : 0
            },
            'location-origin': req.body.location_id
        },
        offset = req.body.offset,
        limit = req.body.limit,
        d = {
            location : {},
            sublocations : []
        },
        location_id = req.body.location_id,
        accountId = (req.body.account_id) ? req.body.account_id : (req.user) ? req.user.account_id : 0,
        locationModel = new Location(location_id),
        sublocationModel = new Location(),
        locations = <any> [],
        filterExceptLocation = (req.body.nofilter_except_location) ? req.body.nofilter_except_location : false,
        userRoleModel = new UserRoleRelation(),
        userId = (req.body.user_id) ? req.body.user_id : req.user.user_id,
        role = 0,
        eco_role_ids = (req.body.eco_role_ids) ? req.body.eco_role_ids :  [9,10,11,15,16,18],
        eco_order = (req.body.eco_order) ? req.body.eco_order : [11,15,13,16,18,9,10]

        try{
            role = await userRoleModel.getByUserId(userId, true);
        }catch(e){}

        if (location_id == 0) {
            try{
                let responseLocations = <any> await this.listLocations(req,res, true, { 'archived' : 0 });
                locations = responseLocations.data;
            }catch(e){
              console.log(e);
            }
        } else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere( whereLoc );
            }catch(e){  }
        }

        let 
          allUserIds = [0],
          allLocationIds = [],
          allLocations = [],
          users = [],
          usersCount = [];

        const config = {};
        if(req.body.searchKey){
          if ( (req.body.searchKey !== null && req.body.searchKey.length > 0) && !filterExceptLocation) {
            config['searchKey'] = req.body.searchKey;
          }
        }

        if(role != 1){
            config['account_id'] = accountId;
        }

        let 
        allLocModel = new Location(),
        allDbLocations = await allLocModel.getAllLocations(),
        mergeToParent = function(data){

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
        },
        findLocationFromHierarhy = function(data, locationId){
            for(let d of data){
                if(d.location_id == locationId){
                    return d;
                }else if(d.sublocations.length > 0){
                    let res = findLocationFromHierarhy(d.sublocations, locationId);
                    if(res){
                        return res;
                    }
                }
            }
        },
        hierarchies = mergeToParent(allDbLocations);
        
        let collectLocIdsFromHierarchy = function(data){
            let response = [];
            for(let d of data){
                response.push(d.location_id);
                if(d.sublocations.length > 0){
                    let subResponse = collectLocIdsFromHierarchy(d.sublocations);
                    response = response.concat(subResponse);
                }
            }
            return response;
        };

        for(let loc of locations){
            allLocationIds.push(loc.location_id);
            let hier = findLocationFromHierarhy(hierarchies, loc.location_id);
            if(hier){
                let ids = collectLocIdsFromHierarchy(hier.sublocations);
                allLocationIds = allLocationIds.concat(ids);
            }
        }

        let 
        usersModel = new User(),
        frpAndTrp = [];

        config['eco_only'] = true;
        config['eco_role_ids'] = eco_role_ids.join(',');
        config['eco_order'] = eco_order;
        let offsetLimit = (filterExceptLocation) ? false :  (limit == 0) ? false : offset+','+limit;
        if(!toPdf && !toCsv){
          config['limit'] = offsetLimit;
        }

        if(eco_role_ids.length > 0){
          users = <any> await usersModel.getAllRolesInLocationIds(allLocationIds.join(','), config);
          config['count'] = true;
          usersCount = <any> await usersModel.getAllRolesInLocationIds(allLocationIds.join(','), config);
        }

        for(let user of users){
            if(allUserIds.indexOf(user.user_id) == -1){
                allUserIds.push(user.user_id);
            }

            if(user.role_id == 1 || user.role_id == 2){
                frpAndTrp.push(user);
            }
        }

        response.pagination.total = (usersCount[0]) ? usersCount[0]['count'] : 0;
        for(let u of users){
          u['region'] = '';
          u['building'] = '';
          u['sublocation'] = '';
          if(u.is_building == 1){
            u['region'] = u.parent_location_name;
            u['building'] = u.name;
          }else if(u.parent_is_building == 1){
            u['region'] = u.parent2_location_name;
            u['building'] = u.parent_location_name;
            u['sublocation'] = u.name;
          }
        }
        response.data = users;

        if(response.pagination.total > limit){
            let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            response.pagination.pages = totalpages;
        }

        if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
            response.pagination.pages = 1;
        }


        if(!toPdf && !toCsv){
            res.status(200).send(response);
        }else if(toPdf || toCsv){
          response['tables'] = [];
          let tblData = {
            title : 'Warden List Report',
            data : [], 
            headers : ["Region", "Building", "Sublocation", "Name", "ECO Role", "Email", "Account"]
          };

          for(let re of response.data){

              tblData.data.push([ re.region, re.building, re.sublocation, re.first_name+' '+re.last_name, re.role_name, re.email, re.account_name ]);

          }
           
          response['tables'].push(tblData);

          if(toPdf){
              this.generatePDF(response, res);
          }else{
              this.generateCSV(response, res);
          }

        } 
    }

    public async generateTeamReport(req: AuthRequest, res: Response, toPdf?, toCsv?) {

        let
        userRoleRel = new UserRoleRelation(),
        r = 0,
        location_id = req.body.location_id,
        accountId = (req.body.account_id) ? (req.body.account_id > -1) ? req.body.account_id : req.user.account_id : req.user.account_id,
        response = {
            status : true, data : [], message : '',
            pagination : {
                total : 0,
                pages : 0
            }
        },
        offset = req.body.offset,
        limit = (req.body.limit)? req.body.limit : 5,
        locationModel = new Location(location_id),
        locations = <any> [],
        toReturn = <any> [],
        isAdmin = (req.user) ? (req.user.evac_role == 'admin') ? true : false : false,
        userRoleModel = new UserRoleRelation(),
        userId = (req.body.user_id) ? req.body.user_id : req.user.user_id,
        role = 0;

        try{
            role = await userRoleModel.getByUserId(userId, true);
        }catch(e){}

        if(location_id == 0){
            try{
                let responseLocations = <any> await this.listLocations(req,res, true, {
                    'offset' : offset, 'limit' : limit, 'archived' : 0
                });
                locations = responseLocations.data;

                let countLocations = <any> await this.listLocations(req,res, true, {
                    'offset' : offset, 'limit' : limit, 'archived' : 0, 'count' : true
                });

                response.pagination.total = countLocations.data[0]['count'];
            }catch(e){}
        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere(whereLoc, offset+','+limit);
                let countLocations = <any> await await locationModel.getWhere(whereLoc, offset+','+limit, true);

                response.pagination.total = countLocations[0]['count'];

                response['locations'] = locations;
            }catch(e){  }
        }

        // console.log( response.pagination );

        let getData = async (locationId, locName, accountId) => {
          let
            locAccUserModel = new LocationAccountUser(),
            emModel = new UserEmRoleRelation(),
            wardensSub = <any> await emModel.getWardensInLocationIds(locationId, 0, accountId),
            mobilityModel = new MobilityImpairedModel(),
            mobs = <any> await mobilityModel.getImpairedUsersInLocationIds(locationId, accountId),
            whereLocUser = [],
            data = {
                location_id : locationId,
                name : locName,
                peep_total : mobs.length,
                total_wardens : wardensSub.length,
                trp : []
            };

            data.trp = <any> await locAccUserModel.getTrpByLocationIds(locationId);

            return data;
        };

        for(let loc of locations){
            loc['parent'] = { name : '' };
            try{
                let parentModel = new Location(loc.parent_id),
                    parent = await parentModel.load();

                loc['parent'] = parent;
            }catch(e){}

            let subids = [0],
                subLocModel = new Location(),
                sublocationsDbData = <any> await subLocModel.getChildren(loc.location_id),
                dataResult = {
                    data : [], location : loc, total_warden : 0
                };

            let dataLoc = <any> await getData(loc.location_id, 'Building level', accountId);
            dataResult.data.push(dataLoc);
            dataResult['total_warden'] += dataLoc.total_wardens;

            for(let sub of sublocationsDbData){
                subids.push(sub.location_id);

                if(role == 1){
                    accountId = undefined;
                }

              let dataSubloc = <any> await getData(sub.location_id, sub.name, accountId);
              dataResult['total_warden'] += dataSubloc.total_wardens;
              dataResult.data.push(dataSubloc);
            }

            toReturn.push(dataResult);
        }

        response.data = toReturn;

        if(response.pagination.total > limit){
            let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            response.pagination.pages = totalpages;
        }

        if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
            response.pagination.pages = 1;
        }

        if(!toPdf && !toCsv){
          res.status(200).send(response);
        }else if(toPdf || toCsv){
          response['title'] = 'Stack Plan Report';
          response['tables'] = [];
          for(let data of response.data){
            let tblData = {
              data : [], 
              headers : ['Building', 'Sublocation', 'Account', 'TRP', 'Email', '# Warden', '# P.E.E.P']
            };

            let totalWardens = 0;
            for(let d of data.data){
              let accnts = '';
              let trps = '';
              let emails = '';

              if(toPdf){
                  for(let t of d.trp){
                    accnts += t.account_name+'\n';
                    trps += t.first_name+' '+t.last_name+'\n';
                    emails += t.email+'\n';
                  }


                  tblData.data.push([
                    data.location.name, d.name, accnts, trps, emails, d.total_wardens, d.peep_total
                  ]);
              }else{
                if(d.trp.length > 0){
                  for(let i in d.trp){
                    let 
                    trpName = d.trp[i].first_name+' '+d.trp[i].last_name,
                    dataPush = [];

                    if(parseInt(i) == 0){
                      dataPush.push(data.location.name, d.name, d.trp[i].account_name, trpName, d.trp[i].email, d.total_wardens, d.peep_total);
                    }else{
                      dataPush.push('', '', d.trp[i].account_name, trpName, d.trp[i].email);
                    }

                    tblData.data.push(dataPush);

                  }
                }else{
                  tblData.data.push([
                    data.location.name, d.name, '', '', '', d.total_wardens, d.peep_total
                  ]);
                }

              }

              

              totalWardens += parseInt(d.total_wardens);
            }

            tblData.data.push([ '', '', '', '', '', 'Total No. Of Wardens '+totalWardens ]);

            response['tables'].push(tblData);
          }
          if(toPdf){
              this.generatePDF(response, res);
          }else{
              this.generateCSV(response, res);
          }
        }
    }

    public async listLocations(req: AuthRequest, res: Response, toReturn?, filters?){
        let
            locAccntRelObj = new LocationAccountRelation(),
            userRoleRel = new UserRoleRelation(),
            r = 0,
            EMRole = new UserEmRoleRelation(),
            temp,
            totalWardens = 0,
            userIds = [],
            accountId = (req.body.account_id) ? (req.body.account_id > 0) ? req.body.account_id : (req.user) ? req.user.account_id : 0 : (req.user) ? req.user.account_id : 0,
            filter = {
                archived : 0
            },
            response = <any> {
                data : []
            }, 
            userId = (req.body.user_id) ? req.body.user_id : (req.user.user_id) ? req.user.user_id : 0;

        try {
          r = await userRoleRel.getByUserId(userId, true);
        } catch(e) {
          console.log('location route get-parent-locations-by-account-d',e);
          r = 0;
        }

        if(req.user){
          if(req.user.evac_role == 'admin'){
            filters['responsibility'] = 'Manager';
          }
        }else{
          try{
            let uModel = new User(req.body.user_id);
            await uModel.load();

            if(uModel.get('evac_role') == 'admin'){
              filters['responsibility'] = 'Manager';
            }
          }catch(e){}
          
        }

        let 
            roles = [],
            isPortfolio = false;

        try {
          roles = await userRoleRel.getByUserId(req.user.user_id);
          for(let role of roles){
              if(role['is_portfolio'] == 1){
                  isPortfolio = true;
              }
          }
        } catch(e) { }

        filter['isPortfolio'] = isPortfolio;
        filter['userId'] = userId;

        if('responsibility' in filters){
            filter['responsibility'] = filters['responsibility'];
        }else{
            filter['responsibility'] = r;
        }

        if('archived' in filters){
            filter['archived'] = filters['archived'];
        }
        if('limit' in filters){
            filter['limit'] = filters['limit'];
        }
        if('offset' in filters){
            filter['offset'] = filters['offset'];
        }
        if('count' in filters){
            filter['count'] = filters['count'];
        }

        filter['no_parent_name'] = true;

        if (r == defs['Tenant']) {
            const locationListingTRP = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
            response.data = locationListingTRP;
        }else if (r == defs['Manager']) {
            const locationsForBuildingManager = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
            response.data = locationsForBuildingManager;
        }else{
            const locations = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
            response.data = locations;
        }

        if(toReturn){
            return  response;
        }else{
            return  res.send(response);
        }
    }

    public async locationTrainings(req: AuthRequest, res: Response, toPdf?, toCsv?){
        console.log(req.body);
      let
        response = {
            status : false, data : [], message : '',
            pagination : {
                total : 0,
                pages : 0
            },
            'location-origin': req.body.location_id
        },
        roleOfAccountInLocationObj = {},
        tenantAccountLocations = [],
        frpAccountLocations = [],
        offset = req.body.offset,
        limit = req.body.limit,
        course_method = req.body.course_method,
        compliant = req.body.compliant,
        training_id = req.body.training_id,
        d = {
            location : {},
            sublocations : []
        },
        location_id = req.body.location_id,
        accountId = (req.body.account_id) ? (req.body.account_id > -1) ? req.body.account_id : req.user.account_id : req.user.account_id,
        locationModel = new Location(location_id),
        sublocationModel = new Location(),
        locations = <any> [],
        getAll = (req.body.getall) ? req.body.getall : false,
        filterExceptLocation = (req.body.nofilter_except_location) ? req.body.nofilter_except_location : false,
        userRoleModel = new UserRoleRelation(),
        userId = (req.body.user_id) ? req.body.user_id : req.user.user_id,
        role = 0;

        try{
            role = await userRoleModel.getByUserId(userId, true);
        }catch(e){}
        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(accountId);            
        } catch (e) {
            console.log('Getting the account role for a location error');
        }

        console.log('Role is ' + role);



        if(getAll || filterExceptLocation){
            training_id = false;
            compliant = -1;
        }

        if (location_id == 0 || getAll) {
            try{
                let responseLocations = <any> await this.listLocations(req,res, true, { 'archived' : 0 });
                console.log('responseLocations', responseLocations);
                locations = responseLocations.data;
            }catch(e){}
        } else {
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];
            for(let i of ids) {            
                if (i in roleOfAccountInLocationObj && roleOfAccountInLocationObj[i]['role_id'] == 1) {            
                    frpAccountLocations.push(parseInt(i, 10));
                    locsIds.push(i);
                } else {
                    tenantAccountLocations.push(parseInt(i, 10));  
                }
        
            }
            let childForTenant = [];
            // since they are only tenant on this building locations, go get the sub locations related to the account
            for (let building of tenantAccountLocations) {
                let tempArr = [];                
                try {                
                    tempArr = await new LocationAccountRelation().getTenantAccountRoleOfBlgSublocs(building,accountId);                
                    childForTenant = childForTenant.concat(tempArr);    
                    
                } catch(e) {
                    // this is at the case of malls where in a tenant is assign to the building               
                    try {
                        tempArr = await new LocationAccountRelation().getTenantAccountRoleAssignToBuilding(building, accountId);
                        childForTenant = childForTenant.concat(tempArr); 
                    } catch(sub_e) {
    
                    }
                }
                
                for (let c of childForTenant) {
                    locsIds.push(c['location_id']);
                }            
                
            }
            console.log(`locsIds are ${locsIds.join(', ')}`);
            console.log(`frpAccountLocations are ${frpAccountLocations.join(',')}`);
            console.log(`tenantAccountLocations are ${tenantAccountLocations.join(',')}`);
            console.log();



            /*
            for(let i in ids){
                locsIds.push(ids[i]);
            }
            */


            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere( whereLoc );
            }catch(e){  }
        }

        let allUserIds = [0],
            allLocationIds = [],
            allLocations = [],
            users = [];

        const config = {};
        if(req.body.searchKey){
          if ( (req.body.searchKey !== null && req.body.searchKey.length > 0) && !getAll && !filterExceptLocation) {
            config['searchKey'] = req.body.searchKey;
          }
        }

        if(role != 1){
            config['account_id'] = accountId;
        }

        let 
        allLocModel = new Location(),
        allDbLocations = await allLocModel.getAllLocations(),
        mergeToParent = function(data){

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
        },
        findLocationFromHierarhy = function(data, locationId){
            for(let d of data){
                if(d.location_id == locationId){
                    return d;
                }else if(d.sublocations.length > 0){
                    let res = findLocationFromHierarhy(d.sublocations, locationId);
                    if(res){
                        return res;
                    }
                }
            }
        },
        hierarchies = mergeToParent(allDbLocations);
        
        let collectLocIdsFromHierarchy = function(data){
            let response = [];
            for(let d of data){
                response.push(d.location_id);
                if(d.sublocations.length > 0){
                    let subResponse = collectLocIdsFromHierarchy(d.sublocations);
                    response = response.concat(subResponse);
                }
            }
            return response;
        };

        for(let loc of locations){
            allLocationIds.push(loc.location_id);
            let hier = findLocationFromHierarhy(hierarchies, loc.location_id);
            if(hier){
                let ids = collectLocIdsFromHierarchy(hier.sublocations);
                allLocationIds = allLocationIds.concat(ids);
            }
        }

        let 
        usersModel = new User(),
        frpAndTrp = [];

        if(req.body.eco_only){
            config['eco_only'] = req.body.eco_only;
        }

        users = <any> await usersModel.getAllRolesInLocationIds(allLocationIds.join(','), config);
        // console.log(users);
        for(let user of users){
            if(allUserIds.indexOf(user.user_id) == -1){
                if (frpAccountLocations.indexOf(user.parent_id) != -1) {
                    allUserIds.push(user.user_id);
                } else if (user.account_id == accountId) {
                    allUserIds.push(user.user_id);
                }                
            }
            if(user.role_id == 1 || user.role_id == 2){
                if (frpAccountLocations.indexOf(user.parent_id) != -1) {
                    frpAndTrp.push(user);
                } else if (user.account_id == accountId) {
                    frpAndTrp.push(user);
                }                  
            }
        }

        // response['users'] = users;
        // response['allLocationIds'] = allLocationIds.join(',');

        let offsetLimit = (getAll || filterExceptLocation) ? false :  (limit == 0) ? false : offset+','+limit,
            courseMethod = (course_method == 'online' && !getAll && !filterExceptLocation) ? 'online_by_evac' : (course_method == 'offline' && !getAll && !filterExceptLocation) ? 'offline_by_evac' : '',
            trainCertModel = new TrainingCertification(),
            trainCertCountModel = new TrainingCertification(),
            certificates = <any> await trainCertModel.getCertificatesByInUsersId( allUserIds.join(','), offsetLimit, false, courseMethod, compliant, training_id ),
            certificatesCount = <any> await trainCertCountModel.getCertificatesByInUsersId( allUserIds.join(','), offsetLimit, true, courseMethod, compliant, training_id );

        response['certificates'] = certificates;

        for(let cert of certificates){
            for(let user of users){
                if(user.user_id == cert.user_id){
                    cert['first_name'] = user.first_name;
                    cert['last_name'] = user.last_name;
                    cert['email'] = user.email;
                    cert['location_name'] = user.location_name;
                    cert['account_name'] = user.account_name;
                    cert['region'] = '';
                    cert['building'] = '';
                    cert['sublocation'] = '';

                    if(user.parent_is_building == 1){
                        cert['building'] = user.parent_location_name;
                        cert['sublocation'] = user.name;
                        cert['region'] = user.parent2_location_name;
                    }else if(user.is_building == 1){
                        cert['building'] = user.name;
                        cert['region'] = user.parent_location_name;
                    }

                }
            }

            if(cert['certification_date'] != null){
                cert['certification_date_formatted'] = moment(cert['certification_date']).format('DD/MM/YYYY');
            }else{
                cert['certification_date_formatted'] = '';
            }

            if(cert['training_requirement_name'] == null){
                cert['training_requirement_name'] = '';
            }

            for(let ft of frpAndTrp){
                if(ft.user_id == cert.user_id){
                    if(cert.role_name == null){
                        cert['role_name'] = ft.role_name;
                    }
                }
            }
        }

        response.pagination.total = (certificatesCount[0]) ? certificatesCount[0]['count'] : 0;

        let finalResult = [];
        for(let cert of certificates){
            let isIn = false;
            for(let fin of finalResult){
                if(cert.user_id == fin.user_id){
                    isIn = true;
                }
            }
            if(!isIn){
                finalResult.push(cert);
            }
        }

        response.data = finalResult;

        if(response.pagination.total > limit){
            let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            response.pagination.pages = totalpages;
        }

        if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
            response.pagination.pages = 1;
        }


        if(!toPdf && !toCsv){
            res.status(200).send(response);
        }else if(toPdf || toCsv){
          response['tables'] = [];
          let tblData = {
            title : (req.body.warden_report) ? 'Warden List Report' : 'Training Report',
            data : [], 
            headers : (req.body.warden_report) ? ["Region", "Building", "Emergency Role", "Sublocation", "Account", "Name", "Email", "Overall Status"] : ["Region", "Building", "Sublocation", "Account", "User", "Email", "Role", "Status", "Date"]
          };

          for(let re of response.data){
              let compOrNot = '';

              if(re.status == 'valid' && re.pass == 1){
                compOrNot = 'Compliant';
              }else{
                  let desc = '(Not Taken)';
                  if(re.pass == 0){
                      desc = '(Failed)';
                  }else if(re.status == 'expired'){
                      desc = '(Expired)';
                  }
                  compOrNot = 'Not Compliant '+desc;
              }

              if(req.body.warden_report){
                tblData.data.push([ re.region, re.building, re.role_name,  re.sublocation,  re.account_name, re.first_name+' '+re.last_name, re.email, compOrNot ]);
              }else{
                tblData.data.push([ re.region, re.building, re.sublocation,re.account_name,  re.first_name+' '+re.last_name, re.email, re.role_name, compOrNot, re.certification_date_formatted ]);
              }

          }
           
          response['tables'].push(tblData);

          if(toPdf){
              this.generatePDF(response, res);
          }else{
              this.generateCSV(response, res);
          }

        } 
    }

    private async createComplianceMapForLocation(locationId, accountId, role){
        let kpisModel = new ComplianceKpisModel(),
            kpis = <any> await kpisModel.getWhere(['description IS NOT NULL']);

        let complianceModel = new ComplianceModel(),
            locationCompliance = <any> await complianceModel.getLocationCompliance(locationId, accountId, role);

        for(let kp of kpis){
            let isHere = false;
            for(let locCom of locationCompliance){
                if(locCom['compliance_kpis_id'] == kp['compliance_kpis_id']){
                    isHere = true;
                }
            }

            if(!isHere){
                let createComplianceModel = new ComplianceModel(),
                    compObj = {
                        'compliance_kpis_id': kp['compliance_kpis_id'],
                        'compliance_status': 0,
                        'building_id': locationId,
                        'account_id': accountId,
                        'valid_till': null,
                        'required': 1,
                        'account_role': 'Manager',
                        'override_by_evac': 0
                    };
                await createComplianceModel.create(compObj);
            }
        }
    }

    private async buildLocationComplianceData(locationData, role, kpis, reqRes?){
        let sublocationModel = new Location(),
            deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(locationData.location_id),
            locAccntModel = new LocationAccountRelation(),
            locCompRate = 0,
            allSubLocationsId = [locationData.location_id],
            complianceModel = new ComplianceModel(),
            emRoleModel = new UserEmRoleRelation(),
            trainingCertificationModel = new TrainingCertification(),
            docs = [],
            today = moment(),
            TotalNumberOfKPIS = kpis.length - 1,
            sundryId = 13,
            ecoIds = [0];



        locationData['kpis'] = JSON.parse(JSON.stringify(kpis));
        locationData['name'] = (locationData['name'].length == 0) ? locationData['formatted_address'] : locationData['name'];

        for(let sub of deepLocations){
            allSubLocationsId.push( sub.location_id );
        }

        locationData['eco_users'] =  await emRoleModel.getUsersInLocationIds(allSubLocationsId.join(','));

        for(let user of locationData['eco_users']){
            ecoIds.push(user.user_id);
        }


        locationData['wardens_trained_count'] = 0;
        locationData['wardens_trained_percent'] = 0;

        try{
            let complianceRoute = new ComplianceRoute(),
            locCompliance = await complianceRoute.getLocationsLatestCompliance(reqRes.req, reqRes.res, true, { 'location_id' : locationData.location_id });

            locationData['compliances'] = locCompliance.data;

            for(let com of locationData['compliances']){

                if(com.compliance_kpis_id == 6){
                    locationData['wardens_trained_count'] = com.total_personnel_trained.total_passed;
                    locationData['wardens_trained_percent'] = com.percentage_number;
                }


                if(com.valid == 1){
                    locCompRate++;
                }
            }

        }catch(e){
            locationData['compliances'] = [];
        }


        locationData['number_of_sublocations'] = deepLocations.length;
        locationData['compliance_rating'] = locCompRate+'/'+TotalNumberOfKPIS;
        locationData['status'] = (locCompRate == TotalNumberOfKPIS) ? 'Compliant' : 'Not Compliant';

        return locationData;
    }

    public async getComplianceSummary(req: AuthRequest, res: Response){
        let location_id = req.body.location_id,
            offset = req.body.offset,
            limit = req.body.limit,
            accountId = req.user.account_id,
            userId = req.user.user_id,
            response = {
                status : true, data : {
                    locations : [],
                    compliance_rating : '0/0',
                    kpis : [],
                    date : moment().format('DD/MM/YYYY')
                }, message : '',
                pagination : {
                    total : 0,
                    pages : 0
                }
            },
            locations = [],
            locationModel = new Location(location_id);

        if(location_id == 0){

            try{
                let responseLocations = <any> await this.listLocations(req,res, true, {
                    'offset' : offset, 'limit' : limit, 'archived' : 0
                });
                locations = responseLocations.data;

                let countLocations = <any> await this.listLocations(req,res, true, {
                    'offset' : offset, 'limit' : limit, 'archived' : 0, 'count' : true
                });

                response.pagination.total = countLocations.data[0]['count'];
            }catch(e){}

        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere(whereLoc, offset+','+limit);
                let countLocations = <any> await await locationModel.getWhere(whereLoc, offset+','+limit, true);

                response.pagination.total = countLocations[0]['count'];
            }catch(e){  }
        }

        let kpisModel = new ComplianceKpisModel(),
            kpis = <any> await kpisModel.getWhere(['description IS NOT NULL']);

        response.data.kpis = kpis;

        let TotalNumberOfKPIS = kpis.length - 1, //minus one due to sundry compliance
            overallRating = 0;

        for(let loc of locations){
            loc['parent'] = {  name : '' };
            try{
                let locParentModel = new Location(loc.parent_id);
                loc['parent'] = await locParentModel.load();
            }catch(e){
                console.log(e);
            }

            try{
                loc = <any> await this.buildLocationComplianceData(loc, 'Manager', kpis, { 'req' : req, 'res' : res });
            }catch(e){
                console.log(e);
            }


        }

        let overallRatingCount = 0;
        for(let loc of locations){
            let splittedComplianceRating = loc.compliance_rating.split('/'),
                nominator = parseInt(splittedComplianceRating[0]),
                denaminator = splittedComplianceRating[1];

            overallRatingCount = overallRatingCount + nominator;
        }

        overallRating = Math.round(overallRatingCount / locations.length);

        response.data.compliance_rating = overallRating+'/'+TotalNumberOfKPIS;
        response.data.locations = locations;


        if(response.pagination.total > limit){
            let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            response.pagination.pages = totalpages;
        }

        if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
            response.pagination.pages = 1;
        }

        res.send(response);
    }

    public async getStatementOfCompliance(req: AuthRequest, res: Response){
        let location_id = req.params.location_id,
            accountId = req.user.account_id,
            userId = req.user.user_id,
            response = {
                status : true, data : [], message : ''
            },
            d = {
                location : {},
                kpis : [],
                docs : [],
                compliances : [],
                wardens : [],
                compliance_rating : '0/0'
            },
            locationModel = new Location(location_id),
            kpisModel = new ComplianceKpisModel(),
            kpis = <any> await kpisModel.getWhere(['description IS NOT NULL']),
            TotalNumberOfKPIS = kpis.length - 1,
            locations = <any>[];

        if(location_id == 0){
            try{
                let responseLocations = <any> await this.listLocations(req,res, true, {  'archived' : 0 });
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere( whereLoc );
            }catch(e){  }
        }

        for(let loc of locations){
            let
            overallRating = 0,
            statement = JSON.parse(JSON.stringify(d));

            this.createComplianceMapForLocation(loc.location_id, accountId, 'Manager');

            loc = await this.buildLocationComplianceData( loc, 'Manager', kpis, { 'req' : req, 'res' : res } );
            loc['parent'] = {  name : '' };
            try{
                let locParentModel = new Location(loc.parent_id);
                loc['parent'] = await locParentModel.load();
            }catch(e){}

            for(let com of loc.compliances){
                if(com.valid == 1){
                    overallRating++;
                }
            }

            statement.location = loc;
            statement.kpis = loc.kpis;
            statement.wardens = loc.wardens;
            statement.compliances = loc.compliances;
            statement.compliance_rating = Math.floor(overallRating)+'/'+TotalNumberOfKPIS;
            response.data.push(statement);
        }

        res.send(response);
    }

    public async getActivityReport(req: AuthRequest, res: Response, toPdf?, toCsv?){
        let
        location_id = req.body.location_id,
        limit = req.body.limit,
        offset = req.body.offset,
        accountId = (req.body.account_id) ? (req.body.account_id > -1) ? req.body.account_id : req.user.account_id : req.user.account_id,
        userId = (req.body.user_id) ? req.body.user_id : req.user.user_id,
        response = {
            status : false, data : [],
            pagination : {
                total : 0,
                pages : 0
            }, message : ''
        },
        utilsModel = new Utils(),
        locationModel = new Location(location_id),
        accountsModel = new Account(accountId),
        locations = <any>[],
        locIds = [],
        offsetLimit = offset+','+limit,
        url = 'https://s3-ap-southeast-2.amazonaws.com/mycompliancegroup-prod/';

        if(location_id == 0){
            try{
                console.log('req.body', req.body);
                let responseLocations = <any> await this.listLocations(req,res, true, {'archived' : 0});
                locations = responseLocations.data;
            }catch(e){
              console.log(e);
            }
        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds.join(',')+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere( whereLoc );
            }catch(e){  }
        }

        for(let loc of locations){
            loc['parent'] = {  name : '' };
            locIds.push(loc.location_id);
            try{
                let locParentModel = new Location(loc.parent_id);
                loc['parent'] = await locParentModel.load();
            }catch(e){}
        }

        let fileTypes = <any> '"Primary","Secondary"';
        if(req.user){
          if(req.user.evac_role == 'admin'){
            fileTypes = false;
          }
        }
        if(req.body.isadmin == true){
          fileTypes = false;
        }

        console.log('req.body.isadmin', req.body.isadmin);
        console.log('fileTypes', fileTypes);

        let logsCount = await accountsModel.getActivityLog(locIds, offsetLimit, true, fileTypes),
            logs = <any> await accountsModel.getActivityLog(locIds, offsetLimit, false, fileTypes);

        for(let log of logs){
            log['timestamp_formatted'] = moment(log.timestamp).format('DD/MM/YYYY hh:mma');
            log['date_of_activity_formatted'] = moment(log.date_of_activity).format('DD/MM/YYYY hh:mma');
            for(let loc of locations){
                if(log.building_id == loc.location_id){
                    log['location_name'] = loc.name;
                    log['parent_name'] = loc.parent.name;
                    log['formatted_address'] = loc.formatted_address;
                }
            }
            log['url'] = (log['urlPath']) ? log['urlPath'] : '';
        }

        response.data = logs;
        response.pagination.total = logsCount[0]['count'];

        if(response.pagination.total > limit){
            let div = response.pagination.total / limit,
                rem = (response.pagination.total % limit) * 1,
                totalpages = Math.floor(div);

            if(rem > 0){
                totalpages++;
            }

            response.pagination.pages = totalpages;
        }

        if(response.pagination.pages == 0 && response.pagination.total <= limit && response.pagination.total > 0){
            response.pagination.pages = 1;
        }

        if(!toPdf && !toCsv){
            res.status(200).send(response);
        }else if(toPdf || toCsv){
          response['tables'] = [];
          let tblData = {
            title : 'Activity Report',
            data : [], 
            headers : ['Location', 'Type', 'File name', 'Date Uploaded']
          };
          for(let d of response.data){
            tblData.data.push([ d.location_name, d.document_type, d.file_name, d.timestamp_formatted ]);
          }
          response['tables'].push(tblData);

          if(toPdf){
              this.generatePDF(response, res);
          }else{
              this.generateCSV(response, res);
          }
        }
    }

    generateCSV(objRes, res){
        let 
        data = objRes.data,
        tables = objRes.tables,
        timestamp = new Date().getTime(),
        csvData = '',
        DIR = __dirname + '/../public/temp/'; //'/../public/uploads/';

        for(let table of tables){
            if(table.title){
              csvData += table.title;
            }
            csvData += '\n';

            csvData += table.headers.join(',');
            csvData += '\n';

            for(let d of table.data){
                d.forEach((item, index) => {
                  if(typeof item == 'boolean' || typeof item == 'number'){
                    item = item.toString();
                  }else if(item == null){
                    item = '';
                  }
                  d[index] =  item.replace(/,/g, ' ');
                });
                csvData += d.join(',');
                csvData += '\n';
            }
        }


        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename='+timestamp + '.csv');
        res.send(csvData);
    }

    generatePDF(objRes, res){
      let 
        data = objRes.data,
        tables = objRes.tables,
        timestamp = new Date().getTime(), 
        doc:PDFDocument = new PDFDocumentWithTables({
          margins : {
            top:25, left:25, right:25, bottom:25
          }
        }),
        DIR = __dirname + '/../public/temp/'; //'/../public/uploads/';

        let 
        filepath = DIR + timestamp + '.pdf',
        writeStream = fs.createWriteStream(filepath);
        
        doc.pipe(writeStream);
        doc.image( __dirname + '/../public/assets/images/ec_logo.png', 25, 15, { width: 200, height: 60 });
        doc.moveDown(4);

        for(let table of tables){
          doc.table({
            title : table.title,
            headers: table.headers,
            rows: table.data
          },
          {
            prepareHeader: () => doc.font('Helvetica').fontSize(9),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(6)
          });
        }

        doc.end();

        writeStream.on('finish', function(){
            fs.readFile(filepath, "utf8", function(err, data){
                if(err) throw err;

                var file = fs.createReadStream(filepath);
                var stat = fs.statSync(filepath);

                res.setHeader('Content-Length', stat.size);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'attachment; filename='+timestamp + '.pdf');
                file.pipe(res);
            });
        });
    }
}
