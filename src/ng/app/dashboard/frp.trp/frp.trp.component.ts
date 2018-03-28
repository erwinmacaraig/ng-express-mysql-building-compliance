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
import { CourseService } from '../../services/course';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Router, NavigationEnd  } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DonutService } from '../../services/donut';

declare var $: any;

@Component({
	selector: 'app-frptrp-dashboard',
	templateUrl: './frp.trp.component.html',
	styleUrls: ['./frp.trp.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService, UserService, DonutService, CourseService, EncryptDecryptService]
})

export class FrpTrpDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

	userData = {};

	courses = [];
	locations = [];
	accountTrainings = <any> {
		total_users : 0,
		total_users_trained : 0,
		em_roles : {},
		em_roles_array : []
	};

	showBuildingTrainingLoader = true;
	showPlansLoader = true;

	constructor(
		private authService : AuthService,
		private donut : DonutService,
		private courseService : CourseService,
		private dashboardService : DashboardPreloaderService,
		private locationService : LocationsService,
		private encryptDecrypt : EncryptDecryptService
		){

		this.userData = this.authService.getUserData();

		this.courseService.myCourses(this.userData['userId'], (response) => {
			this.courses = response.data;
		});

		this.locationService.getParentLocationsForListing(this.userData['accountId'], (res) => {
			this.locations = res.locations;
			if (this.locations.length > 0) {
    			for (let i = 0; i < this.locations.length; i++) {
    				this.locations[i]['location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id);
    			}
    		}
			this.showPlansLoader = false;

			setTimeout(() => {
				$('select').material_select();
			}, 500);
		});

		this.courseService.getCountsBuildingTrainings((response) => {
			this.accountTrainings.total_users = response.data.total_users;
			this.accountTrainings.total_users_trained = response.data.total_users_trained;
			this.accountTrainings.em_roles = response.data.em_roles;
			this.showBuildingTrainingLoader = false;

			for(let i in this.accountTrainings.em_roles){
				this.accountTrainings.em_roles_array.push( this.accountTrainings.em_roles[i] );
			}

			setTimeout(() => {
				let piePercent = ( (this.accountTrainings.total_users_trained / this.accountTrainings.total_users) * 100 ).toFixed(2);
				this.donut.updateDonutChart('#specificChart', parseFloat(piePercent), true);
			},300);
		});

	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		// this.dashboardService.show();

		$('.workspace.container').css('padding', '2% 5%');
		

		// DONUT update
        // Donut Service
		// this.donut.updateDonutChart('#specificChart', 30, true);
	}

	ngOnDestroy(){

	}
}