import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecrypt } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { Countries } from '../../models/country.model';

declare var $: any;
@Component({
  selector: 'app-view-locations-sub',
  templateUrl: './view.sublocation.html',
  styleUrls: ['./view.sublocation.css'],
  providers: [DashboardPreloaderService, EncryptDecrypt, LocationsService]
})
export class ViewSublocationComponent implements OnInit, OnDestroy {

	userData: Object;
	encryptedID;
	locationID = 0;
	locationData = { 
		location_id : 0,
		name : '', 
		frp : [],
		unit : '',
		street : '',
		city : '',
		country : '',
		sublocations : []
	};
	parentData = {
		location_id : 0,
		name : '', 
		frp : [],
		unit : '',
		street : '',
		city : '',
		country : '',
		sublocations : []
	};

	constructor(
		private auth: AuthService,
		private preloaderService : DashboardPreloaderService,
		private locationService : LocationsService,
		private encryptDecrypt : EncryptDecrypt,
		private route: ActivatedRoute
	){
		this.userData = this.auth.getUserData();
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
	}

	ngOnInit(){
		$('select').material_select();

		this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
			this.locationService.getById(this.locationID, (response) => {
				this.locationData = response.data.location;
				this.parentData = response.data.parent;
				if(Object.keys(this.parentData).length > 0){
					this.parentData.location_id = this.encryptDecrypt.encrypt(this.parentData.location_id).toString();
					for(let i in this.parentData['sublocations']){
						this.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.parentData['sublocations'][i].location_id).toString();
					}
				}
				for(let i in this.locationData['sublocations']){
					this.locationData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
				}
			});
		});
	}

	ngOnDestroy(){}

}