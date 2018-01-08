import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { UserService } from '../../services/users';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
  selector: 'app-view-user-component',
  templateUrl: './view.user.component.html',
  styleUrls: ['./view.user.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService]
})
export class ViewUserComponent implements OnInit, OnDestroy {

	userData = {};
	encryptedID = '';
	decryptedID = '';
	viewData = {
		user : {
			profilePic : '',
			last_login : ''
		},
		eco_role : '',
		eco_roles : [],
		location : {
			parent_data : {}
		},
		trainings : [],
		badge_class : ''
	};
	showRemoveWardenButton = false;
	showModalRemoveWardenLoader = false;
	errorMessageRemoveWarden = '';

	constructor(
		private auth: AuthService,
        private preloaderService: DashboardPreloaderService,
        private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
		){

		this.userData = this.auth.getUserData();

		this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.decryptedID = this.encryptDecrypt.decrypt(params['encrypted']);

			this.userService.getUserLocationTrainingsEcoRoles(this.decryptedID, (response) => {
				this.viewData.user = response.data.user;
				this.viewData.eco_role = response.data.eco_role;
				this.viewData.eco_roles = response.data.eco_roles;
				this.viewData.location = response.data.location;
				this.viewData.trainings = response.data.trainings;

				for(let i in this.viewData.eco_roles){
					if(this.viewData.eco_roles[i]['is_warden_role'] == 1){
						this.showRemoveWardenButton = true;
					}

					if( this.viewData.eco_roles[i]['role_name'].toLowerCase().indexOf('chief warden') > -1 ){
						this.viewData.badge_class = 'chief-warden';
					}else{

						if( this.viewData.eco_roles[i]['role_name'].toLowerCase().indexOf('warden') > -1 && this.viewData.eco_roles[i]['is_warden_role'] == 1){
							this.viewData.badge_class = 'warden';
						}

					}
				}

				if(this.viewData.user.last_login.length > 0 ){
					this.viewData.user['last_login'] = moment(this.viewData.user['last_login'], ["YYYY-MM-DD HH:mm:ss"]).format('MMM. DD, YYYY hh:mm A');
				}

				this.preloaderService.hide();
			});
		});
	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

		this.gridEvent();
		this.renderGrid();

		this.preloaderService.show();
		setTimeout(() => { Materialize.updateTextFields(); }, 300);
	}

	public gridEvent(){
		window.addEventListener("load", this.renderGrid, false);
		window.addEventListener("resize", this.renderGrid, false);
	}

	public renderGrid(){
		let containerWidth = document.querySelector('#gridContainer')['offsetWidth'];
		let blocks = document.querySelectorAll('#gridContainer .grid-item');
		let pad = 30, cols = Math.floor( containerWidth / 300 ), newleft, newtop;
		
		for(let x = 1; x < blocks.length; x++){
			blocks[x]['style'].left = null;
			blocks[x]['style'].top = null;
		}

		setTimeout(() => {
			for(let i = 1; i < blocks.length; i++){
				if(i % cols == 0){
					newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
					blocks[i]['style'].top = newtop+"px";
				}else{
					if(blocks[i-cols]){
						newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
						blocks[i]['style'].top = newtop+"px";
					}
					newleft = (blocks[i-1]['offsetLeft'] + blocks[i-1]['offsetWidth']) + pad;
					blocks[i]['style'].left = newleft+"px";
				}
			}
		}, 100);
	}

	public getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	clickRemoveWarden(){
		$('#modalRemoveWarden').modal('open');
		this.errorMessageRemoveWarden = '';
		this.showModalRemoveWardenLoader = false;
	}

	public yesRemoveWarden(){
		this.showModalRemoveWardenLoader = true;
		this.userService.removeUserAsWarden(this.viewData.user['user_id'], (response) => {
			if(response.status){
				$('#modalRemoveWarden').modal('close');
				setTimeout(() => {
					this.showModalRemoveWardenLoader = false;
					this.router.navigate(["/teams/all-users"]);
				}, 300);
			}
		})
	}

	ngOnDestroy(){}
}