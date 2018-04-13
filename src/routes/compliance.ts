

import { Account } from '../models/account.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
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
        new ComplianceRoute().getLocationsLatestCompliance(req, res, next);
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

	public async getLocationsLatestCompliance(req: AuthRequest, res: Response, next: NextFunction) {
		let locationID = req.body.location_id,
			accountID = req.user.account_id,
			locAccModel = new LocationAccountRelation(),
			complianceModel = new ComplianceModel(),
			kpisModel = new ComplianceKpisModel(),
			complianceDocsModel = new ComplianceDocumentsModel(),
			arrWhereKPIS = [],
			arrWhereCompliance = [],
            emrolesOnThisLocation,
            paths,
            evacDiagramId = 5;

        // Retrieve the highest account role
        let role = 0;
        const userRoleRelObj = new UserRoleRelation();
        try {
          role = await userRoleRelObj.getByUserId(req.user.user_id, true, locationID);
        } catch (e) {
          console.log(e);
          role = 0;
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
                if (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'].length > 0) {
                    let locId;
                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'], {
                                'em_role_id': defs['em_roles']['GENERAL_OCCUPANT']
                              }
                            );
                        }
                    }
                }
            }

            if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation) {

                if (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length > 0) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location']);

                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'], {'em_role_id': defs['em_roles']['WARDEN']});
                            // console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']);
                        }
                        if (locId in calcResults) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] =
                            calcResults[locId]['total_estimated_wardens'];
                        } else {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] = 0;
                        }
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                        (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] >=
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens']) ?
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']]['count'] :
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'];

                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                        Math.round( emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] / emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] ) * 100;

                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'].toString() + '%';
                    }
                } else { // there is no  warden assigned to the selected location

                }
            }

            // Floor Warden
            if (defs['em_roles']['FLOOR_WARDEN'] in emrolesOnThisLocation) {
              let locId;
              for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['location'].length; i++) {
                locId = emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['location'][i].toString();
                const floorwardens = [];
                if (emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'].length > 0) {
                  // loop through the users because the training for floor warden and warden is the same
                  // so we do not count
                  for (let counter = 0;
                    counter < emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'].length; counter++) {
                    if (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].indexOf(emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'][counter]) == -1) {
                      floorwardens.push(emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['users'][counter]);

                    }
                  }
                  emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'] =
                    emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].concat(floorwardens);
                  emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training'] =
                  await training.getEMRUserCertifications(floorwardens, {'em_role_id': defs['em_roles']['FLOOR_WARDEN']});
                }
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_floor_wardens'] =
                   emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['count'];
              }
              // console.log((defs['em_roles']['WARDEN'] in emrolesOnThisLocation && (locId in emrolesOnThisLocation[defs['em_roles']['WARDEN']])));
              if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation && (locId in emrolesOnThisLocation[defs['em_roles']['WARDEN']])) {



                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] +
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'];

                // console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]);
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] =
                  emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] +
                  emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                  Math.round( emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] / emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] ) * 100;

                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'].toString() + '%';
              } else {
                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_wardens'] =
                    emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_passed'] =
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'];

                emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['percentage'] =
                Math.round( emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_passed'] / emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_wardens'] ) * 100;

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
        arrWhereCompliance.push(['account_id = ' + accountID]);

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
        for(let d of docs){
            d.timestamp_formatted = (moment(d.timestamp_formatted).isValid()) ? moment(d.timestamp_formatted).format('DD/MM/YYYY') : '00/00/0000';
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
            comp['days_remaining']= 0;

            if (m === 'Traffic' || m === 'evac') {

                if(comp['docs'][0]){
                    validTillMoment = moment(comp['docs'][0]['valid_till'], ['DD/MM/YYYY']);
                }

                if (comp['docs'][0] && validTillMoment.diff(today, 'days') > 0) {
                    comp['validity_status'] = 'valid';
                    comp['days_remaining'] = validTillMoment.diff(today, 'days');
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

            comp['total_personnel'] = 0;
            comp['total_personnel_trained'] = {
                'total_passed' : 0,
                'passed': [],
                'failed': []
            };
            comp['percentage'] = '0%';

            switch(comp['compliance_kpis_id']) {
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
                            tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            comp['percentage'] = tempPercetage + '%';
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
                      for (const u of emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['users']) {
                        if (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'].indexOf(u) === -1) {
                          floorwardens.push(u);
                        }
                      }
                      emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'] =
                        emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users'].concat(floorwardens);
                      comp['total_personnel'] += floorwardens.length;
                      try {
                        const floorwardentrained  = await training.getEMRUserCertifications(floorwardens,
                        {'em_role_id':  defs['em_roles']['FLOOR_WARDEN']});
                        comp['total_personnel_trained']['total_passed'] +=
                        floorwardentrained['total_passed'];

                        tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                        comp['percentage'] = tempPercetage + '%';
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
                comp['total_valid_diagrams'] = valids;
                comp['total_diagrams'] = diagrams.length;
            }

            comp['percentage_number'] = parseInt(comp['percentage'].replace('%', '').trim());

        }


		this.response.status = true;
		this.response.data = compliances;

		res.statusCode = 200;
		res.send(this.response);

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
