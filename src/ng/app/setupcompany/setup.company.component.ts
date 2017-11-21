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
import { UserService } from '../services/users';
import { AccountsDataProviderService } from '../services/accounts';
import { AuthService } from '../services/auth.service';
import { Countries } from '../models/country.model';
import { Timezone } from '../models/timezone';



@Component({
  selector: 'app-setup.company',
  templateUrl: './setup.company.component.html',
  styleUrls: ['./setup.company.component.css'],
  providers: [SignupService, AccountsDataProviderService, UserService]
})
export class SetupCompanyComponent implements OnInit, AfterViewInit {

	private headers: Object;
	private options: Object;
	private baseUrl: String;
	public userData: Object;

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
	selectedAccountId = 0;
	showCreateButton = true;

	defaultCountry = 'AU';
	defaultTimeZone = 'AEST';

	constructor(
		private router: Router,
		private http: HttpClient,
		platformLocation: PlatformLocation,
		private signupService:SignupService,
		private auth: AuthService,
		private accounts : AccountsDataProviderService,
		public zone: NgZone,
		private userService: UserService
	) {
		this.userData = this.auth.getUserData();
		this.headers = new Headers({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
		if(this.userData['accountId'] > 0){
			router.navigate(['/dashboard']);
		}
		for(let i in this.userData['roles']){
			if(this.userData['roles'][i]['role_id'] == 3){
				this.showCreateButton = false;
			}
		}
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
				if(!this.newCompany) {
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

		this.userService.checkUserVerified( this.userData['userId'] , (response) => {
			if(response.status === false && response.message == 'not verified'){
				localStorage.setItem('showemailverification', 'true');
			}else{
				// this.showCreateButton = true;
			}
		});
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
		if(res.status) {
			/*this.modalLoader.message = 'Success!';
			this.modalLoader.iconColor = 'green';
			this.modalLoader.icon = 'check';*/
			this.elems['modalLoader'].modal('close');

			let userdata = this.auth.getUserData();
			userdata.accountId = res.data.account.account_id;
      		this.auth.setUserData(userdata);
	      	setTimeout(() => {
	       	// location.replace(location.origin + '/dashboard/company-information'); }, 500);
	        	this.router.navigate(['/dashboard/company-information']);
	        }, 100);

      	} else {
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

		if($('#selCountry').val() == null) {
			f.controls.country.setValue( this.defaultCountry );
		} else {
			f.controls.country.setValue( $('#selCountry').val() );
		}

		if ($('#selTimezone').val() == null) {
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

		if(this.companyIsSelected){
			formData['account_id'] = this.selectedAccountId;
		}

		return formData;
	}

	setupFormSubmit(f: NgForm, event) {
		event.preventDefault();
		let formData = this.getFormData(f);

		if(f.valid) {

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
		this.selectedAccountId = selectedAccount.account_id;

		$('select option').each(function(){
			if($(this).text().indexOf(selectedAccount.time_zone) > -1){
				selectedAccount.time_zone = $(this).attr('value');
			}
		});

		selectedAccount.key_contact = (selectedAccount.key_contact != null) ? selectedAccount.key_contact : '';

		f.controls.company_name.setValue(selectedAccount.account_name);
		f.controls.key_contact.setValue(selectedAccount.key_contact);
		f.controls.building_name.setValue(selectedAccount.account_name);
		f.controls.unit_no.setValue(selectedAccount.billing_unit);
		f.controls.street.setValue(selectedAccount.	billing_street);
		f.controls.city.setValue(selectedAccount.billing_city);
		f.controls.state.setValue(selectedAccount.billing_state);
		f.controls.postal_code.setValue(selectedAccount.billing_postal_code);
		// f.controls.trp_code.setValue(selectedAccount.trp_code);
		if(f.controls.account_domain){
			f.controls.account_domain.setValue(selectedAccount.account_domain);
		}
		f.controls.building_number.setValue(selectedAccount.building_number);

		this.selCountry = selectedAccount.billing_country;
		$('#selCountry').val( selectedAccount.billing_country );
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
		$('[for="company_name"] .text').html('Company Name Here');
		f.reset();
		this.newCompany = true;
		this.companyIsSelected = true;
  	}

  	cancelClick(f: NgForm){
  		if(this.newCompany || this.companyIsSelected){
  			this.companyIsSelected = false;
			this.newCompany = false;
  			$('[readonly]').attr('readonly', true);
  			$('[for="company_name"] .text').html('Search Company Name Here');
  			f.reset();
  		}else{
  			this.router.navigate(['login']);
  		}
  	}

	public refreshMarkers() {
		event.preventDefault();
		this.companyIsSelected = false;
		this.newCompany = false;
	}

}
