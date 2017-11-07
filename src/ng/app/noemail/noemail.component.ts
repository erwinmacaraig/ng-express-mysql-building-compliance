import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgotpassword.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
	selector: 'app-noemail',
	templateUrl: './noemail.component.html',
	styleUrls: ['./noemail.component.css'],
	providers: [ForgotPasswordService]
})
export class NoemailComponent implements OnInit {

	InvalidMessage = '';
	InvalidMessageTwo = '';
	loadingText = '';
	securityQuestion = '';
	InvalidMessagePassword = '';
	securityQuestionID = 0;
	securityUserID = 0;
	securityToken ='';
	correctMessage = '';
	showLoading = false;
	showFormOneContainer = true;
	showFormTwoContainer = false;
	showFormNewPassword = false;
	showCorrectField = false;
	private baseUrl: String;
	private options;
	private headers;

	constructor(
		private platformLocation: PlatformLocation, 
		private fpService:ForgotPasswordService, 
		private http: HttpClient,
		private router: Router
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new Headers({ 'Content-type' : 'application/json' });
	}

	ngOnInit() {
	}

	submitEvent(f: NgForm, event){
		this.InvalidMessage = '';
		this.loadingText = 'Searching...';
		if(f.valid){
			this.showFormOneContainer = false;
			this.showFormTwoContainer = false;
			this.showLoading = true;

			this.fpService.lookForUsername(f.controls.username.value, (response) => {
				if(response.status){
					setTimeout(() => {
						this.showFormTwoContainer = true;
						this.showLoading = false;
						this.securityQuestion = response.data.question;
						this.securityQuestionID = response.data.question_id;
						this.securityUserID = response.data.user_id;
					}, 1000);
				}else{
					setTimeout(() => {
						this.InvalidMessage = response.message;
						this.showFormOneContainer = true;
					}, 1000);
				}
			});

		}else{
			this.InvalidMessage = 'Username is required';
		}
	}

	submitQuestionEvent(f: NgForm, event){
		this.InvalidMessageTwo = '';
		this.loadingText = 'Checking...';
		if(f.valid){
			this.showFormOneContainer = false;
			this.showFormTwoContainer = false;
			this.showLoading = true;

			this.fpService.submitSecurityQuestion(
				{ 
					answer : f.controls.answer.value, 
					question_id : this.securityQuestionID,
					user_id : this.securityUserID
				}, 
				(response) => {
					if(response.status){
						this.showFormTwoContainer = false;
						this.showLoading = false;
						this.showCorrectField = true;
						this.correctMessage = 'Correct! please setup your new password in the next form.';
						this.securityToken = response.data.token;
						this.securityUserID = response.data.user_id;
						setTimeout(() => {
							this.showCorrectField = false;
							this.showFormNewPassword = true;
							this.showLoading = false;
						}, 2000);
					}else{
						setTimeout(() => {
							this.InvalidMessageTwo = response.message;
							this.showFormTwoContainer = true;
							this.showLoading = false;
						}, 500);
					}
				}
			);

		}else{
			this.InvalidMessageTwo = 'Answer is required';
		}
	}

	submitNewPassword(f: NgForm, event){
		this.InvalidMessagePassword = '';
		this.loadingText = 'Submitting...';
		if(f.valid && f.controls.new_password.value == f.controls.confirm_password.value){
			this.showFormNewPassword = false;
			this.showLoading = true;

			let
			saveData = {
				user_id : this.securityUserID,
				token : this.securityToken,
				new_password : f.controls.new_password.value,
				confirm_password : f.controls.confirm_password.value
			};

			this.fpService.changeUsersPassword(saveData, (response) => {
				if(response.status){
					this.showFormNewPassword = false;
					this.showLoading = false;
					this.showCorrectField = true;
					this.correctMessage = 'Success! redirecting to login';
					setTimeout(() => {
						this.showFormOneContainer = true;
						this.showFormTwoContainer = false;
						this.showFormNewPassword = false;
						this.showCorrectField = false;
						this.router.navigate(['/login']);
					}, 2000);
				}else{
					setTimeout(() => {
						this.InvalidMessagePassword = response.message;
						this.showFormNewPassword = true;
						this.showLoading = false;
					}, 500);
				}
			});

		}else{
			this.InvalidMessagePassword = 'New password & Confirm password are required with minimum of 6 characters and should match';
		}
	}

}
