import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
import * as session from 'express-session';
import * as MemcachedStore from 'connect-memcached';

import * as http from 'http';
import * as url from 'url';

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
<<<<<<< HEAD
import { ComplianceRoute } from './routes/compliance';
=======
import { PaymentRoute } from './routes/payment';
import { TeamRoute } from './routes/team';
import { ProductRoute } from './routes/product';
>>>>>>> develop

import * as cors from 'cors';


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
      this.app.use(cors());
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

      //ComplianceRoute
      ComplianceRoute.create(router);

      // PaymentRoute
      PaymentRoute.create(router);

      // ProductRoute
      ProductRoute.create(router);

      this.app.use('/api/v1', router);

      // use router middleware
      this.app.use(router);

      // catch 404 and forward to error handler
      this.app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
        return res.sendFile(path.join(__dirname, 'public/index.html'));
      });
  }
}
