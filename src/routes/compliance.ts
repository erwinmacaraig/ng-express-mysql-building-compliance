

import { Account } from '../models/account.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { Location } from '../models/location.model';
import { LocationAccountUser } from '../models/location.account.user';
import { ComplianceModel } from '../models/compliance.model';
import { ComplianceKpisModel } from '../models/comliance.kpis.model';
import { ComplianceDocumentsModel } from '../models/compliance.documents.model';
import { ComplianceNotesModel } from '../models/compliance.notes.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import { FileUploader } from '../models/upload-file';
import { TrainingCertification } from './../models/training.certification.model';
import { WardenBenchmarkingCalculator } from './../models/warden_benchmarking_calculator.model';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

const AWSCredential = require('../config/aws-access-credentials.json');
const defs = require('../config/defs.json');
const validator = require('validator');
const md5 = require('md5');
const request = require('request');
import * as S3Zipper from 'aws-s3-zipper';

/**
 * / route
 *
 * @class ComplianceRoute
 */
 export class ComplianceRoute extends BaseRoute {

 	private response = {
 		status : false, data : <any>[], message : ''
 	};

	/**
   	* Create the routes.
   	*
   	* @class ComplianceRoute
   	* @method create
   	* @static
   	*/
    public static create(router: Router) {
        router.get('/compliance/kpis', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
          new ComplianceRoute().getKPIS(req, res, next);
        });

        router.post('/compliance/locations-latest-compliance',
          new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
            new ComplianceRoute().getLocationsLatestCompliance(req, res);
        });

        router.get('/compliance/download-compliance-documents-pack/',
        new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
          new ComplianceRoute().downloadDocumentCompliancePack(req, res, next);
        });

        router.get('/compliance/download-compliance-file/',
            new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
                const uploader = new FileUploader(req, res, next);
                uploader.getFile().then((data) => {
                    console.log(data);
                    res.end();
                });
        });

        router.post('/compliance/toggleTPRViewAccess/',
            new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
              const compliance_documents_id = ('compliance_documents_id' in req.body) ? req.body.compliance_documents_id : 0;
              const viewable_by_trp = ('viewable_by_trp' in req.body) ? req.body.viewable_by_trp : 0;
              const complianceDocObj = new ComplianceDocumentsModel(compliance_documents_id);
              complianceDocObj.load().then((loadData) => {
                return complianceDocObj.create({'viewable_by_trp': viewable_by_trp});
              }).then((createResults) => {
                return res.status(200).send({'viewable_by_trp': viewable_by_trp});
              }).catch((e) => {
                return res.status(400).send({'message':  'Change Failed.'});
              });
        });

        router.post('/compliance/warden-calculations/',
            new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
          // http://ec2-13-55-135-227.ap-southeast-2.compute.amazonaws.com/apis/warden_number_calculator/
          const createData = req.body;
          const headers = {
            'User-Agent': 'Evacconnect-client',
            'Accept': 'application/json'
          };

          const options = {
            url: 'http://ec2-13-55-135-227.ap-southeast-2.compute.amazonaws.com/apis/warden_number_calculator/',
            method: 'POST',
            headers: headers,
            json: true,
            body: req.body
          };
         request(options, (error, response, body) => {
            if (error) {
              console.log('error from calling api', error);
              return res.send({
                'status':  'Cannot query server for calculations'
              });
            }
            let resultObj;
            resultObj = JSON.parse(body.slice(body.indexOf('{'), body.length));
            const wardenCalc = new WardenBenchmarkingCalculator();
            createData['total_estimated_wardens'] = resultObj['total_estimated_wardens']['value'];
            createData['updated_by'] = req.user.user_id;
            wardenCalc.create(createData).then(() => {
              return res.send({
                'message': 'Success',
                'data': resultObj
              });
            }).catch((e) => {
              return res.status(400).send({
                'message': 'Calculation was successful but cannot store results',
                'error': e
              });
            });
         });
        });

        router.post('/compliance/get-sublocations-evac-diagrams', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ComplianceRoute().getSublocationsEvacDiagrams(req, res);
        });
    }

    public downloadDocumentCompliancePack(req: AuthRequest, res: Response, next: NextFunction) {

        const utils = new Utils();
        const config = {
          'accessKeyId': AWSCredential.AWSAccessKeyId,
          'secretAccessKey': AWSCredential.AWSSecretKey,
          'region': AWSCredential.AWS_REGION,
          'bucket': AWSCredential.AWS_Bucket
        };
        const zipper = new S3Zipper(config);
        const dirPath = __dirname + '/../public/temp';
        utils.s3DownloadCompliancePackPathGen(req.user.account_id, req.query.location_id).then((urlPath) => {
          zipper.zipToFile({
            's3FolderName': urlPath,
            'startKey': null,
            'zipFileName': `${dirPath}/${defs['COMPLIANCE-DOCS-PACK']}`,
            'recursive': true
          }, (err, result) => {
            if (err) {
              console.log(err);
              // throw new Error(err);
              return res.status(400).send(err);
            } else {
              const lastFile = result.zippedFiles[result.zippedFiles.length-1];
              if (lastFile) {
                console.log('Zip file: ', lastFile.Key); // next time start from here
              }
              const filePath = `${dirPath}/${defs['COMPLIANCE-DOCS-PACK']}`;
              return res.download(filePath, (error) => {
                if (error) {
                  console.log(error);
                  return res.status(400).send(error);
                } else {
                  console.log('Success');
                  /*
                  fs.unlink(filePath, function(e){
                    console.log('Cannot delete file.', e);
                  });
                  */
                }
              });
            }
          });
        });
        //

    }

	public async getKPIS(req: AuthRequest, res: Response, next: NextFunction) {
		let kpisModel = new ComplianceKpisModel(),
			arrWhere = [],
            evacDiagramId = 5;

		arrWhere.push([' description IS NOT NULL ']);

		this.response.status = true;
		this.response.data = await kpisModel.getWhere(arrWhere);
        for(let d of this.response.data){
            if(d.compliance_kpis_id == evacDiagramId){
                d['measurement'] = 'Precent';
            }
        }

		res.send(this.response);
	}

	public async getLocationsLatestCompliance(req: AuthRequest, res: Response, toReturn?, formData?) {
		let locationID = (formData) ? formData.location_id : req.body.location_id,
			accountID = req.user.account_id,
            userId = req.user.user_id,
            accountModel = new Account(accountID),
			locAccModel = new LocationAccountRelation(),
			complianceModel = new ComplianceModel(),
			kpisModel = new ComplianceKpisModel(),
			complianceDocsModel = new ComplianceDocumentsModel(),
			arrWhereKPIS = [],
			arrWhereCompliance = [],
            emrolesOnThisLocation,
            paths,
            epcMeetingId = 2,
            evacDiagramId = 5,
            epmId = 4,
            sundryId = 13,
            fsaId = 3,
            account= <any> {},
            epcCommitteeOnHQ = false;

        /*
        * epcCommitteeOnHQ if true, no documents required for compliance
        */

        try{
            account = await accountModel.load();
            epcCommitteeOnHQ = (account.epc_committee_on_hq == 1) ? true : false;
        }catch(e){}

        // Retrieve the highest account role
        let role = 0;
        const userRoleRelObj = new UserRoleRelation();
        try {
            role = await userRoleRelObj.getByUserId(userId, true, locationID);
        } catch (e) {
            console.log(e);
            try {
                role = await userRoleRelObj.getByUserId(userId, true);
            } catch (err) {
                console.log(err);
                role = 0;
            }
        }
        
        const utils = new Utils(),
            training = new TrainingCertification(),
            locationModel = new Location(locationID),
            wardenCalc = new WardenBenchmarkingCalculator();

        try {
            paths = await utils.s3DownloadFilePathGen(accountID, locationID);
        } catch (e) {
            paths = [];
        }

        try {
            emrolesOnThisLocation = await locationModel.getEMRolesForThisLocation(0, locationID, role);
            // console.log('======================', emrolesOnThisLocation, '=====================');
            if (defs['em_roles']['GENERAL_OCCUPANT'] in emrolesOnThisLocation) {

                /*
                if (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'].length > 0) {
                    let locId;
                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'], {
                                'em_role_id': defs['em_roles']['GENERAL_OCCUPANT'],
                                'location': locId
                              }
                            );
                        }
                    }
                }
                */
            }

            if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation) {

                if (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length > 0) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location']);

                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'],
                              {
                                'em_role_id': defs['em_roles']['WARDEN'],
                                'location': locId
                            });
                            // console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']);
                        }
                        if (locId in calcResults) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] =
                            calcResults[locId]['total_estimated_wardens'];
                        } else {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] = 0;
                        }
                        /*
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                        (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] >=
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens']) ?
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] :
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'];
                        */
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                        Math.round(
                          (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] /
                          emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].length) * 100 );

                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'].toString() + '%';
                    }
                } else { // there is no  warden assigned to the selected location

                }
            } else {
              emrolesOnThisLocation[defs['em_roles']['WARDEN']] = {
                'name': '',
                'count': 0,
                'users': [],
                'location': []
              };
            }

            // Floor Warden
            if (defs['em_roles']['FLOOR_WARDEN'] in emrolesOnThisLocation) {
              let locId;
              for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['location'].length; i++) {
                locId = emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['location'][i].toString();
                const floorwardens = [];
                if (emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'].length > 0) {
                  if ((locId in emrolesOnThisLocation[defs['em_roles']['WARDEN']])) {
                    // loop through the users because the training for floor warden and warden is the same
                    // so we do not count
                    for (let counter = 0;
                      counter < emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'].length; counter++) {
                      if (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].indexOf(
                          emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'][counter]) === -1
                        ) {
                        floorwardens.push(emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'][counter]);
                      }
                    }
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'] =
                      emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].concat(floorwardens);

                    emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training'] =
                      await training.getEMRUserCertifications(floorwardens, {'em_role_id': defs['em_roles']['FLOOR_WARDEN']});
                  } else {
                   emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training'] =
                   await training.getEMRUserCertifications(
                    emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'],
                    {'em_role_id': defs['em_roles']['FLOOR_WARDEN']});

                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId] =
                      emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId];

                    emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].push(locId);
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['count'] =
                      emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['count'];

                  /*
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] =
                    emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['count'];
                  */
                  }
                }
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_floor_wardens'] =
                   emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['users'].length;
              }
              // console.log((defs['em_roles']['WARDEN'] in emrolesOnThisLocation && (locId in emrolesOnThisLocation[defs['em_roles']['WARDEN']])));
              if ((locId in emrolesOnThisLocation[defs['em_roles']['WARDEN']])) {
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] +
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'];

                // console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]);
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] =
                  emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] +
                  emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                  Math.round(
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] /
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens']
                  ) * 100;

                  emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'].toString() + '%';
              } else {
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                    emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] =
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                Math.round(
                  emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'] /
                  emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'] ) * 100;

              }
              if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation === false) {
                emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] =
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['count'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']]['name'] =
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['name'];
              }

              // console.log(emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]);
            }

            if (defs['em_roles']['CHIEF_WARDEN'] in emrolesOnThisLocation) {
                // console.log(emrolesOnThisLocation['12']);
                if (emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location'].length > 0) {
                    let locId;
                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['users']
                            );
                        }
                    }
                } else {
                    console.log('There is no chief warden assigned to this location');
                }
            }

            this.response['emrolesOnThisLocation'] = emrolesOnThisLocation;
            // console.log(emrolesOnThisLocation);
        } catch (e) {
            console.log(e);
            emrolesOnThisLocation = {};
        }

        arrWhereKPIS.push([' description IS NOT NULL ']);
        let kpis =  <any> await kpisModel.getWhere(arrWhereKPIS),
            kpisIds = [],
            noCompliancesIds = [];

        for(let kpi of kpis){
            if(kpi.compliance_kpis_id == evacDiagramId){
                kpi['measurement'] = 'Precent';
            }
        }

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
            noCompliancesIds.push(kpis[key]['compliance_kpis_id']);
        });

        arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
        arrWhereCompliance.push(['building_id = ' + locationID]);
        arrWhereCompliance.push(['account_id = ' + accountID + ' GROUP BY compliance_kpis_id' ]);

        let compliances = <any> await complianceModel.getWhere(arrWhereCompliance);

        for(let i in kpis) {
            let hasKpis = false;
            for(let c in compliances){
                if(compliances[c]['compliance_kpis_id'] == kpis[i]['compliance_kpis_id']){
                    hasKpis = true;
                }
            }

            if (!hasKpis) {
                let createComplianceModel = new ComplianceModel(),
                compObj = {
                    'compliance_kpis_id': kpis[i]['compliance_kpis_id'],
                    'compliance_status': 0,
                    'building_id': locationID,
                    'account_id': accountID,
                    'valid_till': null,
                    'required': 1,
                    'account_role': '',
                    'override_by_evac': 0
                };
                await createComplianceModel.create(compObj);
                compObj['compliance_id'] = createComplianceModel.ID();
                compliances.push(compObj);
            }
        }

        let whereDocs = [],
            docs = <any> [];

        whereDocs.push(['compliance_documents.building_id = ' + locationID]);
        whereDocs.push(['compliance_documents.account_id = ' + accountID]);
        whereDocs.push(['compliance_documents.document_type = "Primary" ']);
        whereDocs.push(['compliance_documents.override_document = -1 ']);
        docs = await complianceDocsModel.getWhere(whereDocs);

        let 
            sublocsids = [0],
            subLocsModel = new Location(),
            sublocs = <any> await subLocsModel.getChildren(locationID);
            
        for(let sub of sublocs){
            sublocsids.push(sub.location_id);
        }

        if(sublocsids.length > 1){
           let 
               complianceDocsModelSubLoc = new ComplianceDocumentsModel(),
               whereDocsSub = [],
               docsSub = <any> [];

            whereDocsSub.push(['compliance_documents.building_id IN ( ' + sublocsids.join(',') + ')' ]);
            whereDocsSub.push(['compliance_documents.account_id = ' + accountID]);
            whereDocsSub.push(['compliance_documents.compliance_kpis_id IN ('+epcMeetingId+', '+epmId+') ']);
            whereDocsSub.push(['compliance_documents.document_type = "Primary" ']);
            whereDocsSub.push(['compliance_documents.override_document = -1 ']);
            docsSub = await complianceDocsModelSubLoc.getWhere(whereDocsSub);

            docs = docs.concat(docsSub);
        }

        docs = docs.sort((a, b) => {
            let d1 = moment(a.date_of_activity),
                d2 = moment(b.date_of_activity);
            if(d1.isAfter(d2)){
                return -1;
            }else if(d1.isBefore(d2)){
                return 1;
            }else{
                return 0;
            }
        });

        for(let d of docs){
            d.timestamp_formatted = (moment(d.timestamp_formatted).isValid()) ? moment(d.timestamp_formatted).format('DD/MM/YYYY') : '00/00/0000';

            if(d.compliance_kpis_id == epmId){
                try {
                    d['filePaths'] = await utils.s3DownloadFilePathGen(accountID, d.building_id);
                } catch (e) { }
            }
        }

        for (let c in compliances) {
            compliances[c]['docs'] = [];
            compliances[c]['kpis'] = {};

            for(let i in kpis){
                if(compliances[c]['compliance_kpis_id'] == kpis[i]['compliance_kpis_id']){
                    compliances[c]['kpis'] = kpis[i];
                }
            }

            for(let d in docs){
                if(docs[d]['compliance_kpis_id'] == compliances[c]['compliance_kpis_id']){
                    docs[d]['filePaths'] = (paths[ compliances[c]['compliance_kpis_id'] ]) ? paths[ compliances[c]['compliance_kpis_id'] ] : [] ;
                    compliances[c]['docs'].push(docs[d]);
                }
            }

        }

        for (let comp of compliances) {
            let kpis = comp['kpis'],
                m = kpis['measurement'],
                today = moment(),
                validTillMoment = moment(comp['valid_till']);

            comp['measurement'] = comp['kpis']['measurement'];
            comp['valid_till'] = (validTillMoment.isValid()) ? validTillMoment.format('DD/MM/YYYY') : null;
            comp['validity_status'] = 'none-exist';
            comp['valid'] = 0;
            comp['days_remaining']= 0;
            comp['total_personnel'] = 0;
            comp['total_personnel_trained'] = {
                'total_passed' : 0,
                'passed': [],
                'failed': []
            };
            comp['percentage'] = '0%';
            comp['points'] = 0;

            if (m === 'Traffic' || m === 'evac') {

                if(comp['docs'][0]){
                    validTillMoment = moment(comp['docs'][0]['valid_till'], ['DD/MM/YYYY']);
                }

                if (comp['docs'][0] && validTillMoment.diff(today, 'days') > 0) {
                    comp['validity_status'] = 'valid';
                    comp['days_remaining'] = validTillMoment.diff(today, 'days');
                    comp['valid'] = 1;
                    comp['percentage'] = '100%';
                } else if (comp['docs'][0] && validTillMoment.diff(today, 'days') >= 0 && validTillMoment.diff(today, 'days') <= 30) {
                    comp['validity_status'] = 'expiring';
                } else if (comp['docs'][0] && validTillMoment.diff(today, 'days') <= 0) {
                    comp['validity_status'] = 'invalid';
                }

            } else if (m === 'Percent') {
                // 6 Warden Training
                // 8 General Occupant
                // 11 General Occupant
            }
            let tempPercetage;
            const totalPassedArr = [];
            const totalFailedArr = [];

            switch (comp['compliance_kpis_id']) {
                case 6:
                    // Warden Training
                    if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation) {
                        comp['total_personnel'] = comp['warden_total'] = emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'];
                        comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['WARDEN']];
                        try {
                            comp['total_personnel_trained'] =
                                await training.getEMRUserCertifications(
                                  emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'],
                                  {'em_role_id':  defs['em_roles']['WARDEN']}
                                );
                            for (const p of comp['total_personnel_trained']['passed']) {
                              if (totalPassedArr.indexOf(p['user_id']) === -1) {
                                totalPassedArr.push(p['user_id']);
                              }
                            }
                            for (const f of comp['total_personnel_trained']['failed']) {
                              if (totalFailedArr.indexOf(f['user_id']) === -1) {
                                totalFailedArr.push(f['user_id']);
                              }
                            }

                        } catch (e) {
                            comp['total_personnel'] = 0;
                            comp['total_personnel_trained'] = {
                                'total_passed' : 0,
                                'passed': [],
                                'failed': []
                            };
                            comp['percentage'] = '0%';
                        }
                    }

                    if (defs['em_roles']['FLOOR_WARDEN'] in emrolesOnThisLocation) {
                      const floorwardens = [];
                      // loop through the users
                      console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users']);
                      for (const u of emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['users']) {
                        if (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'].indexOf(u) === -1) {
                          floorwardens.push(u);
                        }
                      }
                      // console.log('FLOOR WARDENS = ', floorwardens );
                      emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'] =
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'].concat(floorwardens);
                      comp['total_personnel'] += floorwardens.length;

                      try {
                        const floorwardentrained  = await training.getEMRUserCertifications(floorwardens,
                        {'em_role_id':  defs['em_roles']['FLOOR_WARDEN']});
                        comp['total_personnel_trained']['total_passed'] +=
                        floorwardentrained['total_passed'];
                        // console.log(floorwardentrained);
                        for (const p of floorwardentrained['passed']) {
                          if (totalPassedArr.indexOf(p['user_id']) === -1) {
                            totalPassedArr.push(p['user_id']);
                            comp['total_personnel_trained']['passed'].push(p);
                          }
                        }
                        for (const f of floorwardentrained['failed']) {
                          if (totalFailedArr.indexOf(f['user_id']) === -1) {
                            totalFailedArr.push(f['user_id']);
                            comp['total_personnel_trained']['failed'].push(f);
                          }
                        }
                      } catch (e) {
                        console.log(e);
                      }

                      

                      // computation per location section (signifance: FRP)
                      if (Object.keys(comp['location_details']).length === 0) {
                        comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']];
                      } else {
                        const locDetailsForFloorWarden = emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']];
                        const wardenUsersInThisLoc = [];
                        for (const loc of comp['location_details']['location']) {
                          if (loc in locDetailsForFloorWarden) {
                            const allPassedWardens = [];
                            for (const pw of comp['location_details'][loc]['training']['passed']) {
                              allPassedWardens.push(pw['user_id']);
                            }
                            // loop for all passed users
                            for (const p of locDetailsForFloorWarden[loc]['training']['passed']) {
                              if (allPassedWardens.indexOf(p['user_id']) === -1) {
                                comp['location_details'][loc]['training']['passed'].push(p);
                              }
                            }
                            comp['location_details'][loc]['training']['failed'] =
                            comp['location_details'][loc]['training']['failed'].concat(locDetailsForFloorWarden[loc]['training']['failed']);
                            comp['location_details'][loc]['training']['total_passed'] =
                              comp['location_details'][loc]['training']['passed'].length;

                            comp['location_details'][loc]['training']['percentage'] =
                            Math.round((comp['location_details'][loc]['training']['total_passed']
                             / comp['location_details'][loc]['users'].length) * 100).toFixed(0).toString() + '%';

                          }
                        }
                      }
                    }

                    tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                    if(isNaN(tempPercetage)){
                        tempPercetage = 0;
                    }
                    comp['percentage'] = tempPercetage + '%';
                    if(tempPercetage >= 100){
                        comp['valid'] = 1;
                    }
                break;

                case 8:
                    // General Occupant Training
                    if (defs['em_roles']['GENERAL_OCCUPANT'] in emrolesOnThisLocation) {

                      comp['total_personnel'] = comp['general_occupant_total'] =
                      emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['count'];
                      comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']];

                      try {
                            comp['total_personnel_trained'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['users'],
                              {'em_role_id': defs['em_roles']['GENERAL_OCCUPANT']}
                            );
                            tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            comp['percentage'] = tempPercetage + '%';
                            if (tempPercetage >= 100){
                                comp['valid'] = 1;
                            }
                        } catch (e) {
                            comp['total_personnel'] = 0;
                            comp['total_personnel_trained'] = {
                                'total_passed' : 0,
                                'passed': [],
                                'failed': []
                            };
                            comp['percentage'] = '0%';
                        }
                    }

                break;

                case 12:
                    // Chief Warden Training
                    if (defs['em_roles']['CHIEF_WARDEN'] in emrolesOnThisLocation) {
                        comp['total_personnel'] =  comp['chief_warden_total'] =
                          emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['count'];
                        comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']];
                        try {
                            comp['total_personnel_trained'] =
                              await training.getEMRUserCertifications(
                                emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['users'],
                                {'em_role_id': defs['em_roles']['CHIEF_WARDEN']}
                            );
                            tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            comp['percentage'] = tempPercetage + '%';
                            if(tempPercetage >= 100){
                                comp['valid'] = 1;
                            }
                        } catch (e) {
                            comp['total_personnel'] = 0;
                            comp['total_personnel_trained'] = {
                                'total_passed' : 0,
                                'passed': [],
                                'failed': []
                            };
                            comp['percentage'] = '0%';
                        }
                    }
                break;

                default:

                    // comp['total_personnel'] = 0;
                    // comp['total_personnel_trained'] = {
                    // 'total_passed' : 0,
                    // 'passed': [],
                    // 'failed': []
                    // };
                    // comp['percentage'] = '0%';

                break;
            }

            if(comp.compliance_kpis_id == evacDiagramId){
                let locSubModel = new Location(),
                    subs = <any> [],
                    subIds = [0],
                    compianceDocsModel = new ComplianceDocumentsModel(),
                    diagrams = [],
                    docsWhere = [];

                try{
                    subs = await locSubModel.getWhere([ 'parent_id = '+ locationID + ' AND archived = 0' ]);
                }catch(e){}

                for(let sub of subs){
                    subIds.push(sub.location_id);
                }

                docsWhere.push( ['compliance_documents.compliance_kpis_id = '+evacDiagramId] );
                docsWhere.push( ['compliance_documents.document_type = "Primary" '] );
                docsWhere.push( ['compliance_documents.building_id IN ('+subIds.join(',')+')'] );
                diagrams = <any> await compianceDocsModel.getWhere(docsWhere);
                let valids = 0;
                for(let diag of diagrams){
                    let validTillMoment = moment(diag['valid_till'], ['DD/MM/YYYY']);
                    if ( validTillMoment.diff(today, 'days') > 0 ) {
                        valids++;
                    }
                }
                if(diagrams.length > 0){
                    comp['percentage'] = Math.round( ( valids / diagrams.length ) * 100) + '%' ;
                }
                if(Math.round( ( valids / diagrams.length ) * 100) >= 100){
                    comp['valid'] = 1;
                }
                comp['total_valid_diagrams'] = valids;
                comp['total_diagrams'] = diagrams.length;
            }

            if(comp.compliance_kpis_id == sundryId){
                let deepLocModel = new Location(),
                    deepLocs = <any> await deepLocModel.getDeepLocationsByParentId(locationID),
                    emRoleModel = new UserEmRoleRelation(),
                    wardens = [],
                    sublocsId = [0];
                for(let loc of deepLocs){
                    sublocsId.push( loc.location_id );
                }

                wardens = <any> await emRoleModel.getCountWardensInLocationIds( sublocsId.join(',') );

                comp['num_wardens'] = (wardens[0]) ? wardens[0]['count'] : 0;
            }

            if(comp.compliance_kpis_id == fsaId){
                comp['validity_status'] = 'valid';
            }

            comp['percentage_number'] = parseInt(comp['percentage'].replace('%', '').trim());
        }

        /*
        ** New Compliance Percentage Computation Based On User's Role 
        ** Indexed with KPIS IDS
        */
        let 
        frpRates = {
            2 : { kpis : 'EPC Meeting', valid : 10, no_docs : 0, expired_docs : 5, epc_headoffice_points : 10 },
            3 : { kpis : 'Fire Safety Advisor', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 20, no_docs : 0, expired_docs : 10, epc_headoffice_points : 20 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 20, no_docs : 0, expired_docs : 10, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        trpRates = {
            2 : { kpis : 'EPC Meeting', valid : 0, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            3 : { kpis : 'Fire Safety Advisor', valid : 15, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 20, no_docs : 0, expired_docs : 10, epc_headoffice_points : 20 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 10, no_docs : 0, expired_docs : 5, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 0, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        trpWholeOcccupierRates = {
            2 : { kpis : 'EPC Meeting', valid : 5, no_docs : 0, expired_docs : 2.5, epc_headoffice_points : 5 },
            3 : { kpis : 'Fire Safety Advisor', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 15, no_docs : 0, expired_docs : 7.5, epc_headoffice_points : 15 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 20, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 15, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 20, no_docs : 0, expired_docs : 10, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        locAccUserModel = new LocationAccountUser(),
        locationModelForTRP = new Location(locationID),
        ancetriesIds = await locationModelForTRP.getAncestryIds(locationID),
        loc = <any> {},
        ancIdsArray = [],
        ancestries = [],
        userComplianceRole = '',
        userLocationData = <any> {},
        isWholeBuildingOccupier = (role == 1) ?  true : false,
        rates = JSON.parse(JSON.stringify(frpRates));

        try{
            loc = await locationModelForTRP.load();

            if(ancetriesIds[0]){
                let tempId = ancetriesIds[0]['ids'].split(',');
                for(let id of tempId){
                    if(id > 0){
                        ancIdsArray.push(id);
                    }
                }

                if(ancIdsArray.length > 0){
                    ancestries = <any> await locationModelForTRP.getByInIds(ancIdsArray.join(','));
                }

            }
            ancestries.push(loc);

            // Sort from highest id to lowest id
            ancestries.sort((a, b) => {
                if(a.location_id < b.location_id){
                    return 1;
                }else if(a.location_id > b.location_id){
                    return -1;
                }else{
                    return 0;
                }
            });

            this.response['locations'] = ancestries;
        }catch(e){

        }

        let theBuilding = {};
        for(let loc of ancestries){
            if(loc.is_building == 1){
                theBuilding = loc;
            }else if(loc.parent_id == -1 && Object.keys(theBuilding).length == 0){
                theBuilding = loc;
            }
        }

        this.response['building'] = theBuilding;

        try{
            userLocationData = await locAccUserModel.getByLocationIdAndUserId(locationID, userId);
            if(role == 2){
                isWholeBuildingOccupier = (loc.location_id == locationID) ? true : false;
            }
        }catch(e){}

        userComplianceRole = (role == 1) ? 'frp' : (isWholeBuildingOccupier) ? 'trpWholeOccupier' : 'trp';

        this.response['userLocationData'] = userLocationData;
        this.response['userComplianceRole'] = userComplianceRole;

        if(userComplianceRole == 'trp'){
            rates = JSON.parse(JSON.stringify(trpRates));
        }else if(userComplianceRole == 'trpWholeOccupier'){
            rates = JSON.parse(JSON.stringify(trpWholeOcccupierRates));
        }

        for(let comp of compliances){
            let tempPoints = comp.points;
            if( rates[ comp.compliance_kpis_id ] ){

                if(epcCommitteeOnHQ && rates[comp.compliance_kpis_id]['epc_headoffice_points'] > 0 ){
                    tempPoints = rates[comp.compliance_kpis_id]['valid'];
                    comp['validity_status'] = 'valid';
                }else{

                    if(comp['validity_status'] == 'valid' || comp['valid'] == 1){
                        tempPoints = rates[comp.compliance_kpis_id]['valid'];
                    }else if(comp['validity_status'] == 'expiring' || comp['validity_status'] == 'invalid'){
                        tempPoints = rates[comp.compliance_kpis_id]['expired_docs'];
                    }

                }
            }

            comp['points'] = tempPoints;
        }

        this.response['rates'] = rates;
		this.response.status = true;
		this.response.data = compliances;
        this.response['percent'] = 0;

        let validcount = 0,
            totalcount = 0;
        for (let comp of compliances) {
            if(sundryId != comp.compliance_kpis_id){
                totalcount++;
                validcount = validcount + comp.points;
            }
        }

        if(totalcount > 0){
            this.response['percent'] = Math.floor((validcount / 100) * 100);
        }

		res.statusCode = 200;

        if(!toReturn){
		    res.send(this.response);
        }else{
            return this.response;
        }

	}

    public async getSublocationsEvacDiagrams(req: AuthRequest, res: Response){
        let
        locationId = req.body.location_id,
        accountID = req.user.account_id,
        response = {
            status : true, data : {
                location : {},
                sublocations : [],
                total_diagrams : 0,
                total_valid_diagrams : 0,
                percentage : '0%'
            }, message : ''
        },
        locationModel = new Location(),
        sublocations = [],
        subIds = [0],
        evacDiagramId = 5,
        today = moment();

        response.data.location = <any> await locationModel.getByInIds(locationId);
        if(response.data.location[0]){
            response.data.location = response.data.location[0];
        }

        try{
            sublocations = <any> await locationModel.getWhere([ 'parent_id = ' +locationId+ ' AND archived = 0' ]);

            let
            subs = sublocations,
            diagrams = <any> [],
            valids = 0,
            total_diagrams = 0,
            whereDocs = [],
            subIds = [0],
            complianceDocsModel = new ComplianceDocumentsModel();

            for(let sub of sublocations){
                subIds.push(sub.location_id);
                sub['evac_diagrams'] = [];
            }

            whereDocs.push( ['compliance_documents.compliance_kpis_id = '+evacDiagramId] );
            whereDocs.push( ['compliance_documents.document_type = "Primary" '] );
            whereDocs.push( ['compliance_documents.building_id IN ('+subIds.join(',')+')'] );
            diagrams = await complianceDocsModel.getWhere(whereDocs);

            response.data['diagrams'] = diagrams;
            for(let diag of diagrams){
                for(let sub of sublocations){
                    if(sub.location_id == diag.building_id){
                        sub['evac_diagrams'].push(diag);
                    }
                }
            }

            for(let sub of sublocations){
                sub['evac_diagrams'].reverse();
            }

            for(let sub of sublocations){
                for(let diag of sub['evac_diagrams']){
                    total_diagrams++;
                    let validTillMoment = moment(diag['valid_till'], ['DD/MM/YYYY']);
                    diag['valid'] = false;
                    if ( validTillMoment.diff(today, 'days') > 0 ) {
                        valids++;
                        diag['valid'] = true;
                    }
                    diag['timestamp_formatted'] = (moment(diag.timestamp_formatted).isValid()) ? moment(diag.timestamp_formatted).format('DD/MM/YYYY') : '00/00/0000';
                }
            }

            if(total_diagrams > 0){
                response.data.percentage = Math.round( ( valids / total_diagrams ) * 100) + '%' ;
            }

            response.data.total_diagrams = total_diagrams;
            response.data.total_valid_diagrams = valids;
        }catch(e){}

        response.data['percentage_number'] = parseInt(response.data.percentage.replace('%', '').trim());

        response.data.sublocations = sublocations;

        res.status(200).send(response);
    }

}
