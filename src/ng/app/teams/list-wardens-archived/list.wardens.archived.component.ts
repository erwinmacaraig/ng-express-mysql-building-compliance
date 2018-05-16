import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from './../../services/locations';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { DatepickerOptions } from 'ng2-datepicker';

declare var $: any;
@Component({
  selector: 'app-list-wardens-archived',
  templateUrl: './list.wardens.archived.component.html',
  styleUrls: ['./list.wardens.archived.component.css'],
  providers: [UserService, AuthService, DashboardPreloaderService, EncryptDecryptService]
})
export class ListArchivedWardensComponent implements OnInit, OnDestroy {

	userData = {};
	wardenArr = <any>[];
	selectedToArchive = {
		first_name : '', last_name : '', parent_data : {}, locations : [], parent_name: '', name: ''
	};
	showModalLoader = false;
	copyOfList = [];
	selectedFromList = [];

	filters = [];

	loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        roles : 'users',
        impaired : -1,
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

    options: DatepickerOptions = {
        displayFormat: 'MMM D[,] YYYY',
        minDate: moment().toDate()
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    selectedPeep = {
        first_name : '', last_name : ''
    };

	constructor(
		private userService : UserService,
		private authService : AuthService,
		private dashboardService : DashboardPreloaderService,
		private encDecrService : EncryptDecryptService,
		private dataProvider: PersonDataProviderService,
		private router : Router
		){
		this.userData = this.authService.getUserData();

        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
	}

	getListData(callBack?){

        this.userService.queryUsers(this.queries, (response) => {
            this.pagination.total = response.data.pagination.total;
            this.pagination.pages = response.data.pagination.pages;
            this.wardenArr = response.data.users;

            let tempRoles = {};
            this.filters = [];
            for(let i in this.wardenArr){
                this.wardenArr[i]['bg_class'] = this.generateRandomBGClass();
                this.wardenArr[i]['id_encrypted'] = this.encDecrService.encrypt(this.wardenArr[i]['user_id']);

                for(let l in this.wardenArr[i]['locations']){
                    if(this.wardenArr[i]['locations'][l]['parent_name'] == null){
                        this.wardenArr[i]['locations'][l]['parent_name'] = '';
                    }
                }

                for(let r in this.wardenArr[i]['roles']){
                    if( this.wardenArr[i]['roles'][r]['role_name'] ){
                        if( !tempRoles[ this.wardenArr[i]['roles'][r]['role_name'] ] ){
                            tempRoles[ this.wardenArr[i]['roles'][r]['role_name'] ] = this.wardenArr[i]['roles'][r]['role_name'];
                            this.filters.push({
                                value : this.wardenArr[i]['roles'][r]['role_id'],
                                name : this.wardenArr[i]['roles'][r]['role_name']
                            });
                        }
                    }
                }
            }

            setTimeout(() => { $('.row.filter-container select.filter-by').material_select('update'); }, 100);

            this.copyOfList = JSON.parse( JSON.stringify(this.wardenArr) );

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
                this.pagination.prevPage = 1;
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
        $('#modalMobility select').material_select();
        this.filterByEvent();
        this.sortByEvent();
        this.dashboardService.show();
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
	        this.wardenArr = temp;
	      }else{
	        this.wardenArr = this.copyOfList;
	      }
	    });

	}

	sortByEvent(){
		$('select.sort-by').on('change', () => {
			let selected = $('select.sort-by').val();

			if(selected == 'user-name-asc'){
				this.wardenArr.sort((a, b) => {
					if(a.first_name < b.first_name) return -1;
				    if(a.first_name > b.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.wardenArr.sort((a, b) => {
					if(a.first_name > b.first_name) return -1;
				    if(a.first_name < b.first_name) return 1;
				    return 0;
				});
			}else{
				this.wardenArr = this.copyOfList;
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
                    this.pagination.currentPage = 1;
					this.pagination.prevPage = 1;
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
		}else if(selected == 'peep'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobility').modal('open');
        }else if(selected == 'healthy'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobilityHealty').modal('open');
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
			this.ngOnInit();
			this.selectedToArchive = {
				first_name : '', last_name : '', parent_data : {}, locations : [], name: '', parent_name: ''
			};
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
	      for(let i in this.wardenArr){
	        if(i == index){
	          this.singleCheckboxChangeEvent(this.wardenArr[i], { target : { checked : elem.checked } } );
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
			this.ngOnInit();
			this.selectedFromList = [];
		});
	}

    onChangeDatePicker(event){
        if(!moment(this.datepickerModel).isValid()){
            this.datepickerModel = new Date();
            this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
        }else{
            this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
        }
        this.isShowDatepicker = false;
    }

    showDatePicker(){
        this.isShowDatepicker = true;
    }

    modalPeepFormSubmit(f, event){
        event.preventDefault();

        if(f.valid){
            let paramData = JSON.parse(JSON.stringify(f.value));
            paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
            paramData['user_id'] = this.selectedPeep['user_id'];

            if(this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                for(let user of this.wardenArr){
                    if(user['user_id'] == this.selectedPeep['user_id']){
                        user['mobility_impaired'] = 1;
                        user['mobility_impaired_details'] = response.data;
                    }
                }

                f.reset();
                $('#modalMobility').modal('close');
                this.showModalLoader = false;

            });
        }
    }

    markUserAsHealthy(){
        this.showModalLoader = true;

        let paramData = {
            user_id : this.selectedPeep['user_id'],
            mobility_impaired : 0
        };
        this.userService.markAsHealthy(paramData, (response) => {

            for(let user of this.wardenArr){
                if(user['user_id'] == this.selectedPeep['user_id']){
                    user['mobility_impaired'] = 0;
                    user['mobility_impaired_details'] = [];
                }
            }
  
            $('#modalMobilityHealty').modal('close');
            this.showModalLoader = false;

        });
    }

	pageChange(type){

		let changeDone = false;
		switch (type) {
			case "prev":
				if(this.pagination.currentPage > 1){
					this.pagination.currentPage = this.pagination.currentPage - 1;
					changeDone = true;
				}
				break;

			case "next":
				if(this.pagination.currentPage < this.pagination.pages){
					this.pagination.currentPage = this.pagination.currentPage + 1;
					changeDone = true;
				}
				break;
			
			default:
				if(this.pagination.prevPage != parseInt(type)){
					this.pagination.currentPage = parseInt(type);
					changeDone = true;
				}
				break;
		}

		if(changeDone){
			this.pagination.prevPage = parseInt(type);
			let offset = (this.pagination.currentPage * this.queries.limit) - this.queries.limit;
			this.queries.offset = offset - 1;
			this.loadingTable = true;
			this.getListData(() => { 
				this.loadingTable = false;
			});
		}
	}
}
