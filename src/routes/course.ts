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
		
		try {
            // FRP & TRP
            let userRoleModel = new UserRoleRelation(),
                roles = await userRoleModel.getByUserId(req.user.user_id);

            locationsOnAccount = await account.getLocationsOnAccount(req.user.user_id, 1);
            
            for (let loc of locationsOnAccount) {
                locations.push(loc);
            }
        } catch (e) {
            // Warden or Users
            try{
                let userEmRole = new UserEmRoleRelation(),
                emRoles = <any> await userEmRole.getEmRolesByUserId(req.user.user_id);

                
                for (let em of emRoles) {
                    locations.push(em);
                }

            }catch(e){  }
        }

        for (let loc of locations) {
            let allSubLocationIds = [0],
                deepLocModel = new Location(),
                emRoleModel = new UserEmRoleRelation(),
                trainingCertModel = new TrainingCertification(),
                deepLocations = <any> [],
                userIds = [0];
            
            if(loc.parent_id == -1){
                deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(loc.location_id);
                deepLocations.push(loc);
            }else{
                let ancLocModel = new Location(),
                    ancestores = <any> await ancLocModel.getAncestries(loc.location_id);

                for(let anc of ancestores){
                    if(anc.parent_id == -1){
                        deepLocations = <any> await deepLocModel.getDeepLocationsByParentId(anc.location_id);
                        deepLocations.push(anc);
                    }
                }
            }

            let locMerged = this.addChildrenLocationToParent(deepLocations),
                respLoc = (locMerged[0]) ? locMerged[0] : locMerged;

            for(let sub of deepLocations){
                if(sub.parent_id > -1){
                    allSubLocationIds.push(sub.location_id);
                }
            }

            let users = <any> await emRoleModel.getUsersInLocationIds( allSubLocationIds.join(',') );
            response.data.total_users = response.data.total_users + users.length;
            for(let u of users){
            	if( userIds.indexOf( u.user_id ) == -1 ){
            		userIds.push( u.user_id );
            	}

            	if( u.em_role_id in response.data.em_roles == false ){
            		response.data.em_roles[ u.em_role_id ] = {
            			total : 0,
            			role_name : u.role_name
            		};
            	}

            	response.data.em_roles[ u.em_role_id ].total++;
            }

            let users_took_trainings = <any> await trainingCertModel.getCertificationsInUserIds( userIds.join(',') );

            let usersTrainings = [];
            for(let u of users){
	            let isIn = false;
	            for(let ut of usersTrainings){
	            	if(ut.user_id == u.user_id){
	            		isIn = true;
	            	}
	            }

	            if(!isIn){
	            	usersTrainings.push({
	            		user_id : u.user_id,
	            		trainings : {}
	            	});
	            }
            }

            for(let ut of usersTrainings){
            	for(let took of users_took_trainings){
            		if(took.user_id == ut.user_id){
            			if( took.training_requirement_id in ut.trainings == false ){
            				ut.trainings[ took.training_requirement_id ] = took;
            				if(took.validity == 'active' && took.pass == 1){
            					response.data.total_users_trained++;
            				}
            			}
            		}
            	}
            }

            respLoc['usersTrainings'] = usersTrainings;


            let isInside = false;
            for(let i in responseLocations){
            	if(responseLocations[i].location_id == respLoc.location_id){
            		isInside = true;
            	}
            }

            if(!isInside){
            	responseLocations.push(respLoc);
            }
        }

        response.data.locations = responseLocations;

		res.send(response);
	}

}
