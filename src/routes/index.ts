import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { Sample } from '../models/sample';
import { User } from '../models/user.model';


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
    router.get('/test', (req: Request, res: Response, next: NextFunction) => {
      new IndexRoute().index(req, res, next);
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
  public index(req: Request, res: Response, next: NextFunction) {

    const user = new User(27);
    user.set('field_one', 'this is field one');
    user.set('field_num', 10);
    user.set('first_name', 'Erwin');
    user.set('user_name', 'Erwin Pogi');
    user.dbInsert();
    const l = user.load();
    l.then(() => {
      console.log(user.get('email'));
      console.log(user.getDBData());
    });

    
    //user.load.then(
    //    console.log(user.get('email'));
    //);
    //console.log(user.getDBData());
    //console.log(user.get('email'));
    /*
    setTimeout(() => {
      console.log(user.getDBData());
      console.log(user.get('email'));
    },3000);
    */
      // set options
    const options: Object = {
      'title': 'Evac Connect Platform',
      'message': 'Welcome To EvacConnect'
    };

    // render template
    this.render(req, res, 'index.hbs', options);
  }
}
