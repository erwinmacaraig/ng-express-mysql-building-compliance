

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
import * as moment from 'moment';
const md5 = require('md5');
const defs = require('../config/defs.json');
export class AdminRoute extends BaseRoute {

  public static create(router: Router) {
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

      return res.status(200).send({
        data: {
          buildings: locationsForManager,
          levels: levelLocations['resultArray']
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

      let createData = {
        first_name: '',
        last_name: '',
        email: '',
        mobile_number: '',
        can_login: 1,
        password: '',
        invited_by_user: req.user.user_id,
        account_id: 0,
        token: ''
      };

      for (const u of userForm) {
        const user = new User();
        const token = new Token();

        createData.first_name = u['first_name'];
        createData.last_name = u['last_name'];
        createData.email = u['email'];
        createData.mobile_number = u['contact'];
        createData.password = md5('Ideation' + u['password'] + 'Max');
        createData.account_id = u['account_id'];
        createData.can_login = 1;
        createData.invited_by_user =  req.user.user_id;
        createData.token = md5(u['email']);

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
          token: ''
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
          // EM Roles
        } else {
          // Account
          const locationAccntRel = new LocationAccountRelation();
          try {
              await locationAccntRel.getLocationAccountRelation({
                  'location_id': u['location_id'],
                  'account_id': u['account_id'],
                  'responsibility': defs['role_text'][u['role']]
              });
          } catch (err) {
              await locationAccntRel.create({
                  'location_id': u['location_id'],
                  'account_id': u['account_id'],
                  'responsibility': defs['role_text'][u['role']]
              });
          }

        }
      }

      return res.status(200).send({
        message: 'Success',
        data: userForm
      });
    });

  // ===============
  }
}
