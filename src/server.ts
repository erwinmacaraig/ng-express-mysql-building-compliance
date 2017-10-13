import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as logger from 'morgan';
import * as path from 'path';
import * as cors from 'cors';

import { IndexRoute } from './routes/index';
import { AuthenticateLoginRoute } from './routes/authenticate_login';

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

      // configure hbs
      this.app.set('views', path.join(__dirname, 'views'));
      this.app.set('view engine', 'hbs');

      // use logger middlware
      this.app.use(logger('dev'));

      // use json form parser middlware
      this.app.use(bodyParser.json());

      // use query string parser middlware
      this.app.use(bodyParser.urlencoded({
        extended: true
      }));

      // cors
      this.app.use(cors());

    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

      // Authenticate Login
      AuthenticateLoginRoute.create(router);

      this.app.use('/api/v1', router);

      // use router middleware
      this.app.use(router);

       // catch 404 and forward to error handler
       this.app.use(function(req: express.Request, res: express.Response, next: express.NextFunction) {
        return res.sendFile(path.join(__dirname, 'public/index.html'));
    });
  }
}
