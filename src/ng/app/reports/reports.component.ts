import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MessageService } from '../services/messaging.service';
import * as Rx from 'rxjs/Rx';


declare var $ : any;

@Component({
	selector : 'app-reports-component',
	templateUrl : './reports.component.html',
	styleUrls : [ './reports.component.css' ],
	providers : [ AuthService, MessageService ]
})

export class ReportsComponent implements OnInit, OnDestroy {
	
	userData = {};

	routerSubs;

	constructor(
		private router : Router,
		private authService : AuthService,
		private messageService : MessageService
		) {

		this.userData = this.authService.getUserData();

		/**
		this.routerSubs = this.router.events.subscribe((events) => {
			if(events instanceof NavigationEnd){
				let url = events.url;
				$('.reports-navigation li.active').removeClass('active');
				if(url.indexOf('/locations') > -1){
					$('.reports-navigation li.locations').addClass('active');
				}else if(url.indexOf('/teams') > -1){
					$('.reports-navigation li.teams').addClass('active');
				}else if(url.indexOf('/trainings') > -1){
					$('.reports-navigation li.trainings').addClass('active');
				}

			}
		});
		**/

	}

	ngOnInit(){

	}

	ngAfterViewInit(){

	}

	ngOnDestroy(){
		// this.routerSubs.unsubscribe();
	}

}