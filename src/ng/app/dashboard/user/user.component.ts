import { UserService } from './../../services/users';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
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
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService, DonutService]
})

export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

	userData = {};
  training_percentage = 0;
  assignedCourses = [];
  trainings = [];

	constructor(
		private authService: AuthService,
    private donut: DonutService,
    private userService: UserService
		){

		this.userData = this.authService.getUserData();

	}

	ngOnInit() {
    this.userService.getEmUserDashboardInfo().subscribe((response) => {
      console.log(response);
      this.training_percentage = parseInt(response['percentage_training'], 10);
      this.assignedCourses = response['courses'];
      this.trainings = response['trainings'];
      this.donut.updateDonutChart('#specificChart', this.training_percentage, true);
    }, (e) => {
      console.log(e);
    });

	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '2% 5%');
		$('select').material_select();

		// DONUT update
    // Donut Service

	}

	ngOnDestroy(){

	}
}
