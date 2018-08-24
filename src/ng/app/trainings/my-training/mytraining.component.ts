import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { LocationsService } from '../../services/locations';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ProductService  } from '../../services/products.service';
import { Observable, ReplaySubject, BehaviorSubject, Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DomSanitizer } from '@angular/platform-browser';

import { MessageService } from '../../services/messaging.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ComplianceService } from './../../services/compliance.service';


declare var $: any;
declare var user_course_relation: any;

@Component({
	selector : 'app-mytraining-component',
	templateUrl : './mytraining.component.html',
	styleUrls : [ './mytraining.component.css' ],
    providers : [
      UserService,
      EncryptDecryptService,
      ProductService,
      DashboardPreloaderService,
      ComplianceService]
})
export class MyTrainingsComponent implements OnInit, OnDestroy {
  toggle = false;
  userData = {};
  courses = [];
  selectedCourse;
  routeSubs;
  private baseUrl;

  thisRouteUrl = '';

  constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authService: AuthService,
        private userService: UserService,
        private locationService: LocationsService,
        private signupServices: SignupService,
        private productService: ProductService,
        private encryptDecrypt: EncryptDecryptService,
        private preloaderService: DashboardPreloaderService,
        private messageService: MessageService,
        private complianceService: ComplianceService,
        private platformLocation: PlatformLocation,
        private sanitizer: DomSanitizer
  ) {

    this.userData = this.authService.getUserData();
    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {
    $('.modal').modal({
      dismissible : false,
      startingTop : '0%',
      endingTop: '5%'
    });

    this.complianceService.getAllRegisteredCourses().subscribe((data) => {
      console.log(data);
      if (data['courses'].length > 0) {
        this.courses = data['courses'];
        console.log(this.courses);
      }
    }, (error) => {
      console.log(error);
      this.courses = [];
    });


  }

  ngAfterViewInit () {
    $('.trainings-navigation .active').removeClass('active');
    $('.trainings-navigation .my-training').addClass('active');
    $('.workspace.container').css('padding', '0%');
  }

	ngOnDestroy() {
      $('.workspace.container').css('padding', '');
  }

  public loadTrainingCourse(course: object = {}) {
    this.toggle = true;
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

  public onCloseCourseModule(course: object = {}) {

    this.complianceService.getAllRegisteredCourses().subscribe((data) => {
      console.log(data);
      if (data['courses'].length > 0) {
        this.courses = data['courses'];
        console.log('At onCloseCourseModule', this.courses);
      }
    }, (error) => {
      console.log('At onCloseCourseModule', error);
      this.courses = [];
    });
  }

}
