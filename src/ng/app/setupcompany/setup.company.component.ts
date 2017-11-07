import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { PlatformLocation, NgForOf } from '@angular/common';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
declare var $: any;
import { SignupService } from '../services/signup.service';
import { AccountsDataProviderService } from '../services/accounts';
import { AuthService } from '../services/auth.service';
import { Countries } from '../models/country.model';
import { Timezone } from '../models/timezone';



@Component({
  selector: 'app-setup.company',
  templateUrl: './setup.company.component.html',
  styleUrls: ['./setup.company.component.css'],
  providers: [SignupService, AccountsDataProviderService]
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
	inputReadOnly = true;
	inputCompanyName;

	searchElem = {};
	searchedAccounts = [];

	newCompany = false;
	selectedAccountData = {};
	companyIsSelected = false;

	defaultCountry = 'AU';
	defaultTimeZone = 'AEST';

	constructor(
		private router: Router, 
		private http: HttpClient, 
		platformLocation: PlatformLocation, 
		private signupService:SignupService,
		private auth: AuthService,
		private accounts : AccountsDataProviderService,
		public zone: NgZone
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

		this.searchElem = {
			'searchContainer' : $('.search-container'),
			'preLoaderMain' : $('.search-container .pre-loader-main-wrapper'),
			'ulContainer' : $('.search-container > ul'),
		};

		this.selCountry = this.defaultCountry;
		this.selTimezone = this.defaultTimeZone;


		this.inputCompanyName = Rx.Observable.fromEvent(document.querySelector('input[name="company_name"]'), 'input');

		let thisClass = this;

		this.inputCompanyName.delay(50)
			.map(event => event.target.value)
			.subscribe((value) => {
				if(!this.newCompany){
					thisClass.searchElem['searchContainer'].addClass('active');
					thisClass.searchElem['preLoaderMain'].show();
				}
			});

		this.inputCompanyName.debounceTime(800)
			.map(event => event.target.value)
			.subscribe((value) => {
				if(!this.newCompany){
					this.searchCompanyTypingStopEvent(value, thisClass);
				}
			});

		$('input[name="company_name"]').focus();
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

			this.modalLoader.message = 'There\'s an invalid field, please review your form again.';
			setTimeout(() => {
				this.elems['modalLoader'].modal('close');
				this.elems['modalSignup'].modal('open');
			},2000);
		}
	}

	getFormData(f: NgForm){

		if($('#selCountry').val() == null){
			f.controls.country.setValue( this.defaultCountry );
		}else{
			f.controls.country.setValue( $('#selCountry').val() );
		}

		if($('#selTimezone').val() == null){
			f.controls.time_zone.setValue( this.defaultTimeZone );
		}else{
			f.controls.time_zone.setValue( $('#selTimezone').val() );
		}
		
		f.controls.country.markAsDirty();
		f.controls.time_zone.markAsDirty();

		let 
		userData = this.auth.getUserData(),
		formData = f.value;
		formData.creator_id = userData.userId;
		formData.unit_no = (formData.unit_no === null) ? '' : formData.unit_no; 
		return formData;
	}

	setupFormSubmit(f: NgForm, event){
		event.preventDefault();
		let formData = this.getFormData(f);

		if(f.valid){

	        if(this.newCompany){

	        	this.modalLoader.showLoader = true;
		        this.modalLoader.showMessage = false;

		        this.elems['modalSignup'].modal('close');
		        this.elems['modalLoader'].modal('open');

		        this.signupService.sendCompanyInfoSetupData(formData, (res) => {
		          this.setupResponse(res, f);
		        });
	        }else{
	        	let qParam = {
	        		'account_id' : this.selectedAccountData['account_id'],
	        		'location_id' : this.selectedAccountData['location_id']
	        	};

	        	location.replace( this.baseUrl + '/validation-criteria?account_id='+qParam.account_id+'&location_id='+qParam.location_id );

	        	/*this.router.navigate(['/validation-criteria'], { queryParams: qParam });*/
	        }

		}else{
			for(let x in f.controls){
	          f.controls[x].markAsDirty();
	        }
		}
	}

	searchCompanyTypingStopEvent(value, thisClass){
		if(value.trim().length > 0){
			thisClass.accounts.searhByName(value.trim(), (response) => {
				thisClass.searchedAccounts = response.data;
				thisClass.searchElem['preLoaderMain'].hide();
			});
		}else{
			thisClass.searchElem['searchContainer'].removeClass('active');
		}
	}

	selectCompanyFromListEvent(selectedAccount, f: NgForm){
		this.selectedAccountData = selectedAccount;
		this.searchedAccounts = [];
		this.searchElem['searchContainer'].removeClass('active');
		this.companyIsSelected = true;
		this.newCompany = false;
 
		$('select option').each(function(){
			if($(this).text().indexOf(selectedAccount.time_zone) > -1){ 
				selectedAccount.time_zone = $(this).attr('value');
			}
		});
		
		f.controls.company_name.setValue(selectedAccount.account_name);
		if(selectedAccount.tenant_key_contact != null){
			f.controls.tenant_key_contact.setValue(selectedAccount.tenant_key_contact);
		}else{
			f.controls.tenant_key_contact.setValue('none');
		}
		f.controls.building_name.setValue(selectedAccount.name);
		f.controls.unit_no.setValue(selectedAccount.unit);
		f.controls.street.setValue(selectedAccount.street);
		f.controls.city.setValue(selectedAccount.city);
		f.controls.state.setValue(selectedAccount.state);
		f.controls.postal_code.setValue(selectedAccount.postal_code);
		f.controls.trp_code.setValue(selectedAccount.trp_code);
		f.controls.account_domain.setValue(selectedAccount.account_domain);

		this.selCountry = selectedAccount.country;
		$('#selCountry').val( selectedAccount.country );
		this.selTimezone = (selectedAccount.time_zone !== null || selectedAccount.time_zone.length > 0) ? selectedAccount.time_zone : 'AEST';
		$('#selTimezone').val( this.selTimezone );

		setTimeout(() => {
			$('input').trigger('focusin');
			$('#selCountry').material_select(); 
			$('#selTimezone').material_select();
		}, 100);
	}

	cantFindMyCompanyEvent(f: NgForm){
		this.searchedAccounts = [];
		this.searchElem['searchContainer'].removeClass('active');
		$('[readonly]').removeAttr('readonly');
		$('[for="company_name"]').html('Company Name Here');
		f.reset();
		this.newCompany = true;
		this.companyIsSelected = true;
	}

}
