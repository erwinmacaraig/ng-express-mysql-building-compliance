import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd  } from '@angular/router';
import { SignupService } from '../services/signup.service';
import { UserService } from '../services/users';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [UserService]
})
export class DashboardComponent implements OnInit {
	private baseUrl: String;
	public userData: Object;
	public userRoles;
	showEmailVerification = false;
	showResponse = false;
	responseMessage = '';

	routerSubs;
	isFRPTRP = false;

	constructor(
		private http: HttpClient,
		private platform: PlatformLocation,
		private auth: AuthService,
		private router: Router,
		private signupServices: SignupService,
		private userService: UserService
	) {
		this.baseUrl = (platform as any).location.origin;
		this.subscribeAndCheckUserHasAccountToSetup(router);
		this.userData = this.auth.getUserData();
	}

	subscribeAndCheckUserHasAccountToSetup(router){
		this.routerSubs = router.events.subscribe((val) => {
			if(val instanceof NavigationEnd){
				if( this.userData ){
					this.userRoles = this.userData['roles'];

					for(let i in this.userRoles){
						if( this.userRoles[i]['role_id'] == 1 || this.userRoles[i]['role_id'] == 2 ){
							this.isFRPTRP = true;

							if(this.userData['accountId'] < 1){
								router.navigate(['/setup-company']);
							}
						}
					}

					if(val.url == '/' || val.url == '/dashboard'){
						if(this.isFRPTRP){
							router.navigate(['/dashboard/main']);
						}else{
							router.navigate(['/dashboard/user']);
						}
					}


				}
			}
	    });
	}

	resendEmailVerification(){
		this.showResponse = true;
		this.responseMessage = 'Re-sending email for verification';
		this.signupServices.resendEmailVerification(this.userData['userId'], (response) => {
			this.responseMessage = response.message;
			setTimeout(() => {
				this.showResponse = false;
			}, 3000);
		});
	}

	ngOnInit() {
		this.userService.checkUserVerified( this.userData['userId'] , (response) => {
			if(response.status === false && response.message == 'not verified'){
				localStorage.setItem('showemailverification', 'true');
				this.showEmailVerification = true;
				setTimeout(() => {
					$('.alert-email-verification').removeAttr('style').css('opacity', '1');
				},1000);
			} else {
				localStorage.removeItem('showemailverification');
			}
		});
	}

}
