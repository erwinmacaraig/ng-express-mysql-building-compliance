import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';

declare var $: any;

@Component({
	selector: 'app-warden-location-component',
	templateUrl: './warden.location.component.html',
	styleUrls: ['./warden.location.component.css'],
	providers: [DashboardPreloaderService, EncryptDecryptService, LocationsService]
})
export class WardenLocationComponent implements OnInit, OnDestroy {

  userData: Object;
  userInitials = "";
  roleName = "";

  routeSubs;
  routeParamsSubsc;
  routeParams = {};
  locationsFromDb = [];
  mainLocation = {
    'main_address': '',
    'parent_name': '',
    'my_location_name': '',
    'photo': '/assets/images/locations/default_profile_location.png',
  };

  choseRoleId;

	constructor(
		private auth: AuthService,
		private preloaderService : DashboardPreloaderService,
		private locationService : LocationsService,
		private encryptDecrypt : EncryptDecryptService,
		private activatedRoute: ActivatedRoute,
		private router: Router,
		private userService : UserService
		){
		this.userData = this.auth.getUserData();

		this.userInitials = this.getInitials( this.userData['name'] );

    for(let i in this.userData['roles']){
      let role = this.userData['roles'][i];
      if('role_name' in role){
        this.roleName = role.role_name;
        this.choseRoleId = role.role_id;
      }
    }


/*
		let trp = false,
			frp = false;
		for(let i in this.userData['roles']){
			if(this.userData['roles'][i]['role_id'] == 1){
				frp = true;
			}
			if(this.userData['roles'][i]['role_id'] == 2){
				trp = true;
			}
		}

		if(trp){
			this.roleName = 'Tenant Responsible Personnel';
		}

		if(frp){
			this.roleName = 'Facility Responsible Personnel';
		}

		this.routeSubs = this.router.events.subscribe((event) => {
			console.log(event);
		});

		this.routeParamsSubsc = this.activatedRoute.params.subscribe((params) => {
			this.routeParams = params;
    });
*/
	}

	ngOnInit(){
		$('select').material_select();
    // console.log(this.routeParams);
    this.userService.getAllLocationsForUser().subscribe((response) => {
      console.log(response);
      this.locationsFromDb = response['locations'];
      console.log(this.locationsFromDb);
      this.mainLocation['main_address'] = this.locationsFromDb[0]['main_address'];
      this.mainLocation['parent_name'] = this.locationsFromDb[0]['root_parent_name'];
      this.mainLocation['my_location_name'] = this.locationsFromDb[0]['name'];
      this.mainLocation['photo'] = (this.locationsFromDb[0]['google_photo_url'] != null) ?
       this.locationsFromDb[0]['google_photo_url'] : '/assets/images/locations/default_profile_location.png';
      console.log(this.mainLocation);
    }, (e) => {
      console.log(e);

    });
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
		$('.workspace.container').css('padding', '0% 1%');
	}

	getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '1% 2%');
		// this.routeSubs.unsubscribe();
	}

}
