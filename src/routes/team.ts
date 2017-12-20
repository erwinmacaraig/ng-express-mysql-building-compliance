import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import * as fs from 'fs';
import * as path from 'path';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';

import { FileUploader } from '../models/upload-file';
import { Utils } from './../models/utils.model';

/**
 * / route
 *
 * @class User
 */
export class TeamRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    // add home page route
    router.get('/test', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().index(req, res);
    });

    router.post('/team/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWarden(req, res);
    });

    router.get('/team/eco-role-list', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().getECOList(req, res).then((roles) => {
        return res.status(200).send(roles);
      }).catch((e) => {
        return res.status(400).send('Error generating list');
      });
    });

  }

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: AuthRequest, res: Response) {
     console.log(req.token);
     console.log(req.user);
    // console.log(req.get('user'));
      // set options
    const options: Object = {
      'title': 'Evac Connect Platform',
      'message': 'Welcome To EvacConnect'
    };

    // render template
    this.render(req, res, 'index.hbs', options);
  }

  public addBulkWarden(req: AuthRequest, res: Response) {

  }

  public async getECOList(req: AuthRequest, res: Response) {
    const utils = new Utils();
    try {
      const roles = utils.buildECORoleList();
      return roles;
    } catch (e) {
      throw new Error('There was a problem generating the list');
    }
  }


}
