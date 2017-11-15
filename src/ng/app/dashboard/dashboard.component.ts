import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd  } from '@angular/router';
import { SignupService } from '../services/signup.service';
import { UserService } from '../services/users';

declare var $:any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [UserService]
})
export class DashboardComponent implements OnInit {

	private baseUrl: String;
	public userData: Object;
	showEmailVerification = false;
	showResponse = false;
	responseMessage = '';

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
		router.events.subscribe((val) => {
			if(val instanceof NavigationEnd){
				if( this.userData ){
					if( this.userData['roleId'] == '1' || this.userData['roleId'] == '2' ){
						if(this.userData['accountId'] < 1){
							router.navigate(['/setup-company']);
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
			}
		});
	}

}
