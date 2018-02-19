
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
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';

const AWSCredential = require('../config/aws-access-credentials.json');
const defs = require('../config/defs.json');
const validator = require('validator');
const md5 = require('md5');

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
  }

  public downloadDocumentCompliancePack(req: AuthRequest, res: Response, next: NextFunction) {

    const utils = new Utils();
    const config = {
      'accessKeyId': 'AKIAJUJLEWVLRT5KUU4A',
      'secretAccessKey': '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',
      'region': 'us-east-1',
      'bucket': 'allan-delfin'
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
			locationModel = new Location(),
			locAccModel = new LocationAccountRelation(),
			complianceModel = new ComplianceModel(),
			kpisModel = new ComplianceKpisModel(),
			complianceDocsModel = new ComplianceDocumentsModel(),
			arrWhereKPIS = [],
			arrWhereCompliance = [],
			locAcc = await locAccModel.getLocationAccountRelation({
				'location_id' : locationID,
				'account_id' : accountID
			}),
      responsibility = '';
      const utils = new Utils();
      let paths;
      try {
         paths = await utils.s3DownloadFilePathGen(accountID, locationID);
      } catch(e) {
        paths = [];
      }

      console.log(paths);

		for(let i in locAcc){
			if(locAcc[i]['location_id'] == locationID){
				responsibility = locAcc[i]['responsibility'];
			}
		}

		arrWhereKPIS.push([' description IS NOT NULL ']);
		let kpis =  await kpisModel.getWhere(arrWhereKPIS),
			kpisIds = [],
			noCompliancesIds = [];

		for(let i in kpis){
			kpisIds.push(kpis[i]['compliance_kpis_id']);
			noCompliancesIds.push(kpis[i]['compliance_kpis_id']);
		}

		arrWhereCompliance.push(['compliance_kpis_id IN ('+kpisIds.join(',')+')']);
		arrWhereCompliance.push(['building_id = '+locationID]);
		arrWhereCompliance.push(['account_id = '+accountID]);
		arrWhereCompliance.push(['account_role = "'+responsibility+'"']);

		let compliances = <any> await complianceModel.getWhere(arrWhereCompliance); // console.log(compliances);
		for(let i in kpis){
			let hasKpis = false;
			for(let c in compliances){
				if(compliances[c]['compliance_kpis_id'] == kpis[i]['compliance_kpis_id']){
					hasKpis = true;
				}
			}

			if(!hasKpis){
				let createComplianceModel = new ComplianceModel(),
					compObj = {
						'compliance_kpis_id' : kpis[i]['compliance_kpis_id'],
						'compliance_status' : 0,
						'building_id' : locationID,
						'account_id' : accountID,
						'valid_till' : null,
						'required' : 1,
						'account_role' : responsibility,
						'override_by_evac' : 0
					};
				await createComplianceModel.create(compObj);
				compObj['compliance_id'] = createComplianceModel.ID();
				compliances.push(compObj);
			}
		}

		let whereDocs = [];
		whereDocs.push(['building_id = '+locationID]);
		whereDocs.push(['account_id = '+accountID]);
		whereDocs.push(['document_type = "Primary" ']);
		whereDocs.push(['override_document = -1 ']);
		let docs = await complianceDocsModel.getWhere(whereDocs);

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


		for(let c in compliances){
			compliances[c]['measurement'] = compliances[c]['kpis']['measurement'];

			let m = compliances[c]['measurement'],
				validTillMoment = moment(compliances[c]['valid_till']);

			compliances[c]['valid_till'] = (validTillMoment.isValid()) ? validTillMoment.format('DD/MM/YYYY') : null;

			if(m == 'Traffic' || m == 'evac'){
				if(compliances[c]['docs'][0] && validTillMoment.isValid()){
					let timeStamp = moment(compliances[c]['docs'][0]['timestamp']),
						today = moment(),
						validityInMonths = compliances[c]['kpis']['validity_in_months'];

					// dateOfActivity.add(validityInMonths, "months");

					// compliances[c]['valid_till'] = dateOfActivity.format('MMM. DD, YYYY');

					if( validTillMoment.isSameOrBefore(today) === false ){
						let daysDiffFromNow = validTillMoment.diff(today, 'days'),
							daysDiffOfNowAndTimeStamp = today.diff(timeStamp, 'days'),
							decrease = daysDiffFromNow - daysDiffOfNowAndTimeStamp,
							percentage = (decrease / daysDiffOfNowAndTimeStamp) * 100;

						compliances[c]['validity_percentage'] = 100 - Math.round(percentage);
						compliances[c]['compliance_status'] = 1;
					}else{
						compliances[c]['validity_percentage'] = 0;
						compliances[c]['compliance_status'] = 2;
					}
				}
			}else if(m == 'Precent'){
				// 6 Warden Training
				// 8 General Occupant
				// 11 General Occupant
			}
		}


		this.response.status = true;
		this.response.data = compliances;

		res.statusCode = 200;
		res.send(this.response);

	}

}
