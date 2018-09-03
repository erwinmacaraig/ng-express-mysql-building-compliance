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

    router.get('/email/preview/:type', (req: Request, res: Response) => {
        res.render(req.params['type']+'.hbs');
    });

    router.get('/email/send/:type', (req: AuthRequest, res: Response) => {
        let 
        options = <any> {
            users_fullname : 'Allan Delfin',
            nominators_fullname : 'Rudolf Rednose',
            nominators_account_name : 'StaClause',
            account_name : 'Emapta',
            location_name : 'Jaka Building, Level 7',
            frequency : '3 months',
            setup_link : 'https://google.com',
            footer : ''
        },
        dir = __dirname.replace('routes', 'views'),
        type = req.params['type'],
        filename = '',
        subj = '';

        switch (type) {
            case "warden":
                subj = "You are nominated as Warden";
                filename = "warden-email";
                break;
            case "trp":
                subj = "You are assigned as Tenant Responsible Person";
                filename = "trp-email";
                break;
            case "frp":
                subj = "We invite you to set up your FRP account on EvacConnect";
                filename = "frp-email";
                break;
            case "forgot-password":
                subj = "EvacConnect Change Password";
                filename = "forgot-password-email";
                break;
            case "online-training":
                options.training_name = "Training Bomb Threat";
                subj = "You are invited to take an online training on "+options.training_name;
                filename = "online-training-email";
                break;
            case "frp-confirmation":
                subj = "Please confirm you are the nominated Facility Responsible Person";
                filename = "frp-confirmation-email";
                break;
            case "trp-confirmation":
                subj = "Please confirm you are the nominated Tenant Responsible Person";
                filename = "trp-confirmation-email";
                break;
            case "warden-confirmation":
                subj = "Please confirm you are a nominated Warden";
                filename = "warden-confirmation-email";
                break;
            case "signup":
                subj = "Your EvacConnect Account: Please verify your email address";
                filename = "signup-email";
                break;
        }

        fs.readFile(dir+'/footer-email.hbs', 'utf8', (err, data) => {
            options.footer = data;

            res.render(filename+'.hbs', options, (err, data) => {
                let email = new EmailSender({
                    from : 'allantaw2@gmail.com',
                    fromName : 'Allan Delfin',
                    to : ['emacaraig@evacgroup.com.au'],
                    cc: [],
                    body : data,
                    attachments: [],
                    subject : subj
                });

                email.send(() => {
                    res.send('ok');
                },
                () => {
                    res.send('not ok');
                });
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
    // this.render(req, res, 'index.hbs', options);
    res.render('index.hbs', options, (err, html) => {
      console.log(html);
    });
  }


  displaySearchLocation(req: Request, res: Response, next: NextFunction) {
  	this.render(req, res, 'locationService.hbs');
  }

  displayUploadForm(req: Request, res: Response, next: NextFunction) {
    // this.render(req, res, 'upload.hbs');
    res.render('upload.hbs', (err, html) => {
      console.log(html);
    });
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
