import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ResponseContentType } from '@angular/http';
import { PlatformLocation } from '@angular/common';

@Injectable()
export class CourseService {
    private headers: Object;
    private options: Object;
    private baseUrl: String;

    constructor(
        private http: HttpClient,
        private platformLocation: PlatformLocation,
        private route: ActivatedRoute,
        private router: Router
        ) {

        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
        this.baseUrl = (platformLocation as any).location.origin;
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

    getCourseUserRelation(callBack){
        this.http.get('/courses/get-course-user-ralation').subscribe((res) => {
            callBack(res);
        });
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

    myCourses(userId, callBack){
        this.http.get('/courses/my-courses/'+userId).subscribe((res) => {
            callBack(res);
        });
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
        });
    }

    sendTrainingInvitation(form, callBack){
        this.http.post('/courses/send-training-invitation', form, this.options).subscribe((response) => {
            callBack(response);
        });
    }

}
