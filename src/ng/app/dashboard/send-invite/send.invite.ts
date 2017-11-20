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
	selector: 'app-send-invite',
	templateUrl: './send.invite.html',
	styleUrls: ['./send.invite.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService]
})

export class SendInviteComponent implements OnInit, AfterViewInit {
	@ViewChild('formWardenInvitationCode') formWardenInvitationCode: NgForm; 
	private UserType = new AccountTypes().getTypes();
	private baseUrl: String;
	private options;
	private headers;

	public userRoles;
	public userData: Object;

	private accountData: Object;
	private locationData: Object;

	locations = [];

	arrUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });
	selectUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });

	formToShow = '';

	showSpecificLevel = true;
	showSendInvite = false;

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
	selectAccount = 0;
	selectLocation = 0;
	selectSubLocation = 0;

	emailTaken = false;
	emailBlacklisted = false;

	showWardenInvitationCode = false;
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
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
		this.preloaderService.show();
	}

	ngOnInit() {
		this.userRoles = this.userData['roles'];
		this.getAccountInfoAndDisplay();
		let isTRP = false, isFRP = false;

		for(let i in this.userRoles){
			if(this.userRoles[i]['role_id'] == 1 || this.userRoles[i]['role_id'] == 2){
				this.showSendInvite = true;
				this.showWardenInvitationCode = true;
			}
			if(this.userRoles[i]['role_id'] == 1){
				isFRP = true;
			}
			if(this.userRoles[i]['role_id'] == 2){
				isTRP = true;
			}
		}
		
		for(let i in this.selectUserType){
			// TRP 
			if(isTRP && this.selectUserType[i]['role_id'] == 1){
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
				this.accountData = resAccount.data;
				this.selectAccount = resAccount.data['account_id'];
				this.wardenInvitationCodeData.account_id = resAccount.data['account_id'];

				this.locationsService.getUsersLocationByIdAndAccountId(
					{
						account_id : resAccount.data['account_id'],
						user_id : this.userData['userId']

					}, (resLocation)=>{
						let arrNames = [];
						for(let i in resLocation.data){
							if(resLocation.data[i]['parent_id'] == -1){
								// this.selectLocation = resLocation.data[i]['location_id'];
								this.wardenInvitationCodeData.location_id = resLocation.data[i]['location_id'];
							}
							arrNames.push(resLocation.data[i]['name']);
						}

						$('#inpLocationName').val( arrNames.join(', ') ).trigger('focusin');


						this.locationsService.getByAccountId(
							resAccount.data['account_id'], 
							(resLocation) => 
							{
								this.locations = this.flattenRecurciveItems(resLocation.data, 'sublocations');

								this.parentLocations = this.getParentLocations(this.locations);
								this.childLocations = this.getChildLocations(this.locations);
								this.selectSubLocation = ( Object.keys(this.childLocations).length  > 0) ? this.childLocations[0]['location_id'] : 0;

								this.preloaderService.hide();
								$('select').material_select();
								this.startEvents();
								$('input').trigger('focusin');
							}
						);

						this.accountDataProviderService.getRelatedAccounts(resAccount.data['account_id'], (responseAccounts) => {
							this.selectAccounts = responseAccounts.data;
						});


					}
				);

			}else{
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
		}

		setTimeout(() => { $('select').material_select(); }, 300);
	}

	selectAccountTypeEvent(){
		let selAccountType = $('#accountType');
		selAccountType.on('change', () => {
			let isTRP = false, isFRP = false;
			for(let i in this.userRoles){
				if(this.userRoles[i]['role_id'] == 2){
					isTRP = true;
				}else if(this.userRoles[i]['role_id'] == 1){
					isFRP = true;
				}
			}

			if( selAccountType.val() == 1 && isFRP ){
				this.formToShow = 'frp-to-frp';
			}else if( selAccountType.val() == 2 && isFRP ){
				this.formToShow = 'frp-to-trp';
			}else if( selAccountType.val() == 3 && isFRP ){
				this.formToShow = 'frp-to-warden';
			}else if( selAccountType.val() == 2 && isTRP ){
				this.formToShow = 'trp-to-trp';
			}else if( selAccountType.val() == 3 && isTRP ){
				this.formToShow = 'trp-to-warden';
			}else{
				this.formToShow = '';
			}

			setTimeout(() => { 
				$('select[name="location"]').find('option:first-child').prop('selected', true);
				setTimeout(() => {
					$('select').material_select(); 
				},100);
			}, 100);
		});
	}

	// SUBMIT EVENT INVITE USERS
	submitInviteUsers(f: NgForm, event){
		event.preventDefault();
		f.controls.user_role_id.markAsDirty();
		f.controls.user_role_id.setValue( $('#accountType').val() );
		f.controls.location.setValue( $('select[name="location"]').val() );

		this.emailTaken = false;
		let formValues = {
			sublocations : []
		};

		if( ('account' in f.controls) === false){
			formValues['account_id'] = this.selectAccount;
		}

		f.controls.location.markAsDirty();
		f.controls.location.setValue( $('select[name="location"]').val() );
		formValues['location_id'] = f.controls['location'].value;

		for(let i in f.controls){
			f.controls[i].markAsDirty();
			if(i == 'account'){
				f.controls[i].setValue( $('select[name="account"]').val() );
				formValues['account_id'] = f.controls[i].value;
			}

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
				if($('select[name="sublocation"]').val() !== null){
					f.controls[i].setValue( $('select[name="sublocation"]').val() );
					formValues['location_id'] = f.controls[i].value;
				}
			}
		}

		if(f.valid){
			formValues = Object.assign(formValues, f.value);
			// formValues['user_role_id'] = this.userRoleID;
			formValues['creator_id'] = this.userData['userId'];
			this.modalLoader.showLoader = true;
			this.modalLoader.loadingMessage = 'Sending invitation';
			this.modalLoader.showMessage = false;
			this.modalLoaderElem.modal('open');

			this.accountDataProviderService.sendUserInvitation( formValues, 
				(response) => {
					this.modalLoader.showLoader = false;
					this.modalLoader.showMessage = true;
					if(response.status){
						this.modalLoader.icon = 'check';
						this.modalLoader.iconColor = 'green';
						this.modalLoader.message = 'Success! invitation code was sent';
						f.controls.first_name.reset();
						f.controls.last_name.reset();
						f.controls.email.reset();
						$('.invitation-form .active').removeClass('active');
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
			);
		}
	}

	cancelForm(){
		let selAccountType = $('#accountType');
		selAccountType.val(0);
		selAccountType.trigger('change');
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
