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
import { MessageService } from '../../services/messaging.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;

@Component({
	selector : 'app-training-invite-component',
	templateUrl : './training.invite.component.html',
	styleUrls : [ './training.invite.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService, DashboardPreloaderService]
})
export class TrainingInviteComponent implements OnInit, OnDestroy{

	userData = {};

	routeSubs;

	thisRouteUrl = '';

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private productService: ProductService,
        private encryptDecrypt : EncryptDecryptService,
        private preloaderService: DashboardPreloaderService,
        private messageService : MessageService
		){

		this.userData = this.authService.getUserData();
	}

	ngOnInit(){
	}

	ngAfterViewInit(){
		$('.trainings-navigation .active').removeClass('active');
		$('.trainings-navigation .training-invite').addClass('active');
	}

	ngOnDestroy(){
		
	}

} 