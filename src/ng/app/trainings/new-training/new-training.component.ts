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
import { Observable } from 'rxjs/Rx';
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
    private baseUrl;

    public constructor(
        private dashboardService : DashboardPreloaderService,
        private encryptDecryptService : EncryptDecryptService,
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
        this.userService.userTrainingInfo(this.userData['userId']).subscribe((response) => {
            this.userTrainingInfo = response['userInfoTraining'];
            for (let roles of this.userTrainingInfo) {
               
                roles['completed'] = 0;
                roles['total_modules'] = 0;
                roles['percent_status'] = 0;                
                for (let trainingRqmt of roles['training_requirement'] ) {
                    roles['total_modules'] = (trainingRqmt['modules'] as Array<object>).length;
                    console.log('training requirement', trainingRqmt);
                    for (let trainingReqmtModules of trainingRqmt['modules']) {
                        this.allTrainingModules.push(trainingReqmtModules);
                        if (trainingReqmtModules['completed']) {
                            roles['completed']++; 
                        }
                    }
                    roles['percent_status'] =   (roles['completed'] / roles['total_modules']) * 100;
                }
                console.log(roles);                
            }

            
            
        });
    }

    public ngAfterViewInit(){
        $('.workspace.container').css('padding', '0px');
    }

    public ngOnDestroy(){
        user_training_module_relation = 0;
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

}