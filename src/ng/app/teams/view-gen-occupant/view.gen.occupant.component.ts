import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
  selector: 'app-view-gen-occupant-component',
  templateUrl: './view.gen.occupant.component.html',
  styleUrls: ['./view.gen.occupant.component.css'],
  providers : [UserService, DashboardPreloaderService, PersonDataProviderService, AuthService, EncryptDecryptService]
})
export class ViewGeneralOccupantComponent implements OnInit, OnDestroy {

	viewData = {
		team : [],
		user : {
			profilePic : ''
		},
		location : {
			name : '',
			parent_location : { name : '' }
		},
		eco_role : { role_name : '', em_roles_id: 0 }
	};
	showModalRequestWardenLoader = false;
	approvers = [];
	showModalRequestWardenSuccess = false;
	userData = <any> {};
	customMessageModal = {
		status : false,
		message : ''
	};
	hasRequest = false;
    userIdEnc = '';
	constructor(
		private auth: AuthService,
		private userService: UserService,
		private preloaderService: DashboardPreloaderService,
        private encryptDecrypt : EncryptDecryptService,
		private personService : PersonDataProviderService
		){

		this.userData = this.auth.getUserData();
        this.userIdEnc = this.encryptDecrypt.encrypt(this.userData.userId);
		this.userService.getWardenRequest(this.userData['userId'], (response) => {
			if(response.data.length > 0){
				this.hasRequest = true;
			}
		});

		this.userService.getMyWardenTeam({
			role_id : 8
		}, (response) => {
			if(response.status){
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

					}, () => {
                        this.preloaderService.hide();

                        setTimeout(() => {
                            $('select').material_select();
                        },300);
                    });
				}
			}else{
				this.preloaderService.hide();
			}
		});
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
		setTimeout(() => {
			$('#modalRequestWarden select').material_select();
		}, 300);
	}

	submitRequest(){
		let approverId = $('#modalRequestWarden select').val();
		if(approverId !== null && parseInt(approverId) > 0){
			this.showModalRequestWardenLoader = true;
			this.userService.requestAsWarden({
				user : this.userData['userId'],
				approver : approverId,
				location : this.viewData.location['location_id']
			}, (response) => {
				this.showModalRequestWardenSuccess = true;
				this.showModalRequestWardenLoader = false;
				if(response.status){
					this.hasRequest = true;
					setTimeout(() => {
						$('#modalRequestWarden').modal('close');
					},1000);
				}else{
					this.customMessageModal.status = true;
					this.customMessageModal.message = response.message;
					setTimeout(() => {
						$('#modalRequestWarden').modal('close');
					},3000);
				}
			});
		}
	}

	ngOnDestroy(){}
}
