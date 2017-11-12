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

			}else{
				if(this.userData['roleId'] == 1 || this.userData['roleId'] == 2){
					this.router.navigate(['/setup-company']);
				}
				this.preloaderService.hide();
			}
		});
	}

	startEvents(){
		if(Object.keys(this.accountData).length > 0){
			$('#inpCompanyName').val( this.accountData['account_name'] ).trigger('focusin');
			for(let i in this.arrUserType){
				if(this.userRoleID == this.arrUserType[i]['role_id']){
					$('#inpRoleName').val(this.arrUserType[i]['description']).trigger('focusin');
				}
			}
		}
	}

}
