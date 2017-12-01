import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild, ElementRef } from '@angular/core';
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
declare var Materialize: any;

@Component({
	selector: 'app-send-invite',
	templateUrl: './send.invite.html',
	styleUrls: ['./send.invite.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService]
})

export class SendInviteComponent implements OnInit, AfterViewInit {

	@ViewChild('formWardenInvitationCode') formWardenInvitationCode;

	private UserType = new AccountTypes().getTypes();
	public userRoles;
	public userData: Object;
	private accountData = { account_name : "" };
	private isTRP = false;
	private isFRP = false;
	private locations = [];
	private loadedData = { account : false, locations : false };
	private selectedAccount = 0;
	private selectedUseRole = 0;
	private selectedLocation = 0;
	private accountsSelection = [];
	private arrUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });
	private selectUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });
	private formToShow = '';
	private allLocationIds = [];
	private showSendInvitationField = true;
	private showSpecificLevel = true;

	modalLoaderElem;
	modalLoader = {
	    showLoader : true,
	    loadingMessage : '',
	    showMessage : false,
	    iconColor: 'green',
	    icon: 'check',
	    message: ''
	};

	parentLocations = [];
	childLocations = [];

	selectLocation = 0;
	selectSubLocation = 0;

	emailTaken = false;
	emailBlacklisted = false;

	showWardenInvitationCode = true;
	saveWardenInvitationCodeText = "Save";
	wardenInvitationCodeData = {
		location_id : 0,
		account_id : 0,
		code : ''
	};

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private accountDataProviderService: AccountsDataProviderService,
		private locationsService: LocationsService,
		private preloaderService : DashboardPreloaderService,
		private router : Router
	) {
		this.userData = this.auth.getUserData();
	}

	ngOnInit() {
		this.initializeUserRoles();
		this.getAccountInfo();
		this.getLocations();
		this.setAvailableRoleSelection();
	}

	ngAfterViewInit(){
		this.wait(() => {
			this.preloaderService.hide();
			$('select').material_select();

			if(!$('.vertical-m').hasClass('fadeInRight')){
				$('.vertical-m').addClass('fadeInRight animated');
			}

			this.modalLoaderElem = $('#modalLoader');
			this.modalLoaderElem.modal({
				dismissible: false,
				startingTop: '0%', 
				endingTop: '5%'
			});

			this.startEvents();
		});
	}

	wait(callBack){
		setTimeout(() => {
			if(this.loadedData.account && this.loadedData.locations){
				callBack();
			}else{
				this.wait(callBack);
			}
		}, 100);
	};

	getAllLocationIds(locations){
		let arr = [],
			searchChild = (children) => {
				for(let i in children){
					if(children[i]['sublocations'].length > 0){
						searchChild(children[i]['sublocations']);
					}
					if( arr.indexOf( children[i]['location_id'] ) == -1){
						arr.push(children[i]['location_id']);
					}
				};
			};

		searchChild(locations);
		return arr;
	}

	getLocations(){
		this.locationsService.getParentLocationsForListing( this.userData['accountId'], 
			(resLocation) => {
				this.locations = resLocation.data;
				this.allLocationIds = this.getAllLocationIds(resLocation.data);
				this.parentLocations = this.getParentLocations(resLocation.data);
				this.loadedData.locations = true;
			}
		);
	}

	getAccountInfo(){
		this.accountDataProviderService.getById(this.userData['accountId'], (resAccount) => {
			if(Object.keys(resAccount.data).length > 0){
				this.accountData = resAccount.data;
				this.accountsSelection.push(resAccount.data);
				this.selectedAccount = resAccount.data['account_id'];
				this.wardenInvitationCodeData.account_id = resAccount.data['account_id'];
			}
			this.loadedData.account = true;
		});
	}

	initializeUserRoles(){
		this.userRoles = this.userData['roles'];
		for(let i in this.userRoles){
			this.isFRP = (this.userRoles[i]['role_id'] == 1) ? true : false;
			this.isTRP = (this.userRoles[i]['role_id'] == 2) ? true : false;
		}
	}

	setAvailableRoleSelection(){
		if(this.isTRP){
			for(let i in this.selectUserType){
				if(this.selectUserType[i]['role_id'] == 1){
					this.selectUserType.splice(parseInt(i), 1);
				}
			}
		}
	}

	setWardenCode(){
		if(Object.keys(this.accountData).length > 0){
			if( this.accountData['account_code'] !== null ){
				if(this.showWardenInvitationCode){
					this.formWardenInvitationCode.controls.code.setValue(this.accountData['account_code']);
					this.formWardenInvitationCode.controls.code.markAsDirty();
					this.saveWardenInvitationCodeText = "Update";
					$('#inpInviCode').trigger('focusin');
				}
			}
		}
	}

	startEvents(){
		this.selectselectUserRoleEvent();

		if(!(this.isFRP || this.isTRP)){
			this.showSendInvitationField = false;
		}

		if(!this.isFRP){
			this.showWardenInvitationCode = false;
		}

		this.setWardenCode();

		setTimeout(() => {
			$('select').material_select();
			Materialize.updateTextFields();
		}, 300);
	}

	getDeepChildren(parentId){
		let arr = [],
			searchChildren = (children) => {
				for(let i in children){
					if(children[i]['sublocations'].length > 0){
						searchChildren(children[i]['sublocations']);
					}else{
						arr.push(children[i]);
					}
				}
			};

		for(let i in this.locations){
			if(this.locations[i]['location_id'] == parentId){
				searchChildren(this.locations[i]['sublocations']);
			}
		}
		return arr;
	}

	selectLocationEvent(){
		let waitUI = (callBack) => {
			setTimeout(() => {
				if($('select[name="location"]').length > 0){
					callBack();
				}else{
					waitUI(callBack);
				}
			}, 100)
		};

		waitUI(() => {
			let uiSelect = $('select[name="location"]');

			uiSelect.on('change', () => {
				uiSelect.material_select();
				this.selectedLocation = uiSelect.val();
				this.childLocations = this.getDeepChildren(uiSelect.val());
				
				setTimeout(() => { 
					$('select').material_select();
				}, 300);
			});

		});
	}

	selectselectUserRoleEvent(){
		let selselectUserRole = $('#selectUserRole');
		selselectUserRole.on('change', () => {

			this.selectedUseRole = selselectUserRole.val();

			if( selselectUserRole.val() == 1 && this.isFRP ){
				this.formToShow = 'frp-to-frp';
			}else if( selselectUserRole.val() == 2 && this.isFRP ){
				this.formToShow = 'frp-to-trp';
			}else if( selselectUserRole.val() == 3 && this.isFRP ){
				this.formToShow = 'frp-to-warden';
			}else if( selselectUserRole.val() == 2 && this.isTRP ){
				this.formToShow = 'trp-to-trp';
			}else if( selselectUserRole.val() == 3 && this.isTRP ){
				this.formToShow = 'trp-to-warden';
			}else{
				this.formToShow = '';
			}

			this.childLocations = [];
			this.selectLocationEvent();

			setTimeout(() => {
				this.childLocations = this.getDeepChildren($('select[name="location"]').val());
				setTimeout(() => {
					$('select').material_select();
				}, 100);
			}, 300);
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
	}

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

	submitInviteResponse(response, f){
		this.modalLoader.showLoader = false;
		this.modalLoader.showMessage = true;
		if(response.status){
			this.modalLoader.icon = 'check';
			this.modalLoader.iconColor = 'green';
			this.modalLoader.message = 'Success! invitation code was sent';
			f.controls.first_name.reset();
			f.controls.last_name.reset();
			f.controls.email.reset();
			Materialize.updateTextFields();
			$('#selectUserRole').val(0).trigger('change');
		}else{
			this.modalLoader.icon = 'clear';
			this.modalLoader.iconColor = 'red';
			this.modalLoader.message = response.message;
			if('emailtaken' in response){
				this.emailTaken = true;
			}else if('domain_blacklisted' in response){
				this.emailBlacklisted = true;
			}
		}
		setTimeout(()=>{ 
			this.modalLoaderElem.modal('close'); 
		}, 2000);
	}

	submitInviteGetSublocations(f, formValues){
		for(let i in f.controls){
			f.controls[i].markAsDirty();
			if(i.indexOf('sublocation-') > -1){
				if( f.controls[i].value == true ){
					let sub = i,
						splitted = sub.split('-'),
						subLocationId = splitted[1];

					formValues.sublocations.push({
						location_id : subLocationId
					});
				}
			}else if(i.indexOf('sublocation') > -1){				
				if($('select[name="sublocation"]').val() == null){
					f.controls[i].setValue( this.childLocations[0]['location_id'] );
					$('select[name="sublocation"]').val( this.childLocations[0]['location_id'] )
				}

				formValues.sublocations.push({ location_id : $('select[name="sublocation"]').val() });
			}
		}
	}

	// SUBMIT EVENT INVITE USERS
	submitInviteUsers(f: NgForm, event){
		event.preventDefault();

		f.controls.user_role_id.markAsDirty();
		f.controls.user_role_id.setValue( this.selectedUseRole );
		f.controls.location.markAsDirty();
		f.controls.location.setValue( this.selectedLocation );
		
		this.emailTaken = false;
		let formValues = {
			sublocations : []
		};

		formValues['location_id'] = f.controls['location'].value;
		formValues['account_id'] = this.selectedAccount;

		this.submitInviteGetSublocations(f, formValues);

		if(f.valid){
			formValues = Object.assign(formValues, f.value);
			formValues['creator_id'] = this.userData['userId'];
			this.modalLoader.showLoader = true;
			this.modalLoader.loadingMessage = 'Sending invitation';
			this.modalLoader.showMessage = false;
			this.modalLoaderElem.modal('open');

			this.accountDataProviderService.sendUserInvitation( formValues, 
				(response) => {
					this.submitInviteResponse(response, f);
				}
			);
		}
	}

	cancelForm(){
		let selselectUserRole = $('#selectUserRole');
		selselectUserRole.val(0);
		selselectUserRole.trigger('change');
	}

	// COMPANY WARDEN INVITATION CODE SUBMIT EVENT
	wardenInvitationCodeSubmit(f, e){
		e.preventDefault();
		if(f.valid){
			this.modalLoader.showLoader = true;
			this.modalLoader.loadingMessage = 'Saving warden invitation code...';
			this.modalLoader.showMessage = false;
			this.modalLoaderElem.modal('open');
			this.wardenInvitationCodeData.code = f.controls.code.value.trim();
			this.accountDataProviderService.saveAccountInvitationCode(
				this.wardenInvitationCodeData, 
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


}
