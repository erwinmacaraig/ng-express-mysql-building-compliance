import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { DonutService } from '../../services/donut';
import { Countries } from '../../models/country.model';

declare var $: any;
@Component({
  selector: 'app-view-locations-single',
  templateUrl: './view-single.component.html',
  styleUrls: ['./view-single.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, DonutService]
})
export class ViewSingleLocation implements OnInit, OnDestroy {

	private countries = new Countries().getCountries();
	userData: Object;
	encryptedID;
	locationID = 0;
	locationData = {
		name : '',
		frp : [],
		unit : '',
		street : '',
		city : '',
    country : '',
    google_photo_url: '',
    formatted_address: '',
		sublocations : []
	};

	constructor(
		private auth: AuthService,
		private preloaderService: DashboardPreloaderService,
		private locationService: LocationsService,
		private encryptDecrypt: EncryptDecryptService,
		private route: ActivatedRoute,
		private donut: DonutService
	){
		this.userData = this.auth.getUserData();
	}

	ngOnInit(){
		$('select').material_select();

		this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
			this.locationService.getById(this.locationID, (response) => {
        console.log(response);
        this.locationData.name = response.location.name;
        this.locationData.formatted_address = response.location.formatted_address;
        this.locationData.sublocations = response.sublocation.sublocations;
        this.locationData.google_photo_url = response.location.google_photo_url || undefined;
        for (let i = 0; i < this.locationData['sublocations'].length; i++) {
          this.locationData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
        }
      });
    });

		// DONUT update
		// this.donut.updateDonutChart('#specificChart', 30, true);
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
	}

	getCountryName(abbr){
		let name = '';
		for(let i in this.countries){
			if(this.countries[i]['abbr'] == abbr){
				name = this.countries[i]['name'];
			}
		}

		return name;
	}

	ngOnDestroy(){}



}
