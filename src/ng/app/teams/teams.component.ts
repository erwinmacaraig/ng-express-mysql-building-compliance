import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements OnInit, OnDestroy {

	public thisRouteUrl = '';

	constructor(
		private router: Router
	){
		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd ){
				this.thisRouteUrl = event.url;
				this.ngAfterViewInit();
			}
		});
	}

	ngOnInit(){}

	ngAfterViewInit(){
		let removeWorkspacePadding = false,
			showTeamNav = true;

		if(
			this.thisRouteUrl.indexOf('view-frp-trp') > -1
			){
			removeWorkspacePadding = true;
		}

		if(
			this.thisRouteUrl.indexOf('view-warden') > -1 || 
			this.thisRouteUrl.indexOf('view-gen-occupant') > -1 ||
			this.thisRouteUrl.indexOf('view-chief-warden') > -1
			){
			showTeamNav = false;
			removeWorkspacePadding = true;
		}

		if(removeWorkspacePadding){
			$('.workspace.container').css({
				'padding' : '0px'
			});
		}else{
			$('.workspace.container').css({
				'padding' : '1% 2%'
			});
		}

		if(showTeamNav){
			$('.teams-navigation').show();
		}else{
			$('.teams-navigation').hide();
		}
	}

	ngOnDestroy(){}
}