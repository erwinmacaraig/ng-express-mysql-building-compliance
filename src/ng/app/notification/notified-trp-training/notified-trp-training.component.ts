import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/users';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { PlatformLocation } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course';
import { ComplianceService } from './../../services/compliance.service';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';

declare var user_course_relation: any;
declare var $: any;
@Component({
    selector: 'app-notified-trp-required-training',
    templateUrl: './notified-trp-training.component.html',
    styleUrls: ['./notified-trp-training.component.css'],
    providers: [UserService, EncryptDecryptService, CourseService, ComplianceService]
})
export class NotifiedTRPTrainingsComponent implements OnInit, AfterViewInit, OnDestroy{

    // private properties
    private userId = 0;
    private location_id = 0;
    private configId = 0;
    private notification_token_id = 0;
    private role = 0;
    private accountId = 0;
    private building_id = 0;
    private baseUrl = '';
    
    // public properties
    public isCompliant = false;
    public emergencyRoles = [8]; // if user is tagged to a location, its automatic that user is gen occupant
    public trainingItems = []; // required training items
    public validTrainingItems = []; 
    public encryptedToken = '';
    public hasTrainingReminder = false;
    public selectedCourse = <any>{};
    public showThankYouScreen = false;

    constructor(private userService: UserService,
        private route: ActivatedRoute,
        private router: Router,
        private cryptor: EncryptDecryptService,
        private authService: AuthService,
        private sanitizer: DomSanitizer,
        private courseService: CourseService,
        private platformLocation: PlatformLocation,
        private complianceService: ComplianceService) {
            this.baseUrl = environment.backendUrl;
        }


    ngOnInit() {
        this.route.params.subscribe((params) => {
            const token = this.cryptor.decryptUrlParam(params['token']);
            this.encryptedToken = params['token'];
            const parts: Array<string> = token.split('_');
            this.userId = +parts[0];
            this.location_id = +parts[1];
            this.building_id = +parts[2];
            this.role = +parts[3];
            this.accountId = +parts[4];

            const userId = +this.authService.userDataItem('userId');
            if (isNaN(this.building_id) ||
                isNaN(this.userId) ||
                isNaN(this.location_id) ||
                isNaN(this.role) ||
                isNaN(this.accountId) ||
                userId != this.userId
                ) {
                this.authService.removeToken();
                this.router.navigate(['/success-valiadation'],
                { queryParams: { 'verify-notified-user': 0}});
            }
        });
        for (let role of this.authService.userDataItem('roles')) {
            if (role['role_id'] > 2) {
                this.emergencyRoles.push(role['role_id']);
            }
        }

        
        this.userService.getTrainingData(this.userId, this.emergencyRoles)
        .subscribe((res) => {
            console.log(res);
            if (res.invalid_trainings.length == 0 &&
               res.valid_trainings.length == res.required_trainings.length) {
                    this.isCompliant = true;
            }
            this.trainingItems = [...res.valid_trainings, ...res.invalid_trainings];            
        });

        this.userService.getNotificationToken(this.userId).subscribe((tokens: Array<any>) => {
            for(let tok of tokens) {
                if(tok.training_reminder == 1 && tok.location_id == this.location_id){
                    this.hasTrainingReminder = true;
                }
            }
        });
        



        /*
        this.getUserTrainingData().subscribe((data) => {
            const trainings = data[0];
            const courses = data[1];
            if (trainings.invalid_trainings.length == 0 &&
                trainings.valid_trainings.length == trainings.required_trainings.length) {
                    this.isCompliant = true;
            }
            // loop through invalid trainings
            console.log(courses);
            for (let t of trainings.invalid_trainings) {

            }
            this.trainingItems = [...trainings.valid_trainings, ...trainings.invalid_trainings];
        });
        */
        



    }

    ngAfterViewInit() {}


    ngOnDestroy() {}

    loadTrainingCourse(course: object = {}) {
        user_course_relation = course['course_user_relation_id'] || 0;
        this.selectedCourse = course;
        this.selectedCourse['formatted_launcher_url'] =
        this.sanitizer.bypassSecurityTrustResourceUrl(this.baseUrl + '/' + this.selectedCourse['course_launcher']);
        this.complianceService.initializeLRS(user_course_relation).subscribe((data) => {
            setTimeout(() => {
                console.log(this.selectedCourse);
                $('.modal').modal({
                    dismissible : false,
                    startingTop : '0%',
                    endingTop: '5%'
                });
                $('#training').modal('open');
            }, 600);
        }, (error) => {
            alert('There was an error loading course. Try again later');
        });
    }

    onCloseCourseModule() {
        this.selectedCourse = {}; 
        console.log(this.selectedCourse);       
    }

    setTrainingReminder(event) {
        this.hasTrainingReminder = !this.hasTrainingReminder;
        console.log(this.hasTrainingReminder);
        this.userService.update({
            user_id : this.userId,
            training_reminder : this.hasTrainingReminder ? 1 : 0
        }, (response) => { 
            console.log(response);
         });


    }



    /*
    private getUserTrainingData(): Observable<Array<any>> {
        let trainings = this.userService.getTrainingData(this.userId, this.emergencyRoles);
        let courses = this.courseService.myCourses(this.userId);
        return Observable.forkJoin([trainings, courses]);
    }
    */


    




}