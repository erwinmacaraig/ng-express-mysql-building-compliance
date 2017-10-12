import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';

import Validator from 'better-validator';
import * as md5 from 'md5';

import * as jwt from 'jsonwebtoken';

export class AuthenticateLoginRoute extends BaseRoute {

  /**
   * Authenticate User upon Log in
   *
   * @class AuthenticateLoginRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    router.post('/authenticate', (req: Request, res: Response, next: NextFunction) => {
      new AuthenticateLoginRoute().validate(req, res, next);
    });
  }

  /**
   * Constructor
   *
   * @class AuthenticateLoginRoute
   * @constructor
   */
  constructor() {
    super();
  }

  public validate(req: Request, res: Response, next: NextFunction) {
    // console.log(req.body);
    const user = new User();
    user.loadByCredentials(req.body.username, req.body.password).then(() => {
      console.log(res);
      const token = jwt.sign({
        currentUser: {
          user_db_token: user.get('token'),
          evac_role: user.get('evac_role')
        }}, 'secretKey', { expiresIn: 7200 });
      // return res.status(200).send(user.getDBData());
      return res.status(200).send({
        status: 'Authentication Success',
        message: 'Successfully logged in',
        token: token,
        data: {
          userId: user.get('user_id')
        }
      });
    }, (e) => {
      res.status(401).send({
      status: 'Authentication Failed',
      message: e,
      data: ['username', 'password']
      });
    });

  }
}
