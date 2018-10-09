

import { Account } from '../models/account.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
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
import { EpcMinutesMeeting } from './../models/epc.meeting.minutes';
import { UtilsSync } from '../models/util.sync';
import { PaperAttendanceDocumentModel } from '../models/paper.attendance.doc.model';
import {EmailSender} from '../models/email.sender';
import * as moment from 'moment';
// import * as AWS from 'aws-sdk';
import * as fs from 'fs';
const archiver = require('archiver');


const AWSCredential = require('../config/aws-access-credentials.json');
const defs = require('../config/defs.json');

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

        router.get('/compliance/paginate-all-locationids', new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
            new ComplianceRoute().paginateAllLocationIds(req, res);
        });

        router.post('/compliance/total-compliance-rating-by-location',
        new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
            new ComplianceRoute().totalComplianceRatingByLocationIds(req, res);
        });

        router.get('/compliance/download-compliance-documents-pack/',
        new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
            new ComplianceRoute().downloadDocumentCompliancePack(req, res, next);
        });

        router.get('/compliance/download-compliance-file/',
            new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
            const fname = decodeURIComponent(req.query.fname);
            const key = decodeURIComponent(req.query.keyname);
            const utils = new Utils();
            utils.getAWSSignedURL(key).then((signedUrl) => {
                res.set(
                    'Content-Disposition',
                    `attachment; filename=${fname}`
                );
                request(signedUrl).pipe(res);

            }).catch((e) => {
                console.log(e);
                const opts = {
                    from : '',
                    fromName : 'EvacConnect',
                    to : ['jmanoharan@evacgroup.com.au', 'adelfin@evacgroup.com.au', 'emacaraig@evacgroup.com.au'],
                    cc: [],
                    body : `This key 
                    ( ${key} ) 
                    is being downloaded but was not found in the server`,
                    attachments: [],
                    subject : 'EvacConnect Email Notification'
                };
                const email = new EmailSender(opts);
                email.send(
                    (data) => {
                        console.log('Email sent successfully');					
                    },
                    (err) => console.log(err)
                );
                res.status(400).send({
                    message: `${fname} not found`
                });
            });

            /*
            const uploader = new FileUploader(req, res, next);
            uploader.getFile().then((data) => {
                res.end();
            });
            */


        });

        router.post('/compliance/toggleTPRViewAccess/',
            new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
              const compliance_documents_id = ('compliance_documents_id' in req.body) ? req.body.compliance_documents_id : 0;
              const viewable_by_trp = ('viewable_by_trp' in req.body) ? (req.body.viewable_by_trp) ? 1 : 0 : 0;
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

        router.post('/compliance/save-epc-minutes-of-meeting', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ComplianceRoute().saveEpcMinutesOfMeeting(req, res);
        });

        router.post('/compliance/evac-exercise-completed', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ComplianceRoute().evacExerciseCompleted(req, res);
        });

        router.post('/compliance/fire-safety-completed', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
            new ComplianceRoute().fireSafetyCompleted(req, res);
        });

        router.post('/compliance/retrieve-paper-attendance-file-records/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
            new ComplianceRoute().getPaperAttendanceRecord(req, res, next);
        });
    }

    public async getPaperAttendanceRecord(req: AuthRequest, res: Response, next: NextFunction) {
        //
        const location = req.body.location;
        const recordObj = new PaperAttendanceDocumentModel();
        const attendanceFile: Array<object> = await recordObj.getPaperAttendanceRecordByLocation(location);
        const utils = new Utils();
        const keyPrefix = 'paper_attendance/';
        const attendanceRecord = [];
        
        for (let i = 0; i < attendanceFile.length; i++) {
            try {
                let key = keyPrefix + attendanceFile[i]['strOriginalfilename'];
                attendanceFile[i]['downloadUrl'] = '';
                attendanceFile[i]['downloadUrl'] = await utils.getAWSSignedURL(key);                
                attendanceRecord.push(attendanceFile[i]);
            } catch(e) {
                  console.log(e);
                 
                  continue;
              }
        }
        return res.status(200).send({
            attendance_record: attendanceRecord
        });

    }

    public async downloadDocumentCompliancePack(req: AuthRequest, res: Response, next: NextFunction) {

        const utils = new Utils();
        let locationNameForDirName = '';
        
        let location_id = req.query.location_id;
        const locationObj = new Location(req.query.location_id);
        const locationData = await locationObj.load();
        const sublocations = await locationObj.getChildren(locationObj.ID());
        
        const sublocationsArray = [];
        sublocationsArray.push(locationObj.ID());
     
        for (const sublocation of sublocations) {
            sublocationsArray.push(sublocation['location_id']);
        }
        
        locationNameForDirName = locationData['location_directory_name'];
        if (locationData['is_building'] != 1) {
            // get immediate parent
            location_id = locationData['parent_id'];
            const building_dbData = await new Location(locationData['parent_id']).load();
            locationNameForDirName = building_dbData['location_directory_name'];
        }         
        
        try {
            fs.mkdirSync(__dirname + `/../public/temp/${locationNameForDirName}`);
        } catch(e) {
            console.log(e);
            console.log(`${locationNameForDirName} already exists`);
        }
        const complianceDocsModel = new ComplianceDocumentsModel();
        
        const whereDocs = [];
        let docs = <any>[];       

        const locationIds = sublocationsArray.join(',');
        whereDocs.push([`compliance_documents.building_id IN (${locationIds})`]);
        whereDocs.push([`compliance_documents.document_type = 'Primary' `]);
        docs = await complianceDocsModel.getWhere(whereDocs);
        let totalDocs = 0;
       
        for(let d of docs) {
            let p = await new UtilsSync().getAccountUploadDir(
                d['account_id'],
                d['building_id'],
                d['compliance_kpis_id']
            );
            p = p + d['file_name'];
                                 
            const dirPath = __dirname + `/../public/temp/${locationNameForDirName}/${d['file_name']}`;
            try {
                await utils.getMultipleFilesFromS3(dirPath, p);
                totalDocs++;
            } catch (e) {
                console.log(e);
                console.log(`Key: ${p}`);
            }
            
        }
        try {
            await utils.zipDirectory(__dirname + `/../public/temp/${locationNameForDirName}`, __dirname + `/../public/temp/${locationNameForDirName}.zip`);
            return res.download(__dirname + `/../public/temp/${locationNameForDirName}.zip`, (error) => {
                if (error) {
                  console.log(error);
                  return res.status(400).send({
                      message: 'Internal error',
                      data: error
                  });
                } 
              });
        } catch(e) {
            console.log(e);
        }
        
                
         
            

        
        
        
        /*
        for (let p in paths) {
            console.log(paths[p]);
            const parts = paths[p].split('/');
            const dirPath = __dirname + `/../public/temp/${locationNameForDirName}/${parts[parts.length - 1]}`;
            const params = {
                Bucket:  AWSCredential.AWS_Bucket,
                Key: paths[p]
              };
            const file_stream = fs.createWriteStream(dirPath);
            file_stream.on('finish', () => {
                console.log(`${parts[parts.length - 1]} has been written to disk`);
            });
        }
        */
        

        /*
        const config = {
          'accessKeyId': AWSCredential.AWSAccessKeyId,
          'secretAccessKey': AWSCredential.AWSSecretKey,
          'region': AWSCredential.AWS_REGION,
          'bucket': AWSCredential.AWS_Bucket
        };
        const zipper = new S3Zipper(config);
        const dirPath = __dirname + '/../public/temp';
        const urlPath = await new UtilsSync().getAccountUploadDir(req.user.account_id, req.query.location_id, 0, '' ,true);
        zipper.zipToFile({
            's3FolderName': urlPath,
            'startKey': null,
            'zipFileName': `${dirPath}/${defs['COMPLIANCE-DOCS-PACK']}`,
            'recursive': true
          }, (err, result) => {
            if (err) {
              console.log(err);
              // throw new Error(err);
              return res.status(400).send({
                  message: 'Unexpected error',
                  data: err
              });
            } else if (result.zippedFiles.length == 0) {
                return res.status(400).send({
                    message: 'No files available for download'
                });
            } else {                
              const lastFile = result.zippedFiles[result.zippedFiles.length-1];
              const filePath = `${dirPath}/${defs['COMPLIANCE-DOCS-PACK']}`;
              return res.download(filePath, (error) => {
                if (error) {
                  console.log(error);
                  return res.status(400).send({
                      message: 'Internal error',
                      data: error
                  });
                } 
              });
            }
          });
        
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
              const filePath = `${dirPath}/${defs['COMPLIANCE-DOCS-PACK']}`;
              return res.download(filePath, (error) => {
                if (error) {
                  console.log(error);
                  return res.status(400).send(error);
                } else {
                  /*
                  fs.unlink(filePath, function(e){
                    console.log('Cannot delete file.', e);
                  });
                  
                }
              });
            }
          });
        }).catch((e) => {
            console.log('Error at compliance.downloadDocumentCompliancePack()', e);
            return res.status(400).send({
                message: 'Cannot download compliance pack'
            });
        }); */
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
        let 
        locationID = (formData) ? formData.location_id : req.body.location_id,
        accountID = (req.body.account_id) ? req.body.account_id : req.user.account_id,
        userId = req.user.user_id,
        accountModel = new Account(accountID),
        locAccModel = new LocationAccountRelation(),
        complianceModel = new ComplianceModel(),
        kpisModel = new ComplianceKpisModel(),
        complianceDocsModel = new ComplianceDocumentsModel(),
        arrWhereKPIS = [],
        arrWhereCompliance = [],
        emrolesOnThisLocation = {},
        getEpcData = (formData) ? (formData.getEpcData) ? formData.getEpcData : true : true,
        paths,
        epcMeetingId = 2,
        evacDiagramId = 5,
        evacExerId = 9,
        epmId = 4,
        sundryId = 13,
        fsaId = 3,
        account = <any> (formData) ? (formData.account) ? formData.account : {} : {},
        epcCommitteeOnHQ = false,
        kpis = (formData) ? (formData.kpis) ? formData.kpis : [] : [],
        kpisIds = [],
        role = (formData) ? (formData.role > 0) ? formData.role : 0 : false,
        userRoleRelObj = new UserRoleRelation(),
        relateToSiblingsCompliance = false,
        locSiblings = [],
        locSiblingsIds = [],
        locAccSiblingsModel = new LocationAccountRelation(),
        kpisIdForSiblingsRelated = [];

        this.response = { status : false, data : <any>[], message : '' };

        /*
        ** New Compliance Percentage Computation Based On User's Role
        ** Indexed with KPIS IDS
        */
        let
        frpRates = {
            2 : { kpis : 'EPC Meeting', valid : 10, no_docs : 0, expired_docs : 5, epc_headoffice_points : 10 },
            3 : { kpis : 'Fire Safety Advisor', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 20, no_docs : 0, expired_docs : 15, epc_headoffice_points : 20 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 20, no_docs : 0, expired_docs : 15, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        trpRates = {
            2 : { kpis : 'EPC Meeting', valid : 0, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            3 : { kpis : 'Fire Safety Advisor', valid : 15, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 20, no_docs : 0, expired_docs : 15, epc_headoffice_points : 20 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 25, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 10, no_docs : 0, expired_docs : 5, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 0, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        trpWholeOcccupierRates = {
            2 : { kpis : 'EPC Meeting', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 5 },
            3 : { kpis : 'Fire Safety Advisor', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            4 : { kpis : 'Emergency Procedures Manual', valid : 15, no_docs : 0, expired_docs : 10, epc_headoffice_points : 15 },
            5 : { kpis : 'Evac Diagram', valid : 5, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            6 : { kpis : 'Warden Training', valid : 20, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            8 : { kpis : 'General Occupant Training', valid : 15, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 },
            9 : { kpis : 'Evacuation Exercise', valid : 20, no_docs : 0, expired_docs : 15, epc_headoffice_points : 20 },
            12 : { kpis : 'Chief Warden Training', valid : 10, no_docs : 0, expired_docs : 0, epc_headoffice_points : 0 }
        },
        locAccUserModel = new LocationAccountUser(),
        locModel = new Location(locationID),
        loc = <any> (formData) ? (formData.location) ?  formData.location : {} :  {},
        userComplianceRole = '',
        userLocationData = <any> {},

        isWholeBuildingOccupier = false,
        rates = JSON.parse(JSON.stringify(frpRates)),
        theBuilding = <any>{
            location_id : -1
        },
        locSubModel = new Location(),
        subs = <any> [],
        subIds = [0],
        deepLocModel = new Location(),
        deepLocs = [],
        deepLocIds = [],
        locAccRoleDb = [],
        locAccRole = '';

        locAccRoleDb = await locAccModel.getByAccountIdAndLocationId(accountID, locationID);
        for(let loc of locAccRoleDb){
            if(loc['responsibility'] == 'Manager' &&  (locAccRole.trim().length > 0 || locAccRole.trim() != 'Manager') && loc['responsibility'] != null){
                locAccRole = loc['responsibility'];
            }else if(locAccRole.trim().length == 0 && loc['responsibility'] != null){
                locAccRole = loc['responsibility'];
            }
        }

        this.response['locAccRole'] = locAccRole;

        try{
            theBuilding = await locModel.getTheParentOrBuiling(locationID);
            locationID = theBuilding.location_id;
        }catch(e){
            try{
                loc = await locModel.load();
                theBuilding = loc;
            }catch(ex){}
        }

        try{
            subs = await locSubModel.getWhere([ 'parent_id = '+ locationID + ' AND archived = 0' ]);
        }catch(e){}

        for(let sub of subs){
            subIds.push(sub.location_id);
        }

        deepLocs = <any> await deepLocModel.getDeepLocationsByParentId(locationID);

        for(let deep of deepLocs){
            deepLocIds.push(deep.location_id);
        }

        this.response['deepLocs'] = deepLocs;
        this.response['location_data'] = theBuilding;
        this.response['location_id'] = theBuilding.location_id;
        if(kpis.length == 0){
            arrWhereKPIS.push([' description IS NOT NULL ']);
            kpis =  <any> await kpisModel.getWhere(arrWhereKPIS);
        }

        try{
            if(Object.keys(account).length == 0){
                account = await accountModel.load();
                epcCommitteeOnHQ = (account.epc_committee_on_hq == 1) ? true : false;
            }
        }catch(e){}

        this.response['user'] = req.user;
        if(!role && req.user.evac_role != 'admin'){
            try {
                role = await userRoleRelObj.getByUserId(userId, true, locationID);
            } catch (e) {
                try {
                    role = await userRoleRelObj.getByUserId(userId, true);
                } catch (err) {
                    console.log(err);
                    role = 0;
                }
            }
        }

        if(req.user.evac_role == 'admin'){
            role = 1;
        }

        if(role == 2){
            relateToSiblingsCompliance = true;
            locSiblings = <any> await locAccSiblingsModel.getLoctionSiblingsOfTenantRealtedToAccountAndLocation(accountID, locationID);
            for(let loc of locSiblings){
                locSiblingsIds.push(loc.location_id);
            }
            kpisIdForSiblingsRelated.push(epcMeetingId);
            kpisIdForSiblingsRelated.push(fsaId);
            kpisIdForSiblingsRelated.push(evacExerId);
            kpisIdForSiblingsRelated.push(epmId);
        }

        this.response['building'] = theBuilding;
        this.response['role'] = role;
        
        const 
        utils = new Utils(),
        training = new TrainingCertification(),
        locationModel = new Location(locationID),
        wardenCalc = new WardenBenchmarkingCalculator();       

        let
        sublocsids = [],
        subLocsModel = new Location(),
        sublocs = (role == 1) ? <any> await subLocsModel.getChildren(locationID) : <any> await subLocsModel.getChildrenTenantRelated(locationID, accountID);

        for(let sub of sublocs){
            sublocsids.push(sub.location_id);
        }

        this.response['sublocsids'] = sublocsids;

        try {
            let isAllLocId = true,
                emRolesLocationId = sublocsids.join(',');

            emRolesLocationId += ','+locationID;

            if(sublocsids.length > 0){
                emrolesOnThisLocation = await locationModel.getEMRolesForThisLocation(0, emRolesLocationId, role, isAllLocId);
            }else{
                emrolesOnThisLocation = await locationModel.getEMRolesForThisLocation(0, locationID, role, isAllLocId);
            }

            if (defs['em_roles']['GENERAL_OCCUPANT'] in emrolesOnThisLocation) {
                for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'].length; i++) {
                    let locId = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['location'][i].toString();
                    if (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'].length > 0) {
                        emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training'] =
                        await training.getEMRUserCertifications(
                          emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'],
                          {
                            'em_role_id': defs['em_roles']['GENERAL_OCCUPANT'],
                            'location': locId
                        });
                    }

                    emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training']['percentage'] =
                    Math.round(
                      (emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training']['total_passed'] /
                      emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['users'].length) * 100 );

                    emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training']['percentage'] =
                    emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']][locId]['training']['percentage'].toString() + '%';
                }
            }

            if (defs['em_roles']['WARDEN'] in emrolesOnThisLocation) {

                if ('location' in emrolesOnThisLocation[defs['em_roles']['WARDEN']]) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(
                      emrolesOnThisLocation[defs['em_roles']['WARDEN']]['location']);

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
                        }
                        if (locId in calcResults) {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] =
                            calcResults[locId]['total_estimated_wardens'];
                        } else {
                            emrolesOnThisLocation[defs['em_roles']['WARDEN']][locId]['training']['total_estimated_wardens'] = 0;
                        }

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

                  }
                }
                emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']][locId]['training']['total_floor_wardens'] =
                   emrolesOnThisLocation[defs['em_roles']['FLOOR_WARDEN']]['users'].length;
              }

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
            
            if (defs['em_roles']['CHIEF_WARDEN'] in emrolesOnThisLocation ||
                defs['em_roles']['DEPUTY_CHIEF_WARDEN'] in emrolesOnThisLocation) {

                if ('location' in emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(
                      emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location']);

                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['users']
                            );
                        }

                        if (locId in calcResults) {
                            emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['total_estimated_wardens'] =
                            calcResults[locId]['total_estimated_wardens'];
                        } else {
                            emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['total_estimated_wardens'] = 0;
                        }

                        emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['percentage'] =
                        Math.round(
                          (emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['total_passed'] /
                          emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['users'].length) * 100 );

                        emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['percentage'] =
                        emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']][locId]['training']['percentage'].toString() + '%';
                    }
                } else if ('location' in emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]) {
                    let locId;
                    const calcResults = await wardenCalc.getBulkBenchmarkingResultOnLocations(
                      emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['location']);
                    
                    for (let i = 0; i < emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['location'].length; i++) {
                        locId = emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['location'][i].toString();
                        if (emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['users'].length > 0) {
                            emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training'] =
                            await training.getEMRUserCertifications(
                              emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['users']
                            );
                        }
                    }

                    if (locId in calcResults) {
                        emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['total_estimated_wardens'] =
                        calcResults[locId]['total_estimated_wardens'];
                    } else {
                        emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['total_estimated_wardens'] = 0;
                    }

                    emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['percentage'] =
                    Math.round(
                      (emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['total_passed'] /
                      emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['users'].length) * 100 );

                    emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['percentage'] =
                    emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']][locId]['training']['percentage'].toString() + '%';
                } else {
                    console.log('There is no chief warden assigned to this location');
                }
            }

            // console.log(emrolesOnThisLocation);
        } catch (e) {
            console.log(e);
            emrolesOnThisLocation = {};
        }

        for(let kpi of kpis){
            if(kpi.compliance_kpis_id == evacDiagramId){
                kpi['measurement'] = 'Precent';
            }
        }

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
        });

        arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
        arrWhereCompliance.push(['building_id = ' + locationID]);
        arrWhereCompliance.push(['account_id = ' + accountID + ' GROUP BY compliance_kpis_id' ]);

        let
        compliances = [],
        hasCompliancesFormData = false;

        if(formData){
            if(formData.compliances){
                compliances = formData.compliances;
                hasCompliancesFormData =  true;
            }
        }

        if(!hasCompliancesFormData){
            compliances = <any> await complianceModel.getWhere(arrWhereCompliance);
        }

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
            docs = <any> [],
            docsLocIds = JSON.parse(JSON.stringify(sublocsids));

        docsLocIds.push(locationID);

        whereDocs.push(['compliance_documents.building_id IN (' + docsLocIds.join(',') + ')' ]);
        whereDocs.push(['compliance_documents.document_type = "Primary" ']);
        whereDocs.push(['compliance_documents.account_id = '+accountID+' ']);
        docs = await complianceDocsModel.getWhere(whereDocs);
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

        this.response['docs'] = docs;

        for(let d of docs){
            d.timestamp_formatted = (moment(d.timestamp_formatted).isValid()) ? moment(d.timestamp_formatted).format('DD/MM/YYYY') : '00/00/0000';
            try {
                paths = await utils.s3DownloadFilePathGen(d['account_id'], d['building_id']);
            } catch (e) {
                paths = [];
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
                    if( docs[d]['compliance_kpis_id'] == epmId ){
                        if( docs[d]['building_id'] != theBuilding.location_id && role != 2 ){
                            compliances[c]['docs'].push(docs[d]);
                        }
                    }else{
                        compliances[c]['docs'].push(docs[d]);
                    }
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
                }  else if (comp['docs'][0]) {
                    comp['validity_status'] = 'invalid';
                }

            } else if (m === 'Percent') {
                // 6 Warden Training
                // 8 General Occupant
                // 11 General Occupant
            }
            let tempPercetage = 0;
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
                      // console.log(emrolesOnThisLocation[defs['em_roles']['WARDEN']]['users']);
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
                        comp['validity_status'] = 'valid';
                    }else if(tempPercetage > 0){
                        comp['validity_status'] = 'invalid';
                    }
                break;

                case 8:
                    // General Occupant Training
                    if (defs['em_roles']['GENERAL_OCCUPANT'] in emrolesOnThisLocation) {

                        comp['total_personnel'] = comp['general_occupant_total'] = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['count'];
                        comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']];

                        for (const loc of comp['location_details']['location']) {

                        }

                        try {
                            comp['total_personnel_trained'] = await training.getEMRUserCertifications( emrolesOnThisLocation[defs['em_roles']['GENERAL_OCCUPANT']]['users'], {'em_role_id': defs['em_roles']['GENERAL_OCCUPANT']} );
                            tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            comp['percentage'] = tempPercetage + '%';
                            if (tempPercetage >= 100){
                                comp['valid'] = 1;
                                comp['validity_status'] = 'valid';
                            }else if(tempPercetage > 0){
                                comp['validity_status'] = 'invalid';
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
                    // Chief Warden Training & Deputy Chief Warden

                    if (defs['em_roles']['CHIEF_WARDEN'] in emrolesOnThisLocation) {
                        comp['total_personnel'] =  comp['chief_warden_total'] = emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['count'];
                        comp['location_details'] = emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']];
                        try {
                            comp['total_personnel_trained'] =
                              await training.getEMRUserCertifications(
                                emrolesOnThisLocation[defs['em_roles']['CHIEF_WARDEN']]['users'],
                                {'em_role_id': defs['em_roles']['CHIEF_WARDEN']}
                            );

                            /* If 1 Chief warden passed the training, this compliance is valid */
                            if( comp['total_personnel_trained']['total_passed'] > 0 ){
                                tempPercetage = 100;
                                comp['validity_status'] = 'valid';
                            }

                            // tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            comp['percentage'] = tempPercetage + '%';
                            if(tempPercetage >= 100){
                                comp['valid'] = 1;
                                comp['validity_status'] = 'valid';
                            }else if(tempPercetage > 0){
                                comp['validity_status'] = 'invalid';
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

                    if (defs['em_roles']['DEPUTY_CHIEF_WARDEN'] in emrolesOnThisLocation) {
                        if(comp['total_personnel'] == null || comp['total_personnel'] == ''){
                            comp['total_personnel'] = 0;
                            comp['chief_warden_total'] = 0;
                        }

                        comp['total_personnel'] +=  emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['count'];
                        comp['chief_warden_total'] +=  emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['count'];
                        try {
                            let deputyTrained =
                                await training.getEMRUserCertifications(
                                    emrolesOnThisLocation[defs['em_roles']['DEPUTY_CHIEF_WARDEN']]['users'],
                                    {'em_role_id': defs['em_roles']['DEPUTY_CHIEF_WARDEN']}
                                );

                            if(comp['total_personnel_trained']['failed']){
                                comp['total_personnel_trained']['failed'] = comp['total_personnel_trained']['failed'].concat(deputyTrained['failed']);
                            }

                            if(comp['total_personnel_trained']['passed']){
                                comp['total_personnel_trained']['passed'] = comp['total_personnel_trained']['passed'].concat(deputyTrained['passed']);
                            }

                            if( deputyTrained['total_passed'] > 0 ){
                                tempPercetage = 100;
                                comp['validity_status'] = 'valid';
                            }

                            // tempPercetage = Math.round((comp['total_personnel_trained']['total_passed'] / comp['total_personnel']) * 100);
                            if(comp['percentage_number'] < 100 || tempPercetage == 100){
                                comp['percentage'] = tempPercetage + '%';
                                if(tempPercetage >= 100){
                                    comp['valid'] = 1;
                                    comp['validity_status'] = 'valid';
                                }else if(tempPercetage > 0){
                                    comp['validity_status'] = 'invalid';
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

                    if(comp['total_personnel_trained']){
                        let percentage = (comp['total_personnel_trained']['passed'].length / comp['total_personnel']) * 100;
                        comp['total_personnel_trained']['percentage'] = Math.round(percentage)+'%';
                        if(percentage > 0){
                            comp['valid'] = 1;
                            comp['validity_status'] = 'valid';
                        }else if(percentage > 0){
                            comp['validity_status'] = 'invalid';
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
                let
                compianceDocsModel = new ComplianceDocumentsModel(),
                diagrams = [],
                docsWhere = [];

                if(subIds.length > 0){
                    docsWhere.push( ['compliance_documents.compliance_kpis_id = '+evacDiagramId] );
                    docsWhere.push( ['compliance_documents.document_type = "Primary" '] );
                    docsWhere.push( ['compliance_documents.building_id IN ('+subIds.join(',')+')'] );
                    diagrams = <any> await compianceDocsModel.getWhere(docsWhere);
                }

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
                    comp['validity_status'] = 'valid';
                }
                comp['total_valid_diagrams'] = valids;
                comp['total_diagrams'] = diagrams.length;
            }

            if(comp.compliance_kpis_id == sundryId){
                let 
                emRoleModel = new UserEmRoleRelation(),
                wardens = [];

                wardens = <any> await emRoleModel.getCountWardensInLocationIds( sublocsids.join(',') );
                comp['num_wardens'] = (wardens[0]) ? wardens[0]['count'] : 0;
            }

            let
            buildingDocs = [],
            kpisIdRef;
            if(comp.compliance_kpis_id == epcMeetingId){
                kpisIdRef = epcMeetingId;
            }else if(comp.compliance_kpis_id == epmId && role == 1){
                kpisIdRef = epmId;
            }else if(comp.compliance_kpis_id == evacExerId){
                kpisIdRef = evacExerId;
            }

            if(kpisIdRef){
                for(let doc of docs){
                    if(doc.building_id == theBuilding.location_id && doc.compliance_kpis_id == kpisIdRef){
                        buildingDocs.push(doc);
                    }
                }

                if(buildingDocs[0] && comp['docs'].length == 0){
                    comp['docs'] = buildingDocs;
                }else if(buildingDocs[0] && comp['docs'].length > 0){
                    let
                    bldg = moment(buildingDocs[0]['valid_till'], ['DD/MM/YYYY']),
                    doc = moment(comp['docs'][0]['valid_till'], ['DD/MM/YYYY']);
                    if(bldg.isAfter(doc)){
                        comp['docs'] = buildingDocs;
                    }
                }

                if (comp['docs'][0]) {
                    comp['validity_status'] = 'invalid';
                    validTillMoment = moment(comp['docs'][0]['valid_till'], ['DD/MM/YYYY']);
                    if (comp['docs'][0] && validTillMoment.diff(today, 'days') > 0) {
                        comp['valid_till'] = (validTillMoment.isValid()) ? validTillMoment.format('DD/MM/YYYY') : '';
                        comp['validity_status'] = 'valid';
                        comp['days_remaining'] = validTillMoment.diff(today, 'days');
                        comp['valid'] = 1;
                        comp['percentage'] = '100%';
                    }
                }

            }

            if(relateToSiblingsCompliance && locSiblingsIds.length > 0){
                if( kpisIdForSiblingsRelated.indexOf( comp.compliance_kpis_id ) > -1 && (comp.compliance_status == 0 ||  validTillMoment.isBefore(today))  ){

                    let
                    sibsComplianceModel = new ComplianceModel(),
                    sibsComplWhere = [];

                    sibsComplWhere.push([ 'account_id = '+accountID ]);
                    sibsComplWhere.push([ 'compliance_kpis_id = '+comp.compliance_kpis_id ]);
                    sibsComplWhere.push([ 'compliance_status = 1 ' ]);
                    sibsComplWhere.push([ 'valid_till >= NOW() ' ]);
                    sibsComplWhere.push([ 'building_id IN ('+locSiblingsIds.join(',')+')' ]);

                    let sibsCompliances = await sibsComplianceModel.getWhere(sibsComplWhere);

                    if(sibsCompliances.length > 0){
                        validTillMoment = moment(sibsCompliances[0]['valid_till']);
                        comp['compliance_status'] = 1;
                        comp['valid_till'] = (validTillMoment.isValid()) ? validTillMoment.format('DD/MM/YYYY') : null;
                    }

                    if(!comp['sibsCompliances']){
                        comp['sibsCompliances'] = [];
                    }else{
                        comp['sibsCompliances'].push(sibsCompliances);
                    }

                    if(comp.compliance_kpis_id == epmId && role == 1){
                        let whereEpm =  [],
                            docsEpm = <any> [];

                        whereEpm.push(['compliance_documents.building_id IN (' + locSiblingsIds.join(',') + ')' ]);
                        whereEpm.push(['compliance_documents.account_id = ' + accountID]);
                        whereEpm.push(['compliance_documents.document_type = "Primary" ']);
                        docsEpm =  await complianceDocsModel.getWhere(whereEpm);

                        docsEpm = docsEpm.sort((a, b) => {
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

                        if(docsEpm.length > 0){
                            comp['docs'] = [];
                            comp['docs'].push(docsEpm[0]);
                        }

                    }
                }
            }

            if(comp.compliance_status == 1){
                comp['validity_status'] = 'valid';
                comp['valid'] = 1;
            }

            comp['percentage_number'] = parseInt(comp['percentage'].replace('%', '').trim());
        }

        try{
            userLocationData = await locAccUserModel.getByLocationIdAndUserId(locationID, userId);
            if(role == 2 && loc.location_id == locationID && (userLocationData[0]['parent_id'] == -1 || userLocationData[0]['is_building'] == 1 ) ){
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

        this.response['epcCommitteeOnHQ'] = epcCommitteeOnHQ;

        if(getEpcData){
            let epcModel = new EpcMinutesMeeting(),
                epcWhere = [],
                epcData = {},
                locIds = [];

            if(relateToSiblingsCompliance){
                for(let loc of locSiblings){
                    locIds.push(loc.location_id);
                }
                locIds = JSON.parse(JSON.stringify(locSiblingsIds));
            }

            locIds.push(locationID);

            epcWhere.push(['location_id IN ( '+locIds.join(',')+')'  ]);
            epcWhere.push(['account_id = '+accountID]);
            await epcModel.getWhere(epcWhere);
            if(epcModel.getDBData()[0]){
                epcData = epcModel.getDBData()[0];
                epcData['data'] = JSON.parse(epcData['data']);
                epcData['date_created_formatted'] = moment(epcData['date_created']).format('DD/MM/YYYY');
                epcData['date_updated_formatted'] = moment(epcData['date_updated']).format('DD/MM/YYYY');
            }

            this.response['epcData'] = epcData;
        }


        for(let comp of compliances){
            let tempPoints = comp.points;
            if( rates[ comp.compliance_kpis_id ] ){
                if(epcCommitteeOnHQ && rates[comp.compliance_kpis_id]['epc_headoffice_points'] > 0 ){
                    tempPoints = rates[comp.compliance_kpis_id]['valid'];
                    comp['validity_status'] = 'valid';
                    comp['valid'] = 1;
                }else{
                    if(comp['validity_status'] == 'valid' || comp['valid'] == 1){
                        tempPoints = rates[comp.compliance_kpis_id]['valid'];
                    }else if( comp['validity_status'] == 'invalid' ){
                        tempPoints = rates[comp.compliance_kpis_id]['expired_docs'];
                    }
                }
            }

            if( (comp.compliance_kpis_id == 8 || comp.compliance_kpis_id == 6 ) && comp['total_personnel_trained']['percentage']){
                let num = comp.percentage_number;
                let ratesValidPnts = rates[comp.compliance_kpis_id]['valid'];
                if(num < 100){
                    tempPoints = ratesValidPnts * parseFloat("0."+num);
                }
            }

            comp['points'] = tempPoints;
        }

        this.response['emrolesOnThisLocation'] = emrolesOnThisLocation;
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
            this.response['percent'] = Math.round((validcount / 100) * 100);
        }

        res.statusCode = 200;

        if(!toReturn){
            res.send(this.response);
        }else{
            let dataReturn = JSON.parse(JSON.stringify(this.response));
            return dataReturn;
        }
    }

    public async paginateAllLocationIds(req: AuthRequest, res: Response, toReturn?){
        let
        response = {
            data : [], status : true
        },
        accountId = req.user.account_id,
        userId = req.user.user_id,
        locAccntRelObj = new LocationAccountRelation(),
        userRoleRel = new UserRoleRelation(),
        r = 0,
        filter = {
            locationIdOnly : true,
            archived : 0
        },
        locations = [],
        locationIds = [],
        compliances = {},
        arrWhereKPIS = [],
        kpis = [],
        locationsPages = [],
        kpisModel = new ComplianceKpisModel(),
        accountModel = new Account(accountId),
        account = await accountModel.load();

        let 
            roles = [],
            isPortfolio = false;

        try {
          roles = await userRoleRel.getByUserId(req.user.user_id, true);
          for(let role of roles){
              if(role['is_portfolio'] == 1){
                  isPortfolio = true;
              }
          }
        } catch(e) { }

        filter['isPortfolio'] = isPortfolio;
        filter['userId'] = userId;

        try {
            r = await userRoleRel.getByUserId(userId, true);
        } catch(e) {
            r = 0;
        }

        filter['responsibility'] = r;

        try{
            locations = await locAccntRelObj.listAllLocationsOnAccount(accountId, filter);
            for(let loc of locations){
                if(!locationIds[ loc.location_id ]){
                    locationIds.push(loc.location_id);
                }
            }
            let ind = 0;
            for(let id of locationIds){
                if(!locationsPages[ind]){ locationsPages[ind] = []; }
                if(locationsPages[ind].length < 100){
                    locationsPages[ind].push(id);
                }else{
                    ind++;
                    locationsPages[ind] = [];
                    locationsPages[ind].push(id);
                }
            }
        }catch(e){}

        response['data'] = locationsPages;
        response['locationIds'] = locationIds;

        if(toReturn){
            return response;
        }else{
            res.send(response);
        }
    }

    public async totalComplianceRatingByLocationIds(req: AuthRequest, res: Response){
        let
        response = {
            data : [], status : true
        },
        accountId = req.user.account_id,
        userId = req.user.user_id,
        locAccntRelObj = new LocationAccountRelation(),
        userRoleRel = new UserRoleRelation(),
        locModel = new Location(),
        r = 0,
        filter = {
            locationIdOnly : true,
            archived : 0
        },
        locations = [],
        locationIds = req.body.ids,
        compliance = {},
        arrWhereKPIS = [],
        kpis = [],
        kpisIds = [],
        locationsPages = [],
        arrWhereCompliance = [],
        kpisModel = new ComplianceKpisModel(),
        accountModel = new Account(accountId),
        account = await accountModel.load(),
        complianceModel = new ComplianceModel();

        arrWhereKPIS.push([' description IS NOT NULL ']);
        kpis =  <any> await kpisModel.getWhere(arrWhereKPIS);

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
        });

        let 
            roles = [],
            isPortfolio = false;

        try {
          roles = await userRoleRel.getByUserId(req.user.user_id, true);
          for(let role of roles){
              if(role['is_portfolio'] == 1){
                  isPortfolio = true;
              }
          }
        } catch(e) { }

        try {
            r = await userRoleRel.getByUserId(userId, true);
        } catch (e) {
            r = 2;
        }

        locations = <any> await locModel.getByInIds(locationIds);

        arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
        arrWhereCompliance.push(['building_id IN ('+locationIds.join(',')+')' ]);
        arrWhereCompliance.push(['account_id = ' + accountId + ' GROUP BY compliance_kpis_id' ]);

        let compliances = <any> await complianceModel.getWhere(arrWhereCompliance);

        for(let loc of locations){

            for(let i in kpis) {
                let hasKpis = false;
                for(let c in compliances){
                    if( compliances[c]['compliance_kpis_id'] == kpis[i]['compliance_kpis_id'] && compliances[c]['building_id'] == loc.location_id ){
                        hasKpis = true;
                    }
                }

                if (!hasKpis) {
                    let createComplianceModel = new ComplianceModel(),
                    compObj = {
                        'compliance_kpis_id': kpis[i]['compliance_kpis_id'],
                        'compliance_status': 0,
                        'building_id': loc.location_id,
                        'account_id': accountId,
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

            let compl = [];
            for(let com of compliances){
                if(com.building_id == loc.location_id){
                    compl.push(com);
                }
            }

            let formData = {
                'location' : loc,
                'location_id' : loc.location_id,
                'kpis' : kpis,
                'compliances' : compl,
                'account' : account,
                'role' : r
            };

            compliance = await this.getLocationsLatestCompliance(req, res, true, formData);
            response.data.push( compliance );

        }

        // response['locationIds'] = locationIds;

        res.send(response);
    }

    public async getSublocationsEvacDiagrams(req: AuthRequest, res: Response){
        let
        locationId = req.body.location_id,
        accountID = req.user.account_id,
        relatedLocationOnly = (req.body.get_related_location) ? req.body.get_related_location : false,
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

            if(relatedLocationOnly){
                sublocations = <any> await locationModel.getChildrenTenantRelated(locationId, accountID, 'Tenant');
            }else{
                sublocations = <any> await locationModel.getWhere([ 'parent_id = ' +locationId+ ' AND archived = 0' ]);
            }

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

    public async saveEpcMinutesOfMeeting(req: AuthRequest, res: Response){
        let
        response = {
            status :  false, data : {}, message : ''
        },
        complianceModel = new ComplianceModel(),
        complianceWhere = [],
        kpisModel = new ComplianceKpisModel(),
        arrWhereKPIS = [],
        kpis = [],
        userRoleRelObj = new UserRoleRelation(),
        role = 0,
        kpisIds = [];

        arrWhereKPIS.push([' description IS NOT NULL ']);
        kpis =  <any> await kpisModel.getWhere(arrWhereKPIS);

        try {
            role = await userRoleRelObj.getByUserId(req.user.user_id, true);
        } catch (e) { }

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
        });

        let
        locModel = new Location(req.body.location_id),
        locAccRel = new LocationAccountRelation(),
        kpiEPC = <any> {};

        for(let kpi of kpis){
            if(kpi.compliance_kpis_id == 9){
                kpiEPC = kpi;
            }
        }

        let
        validMonths = kpiEPC.validity_in_months,
        today = moment(),
        validTill = today.add(validMonths, 'months');

        response['role'] = role;

        try{
            let
            location = <any> await locModel.load(),
            siblings = <any> (role == 2) ? await locAccRel.getLoctionSiblingsOfTenantRealtedToAccountAndLocation(req.user.account_id, req.body.location_id) : [],
            allLocs = JSON.parse(JSON.stringify(siblings));
            allLocs.push(location);
            response['allLocs'] = allLocs;
            response['compliances'] = <any> [];

            for(let loc of allLocs){
                let
                arrWhereCompliance = [],
                complianceModel = new ComplianceModel();

                arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
                arrWhereCompliance.push(['building_id = ' + loc.location_id]);
                arrWhereCompliance.push(['account_id = ' + req.user.account_id + ' GROUP BY compliance_kpis_id' ]);

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
                            'building_id': loc.location_id,
                            'account_id': req.user.account_id,
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

                for(let comp of compliances){
                    if(comp.compliance_kpis_id == 2){
                        let
                        saveData = {
                            'account_id' : req.body.account_id,
                            'location_id' : comp.building_id,
                            'data' : JSON.stringify(req.body.data),
                            'date_created' : moment().format('YYYY-MM-DD'),
                            'created_by' : req.user.user_id,
                            'date_updated' : moment().format('YYYY-MM-DD HH:mm:ss'),
                            'updated_by' : req.user.user_id
                        },
                        epcModel = new EpcMinutesMeeting(),
                        epcModelSave = new EpcMinutesMeeting(),
                        epcWhere = [];

                        epcWhere.push(['location_id = '+comp.building_id]);
                        epcWhere.push(['account_id = '+req.user.account_id]);
                        let epc = await epcModel.getWhere(epcWhere);
                        if(epc.length > 0){
                            epcModelSave.setID(epc[0]['epc_meeting_minutes_id']);
                            saveData['updated_by'] = req.user.user_id;
                            saveData['date_updated'] = moment().format('YYYY-MM-DD HH:mm:ss');
                            saveData['data'] = JSON.stringify(req.body.data);
                        }

                        await epcModelSave.create(saveData);

                        let complianceSaveModel = new ComplianceModel(comp['compliance_id']);
                        try{

                            complianceSaveModel.set('compliance_kpis_id', 2);
                            complianceSaveModel.set('account_role', '');
                            complianceSaveModel.set('building_id', comp.building_id);
                            complianceSaveModel.set('account_id', req.body.account_id);
                            complianceSaveModel.set('valid_till', validTill.format('YYYY-MM-DD HH:mm:ss'));
                            complianceSaveModel.set('compliance_status', 1);

                            await complianceSaveModel.dbUpdate();

                        }catch(e){
                            console.log(e);
                        }

                        if(req.body.location_id == comp.building_id){
                            saveData['epc_meeting_minutes_id'] = epcModel.ID();
                            response.data = saveData;
                        }
                    }
                }

                response['compliances'].push(compliances);
            }

            response.status = true;

        }catch(e){
            console.log(e);
        }

        res.send(response);
    }

    public async evacExerciseCompleted(req: AuthRequest, res: Response){
        let response = {
            status : false, message : ''
        },
        locationId = req.body.location_id,
        complModel = new ComplianceModel(req.body.compliance_id),
        kpisModel = new ComplianceKpisModel(),
        arrWhereKPIS = [],
        kpis = [],
        userRoleRelObj = new UserRoleRelation(),
        role = 0,
        kpisIds = [];

        arrWhereKPIS.push([' description IS NOT NULL ']);
        kpis =  <any> await kpisModel.getWhere(arrWhereKPIS);

        try {
            role = await userRoleRelObj.getByUserId(req.user.user_id, true);
        } catch (e) { }

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
        });


        let
        locModel = new Location(locationId),
        locAccRel = new LocationAccountRelation(),
        kpiEvacExer = <any> {};

        for(let kpi of kpis){
            if(kpi.compliance_kpis_id == 9){
                kpiEvacExer = kpi;
            }
        }

        let
        validMonths = kpiEvacExer.validity_in_months,
        today = moment(),
        validTill = today.add(validMonths, 'months');

        response['role'] = role;

        if(role == 2){
            try{
                let
                location = <any> await locModel.load(),
                siblings = <any> await locAccRel.getLoctionSiblingsOfTenantRealtedToAccountAndLocation(req.user.account_id, locationId),
                allLocs = JSON.parse(JSON.stringify(siblings));
                allLocs.push(location);
                response['allLocs'] = allLocs;
                response['compliances'] = <any> [];

                for(let loc of allLocs){
                    let
                    arrWhereCompliance = [],
                    complianceModel = new ComplianceModel();

                    arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
                    arrWhereCompliance.push(['building_id = ' + loc.location_id]);
                    arrWhereCompliance.push(['account_id = ' + req.user.account_id + ' GROUP BY compliance_kpis_id' ]);

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
                                'building_id': loc.location_id,
                                'account_id': req.user.account_id,
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

                    for(let comp of compliances){
                        if(comp.compliance_kpis_id == 9){

                            let
                            complModel = new ComplianceModel(comp.compliance_id);
                            await complModel.load();

                            if(req.body.status == true){
                                complModel.set('valid_till', validTill.format('YYYY-MM-DD HH:mm:ss'));
                                complModel.set('compliance_status', 1);
                            }else{
                                complModel.set('valid_till', 'null');
                                complModel.set('compliance_status', 0);
                            }

                            await complModel.dbUpdate();
                        }
                    }

                    response['compliances'].push(compliances);
                }

                response.status = true;

            }catch(e){
                console.log(e);
            }
        }else{
            try{
                await complModel.load();
                if(complModel.get('compliance_kpis_id') == 9){

                    if(req.body.status == true){
                        complModel.set('valid_till', validTill.format('YYYY-MM-DD HH:mm:ss'));
                        complModel.set('compliance_status', 1);
                    }else{
                        complModel.set('valid_till', 'null');
                        complModel.set('compliance_status', 0);
                    }

                    await complModel.dbUpdate();
                    response.status = true;
                }

            }catch(e){}
        }

        res.send(response);
    }

    public async fireSafetyCompleted(req: AuthRequest, res: Response){
        let response = {
            status : false, message : ''
        },
        locationId = req.body.location_id,
        complModel = new ComplianceModel(req.body.compliance_id),
        kpisModel = new ComplianceKpisModel(),
        arrWhereKPIS = [],
        kpis = [],
        userRoleRelObj = new UserRoleRelation(),
        role = 0,
        kpisIds = [];

        arrWhereKPIS.push([' description IS NOT NULL ']);
        kpis =  <any> await kpisModel.getWhere(arrWhereKPIS);

        try {
            role = await userRoleRelObj.getByUserId(req.user.user_id, true);
        } catch (e) { }

        Object.keys(kpis).forEach((key) => {
            kpisIds.push(kpis[key]['compliance_kpis_id']);
        });


        let
        locModel = new Location(locationId),
        locAccRel = new LocationAccountRelation(),
        kpiFsa = <any> {};

        for(let kpi of kpis){
            if(kpi.compliance_kpis_id == 3){
                kpiFsa = kpi;
            }
        }

        let
        validMonths = kpiFsa.validity_in_months,
        today = moment(),
        validTill = today.add(validMonths, 'months');

        response['role'] = role;

        if(role == 2){
            try{
                let
                location = <any> await locModel.load(),
                siblings = <any> await locAccRel.getLoctionSiblingsOfTenantRealtedToAccountAndLocation(req.user.account_id, locationId),
                allLocs = JSON.parse(JSON.stringify(siblings));
                allLocs.push(location);
                response['allLocs'] = allLocs;
                response['compliances'] = <any> [];

                for(let loc of allLocs){
                    let
                    arrWhereCompliance = [],
                    complianceModel = new ComplianceModel();

                    arrWhereCompliance.push(['compliance_kpis_id IN (' + kpisIds.join(',') + ')']);
                    arrWhereCompliance.push(['building_id = ' + loc.location_id]);
                    arrWhereCompliance.push(['account_id = ' + req.user.account_id + ' GROUP BY compliance_kpis_id' ]);

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
                                'building_id': loc.location_id,
                                'account_id': req.user.account_id,
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

                    for(let comp of compliances){
                        if(comp.compliance_kpis_id == 3){

                            let
                            complModel = new ComplianceModel(comp.compliance_id);
                            await complModel.load();

                            if(req.body.status == true){
                                complModel.set('valid_till', validTill.format('YYYY-MM-DD HH:mm:ss'));
                                complModel.set('compliance_status', 1);
                            }else{
                                complModel.set('valid_till', 'null');
                                complModel.set('compliance_status', 0);
                            }

                            await complModel.dbUpdate();
                        }
                    }

                    response['compliances'].push(compliances);
                }

                response.status = true;

            }catch(e){
                console.log(e);
            }
        }else{
            try{
                await complModel.load();
                if(complModel.get('compliance_kpis_id') == 3){

                    if(req.body.status == true){
                        complModel.set('valid_till', validTill.format('YYYY-MM-DD HH:mm:ss'));
                        complModel.set('compliance_status', 1);
                    }else{
                        complModel.set('valid_till', 'null');
                        complModel.set('compliance_status', 0);
                    }

                    await complModel.dbUpdate();
                    response.status = true;
                }

            }catch(e){}
        }

        res.send(response);
    }

}
