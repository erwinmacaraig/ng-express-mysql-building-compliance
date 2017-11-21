import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { Files } from '../models/files.model';
import Validator from 'better-validator';
import * as md5 from 'md5';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';

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
    user.loadByCredentials(req.body.username, req.body.password).then(
        () => {

            if(user.get('verified') == 1){
                const token = jwt.sign(
                {
                    user_db_token: user.get('token'),
                    user: user.get('user_id')
                }, 
                process.env.KEY, { expiresIn: signedInExpiry }
                );

                let response = {
                    status: 'Authentication Success',
                    message: 'Successfully logged in',
                    token: token,
                    data: {
                        userId: user.get('user_id'),
                        name: user.get('first_name')+' '+user.get('last_name'),
                        email: user.get('email'),
                        accountId: user.get('account_id'),
                        roles : {},
                        profilePic : ''
                    }
                },

                fileCB = (fileData) => {
                    if(fileData !== false){
                        response.data.profilePic = fileData[0].url;
                    }

                    new UserRoleRelation().getByUserId(user.get('user_id')).then(
                        (userRoles) => {
                            response.data['roles'] = userRoles;
                            return res.status(200).send(response);
                        },
                        (m) => {
                            return res.status(200).send(response);
                        }
                    );
                }

                let fileModel = new Files();
                fileModel.getByUserIdAndType(user.get('user_id'), 'profile').then(
                    (fileData) => {
                        fileCB(fileData);
                    },
                    () => {
                        fileCB(false);
                    }
                );
            }else{
                res.status(401).send({
                    verified : false,
                    status: 'Authentication Failed',
                    message: 'Please verify your account',
                    data: ['username', 'password']
                });
            }

        }, (e) => {
            res.status(401).send({
                status: 'Authentication Failed',
                message: e,
                data: ['username', 'password']
            });
        });

}
}
