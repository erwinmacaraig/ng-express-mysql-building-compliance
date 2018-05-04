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


declare var $: any;
@Component({
    selector: 'app-teams-list-warden',
    templateUrl: './list.wardens.component.html',
    styleUrls: ['./list.wardens.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService]
})
export class ListWardensComponent implements OnInit, OnDestroy {
    public wardenArr = <any>[];

    copyOfList = [];
    userData = {};
    showModalLoader = false;
    selectedToArchive = {
        first_name : '', last_name : '', parent_data : {},  locations : [], parent_name: '', name: ''
    };
    selectedFromList = [];

    filters = [];

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage: 0, selection : []
    };

    queries = {
        roles : 'users',
        impaired : -1,
        type : 'client',
        offset :  0,
        limit : 10,
        archived : 0,
        pagination : true,
        user_training : true,
        users_locations : true,
        search : ''
    };

    multipleLocations = [];

    searchMemberInput;

    constructor(
        private authService : AuthService,
        private router : Router,
        private userService : UserService,
        private encDecrService : EncryptDecryptService,
        private dataProvider: PersonDataProviderService,
        private dashboardService : DashboardPreloaderService,
        private locationService: LocationsService) {

        this.userData = this.authService.getUserData();
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
                    this.wardenArr[i]['locations'][l]['enc_location_id'] = this.encDecrService.encrypt(this.wardenArr[i]['locations'][l]['location_id']);
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
        this.filterByEvent();
        this.sortByEvent();
        this.dashboardService.show();
        this.bulkManageActionEvent();
        this.searchMemberEvent();
    }

    generateRandomBGClass(){
        let colors = ["red", "blue", "yellow", "orange", "green", "purple", "pink"];
        return colors[ Math.floor( Math.random() * colors.length) ];
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

    onSelectFromTable(event, warden){
        let selected = event.target.value;
        if(selected == 'view'){
            this.router.navigate(["/teams/view-user/", warden.id_encrypted]);
        }else{
            event.target.value = "0";
            this.showModalLoader = false;
            this.selectedToArchive = warden;
            $('#modalArchive').modal('open');
        }
    }

    archiveClick(){
        this.showModalLoader = true;
        this.userService.archiveUsers([this.selectedToArchive['user_id']], (response) => {
            this.showModalLoader = false;
            $('#modalArchive').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
            this.selectedToArchive = {
                first_name : '', last_name : '', parent_data : {}, locations : [], parent_name: '', name: ''
            };
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
            arrIds.push(this.selectedFromList[i]['user_id']);
        }

        this.userService.archiveUsers(arrIds, (response) => {
            $('#allLocations').prop('checked', false);
            this.showModalLoader = false;
            $('#modalArchiveBulk').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
            this.selectedFromList = [];
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
            this.queries.offset = offset;
            this.loadingTable = true;
            this.getListData(() => { 
                this.loadingTable = false;
            });
        }
    }

    clickMultipleLocation(locations){
        this.multipleLocations = locations;
        $('#modalSelectMultipleLocations').modal('open');
    }

    submitSelectFromMultipleLocations(form){
        if(form.valid){

            $('#modalSelectMultipleLocations').modal('close');
            for(let loc of this.multipleLocations){
                if(loc.location_id == form.value.location_id){
                    if(loc.sublocations_count > 0){
                        this.router.navigate(['/location/view/',  this.encDecrService.encrypt(loc.location_id) ]);
                    }else{
                        this.router.navigate(['/location/view-sublocation/',  this.encDecrService.encrypt(loc.location_id) ]);
                    }
                }
            }
        }
    }

    ngOnDestroy(){}
}
