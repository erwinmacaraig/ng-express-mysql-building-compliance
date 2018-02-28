import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Observable, } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { isArray } from 'util';


declare var $: any;
@Component({
  selector: 'app-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService, AccountsDataProviderService, EncryptDecryptService]
})
export class LocationListComponent implements OnInit, OnDestroy {

	@ViewChild('tbodyElem') tbodyElem;

	locations = [];
	private baseUrl: String;
	private options;
	private headers;
	private accountData = { account_name : " " };
	public userData: Object;
	private mutationOversable;

	constructor (
		private platformLocation: PlatformLocation,
		private http: HttpClient,
		private auth: AuthService,
		private preloaderService: DashboardPreloaderService,
		private locationService: LocationsService,
		private accntService: AccountsDataProviderService,
	    private encryptDecrypt: EncryptDecryptService,
	    private router: Router,
	    private elemRef : ElementRef
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();

    	this.accntService.getById(this.userData['accountId'], (response) => {
	      	this.accountData = response.data;
    	});

    	this.locationService.getParentLocationsForListing(this.userData['accountId'], (response) => {
    		this.preloaderService.hide();
    		this.locations = response.locations;

    		if (this.locations.length > 0) {
    			for (let i = 0; i < this.locations.length; i++) {
    				this.locations[i]['location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id).toString();
    			}
    		} else {
    			this.router.navigate(['/location', 'search']);
        	}
	        if (localStorage.getItem('showemailverification') !== null) {
	          this.router.navigate(['/location', 'search']);
	        }
    	});


		this.mutationOversable = new MutationObserver((mutationsList) => {
			mutationsList.forEach((mutation) => {
				if(mutation.target.nodeName != '#text'){
					let target = $(mutation.target);
					if(target.find('select:not(.initialized)').length > 0){

						target.find('select:not(.initialized)').material_select();

					}
				}
			});
		});

		this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });
 
  	}

	ngOnInit(){
		this.preloaderService.show();
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .active').removeClass('active');
		$('.location-navigation .view-location').addClass('active');


		this.selectRowEvent();
	}

	selectRowEvent(){

		$('body').off('change.selectchangeevent').on('change.selectchangeevent', 'select.initialized', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();

			if(val.indexOf('view-') > -1){
				let locIdEnc = val.replace('view-', '');

				this.router.navigate(["/location/view/", locIdEnc]);
			}else if(val.indexOf('addtenants-') > -1){
				let locIdEnc = val.replace('addtenants-', '');

				this.router.navigate(["/teams/add-user/tenant", locIdEnc]);
			}else if(val.indexOf('addwardens-') > -1){
				let locIdEnc = val.replace('addwardens-', '');

				this.router.navigate(["/teams/add-wardens", locIdEnc]);
			}
		});

	}

	ngOnDestroy(){
		this.mutationOversable.disconnect();
	}

	getInitial(name:String){
		return name.split('')[0].toUpperCase();
	}

}
