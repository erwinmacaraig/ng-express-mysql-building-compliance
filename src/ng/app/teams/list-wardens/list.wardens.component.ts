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
        first_name : '', last_name : '', parent_data : {},  locations : []
    };
    selectedFromList = [];

    filters = [];

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

    ngOnInit(){
        this.dataProvider.buildWardenList().subscribe((response) => {
            let data = response['data'],
            tempRoles = {};

            for(let i in data){
                data[i]['bg_class'] = this.generateRandomBGClass();
                data[i]['id_encrypted'] = this.encDecrService.encrypt(data[i]['user_id']).toString();
                data[i]['last_login'] = moment(data[i]['last_login']).format('MMM. DD, YYYY hh:mmA');

                for(let r in data[i]['roles']){
                    if( data[i]['roles'][r]['role_name'] ){
                        if( !tempRoles[ data[i]['roles'][r]['role_name'] ] ){
                            tempRoles[ data[i]['roles'][r]['role_name'] ] = data[i]['roles'][r]['role_name'];
                            this.filters.push({
                                value : data[i]['roles'][r]['role_id'],
                                name : data[i]['roles'][r]['role_name']
                            });
                        }
                    }
                }
            }

            this.wardenArr = data;
            this.copyOfList = JSON.parse(JSON.stringify(data));
            this.dashboardService.hide();

            setTimeout(() => {
                $('.row.filter-container select').material_select();
            }, 500);

        }, (err: HttpErrorResponse) => {
            console.log(err);
        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });

        $('select').material_select();
        this.filterByEvent();
        this.sortByEvent();
        this.dashboardService.show();
        this.bulkManageActionEvent();
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

    searchMemberEvent(event){
        let key = event.target.value,
        temp = [];

        if(key.length == 0){
            this.wardenArr = this.copyOfList;
        }else{
            for(let i in this.copyOfList){
                let name = (this.copyOfList[i]['first_name']+' '+this.copyOfList[i]['last_name']).toLowerCase(),
                email = this.copyOfList[i]['email'];
                if(name.indexOf(key) > -1 || email.indexOf(key) > -1){
                    temp.push( this.copyOfList[i] );
                }
            }
            this.wardenArr = temp;
        }
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
                first_name : '', last_name : '', parent_data : {}, locations : []
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

    ngOnDestroy(){}
}
