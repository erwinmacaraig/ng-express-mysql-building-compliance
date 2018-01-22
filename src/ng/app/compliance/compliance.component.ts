import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';

declare var $: any;

@Component({
	selector : 'app-base-compliance',
	templateUrl : './compliance.component.html',
	styleUrls : [ './compliance.component.css', '../location/location.component.css' ],
    providers : [AuthService, UserService, SignupService]
})
export class ComplianceComponent implements OnInit, OnDestroy{

	userData = {};

	constructor(
		private router : Router,
		private authService : AuthService,
		private userService: UserService, 
        private signupServices: SignupService
		){

		this.userData = this.authService.getUserData();
	}

	ngOnInit(){
		
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
        $('.location-navigation .active').removeClass('active');
        $('.location-navigation .view-location').addClass('active');
	}

	ngOnDestroy(){

	}

} 