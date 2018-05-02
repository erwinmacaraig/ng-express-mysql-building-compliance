
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
       router.get('/reports/team/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
         new ReportsRoute().generateTeamReport(req, res, next).then((data) => {
           return res.status(200).send({
             'status': 'Success',
             'data': data
           });
         }).catch((e) => {
           console.log(e);
           return res.status(400).send({
             'status': 'Fail', 'data' : [], 'error': e
           });
         });
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
        accntId = req.user.account_id;
            
        try {
            r = await userRoleRel.getByUserId(req.user.user_id, true);
        } catch (e) {
            console.log('location route get-parent-locations-by-account-d', e);
            r = 0;
        }

        let 
            location_id = req.query.location_id,
            locationModel = new Location(location_id),
            locations = <any> [],
            toReturn = <any> [];

        if(location_id == 0){
            try{
                let responseLocations = <any> await this.listLocations(req,res, true);
                locations = responseLocations.data;
            }catch(e){}
        }else{
            let ids = location_id.split('-');
            for(let i in ids){
                try{
                    locationModel.setID(ids[i]);
                    let location = await locationModel.load();
                    locations.push(location);
                }catch(e){ }
            }
        }
        
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

        return toReturn;
    }

    public async listLocations(req: AuthRequest, res: Response, toReturn?){
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
        filter['responsibility'] = r;
        filter['no_parent_name'] = true;

        if (r == defs['Tenant']) {
            const locationListingTRP = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            response.data = locationListingTRP;
        }

        if (r == defs['Manager']) {
            const locationsForBuildingManager = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            response.data = locationsForBuildingManager;
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
            status : false, data : [], message : ''
        },
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
                let responseLocations = <any> await this.listLocations(req,res, true);
                locations = responseLocations.data;
            }catch(e){}

        }else{
            try{
                let location = await locationModel.load();
                locations.push(location);
            }catch(e){
                response.status = false;
                response.message = 'No location found';
            }
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
                response.message = 'No location found';
            }
        }

        let locAccUser = new UserEmRoleRelation(),
            users = <any> await locAccUser.getUsersInLocationIds(allLocationIds.join(',') );

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
            ecoIds = [0],
            wardensId = [0],
            wardensIdTrainedMap = {};

        locationData['kpis'] = JSON.parse(JSON.stringify(kpis));
        locationData['name'] = (locationData['name'].length == 0) ? locationData['formatted_address'] : locationData['name'];
        
        for(let sub of deepLocations){
            allSubLocationsId.push( sub.location_id );
        }

        locationData['eco_users'] =  await emRoleModel.getUsersInLocationIds(allSubLocationsId.join(','));

        for(let user of locationData['eco_users']){
            ecoIds.push(user.user_id);
        }

        locationData['wardens'] =  await emRoleModel.getWardensInLocationIds(allSubLocationsId.join(','));

        for(let ward of locationData['wardens']){
            wardensId.push(ward.user_id);
            wardensIdTrainedMap[ ward.user_id ] = { passed : false, viewed : false };
        }

        let wardensCerts = <any> await trainingCertificationModel.getCertificationsInUserIds(wardensId.join(',')),
            trainedCount = 0;

        locationData['wardensCerts'] = wardensCerts;

        for(let ward of wardensCerts){
            if(ward.validity == 'active' && ward.pass == 1){
                if( wardensIdTrainedMap[ ward.user_id ] ){
                    if(!wardensIdTrainedMap[ ward.user_id ]['viewed']){
                        trainedCount++;
                        wardensIdTrainedMap[ ward.user_id ]['viewed'] = true;
                        wardensIdTrainedMap[ ward.user_id ]['passed'] = true;
                    }
                }
            }
        }

        locationData['wardens_trained_count'] = trainedCount;

        let percentWardens = Math.floor( trainedCount / locationData['wardens'].length * 100 );
        locationData['wardens_trained_percent'] = ( isNaN(percentWardens) ) ? 0 : percentWardens;

        try{
            let complianceRoute = new ComplianceRoute(),
            locCompliance = await complianceRoute.getLocationsLatestCompliance(reqRes.req, reqRes.res, true, { 'location_id' : locationData.location_id });

            locationData['compliances'] = locCompliance.data;

            for(let com of locationData['compliances']){
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
            accountId = req.user.account_id,
            userId = req.user.user_id,
            response = {
                status : true, data : {
                    locations : [],
                    compliance_rating : '0/0',
                    kpis : [],
                    date : moment().format('DD/MM/YYYY')
                }, message : ''
            },
            locations = [],
            locationModel = new Location(location_id);

        if(location_id == 0){

            try{
                let responseLocations = <any> await this.listLocations(req,res, true);
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-');
            for(let i in ids){
                try{
                    locationModel.setID(ids[i]);
                    let location = await locationModel.load();
                    locations.push(location);
                }catch(e){ }
            }
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
            }catch(e){}
            loc = <any> await this.buildLocationComplianceData(loc, 'Manager', kpis, { 'req' : req, 'res' : res });
        }

        let overallRatingCount = 0;
        for(let loc of locations){
            let splittedComplianceRating = loc.compliance_rating.split('/'),
                nominator = parseInt(splittedComplianceRating[0]),
                denaminator = splittedComplianceRating[1];

            overallRatingCount = overallRatingCount + nominator;
        }

        overallRating = Math.floor(overallRatingCount / locations.length);

        response.data.compliance_rating = overallRating+'/'+TotalNumberOfKPIS;
        response.data.locations = locations;

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
                let responseLocations = <any> await this.listLocations(req,res, true);
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-');
            for(let i in ids){
                try{
                    locationModel.setID(ids[i]);
                    let location = await locationModel.load();
                    locations.push(location);
                }catch(e){ }
            }
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
        locationModel = new Location(location_id),
        accountsModel = new Account(accountId),
        locations = <any>[],
        locIds = [],
        offsetLimit = offset+','+limit;

        if(location_id == 0){
            try{
                let responseLocations = <any> await this.listLocations(req,res, true);
                locations = responseLocations.data;
            }catch(e){}

        }else{
            let ids = location_id.split('-');
            for(let i in ids){
                try{
                    locationModel.setID(ids[i]);
                    let location = await locationModel.load();
                    locations.push(location);
                }catch(e){ }
            }
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
            log['timestamp_formatted'] = moment(log.timestamp).format('DD/MM/YYYY');
            for(let loc of locations){
                if(log.building_id == loc.location_id){
                    log['location_name'] = loc.name;
                    log['parent_name'] = loc.parent.name;
                    log['formatted_address'] = loc.formatted_address;
                }
            }
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
