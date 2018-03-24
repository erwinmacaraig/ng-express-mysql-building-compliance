import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';
import { LocationsService } from '../services/locations';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { ProductService  } from '../services/products.service';
import { Observable, ReplaySubject, BehaviorSubject, Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { MessageService } from '../services/messaging.service';
import { DashboardPreloaderService } from '../services/dashboard.preloader';

declare var $: any;

@Component({
	selector : 'app-trainings-component',
	templateUrl : './trainings.component.html',
	styleUrls : [ './trainings.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService, DashboardPreloaderService]
})
export class TrainingsComponent implements OnInit, OnDestroy{

  userData = {};
  private EMRoles = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18]; // need to improve this at a later time by getting these values from db
  routeSubs;

  public isWarden = false;
  thisRouteUrl = '';
  user_id_encrypted;

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
    private messageService: MessageService
  ) {

		this.userData = this.authService.getUserData();

		this.routeSubs = this.router.events.subscribe((event) => {
            if(event instanceof NavigationEnd ) {
                this.thisRouteUrl = event.url;
            }
        });
	}

  ngOnInit() {
    for (let i = 0; i < this.userData['roles'].length; i++) {
      if (this.EMRoles.indexOf(this.userData['roles'][i]['role_id']) !== -1) {
        this.isWarden = true;
        break;
      }
    }
    this.user_id_encrypted = this.encryptDecrypt.encrypt(this.userData['userId']);
  }

	ngAfterViewInit(){
		// this.preloaderService.show();

		if(this.thisRouteUrl.indexOf('/trainings') > -1){
            $('li.nav-list-trainings').addClass('active');
            $('div.archived').remove();
            $('div.archived+.back-to').remove();
            $('.right-top-container').html('');
        }

	}

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}
