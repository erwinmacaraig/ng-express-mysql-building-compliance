
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { List } from '../models/list.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { User } from './../models/user.model';
import { Token } from './../models/token.model';
import { parse } from 'url';
import { LocationAccountRelation } from '../models/location.account.relation';
import { LocationAccountUser } from '../models/location.account.user';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { UtilsSync } from '../models/util.sync';
import { FileUploader } from '../models/upload-file';
import { ComplianceDocumentsModel } from '../models/compliance.documents.model';
import { ComplianceModel } from '../models/compliance.model';
import { ComplianceKpisModel } from '../models/comliance.kpis.model';
import * as moment from 'moment';
import { UserRoleRelation } from '../models/user.role.relation.model';
const md5 = require('md5');
const defs = require('../config/defs.json');
const validator = require('validator');
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as async from 'async';

const AWSCredential = require('../config/aws-access-credentials.json');

export class AdminRoute extends BaseRoute {

  public static create(router: Router) {

    router.get('/admin/get/location-details/:location/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const locationObj = new Location(req.params.location);
      const all_location_data = await locationObj.load();
      const parent_traverse_data = await locationObj.locationHierarchy();


    });

    router.get('/admin/compliance/FSA-EvacExer/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const compliance = new ComplianceModel();
      let complianceData: any;
      if (req.query.ctrl === 'set') {
        complianceData =
          await compliance.setComplianceRecordStatus(req.query.compliance_kpis_id,
            req.query.building_id,
            req.query.account_id,
            req.query.compliance_status);
      }
      complianceData =
            await compliance.getComplianceRecord(req.query.compliance_kpis_id, req.query.building_id, req.query.account_id);
        return res.status(200).send({
          message: 'Success',
          data: complianceData
        });
    });

    router.get('/admin/account-locations/:accountId/', new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const list = new List();
      const accountId = req.params.accountId;
      let temp = [];
      const lar_locations = [];
      let accountLocations: Array<object> = await list.listTaggedLocationsOnAccount(accountId);
      for (const location of accountLocations) {
        lar_locations.push(location['location_id']);
        location['display_name'] = '';
        // loop through the assumed heirarchy
        temp = [];
        let tempColName = '';
        for (let p = 5; p > 0; p--) {
          tempColName = `p${p}_name`;
          if (location[tempColName] != null) {
            temp.push(location[tempColName]);
          }
        }
        temp.push(location['name']);
        location['display_name'] = temp.join(' >> ');
      }
      const locationsFromLAU: Array<object> = await list.listTaggedLocationsOnAccountFromLAU(accountId, {'exclusion_ids': lar_locations});
      for (const location of locationsFromLAU) {
        lar_locations.push(location['location_id']);
        location['display_name'] = '';
        // loop through the assumed heirarchy
        temp = [];
        let tempColName = '';
        for (let p = 5; p > 0; p--) {
          tempColName = `p${p}_name`;
          if (location[tempColName] != null) {
            temp.push(location[tempColName]);
          }
        }
        temp.push(location['name']);
        location['display_name'] = temp.join(' >> ');
      }
      accountLocations = accountLocations.concat(locationsFromLAU);

      return res.status(200).send({
        data: accountLocations
      });
    });
    router.get('/admin/accounts/list/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const accountList = new List();
      const account = new Account();
      let accountIds = [];
      let page_num = 0;
      let row_count = await account.getAll({'count': true});

      row_count = parseInt(row_count, 10);
      let pages = 0;
      const item_per_page = 10;
      if (row_count) {
        pages = Math.ceil( row_count / item_per_page);
      }
      if (req.query.page_num) {
        page_num = parseInt(req.query.page_num, 10);
        accountIds = await account.getAll({'page': page_num});
      }
      if (req.query.search_key) {
        accountIds = await account.getAll({'query': req.query.search_key});
      }
      if (req.query.criteria) {
        accountIds = await account.getAll({'all': 1});
      }

      const list = await accountList.generateAccountsAdminList(accountIds);
      const listFromLAU = await accountList.generateAccountsAdminListFromLAU(accountIds);

      // loop through listFromLAU
      Object.keys(listFromLAU).forEach((key) => {
        if (key in list) {
          list[key]['locations'] = list[key]['locations'].concat(listFromLAU[key]['locations']);
          list[key]['locations'] = Array.from(new Set(list[key]['locations']));
        } else {
          list[key] = listFromLAU[key];
        }
      });
      return res.status(200).send({
        'message': 'Success',
        'data': {
          'list': list,
          'total_pages': pages
        }
      });
    });

    router.get('/admin/account-information/:accountId/',
        new MiddlewareAuth().authenticate,
        async (req: AuthRequest, res: Response, next: NextFunction) => {
        const account = new Account(req.params.accountId);
        try {
          const accntDbData = await account.load();
          return res.status(200).send({
            'message': 'Success',
            data: accntDbData
          });
        } catch (e) {
          return res.status(200).send({
            'message': 'Fail',
            data: {}
          });
        }
    });

    router.get('/admin/account-users/:accountId/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const account = new Account(req.params.accountId);
      const user = new User();
      const row_count_obj = await user.getByAccountId(req.params.accountId);
      const row_count = Object.keys(row_count_obj).length;
      let pages = 0;
      const item_per_page = 10;
      if (row_count) {
        pages = Math.ceil( row_count / item_per_page);
      }

      const user_filter = {
        'page': 0,
        'query': ''
      };

      if (req.query.page_num) {
        user_filter['page'] = req.query.page_num;
      }
      if (req.query.search_key) {
        user_filter['query'] = req.query.search_key;
      }
      let selectedUsers = [];
      selectedUsers = await user.getSpliceUsers(req.params.accountId, user_filter);
      let allUsers = [];
      allUsers = await account.generateAdminAccountUsers(req.params.accountId, selectedUsers);
      allUsers = allUsers.concat(await account.generateAdminEMUsers(req.params.accountId, selectedUsers));
      const accountUsers = [];
      const allUserObject = {};
      const locations = {};
      for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i]['user_id'] in allUserObject) {
          if (allUsers[i]['location_id'] in allUserObject[allUsers[i]['user_id']]['locations']) {
            if (allUsers[i]['account_role'] && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {

              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                allUsers[i]['account_role']
              );


            }
            if (allUsers[i]['role_name'] && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
            }


          } else {
            if (allUsers[i]['location_id'] !== null) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
                'em-role': [],
                'account-role': [],
                'location-name': allUsers[i]['name'],
                'location-parent': allUsers[i]['parent_name']
              };
              if ((allUsers[i]['account_role']) && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                  allUsers[i]['account_role']
                );
              }
              if ( (allUsers[i]['role_name']) && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
                allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
              }

            }

          }
        } else {
          allUserObject[allUsers[i]['user_id']] = {
            'location-ids': [allUsers[i]['location_id']],
            'first_name': allUsers[i]['first_name'],
            'last_name': allUsers[i]['last_name'],
            'email': allUsers[i]['email'],
            'mobile_number': allUsers[i]['mobile_number'],
            'locations': {},
            'locations-arr': []
          };
          // console.log(typeof allUsers[i]['location_id']);
          // console.log(allUsers[i]['location_id'] === null);
          if (allUsers[i]['location_id'] && allUsers[i]['location_id'] != null) {
            allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
              'location-name': allUsers[i]['name'],
              'location-parent': allUsers[i]['parent_name'],
              'account-role': [],
              'em-role': []
            };
            if (allUsers[i]['account_role'] && (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account-role'].push(
                allUsers[i]['account_role']
              );
            }
            if (allUsers[i]['role_name'] && (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0)) {
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em-role'].push(allUsers[i]['role_name']);
            }
          }
        }
      }
      Object.keys(allUserObject).forEach((key) => {
        if (Object.keys(allUserObject[key]['locations']).length > 0) {
          allUserObject[key]['locations-arr'] =
            Object.keys(allUserObject[key]['locations']).map((k) => {
              return allUserObject[key]['locations'][k];
            });
        }
        accountUsers.push(allUserObject[key]);
      });

      return res.status(200).send({
        data: {
          'list': accountUsers,
          'total_pages': pages,
        } ,

      });
    });

    router.get('/admin/location-listing/:accountId/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const locAccntRelObj = new LocationAccountRelation();
      let locationsForManager;
      let locationsForTRP;
      const buildingIds = [];

      locationsForManager = await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Manager']});
      for (const location of locationsForManager) {
        buildingIds.push(location['location_id']);
      }
      // GET ALL SUBLEVELS
      const list = new List();
      let levelLocations;
      if (buildingIds.length == 0) {
        locationsForTRP = await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Tenant']});
        for (const location of locationsForTRP) {
          buildingIds.push(location['parent_id']);
        }
        const locationObj = new Location();
        locationsForManager = await locationObj.bulkLocationDetails(buildingIds);
      }
      levelLocations = await list.generateSublocationsForListing(buildingIds);
      /*
      console.log('======================= BUILDING IDS ======================== ');
      console.log(buildingIds);
      console.log('*********************** LEVEL LOCATIONS ***************************');
      console.log(levelLocations);
      */
      // get locations for location_account_relation and merged it in buildingIds
      const locationsForTrpFromLAR =
        await locAccntRelObj.listAllLocationsOnAccount(req.params.accountId, {'responsibility': defs['Tenant']});

      const uniqLocationsUnderFRP = [];
      for (const location of locationsForTrpFromLAR) {
        if (levelLocations['resultLocationIds'].indexOf(location['location_id']) === -1) {
          uniqLocationsUnderFRP.push(location['location_id']);
        }
      }
      const locationInLAR = await list.generateLocationDetailsForAddUsers(uniqLocationsUnderFRP);
      return res.status(200).send({
        data: {
          buildings: locationsForManager,
          levels: levelLocations['resultArray'].concat(locationInLAR),
          lar: locationInLAR
        }
      });
    });

    router.get('/admin/check-user-email/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      const user = new User();
      const emailInput = req.query.user_email;
      user.getByEmail(emailInput).then((data) => {
        return res.status(200).send({
          forbidden: true
        });
      }).catch((e) => {
        return res.status(200).send({
          forbidden: false
        });
      });
    });

    router.post('/admin/add-new-user/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const userForm = JSON.parse(req.body.users);
      console.log(userForm);
      const invalidUsers = [];
      let createData = {
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        can_login: 1,
        password: '',
        invited_by_user: req.user.user_id,
        account_id: 0,
        token: '',
        location_id: 0
      };

      for (const u of userForm) {
        const user = new User();
        const token = new Token();
        const locationAccntRel = new LocationAccountRelation();
        // check here again for email
        if (validator.isEmail(u['email'])) {
          try {
            await user.getByEmail( u['email']);
          } catch (e) {
          //
            createData.first_name = u['first_name'];
            createData.last_name = u['last_name'];
            createData.email = u['email'];
            createData.mobile_number = u['contact'];
            createData.password = md5('Ideation' + u['password'] + 'Max');
            createData.account_id = u['account_id'];
            createData.can_login = 1;
            createData.invited_by_user =  req.user.user_id;
            createData.token = md5(u['email']);
            createData.location_id = u['location'];
            const locationAccntUser = new LocationAccountUser();

            await user.create(createData);
            createData = {
              first_name: '',
              last_name: '',
              email: '',
              mobile_number: '',
              can_login: 1,
              password: '',
              invited_by_user: req.user.user_id,
              account_id: 0,
              token: '',
              location_id: 0
            };
            await token.create({
              id: user.ID(),
              id_type: 'user_id',
              token: md5(u['email']),
              action: 'verify',
              verified: 1,
              expiration_date: moment().format('YYYY-MM-DD HH-mm-ss')
            });

            if (parseInt(u['role'], 10) > 2) {
              // EM Roles UserEmRoleRelation
              try {
                const em_user = new UserEmRoleRelation();
                em_user.create({
                  user_id: user.ID(),
                  em_role_id: u['role'],
                  location_id: u['location']
                });
              } catch (e) {
                console.log('Unable to create emergency role', e, createData);
              }

            } else {
              // Account
                // create entry in location account user
                try {
                await locationAccntUser.create({
                  location_id: u['location'],
                  account_id: u['account_id'],
                  user_id: user.ID()
                });

                } catch (e) {
                  console.log('Cannot create entry in db with ', createData);
                }
                try {
                    await locationAccntRel.getLocationAccountRelation({
                        'location_id': u['location'],
                        'account_id': u['account_id'],
                        'responsibility': defs['role_text'][u['role']]
                    });
                } catch (err) {
                    await locationAccntRel.create({
                        'location_id': u['location'],
                        'account_id': u['account_id'],
                        'responsibility': defs['role_text'][u['role']]
                    });
                }
                // User Role Relation
                const userRoleRelObj = new UserRoleRelation();
                let accountRole = [];
                accountRole = await userRoleRelObj.getUserRoleRelationId({
                  user_id: user.ID(),
                  role_id: u['role']
                });
                if (accountRole.length === 0) {
                  await userRoleRelObj.create({
                    user_id: user.ID(),
                    role_id: u['role']
                  });
                }
            }
          } // end catch clause for making sure email is unique
        } else {
          invalidUsers.push(u['email']);
        }
      }

      return res.status(200).send({
        'message': 'Success',
        'invalid-users': invalidUsers
      });
    });

    router.get('/admin/compliance/kpis/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
      const kpis =  await new ComplianceKpisModel().getAllKPIs(true);
      return res.status(200).send({
        message: 'Success',
        data: kpis
      });
    });

    router.post('/admin/upload/compliance/evac-diagrams/',
      new MiddlewareAuth().authenticate,
      async (req: AuthRequest, res: Response, next: NextFunction) => {
        const evacDiagramFiles = [];
        let filename = '';
        const errMsgs = [];
        let temp;
        let dirPath = '';
        const rejectedFiles = [];

        let account_id = 0;
        let location_id = 0;

        const multerConfig = multer.diskStorage({
          destination: (rq, file, callback) => {
            callback(null, __dirname + '/../public/temp');
          },
          filename: (rq, file, callback) => {
            filename = file.originalname.replace(/\s+/g, '-');
            callback(null, filename);
          }
        });
        AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
        AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
        AWS.config.region = AWSCredential.AWS_REGION;
        const aws_bucket_name = AWSCredential.AWS_Bucket;
        const aws_s3 = new AWS.S3();
        const complianceDocsUploader = multer({storage: multerConfig}).array('file', 100);
        const complianceModel = new ComplianceModel();
        complianceDocsUploader(req, res, async (err) => {
          if (err) {
            console.log('This is the error', err);
            return res.status(400).send({
              message: 'There was a problem uploading the evacuation diagrams'
            });
          }
          // console.log(req['files']);
          // do file processing here
          let file_parts = [];

          for (const f of req['files']) {
            file_parts = [];
            dirPath = '';
            let parentId = 0;
            temp = null;
            file_parts = f['originalname'].split('_');
            if (file_parts.length !== 5) {
              rejectedFiles.push(f['filename']);
              errMsgs.push(`${f['filename']} does not have the correct format`);
              continue;
            }
            // console.log(file_parts);
            const account = new Account();
            const location = new Location();
            if (file_parts[0] != null) {
              temp = await account.getAccountDetailsUsingName(file_parts[0]);
              if (temp.length > 0) {
                dirPath += `${temp[0]['account_directory_name']}/`;
                account_id = temp[0]['account_id'];
                temp = null;
              } else {
                rejectedFiles.push(f['filename']);
                errMsgs.push(`Cannot get the account directory for ${file_parts[0]}`);
                continue;
              }
            }
            // this is the main (building location)
            if (file_parts[1] != null) {
              temp = await location.getLocationDetailsUsingName(file_parts[1]);
              if (temp.length > 0) {
                parentId = temp[0]['location_id'];
                if (temp[0]['location_directory_name'] == null || temp[0]['location_directory_name'].length == 0) {
                  dirPath += file_parts[1].replace(/\s/g, '') + '/';
                  const myLocation = new Location(temp[0]['location_id']);
                  await myLocation.load();
                  await myLocation.create({
                    location_directory_name: file_parts[1].replace(/\s/g, '')
                  });
                } else {
                  dirPath += `${temp[0]['location_directory_name']}/`;
                }
                temp = null;
              } else {
                rejectedFiles.push(f['filename']);
                errMsgs.push(`Cannot get the location directory for ${file_parts[1]}`);
                continue;
              }
            }
            // this is the level part
            if (file_parts[2] != null) {
              temp = await location.getLocationDetailsUsingName(file_parts[2], parentId);
              if (temp.length > 0) {
                // lets update the location directory
                const myLocation = new Location(temp[0]['location_id']);
                dirPath += file_parts[2].replace(/\s/g, '') + '/EmergencyEvacuationDiagrams/Primary/';
                location_id = temp[0]['location_id'];
                temp = null;
                await myLocation.load();
                await myLocation.create({
                  location_directory_name: file_parts[2].replace(/\s/g, '')
                });
              } else {
                errMsgs.push(`There is no such sublocation with the name -  ${file_parts[2]}`);
                rejectedFiles.push(f['filename']);
                continue;
              }
            }
            // this is the date part
            if (file_parts[4] != null) {
              if (moment(file_parts[4], 'DDMMYYYY').isValid()) {
                temp = moment(file_parts[4], 'DDMMYYYY').format('YYYY-MM-DD');
                // console.log(temp);
              } else {
                errMsgs.push(`Invalid date format -  ${file_parts[4]}`);
                rejectedFiles.push(f['filename']);
                continue;
              }
            }
            const filteredName = f['filename'].replace(/\s+/g, '-');
            f['key'] = `${dirPath}${filteredName}`;
            f['dtActivity'] = moment(file_parts[4], 'DDMMYYYY').format('YYYY-MM-DD');
            evacDiagramFiles.push(f);
            console.log(dirPath);
            // console.log(evacDiagramFiles);
            // console.log(errMsgs);
          }

          let marker = 0;
          async.each(evacDiagramFiles, async (item: object, cb) => {
            const dataStream = await fs.readFileSync(item['path']);
            const params = {
              Bucket: aws_bucket_name,
              Key: item['key'],
              ACL: 'public-read',
              Body: dataStream
            };
            console.log('Processing ', item['path']);
            aws_s3.putObject(params, async (e, d) => {
              if (e) {
                console.log(`error reading file from path`);
                return res.status(400).send({
                  message: 'Upload Failed'
                });
              }
              const complianceDocObj = new ComplianceDocumentsModel();
                await complianceDocObj.create({
                  account_id: account_id,
                  building_id: location_id,
                  compliance_kpis_id: '5',
                  override_document: '-1',
                  document_type: 'Primary',
                  file_name: item['filename'],
                  date_of_activity: item['dtActivity'],
                  viewable_by_trp: '1',
                  description: 'Admin upload',
                  file_size: item['size'],
                  file_type: item['mimetype'],
                  timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
                });
                const today = moment();
                // const dtActivityValidity = moment(dtActivity).add(validityDuration, 'months');
                const status = 1;
                /*
                let status = 0;
                if (dtActivityValidity.isAfter(today)) {
                  status = 1;
                }
                */

                await complianceModel.create({
                  compliance_kpis_id: 5,
                  compliance_status: status,
                  building_id: location_id,
                  account_id: account_id,
                  required: 1,
                  override_by_evac: 0
                });
                marker++;
                // console.log(d);
                // console.log(marker);
              if (marker == evacDiagramFiles.length) {
                return res.status(200).send({
                  message: 'Success'
                });
              }
            });

        });

          return res.status(200).send({
            message: 'Test',
            rejected: rejectedFiles,
            errorMsgs: errMsgs
          });
        });

      });


    router.get('/admin/list/compliance-documents/',
    new MiddlewareAuth().authenticate, async(req: AuthRequest, res: Response, next: NextFunction) => {
      const list = new List();
      let tempNameParts = [];
      const hie_locations = [];
      const location = new Location(req.query.location);
      const documents = await list.generateComplianceDocumentList(req.query.account, req.query.location, req.query.kpi);
      const location_data = await location.locationHierarchy();
      let details: object = {};
      for (const loc of location_data) {
        loc['display_name'] = '';
        // loop through the assumed heirarchy
        tempNameParts = [];
        let tempColName = '';

        for (let p = 5; p > 0; p--) {
          tempColName = `p${p}_name`;
          if (loc[tempColName] != null) {
            tempNameParts.push(loc[tempColName]);
            details[loc[`p${p}_location_id`]] = loc[tempColName];
            hie_locations.push(details);
            details = {};
          }
        }
        details[loc['location_id']] = loc['name'];
        hie_locations.push(details);
        tempNameParts.push(loc['name']);
        loc['display_name'] = tempNameParts.join(' >> ');
      }
      return res.status(200).send({
        data: documents,
        location: location_data,
        displayName: tempNameParts,
        detailsObj: hie_locations
      });
    });

    router.post('/admin/upload/compliance-documents/',
    new MiddlewareAuth().authenticate,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      let filename = '';
      let dirUploadPath = '';
      const multerConfig = multer.diskStorage({
        destination: (rq, file, callback) => {
          callback(null, __dirname + '/../public/temp');
        },
        filename: (rq, file, callback) => {
          filename = file.originalname.replace(/\s+/g, '_');
          callback(null, filename);
        }
      });
      AWS.config.accessKeyId = AWSCredential.AWSAccessKeyId;
      AWS.config.secretAccessKey = AWSCredential.AWSSecretKey;
      AWS.config.region = AWSCredential.AWS_REGION;
      const aws_bucket_name = AWSCredential.AWS_Bucket;
      const aws_s3 = new AWS.S3();

      let account_id,
        building_id,
        kpis,
        dtActivity,
        description,
        viewable_by_trp,
        account_role,
        document_type,
        override_document,
        compliances = [];
      const arrWhereCompliance = [];



      const complianceDocsUploader = multer({storage: multerConfig}).array('file', 100);
      let validityDuration;
      const kpisModels = await new ComplianceKpisModel().getAllKPIs();
      const complianceModel = new ComplianceModel();
      complianceDocsUploader(req, res, async (err) => {
        if (err) {
          console.log('This is the error', err);
          return res.status(400).send({
            message: 'There was a problem uploading the file'
          });
        }

        // console.log(Object.keys(req.body));
        // console.log(req['files']);
        // console.log(req.body);
        account_role = 'Manager'; // to change
        account_id = req.body.account_id;
        building_id = req.body.building_id;
        kpis = req.body.compliance_kpis_id;
        document_type = req.body.document_type;
        dtActivity = req.body.date_of_activity;
        description = req.body.description;
        viewable_by_trp = 1; // to change
        validityDuration = kpisModels[kpis]['validity_in_months'];
        override_document = req.body.override_document;

        arrWhereCompliance.push([`compliance_kpis_id = ${kpis}`]);
        arrWhereCompliance.push([`building_id = ${building_id}`]);
        arrWhereCompliance.push([`account_role = '${account_role}'`]);
        arrWhereCompliance.push([`account_id = ${account_id} GROUP BY compliance_kpis_id`]);
        compliances = await complianceModel.getWhere(arrWhereCompliance);
        // build upload path directory
        const util = new UtilsSync();
        try {
          dirUploadPath = await util.getAccountUploadDir(account_id, building_id, kpis, document_type);
        } catch (e) {
          console.log('Cannot build directory structure', e);
          return res.status(400).send({
            message: 'Failed. Cannot build directory structure'
          });
        }
        let marker = 0;
        async.each(req['files'], async (item: object, cb) => {
          const dataStream = await fs.readFileSync(item['path']);
          filename = item['originalname'].replace(/\s+/g, '_');
          const params = {
            Bucket: aws_bucket_name,
            Key: `${dirUploadPath}${filename}`,
            ACL: 'public-read',
            Body: dataStream
          };
          console.log('Processing ', item['path'], filename);
          aws_s3.putObject(params, async (e, d) => {
            if (e) {
              console.log(`error reading file from path`);
              return res.status(400).send({
                message: 'Upload Failed'
              });
            }
            // console.log(i, params);
            const complianceDocObj = new ComplianceDocumentsModel();
              await complianceDocObj.create({
                account_id: account_id,
                building_id: building_id,
                compliance_kpis_id: kpis,
                override_document: override_document,
                document_type: document_type,
                file_name: item['originalname'].replace(/\s+/g, '_'),
                date_of_activity: dtActivity,
                viewable_by_trp: viewable_by_trp,
                description: description,
                file_size: item['size'],
                file_type: item['mimetype'],
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
              });
              const today = moment();
              const dtActivityValidity = moment(dtActivity).add(validityDuration, 'months');
              let status = 0;
              if (dtActivityValidity.isAfter(today)) {
                status = 1;
              }
              await complianceModel.create({
                compliance_kpis_id: kpis,
                compliance_status: status,
                building_id: building_id,
                account_id: account_id,
                valid_till: dtActivityValidity.format('YYYY-MM-DD'),
                required: kpisModels[kpis]['required'],
                account_role: account_role,
                override_by_evac: 0
              });
            marker++;
            // console.log(d);
            // console.log(marker);
            if (marker == req['files'].length) {
              return res.status(200).send({
                message: 'Success'
              });
            }
          });

        });
       });
      });
  // ===============
  }


}
