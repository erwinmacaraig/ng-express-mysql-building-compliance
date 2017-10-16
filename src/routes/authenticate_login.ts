import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';

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
    // set to 2 hours
    let signedInExpiry = 7200;
    if (req.body.keepSignedin) {
      signedInExpiry = signedInExpiry * 12;
    }
    const user = new User();
    user.loadByCredentials(req.body.username, req.body.password).then(() => {
      const token = jwt.sign({
        user_db_token: user.get('token'),
        evac_role: user.get('evac_role'),
        user: user.get('user_id')
        }, 'secretKey', { expiresIn: signedInExpiry });

      new UserRoleRelation().getByUserId(user.get('user_id')).then(
        (userRole) => {
          return res.status(200).send({
            status: 'Authentication Success',
            message: 'Successfully logged in',
            token: token,
            data: {
              userId: user.get('user_id'),
              name: user.get('first_name')+' '+user.get('last_name'),
              email: user.get('email'),
              roleId : userRole['role_id'],
              mix : false
            }
          });
        },
        (m) => {
          return res.status(200).send({
            status: 'Authentication Success',
            message: 'Successfully logged in',
            token: token,
            data: {
              userId: user.get('user_id'),
              name: user.get('first_name')+' '+user.get('last_name'),
              email: user.get('email'),
              roleId : 0
            }
          });
        }
      );
      
    }, (e) => {
      res.status(401).send({
      status: 'Authentication Failed',
      message: e,
      data: ['username', 'password']
      });
    });

  }
}
