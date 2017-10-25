import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Router, NavigationEnd  } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountTypes } from '../../models/account.types';

declare var $: any;

@Component({
	selector: 'app-company-information',
	templateUrl: './company.information.component.html',
	styleUrls: ['./company.information.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService]
})

export class CompanyInformationComponent implements OnInit, AfterViewInit {
	@ViewChild('formWardenInvitationCode') formWardenInvitationCode: NgForm;
	private UserType = new AccountTypes().getTypes();
	private baseUrl: String;
	private options;
	private headers;

	public userRoleID: Number = 0;
	public userData: Object;

	private accountData: Object;
	private locationData: Object;

	companyName: String = "";
	locations = [];

	arrUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });
	selectUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });

	formToShow = '';

	saveWardenInvitationCodeText = "Save";
	saveWardenInvitationCodeDisable = false;

	showSpecificLevel = true;
	showSendInvite = false;
	showWardenInvitationCode = false;

	modalLoaderElem;
	modalLoader = {
	    showLoader : true,
	    loadingMessage : '',
	    showMessage : false,
	    iconColor: 'green',
	    icon: 'check',
	    message: ''
	};

	selectAccountType;

	parentLocations = [];
	childLocations = [];

	selectAccounts = [];

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private accountDataProviderService: AccountsDataProviderService,
		private locationsService: LocationsService,
		private preloaderService : DashboardPreloaderService,
		private router : Router
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
		this.preloaderService.show();
	}

	ngOnInit() {
		this.userRoleID = this.userData['roleId'];
		this.getAccountInfoAndDisplay();
		
		if(this.userRoleID == 1 || this.userRoleID == 2){
			this.showSendInvite = true;
			this.showWardenInvitationCode = true;
		}

		for(let i in this.selectUserType){

			// TRP 
			if(this.selectUserType[i]['role_id'] == 1 && this.userRoleID == 2){
				this.selectUserType.splice( parseInt(i) , 1 );
			}

		}

	}

	ngAfterViewInit(){
		if(!$('.vertical-m').hasClass('fadeInRight')){
			$('.vertical-m').addClass('fadeInRight animated');
		}

		this.modalLoaderElem = $('#modalLoader');
		this.modalLoaderElem.modal({
			dismissible: false,
			startingTop: '0%', 
			endingTop: '5%'
		});
	}

	flattenRecurciveItems(items, index) {
		let itemsForRecursive = [],
			flatItems = [];

		for(let i in items){
			flatItems.push(items[i]);
			if( Object.keys(items[i][index]).length > 0 ){
				flatItems = flatItems.concat( this.flattenRecurciveItems(items[i][index], index) );
			}
		}

		return flatItems;
	};

	getParentLocations(locations){
		let returnData = [];
		for(let i in locations){
			if(locations[i]['parent_id'] < 0){ returnData.push(locations[i]); };
		}

		return returnData;
	}

	getChildLocations(locations){
		let returnData = [];
		for(let i in locations){
			if(locations[i]['parent_id'] > 0){ returnData.push(locations[i]); };
		}

		return returnData;
	}

	getAccountInfoAndDisplay(){
		this.accountDataProviderService.getByUserId(this.userData['userId'], (resAccount) => {
			if(Object.keys(resAccount.data).length > 0){
				this.companyName = resAccount.data['account_name'];
				this.accountData = resAccount.data;

				this.locationsService.getUsersLocationByIdAndAccountId(
					{
						account_id : resAccount.data['account_id'],
						user_id : this.userData['userId']

					}, (resLocation)=>{
						let arrNames = [];
						for(let i in resLocation.data){
							arrNames.push(resLocation.data[i]['name']);
						}
						$('#inpLocationName').val( arrNames.join(', ') ).trigger('focusin');
					}
				);

				this.locationsService.getByAccountId(
					resAccount.data['account_id'], 
					(resLocation) => 
					{
						this.locations = this.flattenRecurciveItems(resLocation.data, 'sublocations');

						this.parentLocations = this.getParentLocations(this.locations);
						this.childLocations = this.getChildLocations(this.locations);

						this.preloaderService.hide();
						$('select').material_select();
						this.startEvents();
					}
				);
			}else{
				if(this.userData['roleId'] == 1 || this.userData['roleId'] == 2){
					this.router.navigate(['/setup-company']);
				}
				this.preloaderService.hide();
			}
		});
	}

	startEvents(){
		this.selectAccountTypeEvent();

		/*SET WARDEN INVITATION CODE*/
		if(Object.keys(this.accountData).length > 0){
			if( this.accountData['account_code'] !== null ){
				if(this.showWardenInvitationCode){
					this.formWardenInvitationCode.controls.code.setValue(this.accountData['account_code']);
					this.saveWardenInvitationCodeText = "Update";
					$('#inpInviCode').trigger('focusin');
				}
			}

			$('#inpCompanyName').val( this.accountData['account_name'] ).trigger('focusin');
			for(let i in this.arrUserType){
				if(this.userRoleID == this.arrUserType[i]['role_id']){
					$('#inpRoleName').val(this.arrUserType[i]['description']).trigger('focusin');
				}
			}
		}

		setTimeout(() => { $('select').material_select(); }, 300);
	}

	selectAccountTypeEvent(){
		let selAccountType = $('#accountType');
		selAccountType.on('change', () => {
			if( selAccountType.val() == 1 && this.userRoleID == 1 ){
				this.formToShow = 'frp-to-frp';
			}else if( selAccountType.val() == 2 && this.userRoleID == 1 ){
				this.formToShow = 'frp-to-trp';
			}else if( selAccountType.val() == 3 && this.userRoleID == 1 ){
				this.formToShow = 'frp-to-warden';
			}else if( selAccountType.val() == 2 && this.userRoleID == 2 ){
				this.formToShow = 'trp-to-trp';
			}else if( selAccountType.val() == 3 && this.userRoleID == 2 ){
				this.formToShow = 'trp-to-warden';
			}else{
				this.formToShow = '';
			}

			setTimeout(() => { $('select').material_select(); }, 100);
		});
	}

	// COMPANY WARDEN INVITATION CODE SUBMIT EVENT
	wardenInvitationCodeSubmit(f, e){
		e.preventDefault();
		if(f.valid){
			this.modalLoader.showLoader = true;
			this.modalLoader.loadingMessage = 'Saving warden invitation code...';
			this.modalLoader.showMessage = false;
			this.modalLoaderElem.modal('open');
			this.accountDataProviderService.saveAccountInvitationCode(
				{ 
					account_id : this.accountData['account_id'],
					code : f.controls.code.value.trim()
				}, 
				(response) => {
					this.modalLoader.showLoader = false;
					this.modalLoader.showMessage = true;
					if(response.status){
						this.modalLoader.icon = 'check';
						this.modalLoader.iconColor = 'green';
						this.modalLoader.message = 'Successfully updated!';
						this.accountData['account_code'] = f.controls.code.value.trim();
					}else{
						this.modalLoader.icon = 'clear';
						this.modalLoader.iconColor = 'red';
						this.modalLoader.message = response.message;
					}
					setTimeout(()=>{ 
						this.modalLoaderElem.modal('close'); 
					}, 2000);
				}
			);

		}else{
			f.controls.code.markAsDirty();
		}
	}

	// SUBMIT EVENT INVITE USERS
	submitInviteUsers(f: NgForm, event){
		event.preventDefault();
	}

	cancelForm(){
		let selAccountType = $('#accountType');
		selAccountType.val(0);
		selAccountType.trigger('change');
	}


}
