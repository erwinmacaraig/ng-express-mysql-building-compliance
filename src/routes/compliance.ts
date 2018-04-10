

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
			arrWhere = [];

		arrWhere.push([' description IS NOT NULL ']);

		this.response.status = true;
		this.response.data = await kpisModel.getWhere(arrWhere);

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
            paths;


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
            emrolesOnThisLocation = await locationModel.getEMRolesForThisLocation(0, 0);
            if ('8' in emrolesOnThisLocation) {
                if (emrolesOnThisLocation['8']['location'].length > 0) {
                    let locId;
                    for (let i = 0; i < emrolesOnThisLocation['8']['location'].length; i++) {
                        locId = emrolesOnThisLocation['8']['location'][i].toString();
                        if (emrolesOnThisLocation['8'][locId]['users'].length > 0) {
                            emrolesOnThisLocation['8'][locId]['training'] =
                            await training.getEMRUserCertifications(emrolesOnThisLocation['8'][locId]['users']);
                        }
                    }
                }
            }

            if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation) {
                // console.log(emrolesOnThisLocation['9']);
               
                if (emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length > 0) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location']);

                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['users']);
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

            if ('12' in emrolesOnThisLocation) {
                // console.log(emrolesOnThisLocation['12']);
                if (emrolesOnThisLocation['12']['location'].length > 0) {
                    let locId;
                    for (let i = 0; i < emrolesOnThisLocation['12']['location'].length; i++) {
                        locId = emrolesOnThisLocation['12']['location'][i].toString();
                        if (emrolesOnThisLocation['12'][locId]['users'].length > 0) {
                            emrolesOnThisLocation['12'][locId]['training'] =
                            await training.getEMRUserCertifications(emrolesOnThisLocation['12'][locId]['users']);
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
        let kpis =  await kpisModel.getWhere(arrWhereKPIS),
            kpisIds = [],
            noCompliancesIds = [];

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

        whereDocs.push(['building_id = ' + locationID]);
        whereDocs.push(['account_id = ' + accountID]);
        whereDocs.push(['document_type = "Primary" ']);
        whereDocs.push(['override_document = -1 ']);
        docs = await complianceDocsModel.getWhere(whereDocs);

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
                    if ('9' in emrolesOnThisLocation) {
                        comp['total_personnel'] = comp['warden_total'] = emrolesOnThisLocation['9']['count'];
                        comp['location_details'] = emrolesOnThisLocation[9];
                        try {
                            comp['total_personnel_trained'] = await training.getEMRUserCertifications(emrolesOnThisLocation['9']['users']);
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
                    // comp['total_personnel'] = comp['warden_total'] = ('9' in emrolesOnThisLocation) ? emrolesOnThisLocation['9']['count'] : 0;
                break;
            
                case 8:
                    // General Occupant Training
                    if ('8' in emrolesOnThisLocation) {
                        comp['total_personnel'] = comp['general_occupant_total'] = emrolesOnThisLocation['8']['count'];
                        comp['location_details'] = emrolesOnThisLocation[8];
                        try {
                            comp['total_personnel_trained'] = await training.getEMRUserCertifications(emrolesOnThisLocation['8']['users']);
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
                    // comp['total_personnel'] = comp['general_occupant_total'] = ('8' in emrolesOnThisLocation) ? emrolesOnThisLocation['8']['count'] : 0;
                break;

                case 12:
                    // Chief Warden Training
                    if ('12' in emrolesOnThisLocation) {
                        comp['total_personnel'] =  comp['chief_warden_total'] = emrolesOnThisLocation['12']['count'];
                        comp['location_details'] = emrolesOnThisLocation[11];
                        try {
                            comp['total_personnel_trained'] = await training.getEMRUserCertifications(emrolesOnThisLocation['12']['users']);
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

        }


		this.response.status = true;
		this.response.data = compliances;

		res.statusCode = 200;
		res.send(this.response);

	}

}
