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

import { AuthRequest } from '../interfaces/auth.interface';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';

import * as moment from 'moment';


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

	   	router.get('/courses/counts-account-trainings', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
	   		new CourseRoute().getCountsAccountTrainings(req, res);
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
		let userId = req.params.user_id,
		response = {
			status : false, data : [], message : ''
		},
		courseUserRelation = new CourseUserRelation();

		let courses = <any> await courseUserRelation.getAllCourseForUser(userId);
		for(let cor of courses){
			cor['timestamp_formatted'] = moment(cor['dtTimeStamp']).format('MMM. DD, YYYY');
		}
		response.status = true;
		response.data = courses;

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

	public async getCountsAccountTrainings(req: AuthRequest, res: Response){
		let response = {
			data : {
				users : <any> [],
				emUserCerts : <any> [],
				requiredTrainings : <any> [],
				number_required_trainings : 0,
				number_course_finished : 0
			},
			message : ''
		},
		accountId = req.user.account_id,
		emRoleModel = new UserEmRoleRelation(),
		users = <any> await emRoleModel.getUsersByAccountId(accountId),
		certModel = new TrainingCertification(),
		requiredTrainings = <any> await certModel.getRequiredTrainings(),
		emUserCerts = <any> [],
		arrUserIds = [],
		trainingsIds = {};

		for(let user of users){
			if(arrUserIds.indexOf(user.user_id) == -1){
				arrUserIds.push(user.user_id);
			}
		}
		
		try{
			emUserCerts = <any> await certModel.getEMRUserCertifications(arrUserIds);
		}catch(e){}

		for(let i in requiredTrainings){
			let idsArr = requiredTrainings[i]['training_requirement_id'];
			for(let x in idsArr){
				if( trainingsIds[ idsArr[x] ] == undefined){
					trainingsIds[ idsArr[x] ] = {
						taken : false
					};
				}
			}
		}
		response.data['trainingsIds'] = trainingsIds;

		/*for(let i in requiredTrainings){

			if('taken' in requiredTrainings[i] === false){
				requiredTrainings[i]['taken'] = false;
			}

			if('passed' in emUserCerts){
				for(let p of emUserCerts.passed){
					if(  requiredTrainings[i]['training_requirement_id'].indexOf( p.training_requirement_id ) > -1){
						req['taken'] = true;
					}
				}
			}
		}

		for(let req of requiredTrainings){
			if(req.taken){
				response.data.number_course_finished++;
			}
		}*/

		response.data.number_required_trainings = Object.keys(requiredTrainings).length;
		response.data.requiredTrainings = requiredTrainings;
		response.data.users = users;
		response.data.emUserCerts = emUserCerts;

		res.send(response);
	}

}
