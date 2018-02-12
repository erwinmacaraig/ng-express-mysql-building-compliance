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

declare var $: any;

@Component({
	selector : 'app-payment-response-component',
	templateUrl : './payment.response.component.html',
	styleUrls : [ './payment.response.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class PaymentResponseComponent implements OnInit, OnDestroy{

	message = '';
	listOfMessages = {
		1 : 'Payment successfully recorded',
		2 : 'Payment successfully recorded but cannot update transaction records for items',
		3 : 'Payment successfully made, but cannot create internal transaction log record',
		4 : 'There was a problem loading internal transaction log record',
		5 : 'Payment made but no record of transaction log can be made',
		6 : 'There was a problem creating transaction log for this session',
		7 : 'There was a problem updating internal transaction log record'
	};

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private encryptDecrypt : EncryptDecryptService
		){

		this.router.events.subscribe((e) => {
			if(e instanceof NavigationEnd){
				let num = e.url.replace('/payment-response/', '');
				this.message = this.listOfMessages[num];
			}
		});
	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		setTimeout(() => {
			this.router.navigate(["/shop/compliance-package"]);
		}, 2000);
	}

	ngOnDestroy(){
		
	}

} 