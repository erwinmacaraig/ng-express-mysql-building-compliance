import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs/Subscription';

declare var $: any;
@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.css']
})
export class TeamsComponent implements OnInit, OnDestroy {

	public thisRouteUrl = '';
	public oUserData = {};
	public showTeamNav = true;
	public subscriptionType = 'free';
	public showConfirmationProcessBar = false;
	public confirmationProcessStep = -1;
	private myQueryRouteSub: Subscription;


	constructor(
		private router: Router,
		private authService: AuthService,
		private route: ActivatedRoute
	){
		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd ){
				this.thisRouteUrl = event.url;
				this.ngAfterViewInit();
			}
		});

		this.oUserData = this.authService.getUserData();
		this.subscriptionType = this.oUserData['subscription']['subscriptionType'];
	}

	ngOnInit(){
		this.myQueryRouteSub = this.route.queryParams.filter(params => params.confirmation)
		.subscribe(params => {
			this.showConfirmationProcessBar = true;
			this.confirmationProcessStep = 1;
		});
		

	}

	ngAfterViewInit(){
		let teamRoute = this.thisRouteUrl.split("/");
		if(teamRoute[1] == 'teams'){
			let removeWorkspacePadding = false;
			if(
				this.thisRouteUrl.indexOf('view-user') > -1
				){
				removeWorkspacePadding = true;
			}

			if(
				this.thisRouteUrl.indexOf('view-warden') > -1 || 
				this.thisRouteUrl.indexOf('view-gen-occupant') > -1 ||
				this.thisRouteUrl.indexOf('view-chief-warden') > -1
				){
				this.showTeamNav = false;
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

			$('li.nav-list-team').addClass('active');

			if('roles' in this.oUserData){
				let roles = <any> this.oUserData['roles'],
					frp = false,
					trp = false,
					warden = false,
					genOcc = false,
					chiefWarden = false;

				if(roles.length > 0){
					for(let i in roles){
						if(roles[i]['role_id'] == 1){
							frp = true;
						}else if(roles[i]['role_id'] == 2){
							trp = true;
						}else if(roles[i]['role_id'] == 8 || roles[i]['role_id'] == 12 || roles[i]['role_id'] == 13 || roles[i]['role_id'] == 14){
							genOcc = true;
						}else if(roles[i]['role_id'] == 9 || roles[i]['role_id'] == 10){
							warden = true;
						}else if(roles[i]['role_id'] == 11 || roles[i]['role_id'] == 15 || roles[i]['role_id'] == 16 || roles[i]['role_id'] == 18){
							chiefWarden = true;
						}
					}


					if(teamRoute.length == 2){
						if(frp || trp){
							this.router.navigate(["/teams/list-general-occupant"]);
						}else if(chiefWarden){
							this.router.navigate(["/teams/view-chief-warden"]);
						}else if(warden){
							this.router.navigate(["/teams/view-warden"]);
						}else if(genOcc){
							this.router.navigate(["/teams/view-gen-occupant"]);
						}else{
							this.router.navigate(["/teams/view-gen-occupant"]);
						}
					}
				}else{
					$('.teams-navigation').hide();
					$('router-outlet').html('');
				}

			}

			$('.teams-navigation .active').removeClass('active');

            if(teamRoute[2]){
    			if(teamRoute[2].indexOf("add-wardens") > -1 || teamRoute[2].indexOf("list-wardens") > -1 ){
    				$('.teams-navigation .wardens').addClass('active');
    			}else if(teamRoute[2].indexOf("mobility-impaired") > -1 || teamRoute[2].indexOf("add-mobility-impaired") > -1){
    				$('.teams-navigation .mobility').addClass('active');
    			}else if(teamRoute[2].indexOf("list-general-occupant") > -1 || teamRoute[2].indexOf("add-general-occupant") > -1){
    				$('.teams-navigation .general-occupant').addClass('active');
    			}else if(teamRoute[2].indexOf("list-administrators") > -1  || teamRoute[2].indexOf("add-administrators") > -1){
                    $('.teams-navigation .administrator').addClass('active');
                }
            }

		}

	}

	ngOnDestroy(){}
}