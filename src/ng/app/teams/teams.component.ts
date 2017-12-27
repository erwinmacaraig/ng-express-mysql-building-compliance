import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';


declare var $: any;
@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements OnInit, OnDestroy {

	public thisRouteUrl = '';
	public oUserData = {};

	constructor(
		private router: Router,
		private authService: AuthService
	){
		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd ){
				this.thisRouteUrl = event.url;
				this.ngAfterViewInit();
			}
		});

		this.oUserData = this.authService.getUserData();
	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		if(this.thisRouteUrl.indexOf('teams') > -1){
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

			$('li.nav-list-team').addClass('active');

			if('roles' in this.oUserData){
				let roles = this.oUserData['roles'],
					frp = false,
					trp = false,
					warden = false,
					genOcc = false,
					chiefWarden = false,
					otherWarden = false;

				for(let i in roles){
					if(roles[i]['role_id'] == 1){
						frp = true;
					}else if(roles[i]['role_id'] == 2){
						trp = true;
					}else if(roles[i]['role_id'] == 8){
						genOcc = true;
					}else if(roles[i]['role_id'] == 9){
						warden = true;
					}else if(roles[i]['role_id'] == 11){
						chiefWarden = true;
					}else{
						otherWarden = true;
					}
				}

				if(frp || trp){
					this.router.navigate(["/teams/all-users"]);
				}else if(genOcc){
					this.router.navigate(["/teams/view-gen-occupant"]);
				}else if(warden){
					this.router.navigate(["/teams/view-warden"]);
				}else if(chiefWarden){
					this.router.navigate(["/teams/view-chief-warden"]);
				}

			}
		}

	}

	ngOnDestroy(){}
}