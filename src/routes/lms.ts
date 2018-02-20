import { BaseRoute } from './route';
import { NextFunction, Request, Response, Router } from 'express';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import * as fs from 'fs';
import * as moment from 'moment';

import { Course } from '../models/course.model';
import { CourseUserRelation } from '../models/course-user-relation.model';
import { Scorm } from '../models/scorm.model';

export class LMSRoute extends BaseRoute {
  constructor() {
    super();
  }

  public static create(router: Router) {
    router.post('/lms/launch-course/', (req: Request, res: Response, next: NextFunction) => {
      new LMSRoute().initializeLRS(req, res, next).then((data) => {
        console.log(data);
        return res.render('lms-launcher.hbs', data);
      }).catch((e) => {
        console.log(e);
        return res.render('lms-launcher-error.hbs', {});
      });
    });

    router.get('/lms/getParameter', (req: Request, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      scorm.getDataModelVal(req.query.relation, req.query.param).then((param) => {
        console.log('data model', param);
        return res.status(200).send({
          'value': param
        });
      }).catch((e) => {
        return res.status(400).send({'status': false});
      });
    });

    router.post('/lms/setParameterValue/', (req: Request, res: Response, next: NextFunction) => {
      const scorm = new Scorm();
      scorm.setDataModelVal(req.body.relation, req.body.param, req.body.value).then((data) => {
        return res.status(200).send({
          'status': true
        });
      }).catch((e) => {
        return res.status(400).send({
          'status': false
        });
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
      relation = await courseUserRelation.getRelation(req.body.userId, req.body.courseId);
      courseData['course_user_relation_id'] = relation;
      console.log('relation = ' + relation);
    } catch (e) {
      console.log(e);
    }
    await scorm.init(relation);
    return courseData;

  } // end initializeLRS
} // end of class
