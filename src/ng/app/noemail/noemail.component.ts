import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgotpassword.service';
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
	loadingText = '';
	showLoading = false;
	showFormContainer = true;
	private baseUrl: String;
	private options;
	private headers;

	constructor(
		private platformLocation: PlatformLocation, 
		private fpService:ForgotPasswordService, 
		private http: HttpClient
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
			this.showFormContainer = false;
			
			this.showLoading = false;

			this.fpService.lookForUsername(f.controls.username.value, (response) => {
				if(response.status){

				}else{
					setTimeout(() => {
						this.InvalidMessage = response.message;
						this.showFormContainer = true;
					}, 1000);
				}
			});

		}else{
			this.InvalidMessage = 'Username is required';
		}
	}

	submitQuestionEvent(f: NgForm, event){

	}

}
