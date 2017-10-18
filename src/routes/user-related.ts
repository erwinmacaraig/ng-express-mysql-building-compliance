import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';

export class UserRelatedRoute extends BaseRoute {
  public static create(router: Router) {
    router.get('/person-info', (req: Request, res: Response, next: NextFunction) => {
      new  UserRelatedRoute().getUserPersonalInfo(req, res, next);
    });
  }

  public getUserPersonalInfo(req: Request, res: Response, next: NextFunction) {

    const queryParamUser = req.query.userId;
    const user = new User(queryParamUser);
    user.load().then(() => {
      return res.status(200).send({
        first_name: user.get('first_name'),
        last_name: user.get('last_name'),
        email:  user.get('email'),
        phone_number: user.get('phone_number'),
        user_name: user.get('user_name')
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
        });
      });
  }
}
