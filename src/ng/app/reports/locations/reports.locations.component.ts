import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';

declare var $ : any;

@Component({
	selector : 'app-reports-locations-component',
	templateUrl : './reports.locations.component.html',
	styleUrls : [ './reports.locations.component.css' ],
	providers : [ AuthService, MessageService ]
})

export class ReportsLocationsComponent implements OnInit, OnDestroy {
	
	userData = {};
	subscriptionType = 'free';
	constructor(
		private router : Router,
		private authService : AuthService,
		private messageService : MessageService
		) {

		this.userData = this.authService.getUserData();
		this.subscriptionType = this.userData['subscription']['subscriptionType'];

	}

	ngOnInit(){

	}

	ngAfterViewInit(){

	}

	ngOnDestroy(){

	}

}