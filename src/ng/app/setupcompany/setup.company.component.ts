import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { PlatformLocation, NgForOf } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
declare var $: any;
import { SignupService } from '../services/signup.service';
import { AuthService } from '../services/auth.service';
import { Countries } from '../models/country.model';
import { Timezone } from '../models/timezone';



@Component({
  selector: 'app-setup.company',
  templateUrl: './setup.company.component.html',
  styleUrls: ['./setup.company.component.css'],
  providers: [SignupService]
})
export class SetupCompanyComponent implements OnInit, AfterViewInit {

	private headers: Object;
	private options: Object;
	private baseUrl: String;

	modalLoader = {
	    showLoader : true,
	    loadingMessage : "Sending company info...",
	    showMessage : false,
	    iconColor: 'green',
	    icon: 'check',
	    message: ''
	};

	elems = {};

	countries = new Countries().getCountries();
	timezones = new Timezone().get();
	selCountry;
	selTimezone;

	constructor(
		private router: Router, 
		private http: HttpClient, 
		platformLocation: PlatformLocation, 
		private signupService:SignupService,
		private auth: AuthService
	) {
		this.headers = new Headers({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
		this.subscribeAndCheckUserHasAccountToSetup(router);
	}

	subscribeAndCheckUserHasAccountToSetup(router){
		router.events.subscribe((val) => {
			if(val instanceof NavigationEnd){
				let userData = this.auth.getUserData();
				if( userData ){
					if( userData.roleId == '1' || userData.roleId == '2' ){
						if(userData.accountId > 0){
							router.navigate(['/']);
						}
					}else{
						router.navigate(['/']);
					}
				}else{
					router.navigate(['/']);
				}
			}
	    });
	}

	ngOnInit() {
		this.selCountry = 'AU';
		this.selTimezone = 'AEST';
	}

	ngAfterViewInit(){
		this.elems['modalSignup'] = $('#modalSignup');
    	this.elems['modalLoader'] = $('#modalLoader');

		let  modalOpts = {
	      dismissible: false,
	      startingTop: '0%', // Starting top style attribute
	      endingTop: '5%'
	    };

	    // init modal
	    this.elems['modalSignup'].modal(modalOpts);
	    modalOpts.endingTop = '25%';
	    this.elems['modalLoader'].modal(modalOpts);

	    this.elems['modalSignup'].modal('open');

	    setTimeout(()=>{ $('select').material_select(); }, 300);
	}

	setupResponse(res, f){
		this.modalLoader.showLoader = false;
		this.modalLoader.showMessage = true;
		if(res.status){
			this.modalLoader.message = 'Success! Redirecting...';
			this.modalLoader.iconColor = 'green';
			this.modalLoader.icon = 'check';

			let userdata = this.auth.getUserData();
			userdata.accountId = res.data.account.account_id;
			this.auth.setUserData(userdata);
			setTimeout(() => { location.replace(location.origin + '/dashboard/company-information'); }, 500);
		}else{
			this.modalLoader.iconColor = 'red';
			this.modalLoader.icon = 'clear';
			for(let i in res.data){
				f.controls[i].markAsDirty();
			}

			this.modalLoader.message = 'There\'s an invalid field, please review tour form again.';
			setTimeout(() => {
				this.elems['modalLoader'].modal('close');
				this.elems['modalSignup'].modal('open');
			},2000);
		}
	}

	getFormData(f: NgForm){
		f.controls.country.setValue( $('#selCountry').val() );
		f.controls.country.markAsDirty();
		f.controls.time_zone.setValue( $('#selTimezone').val() );
		f.controls.time_zone.markAsDirty();

		let 
		userData = this.auth.getUserData(),
		formData = f.value;
		formData.creator_id = userData.userId;
		return formData;
	}

	setupFormSubmit(f: NgForm, event){
		event.preventDefault();
		let formData = this.getFormData(f);

		if(f.valid){
			this.modalLoader.showLoader = true;
	        this.modalLoader.showMessage = false;

	        this.elems['modalSignup'].modal('close');
	        this.elems['modalLoader'].modal('open');

	        this.signupService.sendCompanyInfoSetupData(formData, (res) => {
	          this.setupResponse(res, f);
	        });
		}else{
			for(let x in f.controls){
	          f.controls[x].markAsDirty();
	        }
		}

	}

}
