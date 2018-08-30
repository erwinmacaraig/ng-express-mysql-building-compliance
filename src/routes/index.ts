import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { Sample } from '../models/sample';
import { User } from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import * as fs from 'fs';
import * as path from 'path';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { EmailSender } from '../models/email.sender';

import { FileUploader } from '../models/upload-file';

/**
 * / route
 *
 * @class User
 */
export class IndexRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    // add home page route
    router.get('/test', (req: AuthRequest, res: Response) => {
      new IndexRoute().index(req, res);
    });

    router.get('/health/', (req: AuthRequest, res: Response) => {
      return res.status(200).send('OK');
    });

    router.post('/test/sample/upload', (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().uploadUserPhoto(req, res, next);
    });

    router.get('/test/upload/form', (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().displayUploadForm(req, res, next);
    });

    router.get('/test/location', (req: Request, res: Response, next: NextFunction) => {
    	new IndexRoute().displaySearchLocation(req, res, next);
    });

    router.get('/health/', (req: AuthRequest, res: Response) => {
      return res.status(200).send('OK');
    });

    router.get('/emails/nominate-warden', (req: AuthRequest, res: Response) => {
        let options = {
            users_fullname : 'Allan Delfin',
            nominators_fullname : 'Rudolf Rednose',
            nominators_account_name : 'StaClause',
            account_name : 'Emapta',
            location_name : 'Jaka Building, Level 7',
            frequency : '3 months',
            setup_link : 'https://google.com'
        };

        res.render('nominate-warden.hbs', options, (err, data) => {
            let email = new EmailSender({
                from : 'allantaw2@gmail.com',
                fromName : 'Allan Delfin',
                to : ['emacaraig@evacgroup.com.au'],
                cc: [],
                body : data,
                attachments: [],
                subject : 'Test HTML Email'
            });

            email.send(() => {
                res.send('ok');
            },
            () => {
                res.send('not ok');
            });
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


  displaySearchLocation(req: Request, res: Response, next: NextFunction) {
  	this.render(req, res, 'locationService.hbs');
  }

  displayUploadForm(req: Request, res: Response, next: NextFunction) {
    this.render(req, res, 'upload.hbs');
  }



  uploadUserPhoto(req: Request, res: Response, next: NextFunction) {
     const fu = new FileUploader(req, res, next);
     const link = fu.uploadFile(false, 'Buildings/5/').then(
       (url) => {
         console.log('Success UPLOAD');
         return res.send('<img src="' + fu.getUploadedFileLocation() + '" />');
       }
     ).catch((e) => {
       return res.end('Error uploading file');
     });
  }
}
