import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as validator from 'validator';

export class UserRelatedRoute extends BaseRoute {
  public static create(router: Router) {
    router.get('/person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new  UserRelatedRoute().getUserPersonalInfo(req, res);
    });

    router.patch('/update-person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().updateUserPersonalInfo(req, res);
    });
  }

  public getUserPersonalInfo(req: AuthRequest, res: Response) {

    const queryParamUser = req.query.userId;
    const user = new User(queryParamUser);
    const account = new Account();

    user.load().then(() => {
      account.getByUserId(queryParamUser).then(() => {
        return res.status(200).send({
          first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: account.get('account_name'),
          occupation: user.get('occupation')
        });
      }).catch((e) => {
        return res.status(200).send({
           first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: '',
          occupation: user.get('occupation')
          });
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
        });
      });
  }

  public updateUserPersonalInfo(req: AuthRequest, res: Response) {

    // validation checks
    let isValid = true;
    let errMessage = 'Invalid ';

    if (!validator.isEmail(req.body.email)) {
      isValid = false;
      errMessage += 'email ';
    }
    if (validator.isEmpty(req.body.first_name)) {
      isValid = false;
      errMessage += ' person name';
    }
    if (validator.isEmpty(req.body.last_name)) {
      isValid = false;
      errMessage += ' last name';
    }
    if (!isValid) {
      return res.status(400).send({
        status: 'Bad Request',
        message: errMessage
      });
    }
    const user = new User(req.user.user_id);
    user.load().then(() => {
      user.create(req.body).then(() => {
        return res.status(200).send({
          'message': 'Success'
        });
      }).catch((e) => {
        return res.status(400).send({
          status: 'Bad Request',
          message: e
          });
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
        });
    });
  }
}
