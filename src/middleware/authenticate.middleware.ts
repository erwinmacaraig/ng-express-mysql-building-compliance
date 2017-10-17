import { User } from '../models/user.model';

export class MiddlewareAuth {
  public authenticate: any;
    constructor() {
      this.authenticate = (req, res, next) => {
        const token = req.header('authorization');
        User.getByToken(token).then((user) => {
          if (!user) {
            return Promise.reject('No such user found.');
          }
          req.user = user;
          req.token = token;
          next();
        }).catch((e) => {
          res.status(401).send({
            'error': 'Not Authenticated'
          });
        });
      };
    }
}
