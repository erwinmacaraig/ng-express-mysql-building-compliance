import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { UserService } from '../../services/users';
import { CourseService } from '../../services/course';
import { DatepickerOptions } from 'ng2-datepicker';
import * as enLocale from 'date-fns/locale/en';
import { ComplianceService } from './../../services/compliance.service';
import { AdminService } from './../../services/admin.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { DomSanitizer } from '@angular/platform-browser';


declare var $: any;
declare var Materialize: any;
declare var moment: any;
declare var user_training_module_relation: any;

@Component({
  selector: 'app-new-training-component',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService, CourseService, ComplianceService, AdminService]
})
export class NewTrainingComponent implements OnInit, OnDestroy, AfterViewInit {
    
    public userData = {};
    public userTrainingInfo;
    public allTrainingModules = [];
    public formatted_launcher_url;
    public emRolesLocations = [];
    public userInfoOtherTraining = [];
    public allMiscModules = [];
    private baseUrl;
    public has_online_training = 0;
    public isWardenTrainingValid = 0;
    public isEnrolledInRewardProgram = false;
    public totalRewardPoints = 0;
    public activeHistoryTab = false;
    public certificates = [];
    public overWriteNonWardenRoleTrainingModules;
    public isWardenRoleArray = [];
    public nonWardenRolesArray = [];
    public myEmRoleIds = [];
    public incorporatedTrainingText = '';
    public displayProgressForNonWardenRole = false;
    private hasWardenRole = false;
    private hasNonWardenRole = false;
    public sub: Subscription;
    
    public constructor(
        private dashboardService : DashboardPreloaderService,
        private encryptor : EncryptDecryptService,
        private userService : UserService,
        private courseService : CourseService,
        private complianceService : ComplianceService,
        private adminService : AdminService,
        private authService : AuthService,
        private sanitizer: DomSanitizer,        
        private platformLocation: PlatformLocation,
    ){
        this.baseUrl = (platformLocation as any).location.origin;
    }

    public ngOnInit() {
        this.userData = this.authService.getUserData();
        this.has_online_training = this.userData['account_has_online_training'];
        this.dashboardService.show();
        this.userService.computeUserRewardPoints(this.userData['userId']).subscribe((response) => {
            this.isEnrolledInRewardProgram = true;
            this.totalRewardPoints = response.total_points;
        }, (error) => {
            this.dashboardService.hide();
            this.isEnrolledInRewardProgram = false;
            this.totalRewardPoints = 0;
        });

        this.getTrainingInfo();
        
    }

    private getTrainingInfo() {
        this.sub =  this.userService.userTrainingInfo(this.userData['userId']).subscribe((response) => {
            this.userTrainingInfo = response['userInfoTraining'];
            // unique locations
            let temp = [];
            for (let loc of response.emRolesLocation) {
                if (temp.indexOf(loc['location_id']) == -1) {
                    temp.push(loc['location_id']);
                    this.emRolesLocations.push(loc);
                }
            }

            // this.certificates = response.certificates;
            for (let cert of response.certificates) {
                cert['encryptedCertId'] = this.encryptor.encrypt(cert['certifications_id']);
                this.certificates.push(cert);
            }
            
            this.overWriteNonWardenRoleTrainingModules = response.overWriteNonWardenRoleTrainingModules;
            this.isWardenRoleArray = response.isWardenRoleArray;
            this.nonWardenRolesArray = response.nonWardenRolesArray;
            this.myEmRoleIds = response.myEmRoleIds;

            const moduleIds = [];
            this.userInfoOtherTraining = response.userInfoOtherTraining['training_requirement'];
            for (let roles of this.userTrainingInfo) {
                roles['completed'] = 0;
                roles['total_modules'] = 0;
                roles['percent_status'] = 0;
                roles['inc_text'] = '';
                if ( (roles['em_role_id'] == 9 ||
                      roles['em_role_id'] == 10 ||
                      roles['em_role_id'] == 11 ||
                      roles['em_role_id'] == 15 ||
                      roles['em_role_id'] == 16 ||
                      roles['em_role_id'] == 18 ) && roles['role_training_status'] == 'compliant') {
                    this.isWardenTrainingValid = 1;
                }
                
                if (this.overWriteNonWardenRoleTrainingModules && this.nonWardenRolesArray.indexOf(roles['em_role_id']) != -1) {
                    roles['inc_text'] = `This training is incorported below`;
                }                
                for (let trainingRqmt of roles['training_requirement'] ) {                    
                    roles['total_modules'] = (trainingRqmt['modules'] as Array<object>).length;
                    if ('total_modules' in trainingRqmt) {
                        roles['total_modules'] = trainingRqmt['total_modules'];
                    }
                    if ('total_completed_modules' in trainingRqmt) {
                        roles['completed'] = trainingRqmt['total_completed_modules'];
                    }
                    console.log('training requirement', trainingRqmt);
                    for (let trainingReqmtModules of trainingRqmt['modules']) {

                        if (moduleIds.indexOf(trainingReqmtModules['module_id']) == -1) {

                            moduleIds.push(trainingReqmtModules['module_id']);
                            this.allTrainingModules.push({
                                ...trainingReqmtModules                                
                            });                 

                            if (trainingReqmtModules['completed']) {
                                roles['completed']++; 
                            }
                        }                        
                    }
                    roles['percent_status'] =   (roles['completed'] / roles['total_modules']) * 100;
                    if (isNaN(roles['percent_status'])) {
                        roles['percent_status'] = 0;
                    }
                }
                console.log(roles);                
            }
            
            for(let other of this.userInfoOtherTraining) {
                other['completed'] = 0;
                other['total_modules'] = other['modules'].length;
                other['percent_status'] = 0;
                for (let module of other['modules']) {
                    this.allMiscModules.push(module);
                }
            }            
           console.log(this.userInfoOtherTraining);            
            this.dashboardService.hide();
        },(e: HttpErrorResponse) => {
            console.log(e);
            this.dashboardService.hide();
        });

    }

    public ngAfterViewInit(){
        $('.workspace.container').css('padding', '0px');
    }

    public ngOnDestroy(){
        this.sub.unsubscribe();
        user_training_module_relation = 0;
        this.isWardenTrainingValid = 0;
        this.formatted_launcher_url = '';
        $('.workspace.container').css('padding', '');

    }

    public loadTrainingModule(module: object = {}) {
        user_training_module_relation = 0;
        this.formatted_launcher_url = this.sanitizer.bypassSecurityTrustResourceUrl(this.baseUrl + '/' + module['module_launcher']);
        const postData = {
            user_id: this.userData['userId'],
            tr_id: module['training_requirement_id'],
            module_id: module['training_module_id']
        };

        if ('user_training_module_relation_id' in module) {
            user_training_module_relation = module['user_training_module_relation_id'];
            postData['user_training_module_relation_id'] = module['user_training_module_relation_id'];
        }

        this.complianceService.setUpUserTrainingModule(postData)
        .subscribe(
            (response) => {
                 if (!user_training_module_relation) {
                    user_training_module_relation = response.user_training_module_relation_id;
                 }
                 setTimeout(() => {
                    console.log(module);
                      $('.modal').modal({
                        dismissible : false,
                        startingTop : '0%',
                        endingTop: '5%'
                      });
                      $('#training').modal('open');
                 }, 600);

            },
            (error) => {
                console.log(error);
                alert('Cannot load training module. Try again later');
            }
        );

    }

    onCloseTrainingModule() {        
        
        this.formatted_launcher_url = '';
        this.userTrainingInfo = [];
        this.certificates = [];
        this.emRolesLocations = [];
        this.userInfoOtherTraining = [];
        this.allMiscModules = [];
        this.isWardenTrainingValid = 0;
        this.allTrainingModules = [];

        this.courseService.logOutTrainingModule(user_training_module_relation).subscribe((response) => {
            user_training_module_relation = 0;
            /*
            if(response.lesson_status == 'completed' || response.lesson_status == 'passed') {
                window.location.reload();
            }
            */
           // user_training_module_relation = 0;
           this.getTrainingInfo();
        });
    }

}