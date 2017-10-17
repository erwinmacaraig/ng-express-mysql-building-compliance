import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsService } from '../../services/accounts';
import { LocationsService } from '../../services/locations';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
	selector: 'app-company-information',
	templateUrl: './company.information.component.html',
	styleUrls: ['./company.information.component.css'],
	providers: [AccountsService, AuthService, LocationsService]
})
export class CompanyInformationComponent implements OnInit {

	private baseUrl: String;
	private options;
	private headers;

	public userRoleID: Number = 0;
	public userData: Object;

	companyName: String = "";
	locations: Object = {};

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private accountService: AccountsService,
		private locationsService: LocationsService
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
	}

	ngOnInit() {
		this.userRoleID = this.userData['roleId'];
		$('select').material_select();
		if(!$('.vertical-m').hasClass('fadeInRight')){
			$('.vertical-m').addClass('fadeInRight animated');
		}

		this.getAccountInfoAndDisplay();
	}

	displayNoAccount(){
		$('.row').html("<h3>You were not registered to any account. Please contact the administrator.</h3>");
	}

	getAccountInfoAndDisplay(){
		this.accountService.getByUserId(this.userData['userId'], (resAccount) => {
			if(Object.keys(resAccount.data).length > 0){
				this.companyName = resAccount.data['account_name'];
				this.locationsService.getByAccountId(resAccount.data['account_id'], (resLocation) => {

				});
			}else{
				this.displayNoAccount();
			}
		});
	}

}
