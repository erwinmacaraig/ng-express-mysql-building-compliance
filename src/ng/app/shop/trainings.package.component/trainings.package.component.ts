import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { Observable } from 'rxjs/Rx';
import { LocationsService } from '../../services/locations';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ComplianceService } from '../../services/compliance.service';

declare var $: any;

@Component({
	selector : 'app-trainings-package-component',
	templateUrl : './trainings.package.component.html',
	styleUrls : [ './trainings.package.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class TrainingsPackageComponent implements OnInit, OnDestroy{

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private encryptDecrypt : EncryptDecryptService
		){

	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '0px');
		$('.package-container').css({
			'width' : '96%',
			'margin' : '0 auto',
			'padding-top' : '3%'
		});
	}

	ngOnDestroy(){
		
	}

} 