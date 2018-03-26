import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Router, NavigationEnd  } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DonutService } from '../../services/donut';

declare var $: any;

@Component({
	selector: 'app-user-dashboard',
	templateUrl: './user.component.html',
	styleUrls: ['./user.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService, UserService, DonutService]
})

export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

	userData = {};

	constructor(
		private authService : AuthService,
		private donut : DonutService
		){

		this.userData = this.authService.getUserData();

	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '2% 5%');
		$('select').material_select();

		// DONUT update
        // Donut Service
		// this.donut.updateDonutChart('#specificChart', 30, true);
	}

	ngOnDestroy(){

	}
}