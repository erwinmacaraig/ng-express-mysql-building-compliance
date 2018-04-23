
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

       router.get('/reports/get-statement-of-compliance/:location_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
         new ReportsRoute().getStatementOfCompliance(req, res);
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
        const userRoleRel = new UserRoleRelation();
        let r = 0;
        // generate all sublocation from the given parent
        try {
          r = await userRoleRel.getByUserId(req.user.user_id, true);
        } catch (e) {
          console.log('location route get-parent-locations-by-account-d', e);
          r = 0;
        }


        const sublocationsDbData = await location.getDeepLocationsByParentId(req.query.location_id);
        const sublocs = [];
        const EMRole = new UserEmRoleRelation();

        Object.keys(sublocationsDbData).forEach((i) => {
          sublocs.push(sublocationsDbData[i]['location_id']);
        });

        if (!sublocs.length) {
          sublocs.push(req.query.location_id);
        }

        const locAcctUser = new LocationAccountUser();
        const resultSet = await locAcctUser.getAllAccountsInSublocations(sublocs);
        const resultSetArr = [];
        let users = [];
        Object.keys(resultSet).forEach((key) => {
          resultSetArr.push(resultSet[key]);
        });

        console.log(resultSetArr);
        let wardenInTheWholeBuilding = 0;
        let temp;
        try {
          temp = await location.getEMRolesForThisLocation(defs['em_roles']['WARDEN'], 0, r);
          wardenInTheWholeBuilding = temp[defs['em_roles']['WARDEN']]['count'];
          users = temp[defs['em_roles']['WARDEN']]['users'];
        } catch (e) {
          console.log('Reports route - generateTeamReport (getting EMRoles)', e);
        }
        try {
          temp = await location.getEMRolesForThisLocation(defs['em_roles']['FLOOR_WARDEN'], 0, r);
          for (const u in temp[defs['em_roles']['FLOOR_WARDEN']]['users']) {
            if (users.indexOf(u) === -1) {
              users.push(u);
            }
          }
          wardenInTheWholeBuilding = temp[defs['em_roles']['WARDEN']]['count'];
        } catch (e) {
          console.log('Reports route - generateTeamReport (getting EMRoles)', e);
        }
        wardenInTheWholeBuilding = users.length;

        const mobilityImpaired = new MobilityImpairedModel();
        for (const rs of resultSetArr) {
          let injured = [];
          let wardenArrays = [];
          injured = await mobilityImpaired.listAllMobilityImpaired(req.user.account_id, rs['location_id'], 'account');
          injured = injured.concat(await mobilityImpaired.listAllMobilityImpaired(req.user.account_id, rs['location_id'], 'emergency'));
          rs['peep_total'] = (Array.from(new Set(injured))).length;
          temp = null;
          temp = await EMRole.getEMRolesOnAccountOnLocation(
            defs['em_roles']['WARDEN'],
            req.user.account_id,
            rs['location_id']
          );
          wardenArrays = temp['users'];
          temp = null;
          temp = await EMRole.getEMRolesOnAccountOnLocation(
            defs['em_roles']['FLOOR_WARDEN'],
            req.user.account_id,
            rs['location_id']
          );
          wardenArrays = wardenArrays.concat(temp['users']);
          rs['total_wardens'] = (Array.from(new Set(wardenArrays))).length;
        }

/*
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
        } */
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

    public addChildrenLocationToParent(data){
        for(let i in data){
            if('sublocations' in data[i] == false){
                data[i]['sublocations'] = [];
            }

            for(let x in data){
                if(data[x]['parent_id'] == data[i]['location_id']){
                    if('sublocations' in data[i] == false){
                        data[i]['sublocations'] = [];
                    }

                    let d = {};
                    for(let l in data[x]){
                        if(l.indexOf('@pi') == -1){
                            d[l] = data[x][l];
                        }
                    }

                    data[i]['sublocations'].push(d);
                }
            }

        }

        let finalData = [];
        for(let i in data){
            if(data[i]['parent_id'] == -1){
                finalData.push( data[i] );
            }
        }

        return finalData;
    }

    public async getRootLocationsOnAccount(accountId, userId){
        const account = new Account(accountId);

        let locationsOnAccount = [],
            locations = <any> [],
            roles = <any> [],
            response = {
                locations : <any> []
            };

        try {
            // FRP & TRP
            let userRoleModel = new UserRoleRelation(),
                roles = await userRoleModel.getByUserId(userId);

            locationsOnAccount = await account.getLocationsOnAccount(userId, 1, 0);

            for (let loc of locationsOnAccount) {
                locations.push(loc);
            }

        } catch (e) {
            // Warden or Users
            try{
                let userEmRole = new UserEmRoleRelation(),
                emRoles = <any> await userEmRole.getEmRolesByUserId(userId);

                for (let em of emRoles) {
                    locations.push(em);
                }

            }catch(e){  }
        }

        let parentLoc = [];
        for (let loc of locations) {
            let allSubLocationIds = [0],
                deepLocModel = new Location(),
                deepLocations = <any> [];

            if(loc.parent_id == -1){
                deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);
                deepLocations.push(loc);
            }else{
                let ancLocModel = new Location(),
                    ancestores = <any> await ancLocModel.getAncestries(loc.location_id);

                for(let anc of ancestores){
                    if(anc.parent_id == -1){
                        deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(anc.location_id);
                        deepLocations.push(anc);
                    }
                }
            }

            for(let sub of deepLocations){
                if(sub.parent_id > -1){
                    allSubLocationIds.push(sub.location_id);
                }
            }

            let locAccModel = new LocationAccountRelation(),
                locAccTenant = <any> await locAccModel.getByWhereInLocationIds( allSubLocationIds.join(',') ),
                numTenants = 0,
                tenantsIds = [];

            for(let ten of locAccTenant){
                if(tenantsIds.indexOf( ten.account_id ) == -1){
                    numTenants++;
                    tenantsIds.push( ten.account_id );
                }
            }


            let locMerged = this.addChildrenLocationToParent(deepLocations),
                respLoc = (locMerged[0]) ? locMerged[0] : locMerged;

            let alreadyHave = false;
            for(let parent of parentLoc){
                if(parent.location_id == respLoc.location_id){
                    alreadyHave = true;
                }
            }

            if(!alreadyHave){
                parentLoc.push(respLoc);
            }
        }

        return parentLoc;
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

            let locAccUser = new UserEmRoleRelation(),
                users = <any> await locAccUser.getUsersInLocationIds(allLocationIds.join(',') ),
                allUserIds = [0];

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

    private async buildLocationComplianceData(locationData, accountId, role, kpis){
        let sublocationModel = new Location(),
            deepLocations = <any> await sublocationModel.getDeepLocationsByParentId(locationData.location_id),
            locAccntModel = new LocationAccountRelation(),
            locCompRate = 0,
            allSubLocationsId = [0],
            complianceModel = new ComplianceModel(),
            locationCompliance = <any> await complianceModel.getLocationCompliance(locationData.location_id, accountId, role),
            locAccntUser = new LocationAccountUser(),
            complianceDocsModel = new ComplianceDocumentsModel(),
            whereDocs = [],
            docs = [],
            today = moment(),
            TotalNumberOfKPIS = kpis.length;

        locationData['kpis'] = JSON.parse(JSON.stringify(kpis));
        locationData['name'] = (locationData['name'].length == 0) ? locationData['formatted_address'] : locationData['name'];
        this.createComplianceMapForLocation(locationData.location_id, accountId, 'Manager');

        for(let sub of deepLocations){
            allSubLocationsId.push( sub.location_id );
        }
        locationData['wardens'] = await locAccntUser.getWardensByAccountIdWhereInLocationId(accountId, allSubLocationsId.join(','));

        whereDocs.push(['building_id = ' + locationData.location_id]);
        whereDocs.push(['account_id = ' + accountId]);
        whereDocs.push(['document_type = "Primary" ']);
        whereDocs.push(['override_document = -1 ']);
        docs = <any> await complianceDocsModel.getWhere(whereDocs);
        locationData['docs'] = docs;

        for(let kp of locationData.kpis){
            kp['compliant'] = false;
            kp['overdue'] = false;
            kp['activity_date'] = '';

            for(let comp of locationCompliance){

                kp['valid_till'] = comp['valid_till'];

                if( comp.compliance_kpis_id == kp.compliance_kpis_id ){

                    if(comp.measurement == "Precent"){

                        let totalWadens = locationData.wardens.length,
                            userIds = [0],
                            wardenCompliantCount = 0;

                        for(let ward of locationData.wardens){
                            userIds.push(ward.user_id);
                        }

                        let certModel = new TrainingCertification(),
                            certificates = <any> await certModel.getCertificatesByInUsersId( userIds.join(',') );

                        kp['certificates'] = certificates;

                        for(let ward of locationData.wardens){
                            ward['compliant'] = false;
                            for(let cert of certificates){
                                if(cert.user_id == ward.user_id){
                                    if(cert.pass == 1 && cert.status == 'valid'){
                                        ward['compliant'] = true;
                                        wardenCompliantCount++;
                                    }
                                }
                            }
                        }

                        kp['wardenCompliantCount'] = wardenCompliantCount;

                        if(wardenCompliantCount == totalWadens){
                            kp['compliant'] = true;
                            locCompRate++;
                        }

                    }else if(comp.measurement == "Traffic"){

                        if(locationData.docs.length > 0){
                            let validTillMoment = moment(comp['valid_till']),
                                doc = {};
                            for(let d of locationData.docs){
                                if(d.compliance_kpis_id == kp.compliance_kpis_id && Object.keys(doc).length == 0){
                                    doc = d;
                                    kp['activity_date'] = d.date_of_activity_formatted;
                                }
                            }

                            kp['doc'] = doc;

                            if (Object.keys(doc).length > 0 && validTillMoment.diff(today, 'days') > 0) {
                                kp['compliant'] = true;
                                locCompRate++;
                            }else if( today.diff(validTillMoment, 'days') > 0  ){
                                kp['overdue'] = true;
                            }

                        }

                    }

                    kp['rate'] = locCompRate;

                }
            }

        }

        locationData['compliances'] = locationCompliance;
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
                    compliance_rating : '0/0'
                }, message : ''
            },
            locations = [],
            locationModel = new Location(location_id);

        if(location_id == 0){
            const account = new Account(accountId);
            locations = <any> await this.getRootLocationsOnAccount(accountId, userId);
        }else{
            try{
                let location = await locationModel.load();
                locations.push(location);
            }catch(e){
                response.status = false;
                response.message = 'No location found';
            }
        }

        let kpisModel = new ComplianceKpisModel(),
            kpis = <any> await kpisModel.getWhere(['description IS NOT NULL']);

        let TotalNumberOfKPIS = kpis.length,
            overallRating = 0;

        for(let loc of locations){
            loc = <any> await this.buildLocationComplianceData(loc, accountId, 'Manager', kpis);
        }

        let overallRatingCount = 0;
        for(let loc of locations){
            let splittedComplianceRating = loc.compliance_rating.split('/'),
                nominator = parseInt(splittedComplianceRating[0]),
                denaminator = splittedComplianceRating[1];

            overallRatingCount = overallRatingCount + nominator;
        }

        overallRating = overallRatingCount / locations.length;

        response.data.compliance_rating = overallRating+'/'+TotalNumberOfKPIS;
        response.data.locations = locations;

        res.send(response);
    }

    public async getStatementOfCompliance(req: AuthRequest, res: Response){
        let location_id = req.params.location_id,
            accountId = req.user.account_id,
            userId = req.user.user_id,
            response = {
                status : true, data : {
                    location : {},
                    kpis : [],
                    docs : [],
                    compliances : [],
                    wardens : [],
                    compliance_rating : '0/0'
                }, message : ''
            },
            locationModel = new Location(location_id),
            kpisModel = new ComplianceKpisModel(),
            kpis = <any> await kpisModel.getWhere(['description IS NOT NULL']),
            TotalNumberOfKPIS = kpis.length,
            overallRating = 0;

        this.createComplianceMapForLocation(location_id, accountId, 'Manager');

        try{
            let loc = <any> await locationModel.load();

            loc = await this.buildLocationComplianceData( loc, accountId, 'Manager', kpis );

            response.data.location = loc;
            response.data.kpis = loc.kpis;
            response.data.wardens = loc.wardens;
            response.data.compliances = loc.compliances;
            response.data.compliances = loc.compliances;


        }catch(e){ }

        response.data.compliance_rating = overallRating+'/'+TotalNumberOfKPIS;
        res.send(response);
    }
}
