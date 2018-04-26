import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { LocationAccountRelation } from '../models/location.account.relation';
import { LocationAccountUser } from '../models/location.account.user';
import { Course } from '../models/course.model';
import { CourseUserRelation } from '../models/course-user-relation.model';
import { TrainingRequirements } from '../models/training.requirements';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { TrainingCertification } from '../models/training.certification.model';
import { UserRoleRelation } from '../models/user.role.relation.model';

import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';

import * as moment from 'moment';
const defs = require('../config/defs');

export class CourseRoute extends BaseRoute {

	public static create(router: Router) {

	   	router.get('/courses/get-all', (req: Request, res: Response) => {
	   		new CourseRoute().getAllCourses(req, res);
	   	});

	   	router.get('/courses/get-training-requirements', (req: Request, res: Response) => {
	   		new CourseRoute().getTrainingRequirements(req, res);
	   	});

	   	router.get('/courses/get-course-user-ralation', (req: Request, res: Response) => {
	   		new CourseRoute().getCourseUserRelation(req, res);
	   	});

	   	router.post('/courses/save-account-courses', (req: Request, res: Response) => {
	   		new CourseRoute().saveAccountCourses(req, res);
	   	});

	   	router.post('/courses/disable-users-from-courses', (req: Request, res: Response) => {
	   		new CourseRoute().disableUsersFromCourses(req, res);
	   	});

	   	router.get('/courses/my-courses/:user_id', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new CourseRoute().getMyCourses(req, res);
	   	});

	   	router.get('/courses/counts-building-trainings', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new CourseRoute().getCountsBuildingTrainings(req, res);
	   	});
   	}

   	response = {
   		status : false,
   		data : [],
   		message : ''
   	};

	constructor() {
		super();
	}
  public async getMyCourses(req: AuthRequest, res: Response){
    const userId = req.params.user_id;
    const response = {
      status : false, data : [], message : ''
    };
    const courseUserRelation = new CourseUserRelation();
    try {
      const courses = <any> await courseUserRelation.getAllCourseForUser(userId);
      for(const cor of courses){
        cor['timestamp_formatted'] = moment(cor['dtTimeStamp']).format('MMM. DD, YYYY');
      }
      response.status = true;
      response.data = courses;
    } catch(e) {
      console.log('course.ts', e, 'getMyCourses');
      response.data = [];
    }
    res.send(response);
  }

	public async disableUsersFromCourses(req: Request, res: Response){
		let accountId = req.body.account_id,
			courseId = req.body.course_id,
			trainingRequirementId = req.body.training_requirement_id,
			userIds = req.body.user_ids;

		for(let i in userIds){
			let courseUserRelationModel = new CourseUserRelation(),
				arrWhere = [];

			arrWhere.push( 'user_id = '+userIds[i] );
			arrWhere.push( 'course_id = '+courseId );
			arrWhere.push( 'training_requirement_id = '+trainingRequirementId );

			let users = <any> await courseUserRelationModel.getWhere(arrWhere);

			for(let user of users){
				let saveCourseUserRelationModel = new CourseUserRelation(user['course_user_relation_id']);

				for(let n in user){
					saveCourseUserRelationModel.set(n, user[n]);
				}

				saveCourseUserRelationModel.set('disabled', 1);

				await saveCourseUserRelationModel.dbUpdate();
			}
		}


		res.send({
			status : true,
			data : [],
			message : 'success'
		});
	}

	public async saveAccountCourses(req: Request, res: Response){
		let accountId = req.body.account_id,
			courseId = req.body.course_id,
			trainingRequirementId = req.body.training_requirement_id,
			userIds = req.body.user_ids;

		for(let i in userIds){
			let courseUserRelationModel = new CourseUserRelation(),
				arrWhere = [];

			arrWhere.push( 'user_id = '+userIds[i] );
			arrWhere.push( 'course_id = '+courseId );
			arrWhere.push( 'training_requirement_id = '+trainingRequirementId );

			let data = <any> await courseUserRelationModel.getWhere(arrWhere);

			if(data.length == 0){
				let saveCourseUserRelationModel = new CourseUserRelation();

				await saveCourseUserRelationModel.create({
					'user_id' : userIds[i],
					'course_id' : courseId,
					'training_requirement_id' : trainingRequirementId
				});

			}else{

				for(let i in data){
					let saveCourseUserRelationModel = new CourseUserRelation();
					for(let n in data[i]){
						saveCourseUserRelationModel.set(n, data[i][n]);
					}
					saveCourseUserRelationModel.set('disabled', 0);
					saveCourseUserRelationModel.setID(data[i]['course_user_relation_id']);

					await saveCourseUserRelationModel.dbUpdate();
				}
			}

		}


		res.send({
			status : true,
			data : [],
			message : 'success'
		});
	}

	public async getAllCourses(req: Request, res: Response){
		let courseModel = new Course();


		this.response.data = <any> await courseModel.getWhere([]);
		this.response.status = true;

		res.send(this.response);
	}

	public async getTrainingRequirements(req: Request, res: Response){
		let trainingRequirementsModel = new TrainingRequirements();


		this.response.data = <any> await trainingRequirementsModel.getWhere([]);
		this.response.status = true;

		res.send(this.response);
	}

	public async getCourseUserRelation(req: Request, res: Response){
		let courseUserRelationModel = new CourseUserRelation();
		let relations = <any> await courseUserRelationModel.getWhere([]);
		this.response.status = true;
		let allUsersData = [];

		for(let i in relations){
			relations[i]['user'] = {};

			if(allUsersData.indexOf(relations[i]['user_id']) == -1){
				try{
					allUsersData[ relations[i]['user_id'] ] = await new User( relations[i]['user_id'] ).load();
					relations[i]['user'] = allUsersData[ relations[i]['user_id'] ];
				}catch(e){}
			}else{
				relations[i]['user'] = allUsersData[ relations[i]['user_id'] ];
			}
		}

		this.response.data = relations;

		res.send(this.response);
	}

	public async getCountsBuildingTrainings(req: AuthRequest, res: Response){
		let response = {
			data : {
				users : <any> [],
				emUserCerts : <any> [],
				requiredTrainings : <any> [],
				total_users : 0,
				total_users_trained : 0,
				locations : [],
				em_roles : {}
			},
			message : ''
		},
		accountId = req.user.account_id,
		account = new Account(accountId),
		locationsOnAccount = <any> [],
		locations = <any> [],
    responseLocations = [];
    const trainingCertModel = new TrainingCertification();

		try {
            // FRP & TRP
            const userRoleModel = new UserRoleRelation();
            const role = await userRoleModel.getByUserId(req.user.user_id, true);
            const locAccntRelObj = new LocationAccountRelation();
            const location = new Location();
            console.log('============', role );
            const filter = {};
            const locationIdsOnAccnt = [];
            let sublocations = [];
            filter['responsibility'] = role;
            const locationListing = await locAccntRelObj.listAllLocationsOnAccount(req.user.account_id, filter);
            for (const l of locationListing) {
              locationIdsOnAccnt.push(l['location_id']);
            }
            if (role === defs['Manager']) {
              let sublocationsDbData;
              const sublocs = [0];
              for (const loc of locationIdsOnAccnt) {
                sublocationsDbData = await location.getDeepLocationsByParentId(loc);
                Object.keys(sublocationsDbData).forEach((i) => {
                  sublocs.push(sublocationsDbData[i]['location_id']);
                });
              }console.log(sublocs);
              sublocations = sublocations.concat(sublocs);
            } else if (role === defs['Tenant']) {
              sublocations = sublocations.concat(locationIdsOnAccnt);
            }
            const em_roles = await account.getAllEMRolesOnThisAccount(accountId, {'location' : sublocations, 'all': 1});
            // console.log(em_roles);
            const em_roles_user = {};
            const allUsers = [];
            for (const em of em_roles) {
              if (em['em_role_id'] in em_roles_user) {
                em_roles_user[em['em_role_id']]['users'].push(em['user_id']);
              } else {
                em_roles_user[em['em_role_id']] = {
                  'users': [em['user_id']],
                  'role_name': em['role_name']
                };
              }
              if (allUsers.indexOf(em['user_id']) === -1) {
                allUsers.push(em['user_id']);
              }
            }

            Object.keys(em_roles_user).forEach((u) => {
              // console.log( `${u} = ${em_roles_user[u]['users'].length}` );
              response.data.em_roles[u] = {
                'total': em_roles_user[u]['users'].length,
                'role_name':  em_roles_user[u]['role_name']
              };
            });

            response.data.total_users = allUsers.length;
            const users_took_trainings = await trainingCertModel.getEMRUserCertifications(allUsers);
            response.data.total_users_trained = users_took_trainings['total_passed'];
            response.data['allUsers'] = allUsers;

        } catch (e) { }

    res.send(response);
  }

}
