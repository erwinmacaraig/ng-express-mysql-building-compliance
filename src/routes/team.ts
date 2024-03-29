import { UserInvitation } from './../models/user.invitation.model';
import { NextFunction, Request, Response, Router } from 'express';
import { BaseRoute } from './route';
import { User } from '../models/user.model';
import { AuthRequest } from '../interfaces/auth.interface';
import * as fs from 'fs';
import * as path from 'path';
import { MiddlewareAuth } from '../middleware/authenticate.middleware';
import { Token } from '../models/token.model';
import { FileUploader } from '../models/upload-file';
import { FileUser } from '../models/file.user.model';
import { Files } from '../models/files.model';
import { Utils } from './../models/utils.model';
import {EmailSender} from './../models/email.sender';
const validator = require('validator');
import { UserRoleRelation } from '../models/user.role.relation.model';
import { LocationAccountUser } from '../models/location.account.user';
import { Account } from '../models/account.model';
import { Location } from '../models/location.model';
import { UserEmRoleRelation } from '../models/user.em.role.relation';
import { LocationAccountRelation } from '../models/location.account.relation';
import { MobilityImpairedModel } from '../models/mobility.impaired.details.model';
import { BlacklistedEmails } from '../models/blacklisted-emails';
import { CourseUserRelation } from '../models/course-user-relation.model';
import { TrainingCertification } from './../models/training.certification.model';
import { NotificationToken } from './../models/notification_token.model';
import { TrainingRequirements } from './../models/training.requirements';
const md5 = require('md5');
const defs = require('../config/defs');
import * as moment from 'moment';
import { AdminRoute } from './admin';


/**
 * / route
 *
 * @class User
 */
export class TeamRoute extends BaseRoute {

  /**
   * Create the routes.
   *
   * @class IndexRoute
   * @method create
   * @static
   */
  public static create(router: Router) {
    // add home page route
    router.get('/test', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().index(req, res);
    });

    router.post('/team/finalize-csv-record', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addUsersFromCSV(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {
        return res.status(400).send({status: 'Fail', message: e});
      });
    });

    router.post('/team/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByEmail(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {

      });
    });

    router.post('/team/form/add-bulk-warden', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addBulkWardenByForm(req, res).then((response) => {
        return res.status(200).send(response);
      }).catch((e) => {
        return res.status(400).send({
          status: 'Fail',
          message : e
        });
      });
    });

    router.get('/team/eco-role-list', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().getECOList(req, res).then((roles) => {
        return res.status(200).send(roles);
      }).catch((e) => {
        return res.status(400).send('Error generating list');
      });
    });

    router.post('/team/process-warden-invitation', (req: Request, res: Response, next: NextFunction) => {
      new TeamRoute().processWardenInvitation(req, res, next).then((data) => {
        res.status(200).send({status: 'Success'});
      }).catch((e) => {
        res.status(400).send({status: 'Fail'});
      });
    });

    router.get('/team/invitation-filled-form/:token/bulk', (req: Request, res: Response, next: NextFunction) => {
      new TeamRoute().retrieveWardenInvationInfo(req, res, next).then((data) => {
        return res.status(200).send(data);
      }).catch((err) => {
        return res.status(400).send({message: 'Internal error', 'err' : err });
      });
    });

    router.get('/team/list/wardens', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildWardenList(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((err) => {
        return res.status(400).send({
          message: 'Cannot build list'
        });
      });
    });

    router.get('/team/list/archived-wardens', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildWardenList(req, res, 1).then((data) => {
        return res.status(200).send(data);
      }).catch((err) => {
        return res.status(400).send({
          message: 'Cannot build list'
        });
      });
    });

    router.post('/team/form/add-bulk-peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().addMobilityImpairedPersons(req, res).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {
        return res.status(400).send({
          message: 'Internal Error. Cannot add mobility impaired person(s)'
        });
      });
    });

    router.get('/team/list/peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildPEEPList(req, res).then((peep) => {
        return res.status(200).send(peep);
      }).catch((e) => {
          console.log(e);
        return res.status(400).send({
          message: 'Internal Error. Cannot build peep list'
        });
      });
    });

    router.get('/team/list/archived-peep', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
      new TeamRoute().buildPEEPList(req, res, 1).then((peep) => {
        return res.status(200).send(peep);
      }).catch(() => {
        return res.status(400).send({
          message: 'Internal Error. Cannot build peep list'
        });
      });
    });

    router.post('/team/csv-upload', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
    //  router.post('/team/warden/csv-upload', (req: AuthRequest, res: Response, next: NextFunction) => {
      new TeamRoute().uploadCSV(req, res, next).then((data) => {
        return res.status(200).send(data);
      }).catch((e) => {
        res.status(400).send({
          message: 'Error processing CSV file.'
        });
      });
    });

    router.post('/team/training/send-invite/', new MiddlewareAuth().authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
        new TeamRoute().trainingSendInvite(req, res);
    });

    router.post('/team/build-eco-team-list/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new TeamRoute().buildMyEcoTeam(req, res);
    });

    router.post('/team/build-trp-peep-list/',  new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new TeamRoute().buildPeepListForTrp(req, res);
    });

    router.get('/team/get-my-warden-list/', new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
        new TeamRoute().generateMyWardenList(req, res);
    });

    router.get('/team/get-my-occupants-list/', new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
        new TeamRoute().generateMyGeneralOccupantList(req, res);
    });

    router.get('/team/get-my-admin-list/', new MiddlewareAuth().authenticate, (req: AuthRequest, res: Response) => {
        new TeamRoute().generateMyAdminList(req, res);
    });

    router.get('/team/get-my-peep-list/', new MiddlewareAuth().authenticate, (req:AuthRequest, res:Response) => {
        new TeamRoute().generateMyPeepList(req, res);
    });


}

  /**
   * Constructor
   *
   * @class IndexRoute
   * @constructor
   */
  constructor() {
    super();
  }

  public async generateMyPeepList(req: AuthRequest, res:Response) {
    let roleOfAccountInLocationObj = {};
    let accountUserData = [];
    let accountRoles = [];
    let list = [];
    
    const emUsers = new UserEmRoleRelation();
    const sublocationIds = [];
    let temp = [];
    let tempFRP = [];
    
    const userIds = [];
    let cert = {};
    let buildingLocations = [];
    const ctr = []; // this will serve as the container of unique building ids

    try {
        // determine if you are a building manager or tenant in these locations - response.locations
        roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);
        
    } catch(err) {
        console.log('authenticate route get account role relation in location', err);
    }
    try {
        accountUserData = await new LocationAccountUser().getByUserId(req.user.user_id);
        for(let data of accountUserData) {
            if (data['location_id'] in roleOfAccountInLocationObj) {
                accountRoles.push({
                    role_id: roleOfAccountInLocationObj[data['location_id']]['role_id'],
                    location_id: data['location_id'],
                    user_id: req.user.user_id
                });
            }
        }
    } catch(e) {
        console.log(' teams route, error getting in location account user data', e);
    }
    for(let role of accountRoles) {
        if (role['role_id'] == 2) {
            try {
                 // get the location and all people that is impaired within the same account                
                temp = await emUsers.getMobilityImpairedTeamList([role['location_id']], req.user.account_id);
                for (let peep of temp) {
                    if (userIds.indexOf(peep['user_id']) == -1) {
                        list.push(peep);
                        userIds.push(peep['user_id']);
                    }                    
                }               

            } catch(e) {
                console.log('Error generating em users from teams route for TRP user', e, role['location_id']);
                temp = [];
            }
            try {
                let accountPeep = await new LocationAccountUser().getMobilityImpairedAccountUserTeamList([role['location_id']], req.user.account_id);
                for (let peep of accountPeep) {
                    if (userIds.indexOf(peep['user_id']) == -1) {
                        list.push(peep);
                        userIds.push(peep['user_id']);
                    }
                }
            } catch(e) {
                console.log(e);
            }
            try {
                let bldg = await new Location().immediateParent([role['location_id']]);
               
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('Error getting immediate parent for sublocation ' + role['location_id']);
            }           
        }
        if (role['role_id'] == 1) { 
            tempFRP = [];
            // get sublocation ids
            sublocationIds.push(role['location_id']);
            tempFRP = await new Location().getChildren(role['location_id']);
            temp = [];
            for (let loc of tempFRP) {
                sublocationIds.push(loc['location_id']);
            }
            try {
                temp = await emUsers.getMobilityImpairedTeamList(sublocationIds);            
                for (let peep of temp) {
                    if (userIds.indexOf(peep['user_id']) == -1) {
                        list.push(peep);
                        userIds.push(peep['user_id']);
                    }
                }
            } catch(e) {
                console.log(e);
            }
            try {
                // get the location and all people that has warden role for FRP            
                let accountPeep = await new LocationAccountUser().getMobilityImpairedAccountUserTeamList(sublocationIds);
                for (let peep of accountPeep) {
                    if (userIds.indexOf(peep['user_id']) == -1) {
                        list.push(peep);
                        userIds.push(peep['user_id']);
                    }
                }

            } catch(e) {
                console.log(e);
            }
            

            // get locations
            try {
                let bldg = await new Location().immediateParent(sublocationIds);
                
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('There was a problem with the list of sublevels in getting the parent', sublocationIds);
            }
        } 

    }

    if (userIds.length) {
        const peepDetails = await new MobilityImpairedModel().getMany([`user_id IN (${userIds.join(',')})`]);
        for (let user of list) {
            user['mobility_impaired_details'] = [];
            for (let details of peepDetails) {
                if (ctr.indexOf(user['user_id']) &&  details['user_id'] == user['user_id']) {
                    ctr.push(user['user_id']);
                    user['mobility_impaired_details'].push(details);
                    continue;
                }
            }
        }

    }
    res.status(200).send({
        users: list,
        buildings: buildingLocations
    });
    
    

  }

  public async generateMyWardenList(req: AuthRequest, res:Response) {

    let showArchivedUsers: number = 0;      
    if (req.query.archived) {
        showArchivedUsers = parseInt(req.query.archived, 10);
    }

    let roleOfAccountInLocationObj = {};
    let accountUserData = [];
    let accountRoles = [];
    let list = [];
    let trpWardenList = [];
    let frpWardenList = [];
    const emUsers = new UserEmRoleRelation();
    const sublocationIds = [];
    let temp = [];
    let tempFRP = [];
    const trainingRequirementsLookup = {};
    const trainingRequirements = [];
    const userIds = [];
    let cert = [];
    let buildingLocations = [];
    const ctr = []; // this will serve as the container of unique building ids
    try {
        // determine if you are a building manager or tenant in these locations - response.locations
        roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);
        
    } catch(err) {
        console.log('authenticate route get account role relation in location', err);
    }

    try {
        accountUserData = await new LocationAccountUser().getByUserId(req.user.user_id);
        for(let data of accountUserData) {
            if (data['location_id'] in roleOfAccountInLocationObj) {
                accountRoles.push({
                    role_id: roleOfAccountInLocationObj[data['location_id']]['role_id'],
                    location_id: data['location_id'],
                    user_id: req.user.user_id
                });
            }
        }
    } catch(e) {
        console.log(' teams route, error getting in location account user data', e);
    }

    try { 
        temp = await new TrainingRequirements().allEmRolesTrainings();
        for (let wardenRole of temp) {
            if (wardenRole['is_warden_role'] == 1) {
                trainingRequirementsLookup[wardenRole['em_role_id']] = wardenRole['training_requirement_id'];
                if (trainingRequirements.indexOf(wardenRole['training_requirement_id']) == -1) {
                    trainingRequirements.push(wardenRole['training_requirement_id']);
                }
            }
        }
    } catch(e) {
        console.log('Error getting/processing training requirement for role', e);
    }
    
    let successIds = [];
    for(let role of accountRoles) {
        if (role['role_id'] == 2) {
            try {
                 // get the location and all people that has warden role within the same account
                temp = await emUsers.getWardenTeamList([role['location_id']], req.user.account_id, showArchivedUsers);
                for (let warden of temp) {
                    trpWardenList.push(warden);
                }
            } catch(e) {
                console.log('Error generating em users from teams route for TRP user', e, role['location_id']);
                temp = [];
            }
            try {
                let bldg = await new Location().immediateParent([role['location_id']]);
               
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        ctr.push(b['parent_id']);
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('Error getting immediate parent for sublocation ' + role['location_id']);
            }           
        }
        if (role['role_id'] == 1) {
            tempFRP = [];
            // get sublocation ids
            sublocationIds.push(role['location_id']);
            tempFRP = await new Location().getChildren(role['location_id']);
            temp = [];
            for (let loc of tempFRP) {
                sublocationIds.push(loc['location_id']);
            }
            try {
                // get the location and all people that has warden role for FRP
                temp = await emUsers.getWardenTeamList(sublocationIds, 0, showArchivedUsers);
                for (let warden of temp) {
                    frpWardenList.push(warden);
                }
            } catch(e) {
                console.log(e);
            }

            // get locations
            try {
                let bldg = await new Location().immediateParent(sublocationIds);
                
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        ctr.push(b['parent_id']);
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('There was a problem with the list of sublevels in getting the parent', sublocationIds);
            }
        }
    }
    
    temp = []; 
    list = [...trpWardenList, ...frpWardenList];
    const listObj = {};
    for (let item of list) {
        if (userIds.indexOf(item['user_id']) == -1) {
            userIds.push(item['user_id']);
        }
        let indexStr = `${item['user_id']}-${item['location_id']}-${item['em_roles_id']}`;
        
        listObj[indexStr] = {
            name: `${item['first_name']} ${item['last_name']}`,
            user_id: item['user_id'],
            mobility_impaired: item['mobility_impaired'],                
            building: item['building'],
            building_id: item['building_id'],
            level: item['level'],
            last_login: item['last_login'],
            profile_completion: item['profile_completion'],
            location_id: item['location_id'],
            is_building: item['is_building'],
            role_id: item['em_roles_id'],
            roles: [item['role_name']],
            training_requirement_id: trainingRequirementsLookup[item['em_roles_id']],
            training: 0,
            account_name: item['account_name']
        };
        
        
    }
    
    try {
        cert = await new TrainingCertification().generateEMTrainingReport(userIds, trainingRequirements);
    } catch (e) {
        console.log(e);
    }
    let certUniq = [];
    list = [];
    Object.keys(listObj).forEach( (key) => {
        let indexUniq = `${listObj[key]['user_id']}-${listObj[key]['role_id']}-${trainingRequirementsLookup[listObj[key]['role_id']]}`;
        
        for (let c of cert) {            
            if (certUniq.indexOf(indexUniq) == -1) {                                 
                if (listObj[key]['user_id'] == c['user_id'] && trainingRequirementsLookup[listObj[key]['role_id']] == c['training_requirement_id']) {                    
                    certUniq.push(indexUniq);
                    if (c['status'] == 'valid') {
                        listObj[key]['training'] = 1;
                        listObj[key]['certifications_id'] = c['certifications_id'];
                    }
                }
            }
        }
        list.push(listObj[key]);
        
    });
    
    return res.status(200).send({
        warden: list,
        buildings: buildingLocations,
        locations: successIds        
    });


  }

  public async generateMyGeneralOccupantList(req: AuthRequest, res:Response) {

      let showArchivedUsers: number = 0;
      
      if (req.query.archived) {
          showArchivedUsers = parseInt(req.query.archived, 10);
      }
      let roleOfAccountInLocationObj = {};
      let accountUserData = [];
      let accountRoles = [];
      let list = [];      
      const emUsers = new UserEmRoleRelation();
      const sublocationIds = [];
      let temp = [];
      let tempFRP = [];
      const trainingRequirementsLookup = {};
      const trainingRequirements = [];
      const userIds = [];
      let cert = {};
      let buildingLocations = [];
      const ctr = []; // this will serve as the container of unique building ids
      try {
        // determine if you are a building manager or tenant in these locations - response.locations
        roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(
          req.user.account_id
        );
      } catch (err) {
        console.log(
          "authenticate route get account role relation in location",
          err
        );
      }

      try {
        accountUserData = await new LocationAccountUser().getByUserId(
          req.user.user_id
        );
        for (let data of accountUserData) {
          if (data["location_id"] in roleOfAccountInLocationObj) {
            accountRoles.push({
              role_id:
                roleOfAccountInLocationObj[data["location_id"]]["role_id"],
              location_id: data["location_id"],
              user_id: req.user.user_id
            });
          }
        }
      } catch (e) {
        console.log(
          " teams route, error getting in location account user data",
          e
        );
      }
      try {
        temp = await new TrainingRequirements().allEmRolesTrainings();
        for (let wardenRole of temp) {
          if (wardenRole["em_role_id"] == 8) {
            trainingRequirementsLookup[wardenRole["em_role_id"]] =
              wardenRole["training_requirement_id"];
            if (
              trainingRequirements.indexOf(
                wardenRole["training_requirement_id"]
              ) == -1
            ) {
              trainingRequirements.push(
                wardenRole["training_requirement_id"]
              );
            }
          }
        }
      } catch (e) {
        console.log(
          "Error getting/processing training requirement for role",
          e
        );
      }

    for(let role of accountRoles) {        
        if (role['role_id'] == 2) {
            try {
                // get all general occupant in this level/location belonging to the same account
                temp = await emUsers.getGOFRTeamList([role['location_id']], req.user.account_id, showArchivedUsers);                
                for (let go of temp) {
                    list.push(go);
                    if (userIds.indexOf(go['user_id']) == -1) {
                        userIds.push(go['user_id']);                        
                    }                    
                }

            } catch(e) {
                console.log('Error generating gofr users from teams route for trp', e, role['location_id']);
                temp = [];
            }
            try {
                let bldg = await new Location().immediateParent([role['location_id']]);
               
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        ctr.push(b['parent_id']);
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('Error getting immediate parent for sublocation ' + role['location_id']);
            }
            
        }
        if (role['role_id'] == 1) { 
            tempFRP = [];
            // get sublocation ids
            sublocationIds.push(role['location_id']);
            tempFRP = await new Location().getChildren(role['location_id']);
            temp = [];
            for (let loc of tempFRP) {
                sublocationIds.push(loc['location_id']);
            }
            try {
                // get the location and all people that has warden role for FRP
                temp = await emUsers.getGOFRTeamList(sublocationIds, 0, showArchivedUsers);            
                for (let go of temp) {
                    list.push(go);
                    if (userIds.indexOf(go['user_id']) == -1) {
                        userIds.push(go['user_id']);                        
                    }  
                }
            } catch (e) {
                console.log(e);
            }

            // get locations
            try {
                let bldg = await new Location().immediateParent(sublocationIds);
                
                for (let b of bldg) {
                    if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                        ctr.push(b['locId']);
                        buildingLocations.push({
                            location_id: b['locId'],
                            location_name: b['level']
                        });
                    } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                        ctr.push(b['parent_id']);
                        buildingLocations.push({
                            location_id: b['parent_id'],
                            location_name: b['buildingName']
                        });
                    }
                }
            } catch(e) {
                console.log('There was a problem with the list of sublevels in getting the parent', sublocationIds);
            }
        }
    }

    temp = [];
    
    const listObj = {};
    for (let item of list) {
        
        let indexStr = `${item['user_id']}-${item['location_id']}`;
        listObj[indexStr] = {
            name: `${item['first_name']} ${item['last_name']}`,
            user_id: item['user_id'],
            mobility_impaired: item['mobility_impaired'],                
            building: item['building'],
            building_id: item['building_id'],
            level: item['level'],
            last_login: item['last_login'],
            profile_completion: item['profile_completion'],
            archived: item['archived'],
            location_id: item['location_id'],
            is_building: item['is_building'],
            role_ids: [item['em_roles_id']],
            roles: [item['role_name']],
            training_requirement_id: trainingRequirementsLookup[item['em_roles_id']],
            training: 0,
            account_name: item['account_name'] 
        };
    }

    cert = await new TrainingCertification().getNumberOfTrainings(userIds, {
        current: true,
        training_requirement: trainingRequirements 
    });
    list = [];
    Object.keys(listObj).forEach( (key) => {
        if (listObj[key]['user_id'] in cert) {
            listObj[key]['training'] = 1;
        }
        list.push(listObj[key]);
    });

    
    return res.status(200).send({
        gofr: list,
        buildings: buildingLocations,
        cert: cert        
    });
    
  }

  public async generateMyAdminList(req: AuthRequest, res:Response) {
        let showArchivedUsers: number = 0;
        
        if (req.query.archived) {
            showArchivedUsers = parseInt(req.query.archived, 10);
        }        
        let roleOfAccountInLocationObj = {};
        let accountUserData = [];
        let accountRoles = [];
        let list = [];
        let trpList = [];
        let frpList = [];
        const emUsers = new UserEmRoleRelation();
        const sublocationIds = [];
        let temp = [];
        let tempFRP = [];
        const trainingRequirementsLookup = {};
        const trainingRequirements = [];
        const userIds = [];
        let cert = {};
        let buildingLocations = [];
        const ctr = []; // this will serve as the container of unique building ids
        try {
            // determine if you are a building manager or tenant in these locations - response.locations
            roleOfAccountInLocationObj = await new UserRoleRelation().getAccountRoleInLocation(req.user.account_id);
            
        } catch(err) {
            console.log('authenticate route get account role relation in location', err);
        }

        try {
            accountUserData = await new LocationAccountUser().getByUserId(req.user.user_id);
            for(let data of accountUserData) {
                if (data['location_id'] in roleOfAccountInLocationObj) {
                    accountRoles.push({
                        role_id: roleOfAccountInLocationObj[data['location_id']]['role_id'],
                        location_id: data['location_id'],
                        user_id: req.user.user_id
                    });
                }
            }
        } catch(e) {
            console.log(' teams route, error getting in location account user data', e);
        }
        for(let role of accountRoles) { 
            if (role['role_id'] == 2) { 
                try {
                    // get the location and all TRP role in the location with the same account
                    temp = await new LocationAccountUser().generateUserAccountRoles(req.user.account_id, [role['location_id']], showArchivedUsers.toString());                    
                    for (let user of temp) {
                        trpList.push(user);
                    }
                } catch(e) {
                    console.log('Error generating TRP users from teams route', e);
                    temp = [];
                }
                try {
                    let bldg = await new Location().immediateParent([role['location_id']]);
                   
                    for (let b of bldg) {
                        if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                            ctr.push(b['locId']);
                            buildingLocations.push({
                                location_id: b['locId'],
                                location_name: b['level']
                            });
                        } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                            ctr.push(b['parent_id']);
                            buildingLocations.push({
                                location_id: b['parent_id'],
                                location_name: b['buildingName']
                            });
                        }
                    }
                } catch(e) {
                    console.log('Error getting immediate parent for sublocation ' + role['location_id']);
                }   
            }
            if (role['role_id'] == 1) {
                tempFRP = [];
                // get sublocation ids
                sublocationIds.push(role['location_id']);
                tempFRP = await new Location().getChildren(role['location_id']);
                temp = [];
                for (let loc of tempFRP) {
                    sublocationIds.push(loc['location_id']);
                }
                try {
                    // get the location and all TRP role in the location with the same account
                    temp = await new LocationAccountUser().generateUserAccountRoles(0, sublocationIds, showArchivedUsers.toString());
                    
                    for (let user of temp) {
                        frpList.push(user);
                    }
                } catch(e) {
                    console.log('Error generating account users from teams route', e);
                    temp = [];
                }
                // get locations
                try {
                    let bldg = await new Location().immediateParent(sublocationIds);
                    
                    for (let b of bldg) {
                        if (b['buildingId'] == null && ctr.indexOf(b['locId']) == -1) {
                            ctr.push(b['locId']);
                            buildingLocations.push({
                                location_id: b['locId'],
                                location_name: b['level']
                            });
                        } else if (b['buildingId'] != null && ctr.indexOf(b['parent_id']) == -1) {                        
                            ctr.push(b['parent_id']);
                            buildingLocations.push({
                                location_id: b['parent_id'],
                                location_name: b['buildingName']
                            });
                        }
                    }
                } catch(e) {
                    console.log('There was a problem with the list of sublevels in getting the parent', sublocationIds);
                }

            }
        }
        temp = [];
        list = [...trpList, ...frpList];
        const listObj = {};
        for (let item of list) {
            if (userIds.indexOf(item['user_id']) == -1) {
                userIds.push(item['user_id']);
            }
            let indexStr = `${item['user_id']}-${item['location_id']}`;
            if (indexStr in listObj) {
                continue;
            } else {
                listObj[indexStr] = {
                    name: `${item['first_name']} ${item['last_name']}`,                    
                    user_id: item['user_id'],
                    email: item['email'],
                    mobility_impaired: item['mobility_impaired'],
                    account_name: item['account_name'],                
                    building: item['building'],
                    building_id: item['building_id'],
                    level: item['name'],
                    last_login: item['last_login'],
                    profile_completion: item['profile_completion'],
                    archived: item['archived'],
                    location_id: item['location_id'],
                    is_building: item['is_building'],
                    role_ids: [],
                    roles: []                    
                }; 
            }
        }
        list = [];
        if (!userIds.length) {
            return res.status(200).send({
                account_users: list,
                buildings: buildingLocations        
            }); 
        }
        const accountUsers = await new UserRoleRelation().getManyByUserIds(userIds.join(','));
        

        Object.keys(listObj).forEach( (key) => {
            for (let user of accountUsers) {
                if (user['user_id'] == listObj[key]['user_id']) {
                    listObj[key]['roles'].push(defs['notification_role_text'][user['role_id']]);
                    listObj[key]['role_ids'].push(user['role_id']);                    
                }
            }
            list.push(listObj[key]);
        });

        return res.status(200).send({
            account_users: list,
            buildings: buildingLocations        
        });
  }

  public async buildPeepListForTrp(req:AuthRequest, res:Response) {
    
    let trpLocations = JSON.parse(req.body.trpLocations);
    let frpLocations = JSON.parse(req.body.frpLocations);

    let assignedLocations = [];
    let tempArr = [];
    let whereLoc = [];
    let buildings = [];
    const location = new Location();
    let myBuildings = [];
    let sublocations = [];
    buildings = JSON.parse(req.body.assignedLocations);
    try {
        // getting the building details        
        whereLoc.push(`location_id IN (${buildings.join(',')})`);
        myBuildings = await location.getWhere(whereLoc) as Array<object>;  
    } catch(e) {
        console.log(e);
        buildings = [];
    }
    whereLoc = [];
    sublocations = [...trpLocations, ...frpLocations];

    if (trpLocations.length == 0 && frpLocations.length == 0) {
        return res.status(500).send({
            list: [],
            message: 'No supplied location parameter'
        });
    }
    if (frpLocations.length > 0) {
        whereLoc.push(`parent_id IN (${frpLocations.join(',')})`);
        tempArr = await location.getWhere(whereLoc) as Array<object>;
        //tempArr now contains the sublevels of the frplocations
        for (let loc of tempArr) {
            sublocations.push(loc['location_id']);	
        }
    }

    // get all emergency roles from these locations which belongs to the same account which is peep
    const peepObj = new MobilityImpairedModel();
    let accountTypeMobilityImpaired = [];
    let emergencyTypeMobilityImpaired = [];
    try {        
        accountTypeMobilityImpaired = await peepObj.listAllMobilityImpaired(req.user.account_id, sublocations, 'account');
        
    } catch(e) {
        console.log(e);
        accountTypeMobilityImpaired = [];
    }
    try {
        emergencyTypeMobilityImpaired = await peepObj.listAllMobilityImpaired(req.user.account_id, sublocations, 'emergency');
    } catch(e) {
        console.log(e);
        emergencyTypeMobilityImpaired = [];
    }

    res.status(200).send({
        building: myBuildings,
        account_users: accountTypeMobilityImpaired,
        emergency_users: emergencyTypeMobilityImpaired
    });
    
    

  }


  public async buildMyEcoTeam(req: AuthRequest, res: Response) {

    let trpLocations = JSON.parse(req.body.trpLocations);
    let frpLocations = JSON.parse(req.body.frpLocations);
    
    let buildings = [];
    let sublocations = [];
    let tempArr = [];
    let whereLoc = [];
    const location = new Location();
    let list = [];
    
    let myBuildings = [];
    buildings = JSON.parse(req.body.assignedLocations);
    try {
        // getting the building details        
        whereLoc.push(`location_id IN (${buildings.join(',')})`);
        myBuildings = await location.getWhere(whereLoc) as Array<object>;  
    } catch(e) {
        console.log(e);
        buildings = [];
    }
    whereLoc = [];
    sublocations = [...trpLocations, ...frpLocations];
    if (trpLocations.length == 0 && frpLocations.length == 0) {
        return res.status(500).send({
            list: [],
            message: 'No supplied location parameter'
        });
    }
    if (frpLocations.length > 0) {
        whereLoc.push(`parent_id IN (${frpLocations.join(',')})`);
        tempArr = await location.getWhere(whereLoc) as Array<object>;
        //tempArr now contains the sublevels of the frplocations
        for (let loc of tempArr) {
            sublocations.push(loc['location_id']);	
        }
    }
    
    // get all wardens from these locations which belongs to the same account
    
    //need to get the training requirements for emergency roles
    const trainingForRoles: Array<object> = await new TrainingRequirements().allEmRolesTrainings();
    const tempUserTrainingReqObj:{[r:number]:Array<Number>} = {};
    for (let training of trainingForRoles) {
        try {
            tempUserTrainingReqObj[training['em_role_id']].push(training['training_requirement_id']);
        } catch(e) {
            tempUserTrainingReqObj[training['em_role_id']] = [];
            tempUserTrainingReqObj[training['em_role_id']].push(training['training_requirement_id']);
        }
    }


    tempArr = await new UserEmRoleRelation().getUserLocationByAccountIdAndLocationIds(req.user.account_id, sublocations.join(','));
    // tempArr now contains all eco and go from the locations specified under the same account

    let userIds = [];
    const tempUserRoleObj:{[k:number]:String[]} = {};
    const trainingReqForUser: {[k:number]: Number[]} = {};
    const uniqTrainingRequirementsIds = [];

    for (let user of tempArr) {        
        if (user['is_warden_role'] == 1) {
            userIds.push(user['user_id']);            
            try {
                tempUserRoleObj[user['user_id']].push(user['role_name']);
            } catch(e) {
                tempUserRoleObj[user['user_id']] = [];
                tempUserRoleObj[user['user_id']].push(user['role_name']);
            }
            for (let trid of tempUserTrainingReqObj[user['em_roles_id']]) {
                if (uniqTrainingRequirementsIds.indexOf(trid) == -1) {
                    uniqTrainingRequirementsIds.push(trid);
                }
            }            
            try {
                for(let tr of tempUserTrainingReqObj[user['em_roles_id']]) {
                    if (trainingReqForUser[user['user_id']].indexOf(tr) == -1) {
                        trainingReqForUser[user['user_id']].push(tr);
                    }
                }
                
            } catch(e) {
                trainingReqForUser[user['user_id']] = [];
                trainingReqForUser[user['user_id']] = [...tempUserTrainingReqObj[user['em_roles_id']]];
            }
        }
    }

    const cert = await new TrainingCertification().getBulkActiveCertificates(userIds, uniqTrainingRequirementsIds);

    // cross reference this users from notification_token table
    const notificationToken = new NotificationToken();
    list = await notificationToken.generateSummaryList({
        'user_ids': userIds,
        'location_ids': sublocations,
        'role_text': 'Warden'
    });
    for (let item of list) {
        item['training'] = 'Non-compliant';        
        if(item['user_id'] in tempUserRoleObj) {
            item['roles'] = tempUserRoleObj[item['user_id']];
        }
        if (item['user_id'] in trainingReqForUser ) {
            for (let trid of trainingReqForUser[item['user_id']]) {
                for (let c of cert) {
                    if (c['user_id'] == item['user_id'] && trid == c['training_requirement_id']) {
                        item['training'] = 'Compliant'; 
                    }
                }
            }    
        }
        
    }
    res.status(200).send({
        list: list,
        building: myBuildings
    });



    
    /*
   

    tempArr = [];
    

    
    */
  }

  /**
   * The home page route.
   *
   * @class IndexRoute
   * @method index
   * @param req {Request} The express Request object.
   * @param res {Response} The express Response object.
   * @next {NextFunction} Execute the next method.
   */
  public index(req: AuthRequest, res: Response) {
     console.log(req.token);
     console.log(req.user);
    // console.log(req.get('user'));
      // set options
    const options: Object = {
      'title': 'Evac Connect Platform',
      'message': 'Welcome To EvacConnect'
    };

    // render template
    this.render(req, res, 'index.hbs', options);
  }

    public async uploadCSV(req: AuthRequest, res: Response, next: NextFunction) {
        const uploader = new FileUploader(req, res, next);
        const invalidRecords = [];
        const validRecords = [];
        const filename = await uploader.uploadFileToLocalServer();
        let isEmailRequired = (req.body.is_email_required) ? req.body.is_email_required : false;
        const emailColumn = 2;
        const accountId = (req.body.account_id) ? req.body.account_id : req.user.account_id;
        let isImpaired = (req.body.mobility_impaired) ? req.body.mobility_impaired : false;

        isEmailRequired = (isEmailRequired == 'true') ? true : false;
        isImpaired = (isImpaired == 'true') ? true : false;

        const utils = new Utils();
        let data;
        data = await utils.processCSVUpload(<string>filename, {
            columnStart : 1, columnEnd : 8, rowStart : 2
        });

        if(data.length == 0){
            throw "Format not valid";
        }

        let validInputs = [];
        for(let i in data){
            let 
            user = new User(),
            rowRecord = data[i],
            firstName = rowRecord[0],
            lastName = rowRecord[1],
            email = rowRecord[2].trim(),
            username = rowRecord[3],
            phone = rowRecord[4],
            mobile = rowRecord[5],
            locationId = rowRecord[6],
            erId = rowRecord[7],
            firstLayerValid = false,
            emailIsValid = false,
            isRowValid = false,
            errMsg = '';

            if(firstName.trim().length > 0 && lastName.trim().length > 0 && locationId.trim().length > 0 && erId.trim().length > 0){
                firstLayerValid = true;
                if(isEmailRequired){
                    if (validator.isEmail(email)) {
                        try {
                            const 
                            userEmail = new User(),
                            dbData = await userEmail.getByEmail(email);
                            errMsg = '(email taken)';
                        } catch (e) { emailIsValid = true; }
                    }else{
                        errMsg = '(email invalid)';
                    }
                }else if(email.trim().length > 0){
                    if (validator.isEmail(email)) {
                        try {
                            const 
                            userEmail = new User(),
                            dbData = await userEmail.getByEmail(email);
                            errMsg = '(email taken)';
                        } catch (e) { emailIsValid = true; }
                    }else{
                        errMsg = '(email invalid)';
                    }
                }
            }

            if(emailIsValid){
                let blackListedEmail = new BlacklistedEmails();
                if(blackListedEmail.isEmailBlacklisted(email)){
                    emailIsValid = false;
                    errMsg = '(Email is not allowed)';
                }
            }

            if(firstLayerValid){
                if(isEmailRequired == false && username.trim().length == 0){
                    errMsg = '(username invalid)';
                    isRowValid = false;
                }else if(emailIsValid){
                    isRowValid = true;
                }
            }else{
                errMsg = 'Row : '+(parseInt(i) + 2)+' (Some fields are missing) ';
            }

            if(isRowValid){
                validInputs.push(rowRecord);
            }else{
                rowRecord[1] += ' '+errMsg;
                invalidRecords.push(rowRecord);
            }
        }

        let adminRoute = new AdminRoute();
        req.params = { 'accountId' : accountId };
        let buildingsLevels = <any> await adminRoute.getLocationListing(req, res, true);

        let allLocIds = [];
        for(let building of buildingsLevels.data.buildings){
            if(allLocIds.indexOf(building.location_id) == -1){
                allLocIds.push(building.location_id);
            }
        }

        for(let level of buildingsLevels.data.levels){
            for(let sub of level.sublocations){
                allLocIds.push(sub.id);
            }
        }

        for(let i in validInputs){
            let 
            rowRecord = validInputs[i],
            locModel = new Location(),
            emRoles = rowRecord[7].split(';').map(function(a){  return parseInt(a); }),
            validEmRoles = [],
            emRoleModel = new UserEmRoleRelation(),
            errMsg = '',
            erInvalid = false,
            locInvalid = false;

            for(let emid of emRoles){
                for(let m in defs['em_roles']){
                    if(defs['em_roles'][m] == emid && validEmRoles.indexOf(emid) == -1){
                        validEmRoles.push(emid);
                    }
                }
            }

            if(validEmRoles.length == 0){
                errMsg = '(EM Id invalid)';
                erInvalid = true;
            }

            try{
                locModel.setID(rowRecord[6]);
                await locModel.load();

                let locFound = false;
                for(let locid of allLocIds){
                    if(locid == rowRecord[6]){
                        locFound = true;
                    }
                }

                if(!locFound){
                    locInvalid = true;
                    errMsg = '(Location Id invalid)';
                }

            }catch(e){
                locInvalid = true;
                errMsg = '(Location Id invalid)';
            }

            if(!erInvalid && !locInvalid){
                validRecords.push(rowRecord);
            }else{
                rowRecord[1] += ' '+errMsg;
                invalidRecords.push(rowRecord);
            }
        }

        try{
            for(let i in validRecords){
                let 
                userSaveModel = new User(),
                rowRecord = validRecords[i],
                token = this.generateRandomChars(15),
                emRoles = rowRecord[7].split(';').map(function(a){  return parseInt(a); }),
                tokenModel = new Token();
                await userSaveModel.create({
                    'first_name' : rowRecord[0],
                    'last_name' : rowRecord[1],
                    'email' : rowRecord[2],
                    'user_name' : rowRecord[3],
                    'phone_number' : rowRecord[4],
                    'mobile_number' : rowRecord[5],
                    'password' : md5('Ideation'+defs['DEFAULT_USER_PASSWORD']+'Max'),
                    'token' : token,
                    'account_id' : accountId,
                    'mobility_impaired' : (isImpaired) ? 1 : 0,
                    'can_login' : 1
                });

                await tokenModel.create({
                    'token': token,
                    'action': 'verify',
                    'verified': 1,
                    'expiration_date': moment().add(7, 'days').format('YYYY-MM-DD'),
                    'id': userSaveModel.ID(),
                    'id_type': 'user_id'
                });

                for(let emid of emRoles){
                    let userEmRole = new UserEmRoleRelation();
                    await userEmRole.create({
                        'user_id' : userSaveModel.ID(),
                        'em_role_id' : emid,
                        'location_id' : rowRecord[6]
                    });
                }
            }
        }catch(e){
            console.log(e);
        }

        fs.unlink(<string>filename, () => {
            console.log(`Successfully delete file: ${filename}`);
        });
        return {
            'valid': validRecords,
            'invalid': invalidRecords,
            'data-override': req.body.override
        };
    }

    public async addUsersFromCSV(req: AuthRequest, res: Response) {
        const user_invitation_records = JSON.parse(req.body.invitations);
        const dataOverride = req.body.data_override;
        const utils = new Utils();
        let em_role = '';
        let account_role = '';
        let name = '';
        const allRolesObj = {};
        for (let i = 0; i < user_invitation_records.length; i++) {
            const userInvitation = new UserInvitation();
            const tokenModel = new Token();
            const tokenStr = tokenModel.generateRandomChars(10);
            if (('ECO Role' in   user_invitation_records[i])) {
                em_role = (user_invitation_records[i]['ECO Role']).toUpperCase();
            }
            if (('First Name' in user_invitation_records[i]) && ('Last Name' in user_invitation_records[i])) {
                name = ' ' + user_invitation_records[i]['First Name'] + ' ' + user_invitation_records[i]['Last Name'];
            }
            if(('Role' in user_invitation_records[i])) {

                const ecos = await utils.buildECORoleList();
                for (let i in ecos ){
                    allRolesObj[ecos[i]['role_name'].toUpperCase()] = ecos[i]['em_roles_id'];
                }
                if(user_invitation_records[i]['Role'].toUpperCase() in allRolesObj){
                    em_role = user_invitation_records[i]['Role'].toUpperCase();
                } else if(user_invitation_records[i]['Role'].toUpperCase() in defs['account_roles']) {
                    account_role = (user_invitation_records[i]['Role'].toUpperCase());
                }

            }
            await userInvitation.create({
                'first_name': ('First Name' in user_invitation_records[i]) ? user_invitation_records[i]['First Name'] : '',
                'last_name': ('Last Name' in user_invitation_records[i]) ? user_invitation_records[i]['Last Name'] : '',
                'email': user_invitation_records[i]['Email'],
                'location_id': 0,
                'account_id': req.user.account_id,
                'role_id': (account_role.length > 0 ) ? defs['account_roles'][account_role] : 0,
                'eco_role_id': (em_role.length > 0) ? defs['em_roles'][em_role] : 0,
                'contact_number': ('Mobile Number' in  user_invitation_records[i]) ? user_invitation_records[i]['Mobile Number'] : '',
                'phone_number': ('Phone Number' in  user_invitation_records[i]) ? user_invitation_records[i]['Phone Number'] : '',
                'invited_by_user': req.user.user_id
            });
            const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
            await tokenModel.create({
                'token': tokenStr,
                'action': 'invitation',
                'verified': 0,
                'expiration_date': expDate,
                'id': userInvitation.ID(),
                'id_type': 'user_invitations_id'
            });
            em_role = '';
            account_role = '';
            const opts = {
                from : '',
                fromName : 'EvacConnect',
                to : [],
                cc: [],
                body : '',
                attachments: [],
                subject : 'EvacConnect Warden Nomination'
            };
            const email = new EmailSender(opts);
            const link = 'https://' + req.get('host') + '/signup/warden-profile-completion/' + tokenStr;
            let emailBody = email.getEmailHTMLHeader();
            emailBody += `<h3 style="text-transform:capitalize;">Hi${name},</h3> <br/>
            <h4>You are nominated to be a Warden.</h4> <br/>
            <h5>Click on the link below to setup your password.</h5> <br/>
            <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

            emailBody += email.getEmailHTMLFooter();
            email.assignOptions({
                body : emailBody,
                to: [user_invitation_records[i]['Email']]
            });
            await email.send((result) => console.log(result),
                (err) => console.log(err)
                );
        }
        return true;
        
    }

    public async addMobilityImpairedPersons(req: AuthRequest, res: Response) {
        console.log(JSON.parse(req.body.peep));
        const peep = JSON.parse(req.body.peep);
        const invalidPeep = [];
        const expDate = moment().format('YYYY-MM-DD HH-mm-ss');

        let accountId = req.user.account_id,
        account = {},
        accountModel = new Account(accountId),
        isAccountEmailExempt = false;

        try{
            let account = <any> await accountModel.load();
            isAccountEmailExempt = (account.email_add_user_exemption == 1) ? true : false;
        }catch(e){

        }

        for (const p of peep) {
            p['errors'] = {};
            const userInvitation = new UserInvitation();
            const tokenModel = new Token();
            const tokenStr = tokenModel.generateRandomChars(10);
            const userEmail = new User();
            const locModel = new Location();
            const parentLocModel = new Location();
            const userEmRole = new UserEmRoleRelation();
            const emRoles = await userEmRole.getEmRoles();
            try {
                const dbData = await userEmail.getByEmail(p['email']);
                p['errors']['email_taken'] = true;
                invalidPeep.push(p);
            } catch (e) {
                if (validator.isEmail(p['email'])) {

                    p['invited_by_user'] = req.user.user_id;
                    p['account_id'] = accountId;
                    p['was_used'] = (isAccountEmailExempt) ? 1 : 0;
                    const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
                    await userInvitation.create(p);

                    if(isAccountEmailExempt){
                        let user  = new User(),
                        encryptedPassword = md5('Ideation' + defs['DEFAULT_USER_PASSWORD'] + 'Max');

                        await user.create({
                            'first_name': p['first_name'],
                            'last_name': p['last_name'],
                            'password': encryptedPassword,
                            'email': p['email'],
                            'token': tokenStr,
                            'account_id': accountId,
                            'invited_by_user': req['user']['user_id'],
                            'can_login': 1,
                            'mobile_number': p['contact_number'],
                            'mobility_impaired' : 1
                        });

                        let tokenModel = new Token();
                        await tokenModel.create({
                            'token' : tokenStr,
                            'action' : 'verify',
                            'id' : user.ID(),
                            'id_type' : 'user_id',
                            'verified' : 1,
                            'expiration_date': expDate
                        });

                        let locationAcctUser = new LocationAccountUser();
                        await locationAcctUser.create({
                            'location_id': p['location_id'],
                            'account_id': accountId,
                            'user_id': user.ID(),
                            'role_id': p['eco_role_id']
                        });

                        if(parseInt(p['role_id']) == 1 || parseInt(p['role_id']) == 2){
                            const userRoleRel = new UserRoleRelation();
                            await userRoleRel.create({
                                'user_id': user.ID(),
                                'role_id': p['role_id']
                            });
                        }else{
                            const EMRoleUserRole = new UserEmRoleRelation();
                            await EMRoleUserRole.create({
                                'user_id': user.ID(),
                                'em_role_id': p['eco_role_id'],
                                'location_id': p['location_id']
                            });
                        }

                    }

                    if(isAccountEmailExempt == false){
                        await tokenModel.create({
                            'token': tokenStr,
                            'action': 'invitation',
                            'verified': 0,
                            'expiration_date': expDate,
                            'id': userInvitation.ID(),
                            'id_type': 'user_invitations_id'
                        });

                        locModel.setID(p.location_id);
                        let location = await locModel.load();
                        let parentName = '';
                        if(location['parent_id'] > -1){
                            parentLocModel.setID(location['parent_id']);
                            await parentLocModel.load();
                            parentName = <string>parentLocModel.get('name');
                        }
                        let locText = '';
                        if(parentName.length > 0){
                            locText += parentName+', ';
                        }
                        locText += location['name'];

                        const opts = {
                            from : '',
                            fromName : 'EvacConnect',
                            to : [],
                            cc: [],
                            body : '',
                            attachments: [],
                            subject : 'EvacConnect Warden Nomination'
                        };
                        const email = new EmailSender(opts);
                        const link = 'https://' + req.get('host') + '/signup/warden-profile-completion/' + tokenStr;
                        let emailBody = email.getEmailHTMLHeader();

                        let roleText = ``;
                        if(p.role_id == 1){
                            roleText += ' FRP '
                        }else if(p.role_id == 2){
                            roleText += ' TRP '
                        }

                        if(p.eco_role_id >= 8){
                            let emRole = '';
                            for(let i in emRoles){
                                if(emRoles[i]['em_roles_id'] == p.eco_role_id){
                                    emRole = emRoles[i]['role_name'];
                                }
                            }
                            roleText += ' AND '+emRole;
                        }

                        emailBody += `<h3 style="text-transform:capitalize;">Hi ${p['first_name']} ${p['last_name']},</h3> <br/>
                        <h4>You are invited to be ${roleText} in ${locText}.</h4> <br/>
                        <h5>Click on the link below to setup your password.</h5> <br/>
                        <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

                        emailBody += email.getEmailHTMLFooter();
                        email.assignOptions({
                            body : emailBody,
                            to: [p['email']],
                            cc: []
                        });
                        email.send((data) => console.log(data),
                            (err) => console.log(err)
                            );

                    }



                } else {
                    p['errors']['invalid'] = true;
                    invalidPeep.push(p);
                }
            }
        }

        return invalidPeep;
    }

    public async addBulkWardenByForm(req: AuthRequest, res: Response) {
        let wardens = JSON.parse(req.body.wardens),
        userRoleRel = new UserRoleRelation(),
        invalidWarden = [],
        role = await userRoleRel.getByUserId(req.user.user_id, true),
        accountId = req.user.account_id,
        account = {},
        accountModel = new Account(accountId),
        isAccountEmailExempt = false;

        try{
            let account = <any> await accountModel.load();
            isAccountEmailExempt = (account.email_add_user_exemption == 1) ? true : false;
            isAccountEmailExempt = true;
        }catch(e){

        }

        try{
            for (const warden of wardens) {
                const user = new User();
                warden['errors'] = {};

                try {
                    const dbData = await user.getByEmail(warden['email']);
                    warden['errors']['email_taken'] = true;
                    invalidWarden.push(warden);
                } catch (e) {

                    if (validator.isEmail(warden['email'])) {
                        const userInvitation = new UserInvitation();
                        const tokenModel = new Token();
                        const tokenStr = tokenModel.generateRandomChars(10);
                        warden['invited_by_user'] = req.user.user_id;
                        warden['account_id'] = accountId;

                        const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
                        await userInvitation.create(warden);

                        if(isAccountEmailExempt){
                            let user  = new User(),
                            encryptedPassword = md5('Ideation' + defs['DEFAULT_USER_PASSWORD'] + 'Max');

                            await user.create({
                                'first_name': warden['first_name'],
                                'last_name': warden['last_name'],
                                'password': encryptedPassword,
                                'email': warden['email'],
                                'token': tokenStr,
                                'account_id': accountId,
                                'invited_by_user': req['user']['user_id'],
                                'can_login': 1,
                                'mobile_number': warden['contact_number']
                            });

                            let tokenModel = new Token();
                            await tokenModel.create({
                                'token' : tokenStr,
                                'action' : 'verify',
                                'id' : user.ID(),
                                'id_type' : 'user_id',
                                'verified' : 1
                            });

                            let locationAcctUser = new LocationAccountUser();
                            await locationAcctUser.create({
                                'location_id': warden['location_id'],
                                'account_id': accountId,
                                'user_id': user.ID(),
                                'role_id': warden['eco_role_id']
                            });

                            const EMRoleUserRole = new UserEmRoleRelation();
                            await EMRoleUserRole.create({
                                'user_id': user.ID(),
                                'em_role_id': warden['eco_role_id'],
                                'location_id': warden['location_id']
                            });
                        }

                        if(isAccountEmailExempt == false){
                            await tokenModel.create({
                                'token': tokenStr,
                                'action': 'invitation',
                                'verified': 0,
                                'expiration_date': expDate,
                                'id': userInvitation.ID(),
                                'id_type': 'user_invitations_id'
                            });

                            const opts = {
                                from : '',
                                fromName : 'EvacConnect',
                                to : [],
                                cc: [],
                                body : '',
                                attachments: [],
                                subject : 'EvacConnect Warden Nomination'
                            };
                            const email = new EmailSender(opts);
                            const link = 'https://' + req.get('host') + '/signup/warden-profile-completion/' + tokenStr;
                            let emailBody = email.getEmailHTMLHeader();
                            emailBody += `<h3 style="text-transform:capitalize;">Hi ${warden['first_name']} ${warden['last_name']},</h3> <br/>
                            <h4>You are nominated to be a Warden.</h4> <br/>
                            <h5>Click on the link below to setup your password.</h5> <br/>
                            <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

                            emailBody += email.getEmailHTMLFooter();
                            email.assignOptions({
                                body : emailBody,
                                to: [warden['email']],
                                cc: []
                            });
                            email.send((data) => console.log(data),
                                (err) => console.log(err)
                                );
                        }

                    } else {
                        warden['errors']['invalid'] = true;
                        invalidWarden.push(warden);
                    }

                }
            }
        }catch(e){

        }


        return invalidWarden;
    }

    public async retrieveWardenInvationInfo(req: Request, res: Response, next: NextFunction) {

        let locationsOnAccount = [],
            location,
            userInvitation,
            token = '',
            dbData;

        if (req.params.token) {
            token = req.params.token;
        }

        const tokenModel = new Token();
        const tokenDbData = await tokenModel.getByToken(token);

        if (tokenDbData['id_type'] === 'user_invitations_id' && !tokenDbData['verified']) {
            userInvitation = new UserInvitation(tokenDbData['id']);
            dbData = await userInvitation.load();
        } else {
            throw new Error('Invalid token');
        }

        const userRoleRel = new UserRoleRelation();

        // what is the highest rank role of the user who invited this warden
        const role = await userRoleRel.getByUserId(dbData['invited_by_user'], true);
        // the account of the user who invited this warden
        const account = new Account(dbData['account_id']);
        try {
            // locations tagged to the user who invited this warden
            locationsOnAccount = await account.getLocationsOnAccount(dbData['invited_by_user'], role);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }

        const accountDB = await account.load();
        dbData['account'] = account.get('account_name');


        if (!dbData['location_id']) {
            switch (role) {
                case 1:
                    for (let loc of locationsOnAccount) {
                        location = new Location(loc.location_id);
                        loc['sublocations'] = await location.getSublocations();
                    }
                    dbData['locations'] = locationsOnAccount; console.log('dbData = ', dbData);
                break;
                case 2:
                    let results,
                        objectOfSubs:{[key: number]: any[]} = {},
                        seenParents = [],
                        rootParents = [],
                        pId = 0;

                    for (let loc of locationsOnAccount) {
                        objectOfSubs[loc.parent_id] = [];
                    }
                    for (let loc of locationsOnAccount) {
                        objectOfSubs[loc.parent_id].push(loc);

                        if ((seenParents.indexOf(loc.parent_id) * 1)  === -1) {

                            seenParents.push(loc.parent_id);
                            let parentId = loc.parent_id;
                            while (parentId !== -1) {
                                location = new Location(parentId);
                                await location.load();
                                parentId = location.get('parent_id');
                            }

                            rootParents.push(location.getDBData());
                            location.set('desc', loc.parent_id);
                            location = undefined;
                        }
                    }

                    let seenRoots = [];
                    let processedRootParents = [];
                    for (let r of rootParents) {
                        if(seenRoots.indexOf(r['location_id']) == -1) {
                            r['sublocations'] = [];
                            r['sublocations'] = objectOfSubs[r['desc']];
                            r['sublocations']['total'] = 0;
                            r['total_subs'] = objectOfSubs[r['desc']].length;
                            seenRoots.push(r['location_id']);
                            processedRootParents.push(r);
                        }
                    }
                    dbData['locations'] = processedRootParents;
                    break;
            }
        } else {
            let locationInstance = new Location(dbData['location_id']);
            await locationInstance.load();
            dbData['location_name'] = locationInstance.get('name');
            let pId = <number>locationInstance.get('parent_id');
            while (pId !== -1) {
                locationInstance = new Location(pId);
                await locationInstance.load();
                pId = <number>locationInstance.get('parent_id');
            }
            dbData['parent_location_name'] = locationInstance.get('name') ? locationInstance.get('name') : locationInstance.get('formatted_address');
            dbData['parent_location_id'] = locationInstance.ID();

        }

        return dbData;
    }

    public async processWardenInvitation(req: Request, res: Response, next: NextFunction) {
        if (req.body.password !== req.body.confirmPassword) {
            throw new Error('Passwords do not match');
        }
        const expDate = moment().format('YYYY-MM-DD HH-mm-ss');

        const encryptedPassword = md5('Ideation' + req.body.password + 'Max');

        let invitation;
        let user;
        try {
            user  = new User();
            const tokenObj = new Token();
            const tokenDbData = await tokenObj.getByToken(req.body.token);
            invitation = new UserInvitation(tokenDbData['id']);
            const userInvitation = await invitation.load();
            await user.create({
                'first_name': req.body.first_name,
                'last_name': req.body.last_name,
                'password': encryptedPassword,
                'email': req.body.email,
                'token': req.body.token,
                'account_id': req.body.account_id,
                'invited_by_user': userInvitation['invited_by_user'],
                'mobility_impaired': userInvitation['mobility_impaired'],
                'can_login': 1,
                'mobile_number': userInvitation['contact_number']
            });
            await tokenObj.create({
                'action': 'verify',
                'verified': 1,
                'id': user.ID(),
                'id_type': 'user_id',
                'expiration_date': expDate
            });
            await invitation.create({
                'was_used': 1
            });
        } catch (e) {
            console.log(e);
            throw new Error('Internal Error');
        }

        let locationAcctUser = new LocationAccountUser();

        let theLocation = req.body.sublocation;
        if (req.body.role_id == defs['Manager']) {
            let locationInstance = new Location(req.body.parent_location);
            await locationInstance.load();
            let pId = <number>locationInstance.get('parent_id');
            while (pId !== -1) {
                locationInstance = new Location(pId);
                await locationInstance.load();
                pId = <number>locationInstance.get('parent_id');
            }
            theLocation = locationInstance.ID();
        }

        if(parseInt(req.body.role_id) == 1 || parseInt(req.body.role_id) == 2){
            const userRoleRel = new UserRoleRelation();
            await userRoleRel.create({
                'user_id': user.ID(),
                'role_id': req.body.role_id
            });

            locationAcctUser = new LocationAccountUser();
            await locationAcctUser.create({
                'location_id': theLocation,
                'account_id': req.body.account_id,
                'user_id': user.ID()
            });

            const EMRoleUserRole = new UserEmRoleRelation();
            await EMRoleUserRole.create({
                'user_id': user.ID(),
                'em_role_id': defs['em_roles']['GENERAL OCCUPANT'],
                'location_id': req.body.sublocation
            });
        } else {
            const EMRoleUserRole = new UserEmRoleRelation();
            await EMRoleUserRole.create({
                'user_id': user.ID(),
                'em_role_id': req.body.em_role,
                'location_id': theLocation
            });
        }

        const locationAccntRel = new LocationAccountRelation();

        try {
            await locationAccntRel.getLocationAccountRelation({
                'location_id': theLocation,
                'account_id': req.body.account_id,
                'responsibility': defs['role_text'][req.body.role_id]
            });
        } catch (err) {
            await locationAccntRel.create({
                'location_id': theLocation,
                'account_id': req.body.account_id,
                'responsibility': defs['role_text'][req.body.role_id]
            });
        }
        return;
    }

    public async addBulkWardenByEmail(req: AuthRequest, res: Response) {
        const emailsSubmitted = JSON.parse(req.body.wardensEmail);
        console.log(typeof emailsSubmitted);
        const invalidWardenEmails = [];
        const objEmail = [];
        const user = new User();
        for (let x = 0; x < emailsSubmitted.length; x++ ) {
            if (validator.isEmail(emailsSubmitted[x])) {
                try {
                    const dbData = await user.getByEmail(emailsSubmitted[x]);
                    invalidWardenEmails.push(emailsSubmitted[x]);
                } catch (e) {
                    objEmail.push(emailsSubmitted[x]);
                }
            }
        }

        const opts = {
            from : '',
            fromName : 'EvacConnect',
            to : [],
            cc: [],
            body : '',
            attachments: [],
            subject : 'EvacConnect Warden Invitation'
        };
        const email = new EmailSender(opts);

        for (let i = 0; i < objEmail.length; i++) {
            const inviCode = new UserInvitation();
            const tokenModel = new Token();
            const token = tokenModel.generateRandomChars(8);

            const link = 'https://' + req.get('host') + '/signup/warden-profile-completion/' + token;
            const expDate = moment().format('YYYY-MM-DD HH-mm-ss');
            await inviCode.create({
                'invited_by_user': req.user.user_id,
                'email': objEmail[i],
                'role_id': 9,
                'account_id': req.user.account_id
            });
            await tokenModel.create({
                'token': token,
                'action': 'invitation',
                'verified': 0,
                'expiration_date': expDate,
                'id': inviCode.ID(),
                'id_type': 'user_invitations_id'
            });

            let emailBody = email.getEmailHTMLHeader();
            emailBody += `<h3 style="text-transform:capitalize;">Hi,</h3> <br/>
            <h4>You are invited to be a Warden.</h4> <br/>
            <h5>Please update your profile to setup your account in EvacOS by clicking the link below</h5> <br/>
            <a href="${link}" target="_blank" style="text-decoration:none; color:#0277bd;">${link}</a> <br/>`;

            emailBody += email.getEmailHTMLFooter();

            email.assignOptions({
                body : emailBody,
                to: [objEmail[i]],
                cc: []
            });
            email.send((data) => console.log(data),
                (err) => console.log(err)
                );
        }
        return emailsSubmitted;
    }

    public async getECOList(req: AuthRequest, res: Response) {
        const utils = new Utils();
        try {
            const roles = utils.buildECORoleList();
            return roles;
        } catch (e) {
            throw new Error('There was a problem generating the list');
        }
    }

    public async buildWardenList(req: AuthRequest, res: Response, archived?){
        let accountId = req.user.account_id,
            userID = req['user']['user_id'],
            locationAccountUser = new LocationAccountUser(),
            response = {
                data : <any>[],
                status : false,
                message : ''
            },
            allParents = [],
            allUsersModel = new UserEmRoleRelation(),
            allUsers = <any>[],
            allUsersIds = [],
            emRolesModel = new UserEmRoleRelation(),
            emRoles = await emRolesModel.getEmRoles(),
            emRolesIndexedId = {},
            accountModel = new Account();

        if(!archived){ archived = 0; }

        let allowedRoleIds = [0,1,2];
        for(let i in emRoles){
            allowedRoleIds.push(emRoles[i]['em_roles_id']);
            emRolesIndexedId[ emRoles[i]['em_roles_id'] ] = emRoles[i];
        }

        let locationsOnAccount = await accountModel.getLocationsOnAccount(userID, 1, archived),
            locations = <any> [];

        for (let loc of locationsOnAccount) {
            locations.push(loc);
        }

        let locationsData = [];
        for (let loc of locations) {
            let
                deepLocModel = new Location(),
                deepLocations = <any> [];

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

            let isIn = false;
            for(let dl of deepLocations){
                for(let ld of locationsData){
                    if(dl.location_id == ld.location_id){
                        isIn = true;
                    }
                }

                if(!isIn){
                    locationsData.push(dl);
                }
            }
        }

        allUsers = await allUsersModel.getUsersByAccountId(accountId, archived);
        // response['allUsers'] = allUsers;

        for(let user of allUsers){
            allUsersIds.push(user.user_id);
            let filesModel = new Files();
            try{
                let profRec = await filesModel.getByUserIdAndType( user.user_id, 'profile' );
                user['profile_pic'] = profRec[0]['url'];
            }catch(e){
                user['profile_pic'] = '';
            }

            user['locations'] = [];
            user['roles'] = [];
        }
        const userIds = [];
        let toSendData = [];
        const userCourseRel = new CourseUserRelation();
        // get assigned trainings
        for (let user of allUsers) {
            userIds.push(user.user_id);
        }
        let user_course_total;
        let user_training_total;
        // get trainings from certifications table
        const training = new TrainingCertification();
        try {
            user_course_total = await userCourseRel.getNumberOfAssignedCourses(userIds);

        } catch (e) {
            user_course_total = {};
        }
        try {
            user_training_total = await training.getNumberOfTrainings(userIds, {
              'pass': 1,
              'current': 1
            });
        } catch(e) {
            user_training_total = {};
        }
        for(let user of allUsers){
            let userLocData = {
                    user_id : user.user_id,
                    location_id : 0,
                    name : '',
                    parent_id : -1,
                    parent_name : '',
                    location_role_id : 0
                };

              if (user.user_id in user_course_total) {
                  user['assigned_courses'] = user_course_total[user.user_id]['count'];
              } else {
                  user['assigned_courses'] = 0;
              }
              if (user.user_id in user_training_total) {
                  user['trainings'] = user_training_total[user.user_id]['count'];
              } else {
                  user['trainings'] = 0;
              }

            for(let loc of locationsData){
                if(loc.location_id == user.location_id){
                    userLocData.location_id = loc.location_id;
                    userLocData.name = loc.name;
                    userLocData.parent_id = loc.parent_id;
                    userLocData.location_role_id = user.em_role_id;

                    if(loc.parent_id > -1){
                        for(let par of locationsData){
                            if(par.location_id == loc.parent_id){
                                userLocData.parent_name = par.name;
                            }
                        }
                    }
                }
            }

            user['locations'].push(userLocData);
            toSendData.push(user);
        }


        for(let user of toSendData){
            let locs = user.locations;

            let tempUserRoles = {};
            for(let loc of locs){
                let roleName = 'General Occupant',
                    roleId = 8;

                if( emRolesIndexedId[ loc.location_role_id ] ){
                    roleName = emRolesIndexedId[ loc.location_role_id ]['role_name'];
                    roleId = loc.location_role_id;
                }

                user['roles'].push({
                    role_name : roleName, role_id : roleId
                });

            }
        }

        response.data = toSendData;
        // response['locations'] = locationsData;
        response.status = true;
        res.statusCode = 200;
        res.send(response);
    }

    public async trainingSendInvite(req: AuthRequest, res: Response){
        const user = new User(req.body.user_id);

        try{

            const userDbData = await user.load();
            const opts = {
                from : '',
                fromName : 'EvacConnect',
                to : [],
                cc: [],
                body : '',
                attachments: [],
                subject : 'EvacConnect Training Invite'
            };

            let currentDate = moment(),
                expirationDate = currentDate.add(1, 'day'),
                expDateFormat = expirationDate.format('YYYY-MM-DD HH:mm:ss'),
                saveData = {
                    id : user.get('user_id'),
                    id_type : 'user_id',
                    token : user.get('user_id')+''+this.generateRandomChars(50),
                    action : 'forgot-password',
                    expiration_date : expDateFormat
                },
                tokenTraining = this.generateRandomChars(40),
                tokenModel = new Token(),
                tokenTrainModel = new Token(),
                multiTokenModel = new Token();

            try{
                let tokens = await multiTokenModel.getAllByUserId(user.get('user_id'));
                for(let t in tokens){
                    if(tokens[t]['action'] == 'forgot-password'){
                        let tokenDelete = new Token(tokens[t]['token_id']);
                        await tokenDelete.delete();
                    }
                }
            }catch(e){}

            let forgotPassLink = 'https://' + req.get('host') +'/token/'+saveData['token'],
                trainingLink = 'https://'+req.get('host') + '/token/'+tokenTraining;

            await tokenModel.create(saveData);

            saveData['token'] = tokenTraining;
            saveData['action'] = 'training-invite';
            await tokenTrainModel.create(saveData);

            let
            roleText = (req.body.no_role_email) ? '' : `for your role as <strong>${req.body.role_name}</strong>`,
            emailData = {
                users_fullname : this.toTitleCase(userDbData['first_name']+' '+userDbData['last_name']),
                training_name : req.body.training_requirement_name,
                role_text_html : roleText,
                loggedin_link : trainingLink,
                forgotpassword_link : forgotPassLink
            },
            email = new EmailSender(opts);

            email.assignOptions({
                to: [userDbData['email']],
                cc: []
            });
            email.sendFormattedEmail('training-invite', emailData, res, 
                (result) => {
                    console.log('Success', result);
                    return res.status(200).send({
                        message: 'Success'
                    });
                }, 
                (err) => {
                    console.log('Failed', err);
                    return res.status(400).send({
                        message: 'Failed'
                    });
                }
            );

        }catch(e){
            return res.status(400).send({
                message: 'Failed'
            });
        }
    }

    public async buildPEEPList(req: AuthRequest, res:Response, archived?){
        let accountId = req['user']['account_id'],
            userID = req['user']['user_id'],
            locationAccountUser = new LocationAccountUser(),
            response = {
                data : <any>[],
                status : false,
                message : ''
            },
            allParents = [],
            allUsersModel = new User(),
            allUsers = <any>[],
            allUsersIds = [],
            emRolesModel = new UserEmRoleRelation(),
            emRoles = await emRolesModel.getEmRoles(),
            emRolesIndexedId = {},
            accountModel = new Account();

        if(!archived){ archived = 0; }

        let locationsOnAccount = await accountModel.getLocationsOnAccount(req.user.user_id, 1, archived),
            locations = <any> [];

        for (let loc of locationsOnAccount) {
            locations.push(loc);
        }

        let locationsData = [];
        for (let loc of locations) {
            let
                deepLocModel = new Location(),
                deepLocations = <any> [];

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

            let isIn = false;
            for(let dl of deepLocations){
                for(let ld of locationsData){
                    if(dl.location_id == ld.location_id){
                        isIn = true;
                    }
                }

                if(!isIn){
                    locationsData.push(dl);
                }
            }
        }

        // response['locations'] = locationsData;

        allUsers = await allUsersModel.getImpairedByAccountId(accountId, archived);

        // response['allUsers'] = allUsers;

        for(let user of allUsers){
            allUsersIds.push(user.user_id);

            let filesModel = new Files(),
                arrWhere = [];

            try{
                let profRec = await filesModel.getByUserIdAndType( user.user_id, 'profile' );
                user['profile_pic'] = profRec[0]['url'];
            }catch(e){
                user['profile_pic'] = '';
            }

            arrWhere.push( "user_id = "+user["user_id"] );

            user['mobility_impaired_details'] = await new MobilityImpairedModel().getMany(arrWhere);

            for(let userMobil of user.mobility_impaired_details){
                userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
            }

            user['locations'] = [];
        }

        let toSendData = [];
        for(let user of allUsers){
            let locAccUserModel = new LocationAccountUser(),
                usersLocsMap = <any> await locAccUserModel.getByUserId(user.user_id),
                userLocData = {
                    user_id : user.user_id,
                    location_id : 0,
                    name : '',
                    parent_id : -1,
                    parent_name : ''
                };

            for(let map of usersLocsMap){
                for(let loc of locationsData){
                    if(loc.location_id == map.location_id){
                        userLocData.location_id = loc.location_id;
                        userLocData.name = loc.name;
                        userLocData.parent_id = loc.parent_id;

                        if(loc.parent_id > -1){
                            for(let par of locationsData){
                                if(par.location_id == loc.parent_id){
                                    userLocData.parent_name = par.name;
                                }
                            }
                        }
                    }
                }
            }

            user['locations'].push(userLocData);
            toSendData.push(user);
        }


        let userInviModel = new UserInvitation(),
        whereInvi = [];

        whereInvi.push([ 'account_id = '+accountId ]);
        whereInvi.push([ 'mobility_impaired = 1' ]);
        whereInvi.push([ 'was_used = 0' ]);

        if(!archived){
        whereInvi.push([ 'archived = 0' ]);
        }else{
        whereInvi.push([ 'archived = '+archived ]);
        }

        try{
            let usersInvited:any = await userInviModel.getWhere(whereInvi);
            for(let user of usersInvited){
                user['locations'] = [];
                user['profile_pic'] = '';
                user['mobility_impaired_details'] = [];

                let arrWhere = [];
                arrWhere.push( "user_invitations_id = "+user["user_invitations_id"] );

                user['mobility_impaired_details'] = await new MobilityImpairedModel().getMany(arrWhere);
                for(let userMobil of user.mobility_impaired_details){
                    userMobil['date_created'] = moment(userMobil['date_created']).format('MMM. DD, YYYY');
                }

                user.locations.push({
                    location_id : user.location_id,
                    name : user.location_name,
                    parent_name : (user.parent_name == null) ? '' : user.parent_name
                });

                toSendData.push(user);
            }
        }catch(e){}


        response.data = toSendData;
        response.status = true;
        res.statusCode = 200;
        res.send(response);
    }





}
