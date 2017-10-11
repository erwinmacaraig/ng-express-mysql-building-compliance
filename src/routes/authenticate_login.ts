import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';

import Validator from 'better-validator';
import * as md5 from 'md5';

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
      return res.send(user.getDBData());
    }, (e) => {
      res.status(401).send({
      status: 'Failed Authentication',
      message: e,
      data: ['username', 'password']
      });
    });

  }
}
