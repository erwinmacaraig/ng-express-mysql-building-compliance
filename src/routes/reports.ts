
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
        router.get('/reports/list-locations/',
          new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
          const locAccntRelObj = new LocationAccountRelation();
          const userRoleRel = new UserRoleRelation();
          let r = 0;
          const filter = {};
          let locationListing;
          try {
            r = await userRoleRel.getByUserId(req.user.user_id, true);
          } catch (e) {
            console.log('location route get-parent-locations-by-account-d', e);
            r = 0;
          }
          filter['responsibility'] = r;
          if (r === defs['Tenant']) {
            locationListing = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);

          } else if (r === defs['Manager']) {
            filter['is_building'] = 1;
            locationListing = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
          }
          // console.log(locationListing);
          return  res.send({
              data : locationListing
          });

        });

       /**
        * @route
        * generate list for team
        */
       router.post('/reports/team', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
         new ReportsRoute().generateTeamReport(req, res, next);
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
    }

     /**
      * @generateTeamReport
      * process reporting info for a given root location
      */
    
    public async generateTeamReport(req: AuthRequest, res: Response, next: NextFunction) {

        let 
        userRoleRel = new UserRoleRelation(),
        r = 0,
        location_id = req.body.location_id,
        response = {
            status : true, data : [], message : '',
            pagination : {
                total : 0,
                pages : 0
            }
        },
        offset = req.body.offset,
        limit = req.body.limit,
        accntId = req.user.account_id,
        locationModel = new Location(location_id),
        locations = <any> [],
        toReturn = <any> [];

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

            whereLoc.push([ 'location_id IN ('+locsIds+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere(whereLoc, offset+','+limit);
                let countLocations = <any> await await locationModel.getWhere(whereLoc, offset+','+limit, true);

                response.pagination.total = countLocations[0]['count'];

                response['locations'] = locations;
            }catch(e){  }
        }

        console.log( response.pagination );
        
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
                emModel = new UserEmRoleRelation(),
                mobilityModel = new MobilityImpairedModel(),
                dataResult = {
                    data : [], location : loc, total_warden : 0
                };

            for(let sub of sublocationsDbData){
                subids.push(sub.location_id);

                let 
                locAccUserModel = new LocationAccountUser(),
                wardensSub = <any> await emModel.getWardensInLocationIds(sub.location_id, 0, accntId),
                mobs = <any> await mobilityModel.getImpairedUsersInLocationIds(sub.location_id, accntId),
                whereLocUser = [],
                data = {
                    location_id : sub.location_id,
                    name : sub.name,
                    peep_total : mobs.length,
                    total_wardens : wardensSub.length,
                    trp : []
                };

                data.trp = <any> await locAccUserModel.getTrpByLocationIds(sub.location_id);

                dataResult['total_warden'] += wardensSub.length;
                dataResult.data.push(data);
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

        res.status(200).send(response);
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
            filter = {
                archived : 0
            },
            response = <any> {
                data : []
            };

        try {
          r = await userRoleRel.getByUserId(req.user.user_id, true);
        } catch(e) {
          console.log('location route get-parent-locations-by-account-d',e);
          r = 0;
        }

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
            const locationListingTRP = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            response.data = locationListingTRP;
        }else if (r == defs['Manager']) {
            const locationsForBuildingManager = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            response.data = locationsForBuildingManager;
        }else{
            const locations = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            response.data = locations;
        }

        if(toReturn){
            return  response;
        }else{
            return  res.send(response);
        }
    }

    public async locationTrainings(req: AuthRequest, res: Response){
        let 
        response = {
            status : false, data : [], message : '',
            pagination : {
                total : 0,
                pages : 0
            }
        },
        offset = req.body.offset,
        limit = req.body.limit,
        course_method = req.body.course_method,
        compliant = req.body.compliant,
        d = {
            location : {},
            sublocations : []
        },
        location_id = req.body.location_id,
        locationModel = new Location(location_id),
        sublocationModel = new Location(),
        locations = <any> [];

        if(location_id == 0){

            try{
                let responseLocations = <any> await this.listLocations(req,res, true, { 'archived' : 0 });
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds+') AND archived = 0' ]);

            try{
                locations = <any> await locationModel.getWhere( whereLoc );
            }catch(e){  }
        }

        let allUserIds = [0],
            allLocationIds = [0],
            allLocations = [];

        for(let loc of locations){
            allLocationIds.push(loc.location_id);
            try{
                locationModel = new Location(loc.location_id)
                let location = await locationModel.load(),
                    deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(loc.location_id);

                location['name'] = (location['name'].length === 0) ? location['formatted_address'] : location['name'];

                allLocations.push(location);

                for(let deeploc of deepLocations){
                    deeploc['name'] = (deeploc['name'].length === 0) ? deeploc['formatted_address'] : deeploc['name'];

                    allLocationIds.push(deeploc.location_id);
                    allLocations.push(deeploc);
                }

            }catch(e){
                
            }
        }

        let locAccUser = new UserEmRoleRelation(),
            users = <any> await locAccUser.getUsersInLocationIds(allLocationIds.join(',') );

        for(let user of users){
            if(allUserIds.indexOf(user.user_id) == -1){
                allUserIds.push(user.user_id);
            }
        }

        let courseMethod = (course_method == 'online') ? 'online_by_evac' : (course_method == 'offline') ? 'offline_by_evac' : '',
            trainCertModel = new TrainingCertification(),
            trainCertCountModel = new TrainingCertification(),
            certificates = <any> await trainCertModel.getCertificatesByInUsersId( allUserIds.join(','), offset+','+limit, false, courseMethod, compliant ),
            certificatesCount = <any> await trainCertCountModel.getCertificatesByInUsersId( allUserIds.join(','), offset+','+limit, true, courseMethod, compliant );

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

        response.pagination.total = certificatesCount[0]['count'];

        response.data = certificates;


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

            whereLoc.push([ 'location_id IN ('+locsIds+') AND archived = 0' ]);

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

            whereLoc.push([ 'location_id IN ('+locsIds+') AND archived = 0' ]);

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

    public async getActivityReport(req: AuthRequest, res: Response){
        let 
        location_id = req.body.location_id,
        limit = req.body.limit,
        offset = req.body.offset,
        accountId = req.user.account_id,
        userId = req.user.user_id,
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
                let responseLocations = <any> await this.listLocations(req,res, true, {'archived' : 0});
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-'),
                locsIds = [0],
                whereLoc = [];

            for(let i in ids){
                locsIds.push(ids[i]);
            }

            whereLoc.push([ 'location_id IN ('+locsIds+') AND archived = 0' ]);

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

        let logsCount = await accountsModel.getActivityLog(locIds, offsetLimit, true),
            logs = <any> await accountsModel.getActivityLog(locIds, offsetLimit);

        for(let log of logs){
            log['timestamp_formatted'] = moment(log.timestamp).format('DD/MM/YYYY hh:mma');
            for(let loc of locations){
                if(log.building_id == loc.location_id){
                    log['location_name'] = loc.name;
                    log['parent_name'] = loc.parent.name;
                    log['formatted_address'] = loc.formatted_address;
                }
            }
            log['url'] = '';

            try{
                let paths = await utilsModel.s3DownloadFilePathGen(accountId, log.building_id);
                log['url'] = url + paths[log.compliance_kpis_id][0];
            }catch(e){}
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



        res.status(200).send(response);
    }
}
