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
	selector : 'app-shop-component',
	templateUrl : './shop.component.html',
	styleUrls : [ './shop.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class ShopComponent implements OnInit, OnDestroy{

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
				$('.shop-navigation .active').removeClass('active');
					switch (e.url) {
						case "/shop/compliance-package":
							$('.compliance-package').addClass('active');
							break;

						case "/shop/trainings-package":
							$('.trainings-package').addClass('active');
							break;
						
					}
			}
		});
	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		

		
	}

	ngOnDestroy(){
		
	}

} 