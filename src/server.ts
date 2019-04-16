import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
import * as session from 'express-session';
import * as MemcachedStore from 'connect-memcached';

// All Routes here
import { IndexRoute } from './routes/index';
import { RegisterRoute } from './routes/register';
import { ForgotPasswordRequestRoute } from './routes/forgot.password';
import { AuthenticateLoginRoute } from './routes/authenticate_login';
import {  UserRelatedRoute } from './routes/user-related';
import {  UsersRoute } from './routes/users';

import { AwsRoute } from './routes/aws-ses';
import { AccountRoute } from './routes/account';
import { LocationRoute } from './routes/location';
import { TokenRoute } from './routes/token';
import { ComplianceRoute } from './routes/compliance';
import { PaymentRoute } from './routes/payment';
import { TeamRoute } from './routes/team';
import { ProductRoute } from './routes/product';
import { LMSRoute } from './routes/lms';
import { CourseRoute } from './routes/course';
import { ReportsRoute } from './routes/reports';
import { AdminRoute } from './routes/admin';

import * as cors from 'cors';
const defs = require('./config/defs.json');


import * as swaggerUi from 'swagger-ui-express';
const swaggerDocument = require('./config/swagger.json');

/**
 * The server.
 *
 * @class Server
 */
export class Server {

  public app: express.Application;

  /**
   * Bootstrap the application.
   *
   * @class Server
   * @method bootstrap
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  public static bootstrap(): Server {
    return new Server();
  }

  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    // create expressjs application
    this.app = express();

    // configure application
    this.config();

    // add routes
    this.routes();
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */

  public config() {


      // add static paths
      this.app.use(express.static(path.join(__dirname, 'public')));

      const memcachedStore = new MemcachedStore(session);

      // configure hbs
      this.app.set('views', path.join(__dirname, 'views'));
      this.app.set('view engine', 'hbs');

      // use logger middlware
      this.app.use(logger('dev'));

      // use json form parser middlware
      this.app.use(bodyParser.json());
      this.app.use(cookieParser());
      this.app.use(session({
        secret: 'evacconnect-true-session',
        key: 'evac-ssid',
        proxy: true,
        store: new memcachedStore({
          hosts: ['127.0.0.1:11211'],
          secret: 'evacconnect-memcached-store'
        }),
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 180 * 60 * 1000}
      }));
      // use query string parser middlware
      this.app.use(bodyParser.urlencoded({
        extended: true
      }));

      this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      // cors
      this.app.use(cors({
        origin: function(origin, callback) {
          // allow requests with no origin like mobile apps or curl requests
          if (!origin) {
            return callback(null, true);
          }
          if (defs['ALLOWED_ORIGINS'].indexOf(origin) === -1) {
            const message = 'Allow access from the specified origin ' + origin + ' is prohibited.';
            console.log(message);
            return callback(new Error('message'));
          }
          return callback(null, true);
        }
      }));
  }

  /**
  * Create router.
  *
  * @class Server
  * @method config
  * @return void
  */
  private routes() {
      let router: express.Router;
      router = express.Router();

      // IndexRoute
      IndexRoute.create(router);

      // Sign up or User registration route
      RegisterRoute.create(router);

      // Forgot password route
      ForgotPasswordRequestRoute.create(router);

      // Authenticate Login
      AuthenticateLoginRoute.create(router);

      // User Related Route
      UserRelatedRoute.create(router);
      // AWS Sample Route
      AwsRoute.create(router);

      // Account
      AccountRoute.create(router);

      // Locations
      LocationRoute.create(router);

      // Users
      UsersRoute.create(router);

      // TokenRoute
      TokenRoute.create(router);

      // TeamRoute
      TeamRoute.create(router);

      // ComplianceRoute
      ComplianceRoute.create(router);

      // PaymentRoute
      PaymentRoute.create(router);

      // ProductRoute
      ProductRoute.create(router);

      // Learning Management System Route
      LMSRoute.create(router);

      // CourseRoute
      CourseRoute.create(router);

      // ReportsRoute
      ReportsRoute.create(router);

      // Admin Route
      AdminRoute.create(router);

      this.app.use('/api/v1', router);

      // use router middleware
      this.app.use(router);
      
      this.app.use(function(req, res, next) {
        if ((!req.secure) && (req.get('X-Forwarded-Proto') !== 'https')) {
          // return res.redirect('https://' + req.get('Host') + req.url);
        }
        return next();
      });
      

      // catch 404 and forward to error handler
      this.app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
        return res.sendFile(path.join(__dirname, 'public/index.html'));
      });
  }
}
