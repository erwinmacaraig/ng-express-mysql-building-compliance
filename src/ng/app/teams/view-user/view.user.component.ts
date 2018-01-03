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
		eco_roles : [],
		locations : [],
		trainings : [],
		badge_class : ''
	};

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

			this.userService.getUserForViewFrpTrp(this.decryptedID, (response) => {
				this.viewData.user = response.data.user;
				this.viewData.eco_roles = response.data.eco_roles;
				this.viewData.locations = response.data.locations;
				this.viewData.trainings = response.data.trainings;

				let chief = false,
					warden = false;
				for(let i in this.viewData.eco_roles){
					if(this.viewData.eco_roles[i]['em_roles_id'] == 9){
						warden = true;
					}else if(this.viewData.eco_roles[i]['em_roles_id'] == 11){
						chief = true;
					}
				}

				if(chief){
					this.viewData.badge_class = 'chief-warden';
				}else if(warden){
					this.viewData.badge_class = 'warden';
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

	ngOnDestroy(){}
}