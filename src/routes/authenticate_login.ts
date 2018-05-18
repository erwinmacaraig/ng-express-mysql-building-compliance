import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
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

public async successValidation(req: Request, res: Response, userModel, signedInExpiry, toReturn?){
    const token = jwt.sign(
    {
        user_db_token: userModel.get('token'),
        user: userModel.get('user_id')
    },
    process.env.KEY, { expiresIn: signedInExpiry }
    );

    let response = {
        status: 'Authentication Success',
        message: 'Successfully logged in',
        token: token,
        data: {
            userId: userModel.get('user_id'),
            name: userModel.get('first_name')+' '+userModel.get('last_name'),
            email: userModel.get('email'),
            accountId: userModel.get('account_id'),
            roles : [],
            profilePic : ''
        }
    };

    let fileModel = new Files(),
        fileData = <any> [],
        wardenRoles = [];
    
    try{
        fileData = <any> await fileModel.getByUserIdAndType(userModel.get('user_id'), 'profile');
    }catch(e){
        fileData = false;
    }

    if(fileData !== false){
        response.data.profilePic = fileData[0].url;
    }

    try{
        wardenRoles = <any> await new UserEmRoleRelation().getEmRolesByUserId(userModel.get('user_id'));
        for(let role of wardenRoles){
            response.data['roles'].push({
                role_id : role['em_roles_id'],
                role_name : role['role_name'],
                is_warden_role : role['is_warden_role']
            });
        }
    }catch(e){ }

    try{
        let userRoles = await new UserRoleRelation().getByUserId(userModel.get('user_id'));
        for (let role of userRoles){
            response.data['roles'].push(role);
        }
    }catch(e){ }

    const now = moment().format('YYYY-MM-DD HH-mm-ss');
    userModel.set('last_login', now);

    try{
        await userModel.dbUpdate();
    }catch(e){ }

    if(toReturn){
        return response;
    }else{
        res.status(200).send(response);
    }

}

public validate(req: Request, res: Response, next: NextFunction, returnData?) {
    // set to 2 hours
    let signedInExpiry = 7200;
    if (req.body.keepSignedin) {
        signedInExpiry = signedInExpiry * 12;
    }

    if(returnData){
        req.body['username'] = returnData.username;
        req.body['password'] = returnData.password;
    }

    const user = new User();
    user.loadByCredentials(req.body.username, req.body.password).then(
        () => {

            if(user.get('verified') == 1){
                this.successValidation(req, res, user, signedInExpiry);
            }else{
                let action = user.get('action'),
                    now = moment(),
                    expiration = moment(user.get('expiration_date'), ['YYYY-MM-DD HH-mm-ss']),
                    expired = false;

                if(expiration.isBefore(now)){
                    expired = true;
                }

                res.status(401).send({
                    verified : false,
                    token_expired : expired,
                    status: 'Authentication Failed',
                    message: 'Please verify your account',
                    data: ['username', 'password', user.get('user_id')]
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
