import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { Sample } from '../models/sample';
import { User } from '../models/user.model';
import  * as fs  from 'fs';
import * as path from 'path';

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

    /*router.get('/static-data', (req: Request, res: Response, next: NextFunction) => {

      console.log(__dirname);
      console.log(path.join(__dirname, 'config/static-data.json'));

      fs.readFile(path.join(__dirname, 'config/static-data.json'), (err, data) => {
        console.log(err);
        console.log(data);
        res.send(data);
      });
      
    });*/

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

    /*
    const user = new User(27);
    user.set('field_one', 'this is field one');
    user.set('field_num', 10);
    user.set('first_name', 'Gilmore');
    user.set('user_name', 'Erwin Pogi');
    user.set('last_name', 'Happy');
    user.set('email', 'test@test.com');
    user.set('phone_number', '12345');
    user.set('mobile_number', '67891234');
    user.set('mobility_impaired', '1');
    user.set('time_zone', '');
    user.set('can_login', '1');
    user.set('password', '1kasnfsklnwedssadfsd');
    user.set('account_id', '1');
    user.set('evac_role', 'admin');
    user.dbInsert().then(
     () => {
       console.log(user.ID());
       user.load().then(() => {
        console.log(user.get('email'));
        console.log(user.getDBData());
        /*
        user.set('password', 'qwertypassword');
        user.write(user.getDBData()).then(
          () => {
            console.log("New password is ", user.get('password'));
          }
        );

      });
     }
    );
*/
/*
    // load a new user
    const userTwo = new User(15861);
    userTwo.load().then(() => {
      console.log('old password', userTwo.get('password'));
      userTwo.set('password', 'qwertypassword');
      userTwo.write().then(() => {
        console.log(userTwo.get('password'));
      });

    });

user.set();
    user.set('field_num', 10);
    user.set('first_name', 'Gilmore');
    user.set('user_name', 'Erwin Pogi');
    user.set('last_name', 'Happy');
    user.set('email', 'test@test.com');
    user.set('phone_number', '12345');
    user.set('mobile_number', '67891234');
    user.set('mobility_impaired', '1');
    user.set('time_zone', '');
    user.set('can_login', '1');
    user.set('password', '1kasnfsklnwedssadfsd');
    user.set('account_id', '1');
    user.set('evac_role', 'admin');


*/

const u = new User();
u.create({
  'field_one': 'this is field one',
  'first_name' : 'Software',
  'user_name': 'MyNameIs',
  'last_name': 'What',
  'password': 'testpassword123',
  'email': 'testuser@gmail.com',
  'phone_number': '123459876',
  'mobile_number': '67893451234',
  'mobility_impaired': 0,
  'account_id': '1',
  'evac_role': 'user'
}).then(() => {
  console.log(u.ID());
});

    /*
 () => {
        user.load().then(() => {
          console.log(user.get('email'));
          console.log(user.getDBData());
        });
      }
    */

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
