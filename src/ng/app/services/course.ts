import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable()
export class CourseService {
    private headers: Object;
    private options: Object;
    private baseUrl: String;

    constructor(
        private http: HttpClient,
        private platformLocation: PlatformLocation,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService
        ) {

        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };        
		this.baseUrl = environment.backendUrl;
    }

    getCourses(callBack){
        this.http.get('/courses/get-all').subscribe((res) => {
            callBack(res);
        });
    }

    getTrainingRequirements(callBack){
        this.http.get('/courses/get-training-requirements').subscribe((res) => {
            callBack(res);
        });
    }

    getCourseUserRelation(){
        return this.http.get('/courses/get-course-user-ralation');
    }

    saveAccountCourses(data, callBack){
        this.http.post('/courses/save-account-courses', data).subscribe((res) => {
            callBack(res);
        });
    }

    disableUsersFromCourses(data, callBack){
        this.http.post('/courses/disable-users-from-courses', data).subscribe((res) => {
            callBack(res);
        });
    }

    myCourses(userId){
        return this.http.get('/courses/my-courses/'+userId);
    }

    getCountsBuildingTrainings(callBack){
        this.http.get('/courses/counts-building-trainings').subscribe((res) => {
            callBack(res);
        });
    }

    emailTrainingInvite(training_details = {}) {
      return this.http.post(this.baseUrl + '/team/training/send-invite/', training_details, this.options);
    }

    getAllEmRolesTrainings(callBack){
        this.http.get('/courses/get-all-em-trainings').subscribe((res) => {
            callBack(res);
        }, err => {
            console.log(JSON.parse(err.error));
            if (err.error == 'Not Authenticated') {
                this.authService.logout();
            }
            callBack( JSON.parse(err.error) );
        } );
    }

    logOutTrainingCourse(relation=0) {
        return this.http.post<{lesson_status: string}>(this.baseUrl + '/lms/logoutCourse', {'relation': relation});
    }

    sendTrainingInvitation(form, callBack){
        this.http.post(this.baseUrl + '/courses/send-training-invitation', form, this.options).subscribe((response) => {
            callBack(response);
        });
    }

    logOutTrainingModule(userTrainingModuleRelationId=0) {
        return this.http.post<{lesson_status: string}>(this.baseUrl +'/lms/logoutModule', {'relation': userTrainingModuleRelationId});
    }

    getCertificationDetailsForPrinting(certId=0) {
        return this.http.post<{
            name: string,
            training: string,
            certificate_no: string,
            training_date: string
        }>(`${this.baseUrl}/users/certificate/`, {certId:certId});
    }



}
