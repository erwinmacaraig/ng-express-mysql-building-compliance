
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { List } from '../models/list.model';
import { Account } from '../models/account.model';
import { User } from './../models/user.model';
import { parse } from 'url';

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
      const row_count = await user.getByAccountId(req.params.accountId).length;
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
      console.log(allUsers);
      for (let i = 0; i < allUsers.length; i++) {
        if (allUsers[i]['user_id'] in allUserObject) {
          if (allUsers[i]['location_id'] in allUserObject[allUsers[i]['user_id']]['locations']) {
            if (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0) {
              /*
              allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['account_role'].push(
                allUsers[i]['account_role']
              );
              */

            }
            if (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0) {
              // allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']]['em_role'].push(allUsers[i]['role_name']);

            }


          } else {
            allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
              'em-role': [allUsers[i]['role_name']],
              'account-role': [allUsers[i]['account_role']],
              'location-name': allUsers[i]['name'],
              'location-parent': allUsers[i]['parent_name']
            };
            /*
            if (allUsers[i]['account_role'] !== null || allUsers[i]['account_role'].length > 0) {
              allUserObject[allUsers[i]['user_id']]['locations']['account-role'].push(allUsers[i]['account_role']);
            }
            if (allUsers[i]['role_name'] !== null || allUsers[i]['role_name'].length > 0) {
              allUserObject[allUsers[i]['user_id']]['locations']['role_name'].push(allUsers[i]['role_name']);
            }
            */
          }
        } else {
          allUserObject[allUsers[i]['user_id']] = {
            'location-ids': [allUsers[i]['location_id']],
            'first_name': allUsers[i]['first_name'],
            'last_name': allUsers[i]['last_name'],
            'email': allUsers[i]['email'],
            'mobile_number': allUsers[i]['mobile_number'],
            'locations': {}
          };
          allUserObject[allUsers[i]['user_id']]['locations'][allUsers[i]['location_id']] = {
              'em-role': [allUsers[i]['role_name']],
              'account-role': [allUsers[i]['account_role']],
              'location-name': allUsers[i]['name'],
              'location-parent': allUsers[i]['parent_name']
          };
        }
      }
      Object.keys(allUserObject).forEach((key) => {
        accountUsers.push(allUserObject[key]);
      });
      return res.status(200).send({
        data: accountUsers
      });
    });
  }
}
