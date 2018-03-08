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
	}

	ngOnInit(){
		$('select').material_select();

	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
		$('.workspace.container').css('padding', '0% 1%');
	}



	ngOnDestroy(){
		$('.workspace.container').css('padding', '1% 2%');
	}

}
