import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { TrainingCertification } from '../models/training.certification.model';
import { UserTrainingModuleRelation } from '../models/user.training.module.relation.model';
import { UserRoleRelation } from '../models/user.role.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { Files } from '../models/files.model';
import { Token } from '../models/token.model';
import { Location } from '../models/location.model';

import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { LocationAccountUser } from '../models/location.account.user';
import { Account } from '../models/account.model';

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

        const myLocationIds = [];
        const buildings = [];

        let response = {
            status: 'Authentication Success',
            message: 'Successfully logged in',
            token: token,
            expiresIn: signedInExpiry, 
            data: {
                userId: userModel.get('user_id'),
                name: userModel.get('first_name')+' '+userModel.get('last_name'),
                email: userModel.get('email'),
                mobile: userModel.get('mobile_number'),
                first_name: userModel.get('first_name'),
                last_name: userModel.get('last_name'), 
                account_has_online_training: 0,
                accountId: userModel.get('account_id'),
                accountName: '',
                evac_role: userModel.get('evac_role'),
                roles : [],
                profilePic : '',
                account_roles: {},
                subscription: {},
                buildings: []
            }
        };
        let roleOfAccountInLocationObj = {};
        let accountUserData = [];
        let fileModel = new Files(),
            fileData = <any> [],
            wardenRoles = [];

        try {
            let accountData = await new Account(userModel.get('account_id')).load();
            response.data.accountName = accountData['account_name'];
            response.data['account_has_online_training'] = accountData['online_training'];
        } catch (e) {
            response.data['account_has_online_training'] = 0;
        }
        fileData = false;
        /*
        try{
            fileData = <any> await fileModel.getByUserIdAndType(userModel.get('user_id'), 'profile');
            fileData[0].url = await new Utils().getAWSSignedURL(`${fileData[0].directory}/${fileData[0].file_name}`);
        }catch(e){
            fileData = false;
        }
        

        if(fileData !== false){
            response.data.profilePic = fileData[0].url;
        }
        */
        try{
            wardenRoles = <any> await new UserEmRoleRelation().getEmRolesByUserId(userModel.get('user_id'));
            for(let role of wardenRoles){
                response.data['roles'].push({
                    role_id : role['em_roles_id'],
                    location_id: role['location_id'],
                    role_name : role['role_name'],
                    is_warden_role : role['is_warden_role']
                });
                myLocationIds.push(role['location_id']);
            }
        }catch(e){ }

        try {
            const training = new TrainingCertification();
            const myModules = await new UserTrainingModuleRelation().getMyTrainingModules(userModel.get('user_id'));
            const trIds = [];
            
            for (let module of myModules) {
                if (trIds.indexOf(module['training_requirement_id']) == -1) {
                    trIds.push(module['training_requirement_id']);
                    const activeTrainingCert = await training.getActiveCertificate(userModel.get('user_id'),module['training_requirement_id']);
                    if (activeTrainingCert.length == 0) {
                        await new UserTrainingModuleRelation().resetMyTrainingModules(userModel.get('user_id'), module['training_requirement_id']);
                    }
                }
            }

        } catch(e) {
            console.log(`There was an error processing training modules`,e);
        }

        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(userModel.get('account_id'));
            // response.data['account_roles'] = { ...roleOfAccountInLocationObj };
        } catch(err) {
            console.log('authenticate route get account role relation in locatio', err);
        }

        try {
            accountUserData = await new LocationAccountUser().getByUserId(userModel.get('user_id'));
            for(let data of accountUserData) {
                if (data['location_id'] in roleOfAccountInLocationObj) {
                    response.data['roles'].push({
                        role_id: roleOfAccountInLocationObj[data['location_id']]['role_id'],
                        location_id: data['location_id'],
                        user_id:userModel.get('user_id') 
                    });
                    myLocationIds.push(data['location_id']);
                }
            }
        } catch(e) {
            console.log(' authenticate route, error getting in location account user data', e);
        }

        try {
            // get building locations

            let temp = await new Location().immediateParent(myLocationIds);
            for (let loc of temp) {
                if (loc['buildingId'] == null && buildings.indexOf(loc['locId']) == -1) {
                    buildings.push(loc['locId']);
                } else if (loc['buildingId'] !== null && buildings.indexOf(loc['buildingId']) == -1) {
                    buildings.push(loc['buildingId']);
                }
            }
            response.data.buildings = buildings;
        } catch(e) {
           console.log(e);
        }

        try {
            response.data.subscription = await Account.getAccountSubscription(userModel.get('account_id'));
        } catch(e) {
            console.log('Error in getting account subscriptions at authenticate login', e);
        }

        

        const now = moment().format('YYYY-MM-DD HH-mm-ss');
        userModel.set('last_login', now);
        userModel.set('profile_completion', 1);

        try{
            await userModel.dbUpdate();
        }catch(e){ }

        if(toReturn){
            return response;
        }else{
            res.status(200).send(response);
        }

    }

    public async validate(req: Request, res: Response, next: NextFunction, returnData?) {
        if (req.body['username'] && req.body['username'].length < 4) {
            res.status(401).send({
                status: 'Authentication Failed',
                message: 'Invalid username/password',
                
            });
        }

        if (req.body['password'] && req.body['password'].length < 4) {
            res.status(401).send({
                status: 'Authentication Failed',
                message: 'Invalid username/password',
               
            });
        }


        
        // set to 2 hours
        let signedInExpiry = 7200;
        if (req.body.keepSignedin) {
            signedInExpiry = signedInExpiry * 12;
        }

        if(returnData){
            req.body['username'] = returnData.username;
            req.body['password'] = returnData.password;
        }

        let token = this.generateRandomChars(20);

        let toRespondCall = (user) => {
            if(user.get('verified') == 1){
                this.successValidation(req, res, user, signedInExpiry);
            }else{
                let action = user.get('action'),
                    now = moment(),
                    expiration = moment(user.get('expiration_date'), ['YYYY-MM-DD HH:mm:ss']),
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
        };

        const user = new User();

        try{
            await user.loadByCredentials(req.body.username, req.body.password);

            if(user.get('token_id') == null){
                let 
                tokenModel = new Token(),
                expiration = moment( moment().subtract(1, 'day'), ['YYYY-MM-DD HH:mm:ss']);

                await tokenModel.create({
                    'token' : token,
                    'action' : 'verify',
                    'verified' : 1,
                    'expiration_date' : expiration.format('YYYY-MM-DD HH:mm:ss'),
                    'id' : user.get('user_id'),
                    'id_type' : 'user_id'
                });

                user.set('token', token);
                user.set('verified', 1);
                await user.dbUpdate();

                await toRespondCall(user);
            }else{
                await toRespondCall(user);
            }
        }catch(e){
            res.status(401).send({
                status: 'Authentication Failed',
                message: e,
                data: ['username', 'password']
            });
        }
    }
}
