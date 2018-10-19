import { Component, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgotpassword.service';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;


@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css'],
  providers: [ForgotPasswordService]
})
export class ChangepasswordComponent implements OnInit, AfterViewInit {

  	private baseUrl: String;
	private options;
	private headers;
	userId = 0;
	token = '';
	invalidMessage = '';
	inpNewPassword;
	inpConfirmPassword;
	modalMsg;
	showLoader = false;
	modalMessage = '';
	modalshowCheckIcon = false;
	modalshowCloseIcon = false;

	constructor(
		private platformLocation: PlatformLocation,
		private http: HttpClient,
		private fpService : ForgotPasswordService,
    private route : ActivatedRoute,
    private router: Router
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
	}

	ngOnInit() {
		this.route.params.subscribe(params => {
			this.token = params.token;
            console.log(this.token);
			this.fpService.getTokenData(this.token, (response) => {
				console.log(response);
				if(response.status){
					this.userId = response.data.id;
				}else{
					this.modalshowCheckIcon = false;
					this.modalshowCloseIcon = true;
					this.modalMessage = 'No token found.';
					this.modalMsg.modal('open');
					//this.modalMessage = response.message;
				}
			});

		});
	}

	ngAfterViewInit(){
		this.modalMsg = $('#modalMsg').modal({
			dismissible: false,
			startingTop: '0%',
			endingTop: '5%'
		});
	}

	changePassFormSubmit(f:NgForm, event){
		event.preventDefault();
		this.invalidMessage = '';
		this.modalMessage = '';
		this.modalshowCheckIcon = false;
		this.modalshowCloseIcon = false;

		if(f.controls.new_password.value !== f.controls.confirm_password.value){
			this.invalidMessage = 'Password mismatch';
		}else{
			if(f.valid){
				let sendData = f.value;
				sendData['user_id'] = this.userId;
				sendData['token'] = this.token;
				this.showLoader = true;
				this.modalMsg.modal('open');
				this.fpService.changeUsersPassword(
					sendData,
					(response) => {
						this.showLoader = false;
						if(response.status){
							this.modalshowCheckIcon = true;
							this.modalshowCloseIcon = false;
							this.modalMessage = 'Success! Please go back to login page with your account using your new password.';
              f.form.reset();

						}else{
							this.modalshowCheckIcon = false;
							this.modalshowCloseIcon = true;
							this.modalMessage = response.message;
						}
						setTimeout(() => {
              this.modalMsg.modal('close');
              this.router.navigate(['/login']);
            }, 2000);

					}
				)


			}else if('minlength' in f.controls.new_password.errors || 'minlength' in f.controls.confirm_password.errors){
				this.invalidMessage = 'Password must be at least 6 characters';
			}
		}

	}

}
