import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
  selector: 'app-view-gen-occupant-component',
  templateUrl: './view.gen.occupant.component.html',
  styleUrls: ['./view.gen.occupant.component.css'],
  providers : [UserService, DashboardPreloaderService, PersonDataProviderService, AuthService]
})
export class ViewGeneralOccupantComponent implements OnInit, OnDestroy {

	viewData = {
		team : [],
		user : {
			profilePic : ''
		},
		location : {
			parent_data : {}
		},
		eco_role : {}
	}
	showModalRequestWardenLoader = false;
	approvers = [];
	showModalRequestWardenSuccess = false;
	userData = {};

	constructor(
		private auth: AuthService,
		private userService: UserService,
		private preloaderService: DashboardPreloaderService,
		private personService : PersonDataProviderService
		){
		
		this.userService.getMyWardenTeam((response) => {
			this.viewData.user = response.data.user;
			this.viewData.team = response.data.team;
			this.viewData.location = response.data.location;
			this.viewData.eco_role = response.data.eco_role;

			if(Object.keys(response.data.location).length > 0){
				this.personService.listAllTRP(response.data.location['location_id']).subscribe((response)=>{
					this.approvers = response.data;
					this.preloaderService.hide();

					setTimeout(() => {
						$('select').material_select();
					},300);

				});
			}
		});

		this.userData = this.auth.getUserData();

	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

		this.preloaderService.show();
	}

	public getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	requestWardenClick(){
		$('#modalRequestWarden').modal('open');
		this.showModalRequestWardenLoader = false;
		this.showModalRequestWardenSuccess = false;
	}

	submitRequest(){
		let approverId = $('#modalRequestWarden select').val();
		if(approverId !== null && parseInt(approverId) > 0){
			this.showModalRequestWardenLoader = true;
			this.userService.requestAsWarden(this.userData['userId'], (response) => {
				this.showModalRequestWardenSuccess = true;
			});
		}
	}

	ngOnDestroy(){}
}