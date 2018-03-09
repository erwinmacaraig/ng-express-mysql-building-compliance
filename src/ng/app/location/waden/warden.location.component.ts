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
			}
		}

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
	}

	ngOnInit(){
		$('select').material_select();
		console.log(this.routeParams);
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
		this.routeSubs.unsubscribe();
	}

}
