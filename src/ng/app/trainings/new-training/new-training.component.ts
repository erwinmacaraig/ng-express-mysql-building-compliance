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
import { DomSanitizer } from '@angular/platform-browser';
import { AdminService } from './../../services/admin.service';
import { Observable } from 'rxjs/Rx';

declare var $: any;
declare var Materialize: any;
declare var moment: any;

@Component({
  selector: 'app-new-training-component',
  templateUrl: './new-training.component.html',
  styleUrls: ['./new-training.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService, CourseService, ComplianceService, AdminService]
})
export class NewTrainingComponent implements OnInit, OnDestroy, AfterViewInit {
    
    public userData = {};
    public userTrainingInfo;

    public constructor(
        private dashboardService : DashboardPreloaderService,
        private encryptDecryptService : EncryptDecryptService,
        private userService : UserService,
        private courseService : CourseService,
        private complianceService : ComplianceService,
        private adminService : AdminService,
        private authService : AuthService
    ){

    }

    public ngOnInit() {
        this.userData = this.authService.getUserData();
        this.userService.userTrainingInfo(this.userData['userId']).subscribe((response) => {
            console.log(response);
            this.userTrainingInfo = response['userInfoTraining'];
        });
    }

    public ngAfterViewInit(){
        $('.workspace.container').css('padding', '0px');
    }

    public ngOnDestroy(){
        $('.workspace.container').css('padding', '');
    }

}