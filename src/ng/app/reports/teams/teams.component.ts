import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';

declare var $ : any;

@Component({
	selector : 'app-teams-compliance-component',
	templateUrl : './teams.component.html',
	styleUrls : [ './teams.component.css' ],
	providers : [ AuthService, MessageService ]
})

export class ReportsTeamsComponent implements OnInit, OnDestroy {
	
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
		$('select').material_select();
	}

	ngOnDestroy(){

	}

}