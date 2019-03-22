import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
	selector : 'app-training-invite-component',
	templateUrl : './training.invite.component.html',
	styleUrls : [ './training.invite.component.css' ]
})
export class TrainingInviteComponent implements OnInit, OnDestroy{

	userData = {};

	routeSubs;

	thisRouteUrl = '';

	constructor(private authService : AuthService){

		this.userData = this.authService.getUserData();
	}

	ngOnInit(){
	}

	ngAfterViewInit(){
		$('select').material_select();
		$('.trainings-navigation .active').removeClass('active');
		$('.trainings-navigation .training-invite').addClass('active');
	}

	ngOnDestroy(){
		
	}

} 