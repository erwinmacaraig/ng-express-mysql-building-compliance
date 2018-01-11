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
	selectedToArchive = {
		first_name : '', last_name : '', parent_data : {}, user_info : {}
	};
	showModalLoader = false;
	copyOfList = [];
	selectedFromList = [];

	constructor(
		private userService : UserService,
		private authService : AuthService,
		private dashboardService : DashboardPreloaderService,
		private encDecrService : EncryptDecryptService,
		private router : Router
		){
		this.userData = this.authService.getUserData();
	}

	getListData(callBack?){
		this.userService.getUsersByAccountId(this.userData['accountId'], (response) => {
			this.listData = response.data;
			for(let i in this.listData){
				this.listData[i]['bg_class'] = this.generateRandomBGClass();
				this.listData[i]['user_id_encrypted'] = this.encDecrService.encrypt(this.listData[i]['user_id']).toString();
				this.listData[i]['id_encrypted'] = this.encDecrService.encrypt(this.listData[i]['location_account_user_id']).toString();
			}
			this.copyOfList = JSON.parse( JSON.stringify(this.listData) );
			if(callBack){
				callBack();
			}
		});
	}

	ngOnInit(){

		this.getListData(() => { this.dashboardService.hide(); });

	}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('.row.filter-container select').material_select();

		this.dashboardService.show();

		this.filterByEvent();
		this.sortByEvent();
		this.bulkManageActionEvent();
	}

	filterByEvent(){

		$('select.filter-by').on('change', () => {
			let selected = $('select.filter-by').val();
			let temp = [];
			if(selected == 'frp'){
				for(let i in this.copyOfList){
					if(this.copyOfList[i]['role_id'] == 1){
						temp.push(this.copyOfList[i]);
					}
				}
				this.listData = temp;
			}else if(selected == 'trp'){
				for(let i in this.copyOfList){
					if(this.copyOfList[i]['role_id'] == 2){
						temp.push(this.copyOfList[i]);
					}
				}
				this.listData = temp;
			}else if(selected == 'user'){
				for(let i in this.copyOfList){
					if(this.copyOfList[i]['role_id'] != 1 && this.copyOfList[i]['role_id'] != 2){
						temp.push(this.copyOfList[i]);
					}
				}
				this.listData = temp;
			}else{
				this.listData = this.copyOfList;
			}
		});
		
	}

	sortByEvent(){
		$('select.sort-by').on('change', () => {
			let selected = $('select.sort-by').val();
			
			if(selected == 'loc-name-asc'){
				this.listData.sort((a, b) => {
					if(a.name < b.name) return -1;
				    if(a.name > b.name) return 1;
				    return 0;
				});
			}else if(selected == 'loc-name-desc'){
				this.listData.sort((a, b) => {
					if(a.name > b.name) return -1;
				    if(a.name < b.name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-asc'){
				this.listData.sort((a, b) => {
					if(a.user_info.first_name < b.user_info.first_name) return -1;
				    if(a.user_info.first_name > b.user_info.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.listData.sort((a, b) => {
					if(a.user_info.first_name > b.user_info.first_name) return -1;
				    if(a.user_info.first_name < b.user_info.first_name) return 1;
				    return 0;
				});
			}else{
				this.listData = this.copyOfList;
			}
		});
	}

	searchMemberEvent(event){
		let key = event.target.value,
			temp = [];

		if(key.length == 0){
			this.listData = this.copyOfList;
		}else{
			for(let i in this.copyOfList){
				let name = (this.copyOfList[i]['user_info']['first_name']+' '+this.copyOfList[i]['user_info']['last_name']).toLowerCase();
				if(name.indexOf(key) > -1){
					temp.push( this.copyOfList[i] );
				}
			}
			this.listData = temp;
		}
	}

	ngOnDestroy(){}

	generateRandomBGClass(){
		let colors = ["red", "blue", "yellow", "orange", "green", "purple", "pink"];
		return colors[ Math.floor( Math.random() * colors.length) ];
	}

	onSelectFromTable(event, list){
		let selected = event.target.value;
		if(selected == 'view'){
			this.router.navigate(["/teams/view-user/", list.id_encrypted]);
		}else{
			event.target.value = "0";
			this.showModalLoader = false;
			this.selectedToArchive = list;
			$('#modalArchive').modal('open');
		}
	}

	archiveClick(){
		this.showModalLoader = true;
		this.userService.archiveLocationUser([this.selectedToArchive['location_account_user_id']], (response) => {
			this.showModalLoader = false;
			$('#modalArchive').modal('close');
			this.dashboardService.show();
			this.getListData(() => { this.dashboardService.hide(); });
		});
	}

	selectAllCheckboxEvent(event){
		let checkboxes = $('table tbody input[type="checkbox"]');
		if(event.target.checked){
			checkboxes.prop('checked', true);
		}else{
			checkboxes.prop('checked', false);
		}

		checkboxes.each((indx, elem) => {
			let id = $(elem).attr('id'),
				index = id.replace('location-', '');
			for(let i in this.listData){
				if(i == index){
					this.singleCheckboxChangeEvent(this.listData[i], { target : { checked : elem.checked } } );
				}
			}
		});
	}

	singleCheckboxChangeEvent(list, event){
		let copy = JSON.parse(JSON.stringify(this.selectedFromList));
		if(event.target.checked){
			this.selectedFromList.push(list);
		}else{
			let temp = [];
			for(let i in this.selectedFromList){
				if(this.selectedFromList[i]['location_account_user_id'] != list['location_account_user_id']){
					temp.push( this.selectedFromList[i] );
				}
			}
			this.selectedFromList = temp;
		}
	}

	bulkManageActionEvent(){
		$('select.bulk-manage').on('change', () => {
			let sel = $('select.bulk-manage').val();

			if(sel == 'archive'){
				$('select.bulk-manage').val("0").material_select();
				if(this.selectedFromList.length > 0){
					$('#modalArchiveBulk').modal('open');
				}
			}

		});
	}

	bulkArchiveClick(){
		this.showModalLoader = true;
		let arrIds = [];

		for(let i in this.selectedFromList){
			arrIds.push(this.selectedFromList[i]['location_account_user_id']);
		}

		this.userService.archiveLocationUser(arrIds, (response) => {
			this.showModalLoader = false;
			$('#modalArchiveBulk').modal('close');
			this.dashboardService.show();
			this.getListData(() => { this.dashboardService.hide(); });
		});
	}
}