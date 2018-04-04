import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
  selector: 'app-all-users-archived',
  templateUrl: './all.users.archived.component.html',
  styleUrls: ['./all.users.archived.component.css'],
  providers: [UserService, AuthService, DashboardPreloaderService, EncryptDecryptService]
})
export class AllUsersArchivedComponent implements OnInit, OnDestroy {

	userData = {};
	listData = [];
	selectedToArchive = {
		first_name : '', last_name : '', parent_data : {}, locations : []
	};
	showModalLoader = false;
	copyOfList = [];
	selectedFromList = [];

	filters = [];

	loadingTable = false;

	pagination = {
		pages : 0, total : 0, currentPage : 0, selection : []
	};

	queries = {
		roles : 'frp,trp,users',
		impaired : null,
		type : 'client',
		offset :  0,
		limit : 10,
		archived : 1,
		pagination : true,
		user_training : true,
		users_locations : true,
		search : ''
	};

	searchMemberInput;

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

		this.userService.queryUsers(this.queries, (response) => {
			this.pagination.total = response.data.pagination.total;
			this.pagination.pages = response.data.pagination.pages;
			this.listData = response.data.users;

			let tempRoles = {};
			for(let i in this.listData){
				this.listData[i]['bg_class'] = this.generateRandomBGClass();
				this.listData[i]['id_encrypted'] = this.encDecrService.encrypt(this.listData[i]['user_id']);

				for(let l in this.listData[i]['locations']){
					if(this.listData[i]['locations'][l]['parent_name'] == null){
						this.listData[i]['locations'][l]['parent_name'] = '';
					}
				}

				for(let r in this.listData[i]['roles']){
					if( this.listData[i]['roles'][r]['role_name'] ){
						if( !tempRoles[ this.listData[i]['roles'][r]['role_name'] ] ){
							tempRoles[ this.listData[i]['roles'][r]['role_name'] ] = this.listData[i]['roles'][r]['role_name'];
							this.filters.push({
								value : this.listData[i]['roles'][r]['role_id'],
								name : this.listData[i]['roles'][r]['role_name']
							});
						}
					}
				}
			}
			this.copyOfList = JSON.parse( JSON.stringify(this.listData) );

			if(callBack){
				callBack();
			}
		});
	}

	ngOnInit(){
		this.dashboardService.show();
		this.getListData(() => { 
			if(this.pagination.pages > 0){
				this.pagination.currentPage = 1;
			}

			for(let i = 1; i<=this.pagination.pages; i++){
				this.pagination.selection.push({ 'number' : i });
			}
			setTimeout(() => {
				this.dashboardService.hide(); 
				$('.row.filter-container select').material_select();
			}, 100);
		});

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
		this.searchMemberEvent();
	}

	filterByEvent(){

		$('select.filter-by').on('change', () => {
			let selected = $('select.filter-by').val();
			if(parseInt(selected) != 0){
				let temp = [],
					addedIds = {};
				for(let list of this.copyOfList){
					let add = false;
					for(let role of list.roles){
						if( role.role_id == selected ){
							add = true;
						}
					}

					if(add){
						temp.push(list);
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
			
			if(selected == 'user-name-asc'){
				this.listData.sort((a, b) => {
					if(a.first_name < b.first_name) return -1;
				    if(a.first_name > b.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.listData.sort((a, b) => {
					if(a.first_name > b.first_name) return -1;
				    if(a.first_name < b.first_name) return 1;
				    return 0;
				});
			}else{
				this.listData = this.copyOfList;
			}
		});
	}

	searchMemberEvent(){
		this.searchMemberInput = Rx.Observable.fromEvent(document.querySelector('#searchMemberInput'), 'input');
		this.searchMemberInput.debounceTime(800)
			.map(event => event.target.value)
			.subscribe((value) => {
				this.queries.search = value;
				this.queries.offset = 0;
				this.loadingTable = true;
				this.pagination.selection = [];
				this.getListData(() => { 
					for(let i = 1; i<=this.pagination.pages; i++){
						this.pagination.selection.push({ 'number' : i });
					}
					this.loadingTable = false;
				});
			});
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

	unArchiveClick(){
		this.showModalLoader = true;
		this.userService.unArchiveUsers([this.selectedToArchive['user_id']], (response) => {
			this.showModalLoader = false;
			$('#modalArchive').modal('close');
			this.dashboardService.show();
			this.selectedToArchive = {
				first_name : '', last_name : '', parent_data : {}, locations : []
			};
			this.getListData(() => { 
				this.dashboardService.hide();
				setTimeout(() => {
					$('.row.filter-container select').material_select();
				}, 500);
			});
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
				if(this.selectedFromList[i]['user_id'] != list['user_id']){
					temp.push( this.selectedFromList[i] );
				}
			}
			this.selectedFromList = temp;
		}

		let checkboxes = $('table tbody input[type="checkbox"]'),
        countChecked = 0;
        checkboxes.each((indx, elem) => {
            if($(elem).prop('checked')){
                countChecked++;
            }
        });

        $('#allLocations').prop('checked', false);
        if(countChecked == checkboxes.length){
            $('#allLocations').prop('checked', true);
        }
	}

	bulkManageActionEvent(){
		$('select.bulk-manage').on('change', () => {
			let sel = $('select.bulk-manage').val();

			if(sel == 'restore'){
				$('select.bulk-manage').val("0").material_select();
				if(this.selectedFromList.length > 0){
					$('#modalArchiveBulk').modal('open');
				}
			}

		});
	}

	bulkUnArchiveClick(){
		this.showModalLoader = true;
		let arrIds = [];

		for(let i in this.selectedFromList){
			arrIds.push(this.selectedFromList[i]['user_id']);
		}

		this.userService.unArchiveUsers(arrIds, (response) => {
			$('#allLocations').prop('checked', false);
			this.showModalLoader = false;
			$('#modalArchiveBulk').modal('close');
			this.dashboardService.show();
			this.selectedFromList = [];
			this.getListData(() => { 
				this.dashboardService.hide();
				setTimeout(() => {
					$('.row.filter-container select').material_select();
				}, 500);
			});

		});
	}

	pageChange(type){

		switch (type) {
			case "prev":
				if(this.pagination.currentPage > 1){
					this.pagination.currentPage = this.pagination.currentPage - 1;
				}
				break;

			case "next":
				if(this.pagination.currentPage < this.pagination.pages){
					this.pagination.currentPage = this.pagination.currentPage + 1;
				}
				break;
			
			default:
				this.pagination.currentPage = type;
				break;
		}

		let offset = (this.pagination.currentPage * this.queries.limit) - this.queries.limit;
		this.queries.offset = offset;
		this.loadingTable = true;
		this.getListData(() => { 
			this.loadingTable = false;
		});
	}
}