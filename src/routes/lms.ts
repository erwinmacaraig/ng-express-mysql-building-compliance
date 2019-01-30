import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { AuthRequest } from '../interfaces/auth.interface';
import * as moment from 'moment';

import { Course } from '../models/course.model';
import { CourseUserRelation } from '../models/course-user-relation.model';
import { Scorm } from '../models/scorm.model';

import { UserTrainingModuleRelation } from '../models/user.training.module.relation.model';
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

    router.post('/lms/setParameterValue/', (req: Request, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      scorm.setDataModelVal(req.body.relation, 'last_accessed', moment().format('YYYY-MM-DD HH:mm:ss')).then((data) => {
        
      });

      scorm.setDataModelVal(req.body.relation, req.body.param, req.body.value).then((data) => {
        // Need to update user_training_module_relation

        // Scorm 1.1 and Scorm 1.2
        // console.log(req.body);        
        /*
        if (req.body.param == 'cmi.core.lesson_status' && (req.body.value == 'completed' || req.body.value == 'passed')) {
          const courseUserRelObj = new CourseUserRelation(req.body.relation);
          courseUserRelObj.updateUserTrainingCourseCertificate().then((result) => {
            console.log('Update certification');
            return res.status(200).send({
              'status': true
            });
          }).catch((e) => {
            console.log(e);
            return res.status(200).send({
              'status': true
            });
          });

        } else {
          return res.status(200).send({
            'status': true
          });
        }
        */
      }).catch((e) => {
        return res.status(400).send({
          'status': false
        });
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

    if (loginUserId != postedUserId) {
      res.status(400).send({
        message: 'You are not allowed to load this module'
      });
    }
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
