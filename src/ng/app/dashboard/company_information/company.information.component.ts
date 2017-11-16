import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Router, NavigationEnd  } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AccountTypes } from '../../models/account.types';
import { Countries } from '../../models/country.model';

declare var $: any;

@Component({
	selector: 'app-company-information',
	templateUrl: './company.information.component.html',
	styleUrls: ['./company.information.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService, UserService]
})

export class CompanyInformationComponent implements OnInit, AfterViewInit {
	@ViewChild('formWardenInvitationCode') formWardenInvitationCode: NgForm; 
	private UserType = new AccountTypes().getTypes();
	private countries = new Countries().getCountries();
	private baseUrl: String;
	private options;
	private headers;

	public userData: Object;

	private accountData: Object;
	private locationData: Object;

	companyName: String = "";
	companyAddress: String = "";
	companyRoles: String = "";
	locations = [];
	userRoles = [];

	arrUserType = Object.keys(this.UserType).map((key) => { return this.UserType[key]; });

	selectAccounts = [];
	selectAccount = 0;
	selectLocation = 0;

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private accountDataProviderService: AccountsDataProviderService,
		private locationsService: LocationsService,
		private preloaderService : DashboardPreloaderService,
		private router : Router,
		private userService: UserService
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
		this.preloaderService.show();
	}

	ngOnInit() {
		this.getAccountInfoAndDisplay();
	}

	ngAfterViewInit(){
		if(!$('.vertical-m').hasClass('fadeInRight')){
			$('.vertical-m').addClass('fadeInRight animated');
		}
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

				this.companyAddress = resAccount.data['building_number'];
				this.companyAddress += ' '+resAccount.data['billing_unit'];
				this.companyAddress += ' '+resAccount.data['billing_street'];
				this.companyAddress += ' '+resAccount.data['billing_city'];
				this.companyAddress += ', '+resAccount.data['billing_state'];
				for(let i in this.countries){
					if(this.countries[i]['abbr'] == resAccount.data['billing_country']){
						this.companyAddress += ', '+this.countries[i]['name'];
					}
				}
				

				this.userService.getRoles(this.userData['userId'], (responseRoles) => {
					for(let i in responseRoles.data){
						for(let x in this.arrUserType){
							if(responseRoles.data[i]['role_id'] == this.arrUserType[x]['role_id']){
								this.userRoles.push( this.arrUserType[x]['description'] );
							}
						}
					}

					this.companyRoles = this.userRoles.join(', ');

					this.preloaderService.hide();
					$('select').material_select();
					this.startEvents();
				});
				

				/*
				this.selectAccount = resAccount.data['account_id'];
				this.locationsService.getUsersLocationByIdAndAccountId(
					{
						account_id : resAccount.data['account_id'],
						user_id : this.userData['userId']

					}, (resLocation)=>{
						let arrNames = [];
						for(let i in resLocation.data){
							this.selectLocation = resLocation.data[i]['location_id'];
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

						this.preloaderService.hide();
						$('select').material_select();
						this.startEvents();
					}
				);

				this.accountDataProviderService.getRelatedAccounts(resAccount.data['account_id'], (responseAccounts) => {
					this.selectAccounts = responseAccounts.data;
				});
				*/

			}else{
				/*if(this.userData['roleId'] == 1 || this.userData['roleId'] == 2){
					this.router.navigate(['/setup-company']);
				}*/
				this.preloaderService.hide();
			}
		});
	}

	startEvents(){
		$('input').trigger('focusin');
	}

}
