import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { ViewChild } from '@angular/core';

declare var $: any;
declare var Materialize: any;
declare var moment: any;

declare var $: any;
@Component({
  selector: 'app-view-chief-warden-component',
  templateUrl: './view.chief.warden.component.html',
  styleUrls: ['./view.chief.warden.component.css'],
  providers : [UserService, DashboardPreloaderService, PersonDataProviderService, AuthService]
})
export class ViewChiefWardenComponent implements OnInit, OnDestroy {

	viewData = {
		team : [],
		user : {
			profilePic : ''
		},
		location : {
			name : '',
			parent_location : { name : '' }
		},
		eco_role : { role_name : '' }
	};
	showModalRequestWardenLoader = false;
	approvers = [];
	showModalRequestWardenSuccess = false;
	userData = {};
	customMessageModal = {
		status : false,
		message : ''
	};
	hasRequest = false;
	copyTeam = [];

	@ViewChild('invitefrm') emailInviteForm: NgForm;
	public bulkEmailInvite;

	constructor(
		private auth: AuthService,
		private userService: UserService,
		private preloaderService: DashboardPreloaderService,
		private personService : PersonDataProviderService
		){
		this.userData = this.auth.getUserData();

		this.userService.getMyWardenTeam({
			role_id : 11
		}, (response) => {
			this.viewData.user = response.data.user;
			this.viewData.team = response.data.team;
			this.viewData.location = response.data.location;
			this.viewData.eco_role = response.data.eco_role;
			this.copyTeam = JSON.parse(JSON.stringify(response.data.team));
			this.preloaderService.hide();

			setTimeout(() => {
				$('select').material_select();
			},300);
		});
	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

		this.preloaderService.show();
		this.sortByEvent();
	}

	showModalInvite(){
		$('#modalInvite').modal('open');
	}

	public getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	sortByEvent(){
		$('select.sort-by').on('change', () => {
			let selected = $('select.sort-by').val();
			
			if(selected == 'loc-name-asc'){
				this.viewData.team.sort((a, b) => {
					if(a.location_name < b.location_name) return -1;
				    if(a.location_name > b.location_name) return 1;
				    return 0;
				});
			}else if(selected == 'loc-name-desc'){
				this.viewData.team.sort((a, b) => {
					if(a.location_name > b.location_name) return -1;
				    if(a.location_name < b.location_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-asc'){
				this.viewData.team.sort((a, b) => {
					if(a.first_name < b.first_name) return -1;
				    if(a.first_name > b.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.viewData.team.sort((a, b) => {
					if(a.first_name > b.first_name) return -1;
				    if(a.first_name < b.first_name) return 1;
				    return 0;
				});
			}else{
				this.viewData.team = this.copyTeam;
			}
		});
	}

	searchMemberEvent(event){
		let key = event.target.value,
			temp = [];

		if(key.length == 0){
			this.viewData.team = this.copyTeam;
		}else{
			for(let i in this.copyTeam){
				let name = (this.copyTeam[i]['first_name']+' '+this.copyTeam[i]['last_name']).toLowerCase();
				if(name.indexOf(key) > -1){
					temp.push( this.copyTeam[i] );
				}
			}
			this.viewData.team = temp;
		}
	}

	sendInviteOnClick() {

		this.bulkEmailInvite = (this.emailInviteForm.controls.inviteTxtArea.value).split(',');
		const validEmails = [];
		const email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
		for (let x = 0; x < this.bulkEmailInvite.length; x++) {
			if (email_regex.test(this.bulkEmailInvite[x].trim())) {
				validEmails.push(this.bulkEmailInvite[x].trim());
			}
		}
		this.personService.sendWardenInvitation(validEmails).subscribe((data) => {
			console.log(data);
			$('#modalInvite').modal('close');
		}, (e) => {
			console.log(e);
		}
		);
		this.emailInviteForm.controls.inviteTxtArea.reset();
	}

	ngOnDestroy(){}
}