import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecrypt } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


declare var $: any;
@Component({
  selector: 'app-location-list',
  templateUrl: './location.list.html',
  styleUrls: ['./location.list.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService, AccountsDataProviderService, EncryptDecrypt]
})
export class LocationListComponent implements OnInit, OnDestroy {

	locations = [];
	private baseUrl: String;
	private options;
	private headers;
	private accountData = { account_name : " " };
	public userData: Object;

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private preloaderService : DashboardPreloaderService,
		private locationService : LocationsService,
		private accntService : AccountsDataProviderService,
		private encryptDecrypt : EncryptDecrypt,
		private router : Router
	){
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();

		this.locationService.getParentLocationsForListing(this.userData['accountId'], (response) => {
			this.locations = response.data;
			if(this.locations.length == 0){
				localStorage.setItem('nolocations', 'true');
				setTimeout(() => {
					this.router.navigate(['locations-ui/search-location']);
				}, 300);
			}else{
				localStorage.removeItem('nolocations');
				this.preloaderService.hide();
				
				for(let i in this.locations){
					this.locations[i]['location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id).toString();
				}
			}
		});

		this.accntService.getById(this.userData['accountId'], (response) => {
			this.accountData = response.data;
		});
	}

	ngOnInit(){
		this.preloaderService.show();
		$('select').material_select();
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
	}

	ngOnDestroy(){

	}

	getInitial(name:String){
		return name.split('')[0].toUpperCase();
	}
}