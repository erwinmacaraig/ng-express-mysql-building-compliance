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

	public userRoleID: Number = 0;
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
				this.accountData = resAccount.data;
				this.selectAccount = resAccount.data['account_id'];

				this.locationsService.getUsersLocationByIdAndAccountId(
					{
						account_id : resAccount.data['account_id'],
						user_id : this.userData['userId']

					}, (resLocation)=>{
						let arrNames = [];
						for(let i in resLocation.data){
							if(resLocation.data[i]['parent_id'] == -1){
								this.selectLocation = resLocation.data[i]['location_id'];
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
							}
						);

						this.accountDataProviderService.getRelatedAccounts(resAccount.data['account_id'], (responseAccounts) => {
							this.selectAccounts = responseAccounts.data;
						});


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

			$('select[name="location"] option[value="'+this.selectLocation+'"]').prop('selected', true);

			setTimeout(() => { $('select').material_select(); }, 100);
		});
	}

	// SUBMIT EVENT INVITE USERS
	submitInviteUsers(f: NgForm, event){
		event.preventDefault();
		f.controls.account_type.markAsDirty();
		f.controls.account_type.setValue( $('#accountType').val() );
		
		console.log(this.selectLocation);

		if($('select[name="location"]').val() === null){

			$('select[name="location"]').val(this.selectLocation);
			$('select[name="location"]').trigger('change');
		}

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
			formValues['user_role_id'] = this.userRoleID;
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
							this.emailTaken = response.emailtaken;
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


}