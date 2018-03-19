import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';

declare var $ : any;

@Component({
	selector : 'app-location-compliance-component',
	templateUrl : './location.compliance.component.html',
	styleUrls : [ './location.compliance.component.css' ],
	providers : [ AuthService, MessageService ]
})

export class ReportsLocationsComplianceComponent implements OnInit, OnDestroy {
	
	userData = {};

	constructor(
		private router : Router,
		private authService : AuthService,
		private messageService : MessageService
		) {

		this.userData = this.authService.getUserData();

	}

	ngOnInit(){

	}

	ngAfterViewInit(){

	}

	ngOnDestroy(){

	}

}