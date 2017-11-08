import { NextFunction, Request, Response, Router } from 'express';

import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { InvitationCode  } from '../models/invitation.code.model';
import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Utils } from '../models/utils.model';
import * as validator from 'validator';
import { EmailSender } from '../models/email.sender';
import { BlacklistedEmails } from '../models/blacklisted-emails';

export class UserRelatedRoute extends BaseRoute {
  public static create(router: Router) {
    router.get('/person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new  UserRelatedRoute().getUserPersonalInfo(req, res);
    });

    router.patch('/update-person-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().updateUserPersonalInfo(req, res);
    });

    router.get('/person-invi-code', (req: Request, res: Response, next: NextFunction) => {
      new UserRelatedRoute().getUserInvitationCode(req, res, next);
    });

    router.get('/listAllFRP', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().listAllFRP(req, res);
    });

    router.get('/listAllTRP', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().listAllTRP(req, res);
    });

    router.post('/validate-info', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response)=> {
      new UserRelatedRoute().processValidation(req, res);
    });

    router.get('/list-validation-question', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new UserRelatedRoute().generateValidationQuestions(req, res);
    });
  }

  public generateValidationQuestions(req: AuthRequest, res: Response) {
    let role_id = 0;
    let account_id = 0;
    console.log(req.query);
    let numberOfValidationQuestions = 1;
    let currentQuestionIndex = req.query.currentQ || 0;
    let currentQuestion = 0;
    if ('account_id' in req.query) {
      account_id = req.query.account_id;
    }
    if ('role_id' in req.query) {
      role_id = req.query.role_id;
    }
    const utils = new Utils();
    // get total validation for the user and first question id
    utils.queryValidationQuestions(role_id).then((results: any[]) => {
      numberOfValidationQuestions = results.length;
      if (currentQuestionIndex > results.length) {
        currentQuestionIndex = 0;
      }
      console.log(results);
      console.log(results[0]);
      console.log(results[1]);
      console.log(results[currentQuestionIndex]);
      console.log('currentIndex = ' + currentQuestionIndex);
      currentQuestion = results[currentQuestionIndex]['question_id'];
      utils.deployQuestions(account_id, 0, req.user['user_id'], 2, currentQuestion).then((data) => {
        console.log(data);
        return res.status(200).send({
          qid: currentQuestionIndex,
          question: results[currentQuestionIndex]['question'],
          choices: [10, data, 5]
        });
      });
    });




  }

  public getUserInvitationCode(req: Request, res: Response, next: NextFunction) {
    const queryParamCode = req.query.code;
    const invitation_code = new InvitationCode();


    invitation_code.getInvitationByCode(queryParamCode, false).then((dbData) => {
      console.log('dbData', dbData);
      return res.status(200).send({
        status: 'OK',
        message: 'Query Successful',
        data: {
          invitation_code_id: dbData['invitation_code_id'],
          code: dbData['code'],
          first_name: dbData['first_name'],
          last_name: dbData['last_name'],
          email: dbData['email'],
          location_id: dbData['location_id'],
          account_id: dbData['account_id'],
          role_id: dbData['role_id'],
          was_used: dbData['was_used']
        }
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
      });
    });

  } // end getUserInvitationCode
  public getUserPersonalInfo(req: AuthRequest, res: Response) {

    const queryParamUser = req.query.userId;
    const user = new User(queryParamUser);
    const account = new Account();

    user.load().then(() => {
      account.getByUserId(queryParamUser).then(() => {
        return res.status(200).send({
          first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: account.get('account_name'),
          occupation: user.get('occupation')
        });
      }).catch((e) => {
        return res.status(200).send({
          first_name: user.get('first_name'),
          last_name: user.get('last_name'),
          email:  user.get('email'),
          phone_number: user.get('phone_number'),
          user_name: user.get('user_name'),
          account_name: '',
          occupation: user.get('occupation')
          });
      });
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad Request',
        message: e
        });
      });
  }

  public updateUserPersonalInfo(req: AuthRequest, res: Response) {

    // validation checks
    let isValid = true;
    let errMessage = 'Invalid ';

    if (!validator.isEmail(req.body.email)) {
      isValid = false;
      errMessage += 'email ';
    }
    if (validator.isEmpty(req.body.first_name)) {
      isValid = false;
      errMessage += ' person name';
    }
    if (validator.isEmpty(req.body.last_name)) {
      isValid = false;
      errMessage += ' last name';
    }
    if (!isValid) {
      return res.status(400).send({
        status: 'Bad Request',
        message: errMessage
      });
    }

    const saveAction = () => {
      const user = new User(req.user.user_id);
      user.load().then(() => {
        user.create(req.body).then(() => {
          return res.status(200).send({
            'message': 'Success'
          });
        }).catch((e) => {
          return res.status(400).send({
            status: 'Bad Request',
            message: e
            });
        });
      }).catch((e) => {
        return res.status(400).send({
          status: 'Bad Request',
          message: e
          });
      });
    };

    const blacklistedEmails = new BlacklistedEmails(),
      isBlacked = blacklistedEmails.isEmailBlacklisted(req.body.email);

    if(!isBlacked){
      const userEmail = new User();
      userEmail.getByEmail(req.body.email).then(
        (userData) => {
          if(userData['user_id'] == req.user.user_id){
            saveAction();
          }else{
            return res.status(400).send({
              status: false,
              message: 'Email taken'
            });
          }
        },
        () => {
          saveAction();
        }
      );
    }else{
      return res.status(400).send({
        status: false,
        message: 'Domain blacklisted'
      });
    }
  }

  public listAllFRP(req: AuthRequest, res: Response) {
    const utils = new Utils();
    // const queryParamUser = req.query.userId;
    let account_id = 0;
    if ('account_id' in req.query) {
      account_id = req.query.account_id;
    }
    console.log(req.query);
    utils.listAllFRP(account_id).then((list) => {
      return res.status(200).send({
        status: 'Success',
        data: list
      });
    }).catch((e) => {
      return res.status(400).send({
        message: e
      });
    });
  }

  public listAllTRP(req: AuthRequest, res: Response) {
    const utils = new Utils();
    console.log('TRP', req.query);
    if (!('location_id' in req.query)) {
      return res.status(400).send({
        message: 'Bad Request. Invalid parameters.'
      });
    }
    const location_id = req.query.location_id;
    let account_id = 0;
    if ('account_id' in req.query) {
      account_id = req.query.account_id;
    }
    utils.listAllTRP(location_id, account_id).then((list) => {
      return res.status(200).send({
        status: 'Success',
        data: list
      });
    }).catch((e) => {
      return res.status(400).send({
        message: e
      });
    });
  }

  public processValidation(req: AuthRequest, res: Response) {
    const user = req.user;
    const role_id = req.body.role_id;
    const location_id = req.body.location_id;
    const account_id = req.body.account_id;
    const userDomain =  user['email'].substr( user['email'].indexOf('@') + 1,  user['email'].length);
    const approver = new User(req.body.approvalFrom);
    const criteria = req.body.criteria;
    console.log(req.body);
    // get all user details
    // console.log(user);
    console.log(req.body);
    const utils = new Utils();
    // save request validation


    const requestValidationData = {
      'user_id': user['user_id'],
      'approvalFrom': parseInt(req.body.approvalFrom, 10)
    };
    approver.load().then(() => {
      utils.getAccountLocationRelationInfo(location_id, account_id).then((r) => {
        utils.storeRequestValidation(requestValidationData).then((data) => {
          r['role_text'] = (role_id == 1) ? 'Building Manager' : 'Tenant';

          const emailOpts = {
            'from': 'allantaw2@gmail.com',
            'fromName': 'EvacConnect Compliance Management System',
            'to': [approver.get('email')],
            'subject': 'User Validation',
            'body': `
            Hi <strong>${approver.get('first_name')} ${approver.get('last_name')}</strong>,
            <br /> <br />
            This person is trying to register as a <strong>${r['role_text']}</strong> to <strong>${r['account_name']}</strong>.
            <br /><br />Please refer to the information below:<br />
            Name: <strong>${user['first_name']}</strong><br />
            Last Name: <strong>${user['last_name']}</strong> <br />
            Email: <strong> ${user['email']}</strong> <br />
            Submitted TRP Code: <strong>${req.body.trp_code}</strong><br />
            Domain Name Submitted: <strong> ${userDomain}</strong> <br />
            Location:
            <strong>${r['name']} ${r['unit']} ${r['street']} ${r['city']} ${r['state']} ${r['postal_code']}</strong>
            <br /><br />
            Please click on the link below to verify this user or just ignore this message. <br />
            <a href="${req.protocol}://${req.get('host')}/user-account-validation/${data}/${req.body.approvalFrom}/${user['user_id']}/${account_id}/${location_id}"
            target="_blank" style="text-decoration:none; color:#0277bd;">
            ${req.protocol}://${req.get('host')}/user-account-validation/${data}/${req.body.approvalFrom}/${user['user_id']}/${account_id}/${location_id}
            </a>
            <br /><br />
            Thank you.
            `,
          };
          const email = new EmailSender(emailOpts);
          email.send((d) => console.log(d),
          (err) => console.log(err));

          return res.status(200).send({
            status: 'OK',
            data: data
          });
        }).catch((e) => {
          console.log(e);
          return res.status(400).send({
            status: 'Bad request storeRequestValidation',
            data: e
          });
        });// request validation

      }); // get UserAccountRoleLocationInfo
    }).catch((e) => {
      return res.status(400).send({
        status: 'Bad request approver',
        data: e
      });
    }); // load
   // get info to be validated



  }
}
