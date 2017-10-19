import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
	selector: 'app-company-information',
	templateUrl: './company.information.component.html',
	styleUrls: ['./company.information.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService]
})
export class CompanyInformationComponent implements OnInit {

	private baseUrl: String;
	private options;
	private headers;

	public userRoleID: Number = 0;
	public userData: Object;

	private accountData: Object;
	private locationData: Object;

	companyName: String = "";
	locations = [];

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private accountDataProviderService: AccountsDataProviderService,
		private locationsService: LocationsService,
		private preloaderService : DashboardPreloaderService
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
		this.preloaderService.show();
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
		this.accountDataProviderService.getByUserId(this.userData['userId'], (resAccount) => {
			if(Object.keys(resAccount.data).length > 0){
				this.companyName = resAccount.data['account_name'];
				this.accountData = resAccount.data;
				this.locationsService.getByAccountId(resAccount.data['account_id'], (resLocation) => {
					this.locations = Object.keys(resLocation.data).map(function (key) { return resLocation.data[key]; });
					setTimeout(()=>{ $('select').material_select(); this.preloaderService.hide(); }, 500);
				});
			}else{
				this.displayNoAccount();
				this.preloaderService.hide();
			}
		});
	}

	btnLoaderShow(){
		let btn = $('.btn-generate'),
			count = 0,
			btnObjOpt = {
				t: <any> null,
				hide : function(){
					clearInterval( btnObjOpt['t'] );
					btn.html('GENERATE').prop('disabled', false);
				}
			};

		btn.html('Generating').prop('disabled', true);
		btnObjOpt.t = setInterval(() => {
			if(count == 3){ 
				count = 0; 
				btn.html('Generating'); 
			}else{
				btn.append('.');
				count++;
			}
		}, 500);

		return btnObjOpt;
	}

	submitFormEvent(f: NgForm, event){
		let btnObjOpt = this.btnLoaderShow(),
			param = {
				location_id : $('#selectLocation').val(),
				account_id : this.accountData['account_id'],
				roles : []
			};

		for(let i in f.controls){
			param.roles.push(i);
		}

		this.accountDataProviderService.generateInvitationCode(param, 
			(response) => {

				for(let i in response.data){
					$( 'input[name="'+response.data[i]['role']+'"]' ).val(response.data[i]['code']).trigger('change');
				}

				setTimeout(function(){ 
					btnObjOpt.hide();
				}, 500);
			}
		);
	}

}
