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

    router.get('/admin/account-locations/:accountId/', async (req: Request, res: Response, next: NextFunction) => {
      const list = new List();
      const accountId = req.params.accountId;
      const tempHierarchy = [];
      let temp = [];
      const accountLocations: Array<object> = await list.listTaggedLocationsOnAccount(accountId);
      for (const location of accountLocations) {
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

    router.post('/admin/upload/compliance-documents/',
    new MiddlewareAuth().authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
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

        // console.log(Object.keys(req));
        console.log(req['files']);
        account_role = 'Manager'; // to change
        account_id = req.body.account_id;
        building_id = req.body.building_id;
        kpis = req.body.compliance_kpis_id;
        dtActivity = req.body.date_of_activity;
        description = req.body.description;
        viewable_by_trp = (req.body.viewable_by_trp.length > 0) ? 1 : 0;
        validityDuration = kpisModels[kpis]['validity_in_months'];

        arrWhereCompliance.push([`compliance_kpis_id = ${kpis}`]);
        arrWhereCompliance.push([`building_id = ${building_id}`]);
        arrWhereCompliance.push([`account_role = '${account_role}'`]);
        arrWhereCompliance.push([`account_id = ${account_id} GROUP BY compliance_kpis_id`]);
        compliances = await complianceModel.getWhere(arrWhereCompliance);
        // build upload path directory
        const util = new UtilsSync();
        try {
          dirUploadPath = await util.getAccountUploadDir(account_id, building_id, kpis);

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
                document_type: 'Primary',
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
 /*
        Object.keys(req['files']).forEach(async (i) => {
          filename = req['files'][i]['originalname'];
          const dataStream = await fs.readFileSync(req['files'][i]['path']);
          const params = {
            Bucket: aws_bucket_name,
            Key: `${dirUploadPath}${filename}`,
            ACL: 'public-read',
            Body: dataStream
          };
          aws_s3.putObject(params, (e, d) => {
            if (e) {
              console.log(`error reading file from path`);
              return res.status(400).send({
                message: 'Upload Failed'
              });
            }
            console.log(i, params);
            console.log(d);
          });

        });*/

        /*
         for (const f of req['files']) {
           filename = f['originalname'];
          fs.readFile(f['path'], (error, data) => {
            if (error) {
              console.log('There was a problem reading the uploaded file', error);
              return res.status(400).send({
                message: 'Problem reading uploaded file'
              });
            }
            const params = {
              Bucket: aws_bucket_name,
              Key: `${dirUploadPath}${filename}`,
              ACL: 'public-read',
              Body: data
            };
            aws_s3.putObject(params, async (e, d) => {
              if (e) {
                console.log(`error reading file from path ${req['file']['path']}`);
                return res.status(400).send({
                  message: 'Upload Failed'
                });
              }

              fs.unlink( __dirname + '/../public/temp/' + filename, () => {
                console.log(`Deleting ${filename}`);
              });
              const complianceDocObj = new ComplianceDocumentsModel();
              await complianceDocObj.create({
                account_id: account_id,
                building_id: building_id,
                compliance_kpis_id: kpis,
                document_type: 'Primary',
                file_name: filename,
                date_of_activity: dtActivity,
                viewable_by_trp: viewable_by_trp,
                description: description,
                file_size: f['size'],
                file_type: f['mimetype'],
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
            });
          });
         }
        */

        /*
        account_role = 'Manager'; // to change
        account_id = req.body.account_id;
        building_id = req.body.building_id;
        kpis = req.body.compliance_kpis_id;
        dtActivity = req.body.date_of_activity;
        description = req.body.description;
        viewable_by_trp = (req.body.viewable_by_trp.length > 0) ? 1 : 0;
        validityDuration = kpisModels[kpis]['validity_in_months'];

        arrWhereCompliance.push([`compliance_kpis_id = ${kpis}`]);
        arrWhereCompliance.push([`building_id = ${building_id}`]);
        arrWhereCompliance.push([`account_role = '${account_role}'`]);
        arrWhereCompliance.push([`account_id = ${account_id} GROUP BY compliance_kpis_id`]);
        compliances = await complianceModel.getWhere(arrWhereCompliance);
        // build upload path directory
        const util = new UtilsSync();
        try {
          dirUploadPath = await util.getAccountUploadDir(account_id, building_id, kpis);

        } catch (e) {
          console.log('Cannot build directory structure', e);
          return res.status(400).send({
            message: 'Failed. Cannot build directory structure'
          });
        }

        fs.readFile(req['file']['path'], (error, data) => {
          if (error) {
            console.log('There was a problem reading the uploaded file', error);
            return res.status(400).send({
              message: 'Problem reading uploaded file'
            });
          }
          const params = {
            Bucket: aws_bucket_name,
            Key: `${dirUploadPath}${filename}`,
            ACL: 'public-read',
            Body: data
          };
          aws_s3.putObject(params, async (e, d) => {
            if (e) {
              console.log(`error reading file from path ${req['file']['path']}`);
              return res.status(400).send({
                message: 'Upload Failed'
              });
            }

            fs.unlink( __dirname + '/../public/temp/' + filename, () => {});
            const complianceDocObj = new ComplianceDocumentsModel();
            await complianceDocObj.create({
              account_id: account_id,
              building_id: building_id,
              compliance_kpis_id: kpis,
              document_type: 'Primary',
              file_name: filename,
              date_of_activity: dtActivity,
              viewable_by_trp: viewable_by_trp,
              description: description,
              file_size: req['file']['size'],
              file_type: req['file']['mimetype'],
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

            return res.status(200).send({
              message: 'Success'
            });
          }); */
        });

      });
  // ===============
  }
}
