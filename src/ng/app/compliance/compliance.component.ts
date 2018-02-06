import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';
import { Observable } from 'rxjs/Rx';
import { LocationsService } from '../services/locations';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { ComplianceService } from '../services/compliance.service';

declare var $: any;

@Component({
	selector : 'app-base-compliance',
	templateUrl : './compliance.component.html',
	styleUrls : [ './compliance.component.css', '../location/location.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ComplianceService]
})
export class ComplianceComponent implements OnInit, OnDestroy{

	userData = {};

	locationData = {
		'parentData' : <any>{ location_id : 0 }
	};
	encryptedLocationID;
	locationID = 0;

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private complianceService : ComplianceService,
        private encryptDecrypt : EncryptDecryptService
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