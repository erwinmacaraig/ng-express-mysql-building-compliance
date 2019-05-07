import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { AuthRequest } from '../interfaces/auth.interface';


import * as moment from 'moment';

import { Course } from '../models/course.model';
import { CourseUserRelation } from '../models/course-user-relation.model';
import { Scorm } from '../models/scorm.model';
import { TrainingCertification } from '../models/training.certification.model';
import { TrainingRequirements } from '../models/training.requirements';
import { UserTrainingModuleRelation } from '../models/user.training.module.relation.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { User } from '../models/user.model';


export class LMSRoute extends BaseRoute {
  constructor() {
    super();
  }

  public static create(router: Router) {
    router.post('/lms/launch-course/', (req: Request, res: Response, next: NextFunction) => {
      new LMSRoute().initializeLRS(req, res, next).then((data) => {
        // console.log(data);
        return res.render('lms-launcher.hbs', data);
      }).catch((e) => {
        // console.log(e);
        return res.render('lms-launcher-error.hbs', {});
      });
    });

    router.post('/lms/initLRS/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      scorm.init(req.body.relation).then((data) => {
        return res.status(200).send({'status': data});
      }).catch((e) => {
        return res.status(400).send({'status': false});
      });
    });

    router.post('/lms/initLearningModule/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      new LMSRoute().initializeLearning(req, res, next);
    });

    router.post('/lms/loadUserTrainingModule/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
      new LMSRoute().loadUserTrainingModule(req, res, next);
    });


    router.get('/lms/getParameter', (req: Request, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      scorm.getDataModelVal(req.query.relation, req.query.param).then((param) => {
        // console.log('data model', param);
        return res.status(200).send({
          'value': param
        });
      }).catch((e) => {
        return res.status(400).send({'status': false});
      });
    });

    router.post('/lms/setParameterValue/', async (req: Request, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      // console.log(req.body);
      let course_completed = 0;
      scorm.setDataModelVal(req.body.relation, 'last_accessed', moment().format('YYYY-MM-DD HH:mm:ss'));
      scorm.setDataModelVal(req.body.relation, req.body.param, req.body.value);
      if (req.body.param == 'cmi.core.lesson_status' && (req.body.value == 'completed' || req.body.value == 'passed')) { 
        const userToTrainingModuleRelation = new UserTrainingModuleRelation(req.body.relation);                
        const userTrainingModuleData = await userToTrainingModuleRelation.load();
        userTrainingModuleData['completed'] = 1;
        userTrainingModuleData['dtCompleted'] = moment().format('YYYY-MM-DD');
        await userToTrainingModuleRelation.create(userTrainingModuleData);
        const trainingRqmtObj = new TrainingRequirements(userTrainingModuleData['training_requirement_id']);
        scorm.setDataModelVal(req.body.relation, 'cmi.core.exit', 'logout');
        scorm.setDataModelVal(req.body.relation, 'cmi.suspend_data', '');
        /*check the completion of the whole training requirement */
        const user = await new User(userTrainingModuleData['user_id']).load();
        let requirementModules = await trainingRqmtObj.getTrainingModulesForRequirement(userTrainingModuleData['training_requirement_id'], user['account_id']);
        if (requirementModules.length == 0) {
          requirementModules = await trainingRqmtObj.getTrainingModulesForRequirement(userTrainingModuleData['training_requirement_id'], 0);
        }        
        //********* DEBUG CODE ********* */
        //console.log('requirementModules', requirementModules);
        let completed = 0;
        // retrieve user modules
        const availableUserTrainingModules = await userToTrainingModuleRelation.trainingRequirementModuleStatuses(userTrainingModuleData['user_id'], userTrainingModuleData['training_requirement_id']); 
        //********* DEBUG CODE ********* */
        //console.log('availableUserTrainingModules', availableUserTrainingModules);
        
        // cross reference
        for ( let mod of requirementModules ) {
          for(let userModule of availableUserTrainingModules) {
            if (mod['training_module_id'] == userModule['training_module_id'] && userModule['completed'] == 1) {
              completed++;
              break;
            }
          }
        }
        if (requirementModules.length == completed) {
          let trainingCertObj = new TrainingCertification();
          await trainingCertObj.checkAndUpdateTrainingCert({
            'training_requirement_id': userTrainingModuleData['training_requirement_id'],
            'user_id': userTrainingModuleData['user_id']
          });          
          trainingCertObj = null;
          let emroles = new UserEmRoleRelation();
          const emRolesInfoArr = await emroles.getEmRolesFilterBy({
              user_id: userTrainingModuleData['user_id'],
              distinct: 'em_role_id' 
          });
          const myEmRoleIds = (emRolesInfoArr[0] as Array<number>);
          let gofr_trid = 0;
          if (myEmRoleIds.indexOf(8) != -1) {
            // Get training requirement for GOFR 
            const data = await trainingRqmtObj.allEmRolesTrainings();
            for (let dref of data) {
              if (dref['em_role_id'] == 8) {
                gofr_trid = dref['training_requirement_id'];
                break;
              }
            }
            trainingCertObj = new TrainingCertification();
            await trainingCertObj.checkAndUpdateTrainingCert({
              'training_requirement_id': gofr_trid,
              'user_id': userTrainingModuleData['user_id']
            });
          }

        }
        //console.log('TOTAL COMPLETED: ' + completed);
        course_completed = completed;
      }
      return res.status(200).send({
        'status': true,
        'course_completed': course_completed
      });
    });

    router.post('/lms/logoutCourse', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response) => {
      const scorm = new Scorm();
      scorm.setDataModelVal(req.body.relation, 'cmi.core.exit', 'logout');
      const status = await scorm.getDataModelVal(req.body.relation, 'cmi.core.lesson_status'); 
      if (status == 'completed' || status == 'passed') {
        scorm.setDataModelVal(req.body.relation, 'cmi.suspend_data', '');
      }
      return res.status(200).send({
        lesson_status: status
      });

    });

    router.get('/lms/getAllCourses/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      const courseUserRelation = new CourseUserRelation();
      courseUserRelation.getAllCourseForUser(req.user.user_id).then((courses) => {
        return res.status(200).send({
          'courses': courses
        });               
      }).catch((e) => {
        return res.status(400).send({'message': 'No course registered for this user - ' + req.user.user_id});
      });
    });

    router.post('/lms/logoutModule', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response) => {
      const scorm = new Scorm();
      // scorm.setDataModelVal(req.body.relation, 'cmi.core.exit', 'logout');
      const status = await scorm.getDataModelVal(req.body.relation,'cmi.core.lesson_status'); 
      if (status == 'completed' || status == 'passed') {
        scorm.setDataModelVal(req.body.relation, 'cmi.suspend_data', '');
      }
      return res.status(200).send({
        lesson_status: status
      });

    });

  } // end of create

  public async initializeLRS(req, res, next) {
    const course = new Course(req.body.courseId);
    const courseData = await course.load();
    const courseUserRelation = new CourseUserRelation();
    let relation = 0;
    const scorm = new Scorm();
    try {
      relation = await courseUserRelation.getRelation({'user': req.body.userId, 'course': req.body.courseId});
      courseData['course_user_relation_id'] = relation;
      // console.log('relation = ' + relation);
    } catch (e) {
      console.log(e);
    }
    await scorm.init(relation);
    return courseData;
  } // end initializeLRS

  public loadUserTrainingModule(req: AuthRequest, res: Response, next: NextFunction) {
    const scorm = new Scorm();
    scorm.initModule(req.body.user_training_module_relation_id)
    .then((data) => {
      return res.status(200).send({'message': 'Successful', 'status': data});
    }).catch((e) => {
      console.log('lms route method loadUserTrainingModule', e);
      return res.status(200).send({'message': 'Fail', 'status': false});
    });

  }
  
  public async initializeLearning(req: AuthRequest, res: Response, next: NextFunction) {
    const userTrainingModuleRelationObj = new UserTrainingModuleRelation();
    const loginUserId = req.user.user_id;
    const postedUserId = req.body.user_id;
    const trainingReqId = req.body.tr_id;
    const module_id = req.body.module_id;
    let userTrainingModuleRelationId = 0;
    const scorm = new Scorm();
    const userEMRoleObj = new UserEmRoleRelation();

    if (loginUserId != postedUserId) {
      res.status(400).send({
        message: 'You are not allowed to load this module'
      });
    }
    // check user if he/she has both warden and gofr role

    try {
      await userTrainingModuleRelationObj.create({
        training_requirement_id: trainingReqId,
        user_id: loginUserId,
        training_module_id: module_id
      });
      if (req.body.user_training_module_relation_id) {
        userTrainingModuleRelationId = req.body.user_training_module_relation_id;
      } else {
        userTrainingModuleRelationId = await userTrainingModuleRelationObj.userTrainingModuleRelationId(loginUserId, trainingReqId, module_id);
      } 
      /*
      return res.status(200).send({
        message: 'Success',
        user_training_module_relation_id:userTrainingModuleRelationId 
      })
      */
      
    } catch(e) {
      console.log('lms route, calling initializeLearning method', e);
      return res.status(400).send({
        message: 'There was a problem retrieving user training module from the server'
      });
    }

    try {
      await scorm.initModule(userTrainingModuleRelationId);
      return res.status(200).send({
        message: 'Success',
        user_training_module_relation_id: userTrainingModuleRelationId  
      });
    } catch(e) {
      console.log('Cannot initialize learning record store at lms route initializeLearning', e);
      return res.status(400).send({
        message: 'Fail. Cannot initialize learning record store'        
      });
    }

  }



} // end of class