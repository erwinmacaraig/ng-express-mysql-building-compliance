import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $: any;
@Component({
  selector: 'app-all-users',
  templateUrl: './all.users.component.html',
  styleUrls: ['./all.users.component.css'],
  providers: [UserService, AuthService, DashboardPreloaderService, EncryptDecryptService]
})
export class AllUsersComponent implements OnInit, OnDestroy {

	userData = {};
	listData = [];

	constructor(
		private userService : UserService,
		private authService : AuthService,
		private dashboardService : DashboardPreloaderService,
		private encDecrService : EncryptDecryptService
		){
		this.userData = this.authService.getUserData();
	}

	ngOnInit(){

		this.userService.getUsersByAccountId(this.userData['accountId'], (response) => {
			this.listData = response.data;
			for(let i in this.listData){
				this.listData[i]['bg_class'] = this.generateRandomBGClass();
				this.listData[i]['user_id_encrypted'] = this.encDecrService.encrypt(this.listData[i]['user_id']).toString();
			}
			this.dashboardService.hide();
		});

	}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

		this.dashboardService.show();
	}

	ngOnDestroy(){}

	generateRandomBGClass(){
		let colors = ["red", "blue", "yellow", "orange", "green", "purple", "pink"];
		return colors[ Math.floor( Math.random() * colors.length) ];
	}
}