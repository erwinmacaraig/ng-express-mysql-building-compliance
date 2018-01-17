import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { LocationsService } from './../../services/locations';
import { AuthService } from '../../services/auth.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;
@Component({
    selector: 'app-mobility-impaired-archived',
    templateUrl: './mobility.impaired.archived.component.html',
    styleUrls: ['./mobility.impaired.archived.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService]
})
export class MobilityImpairedArchivedComponent implements OnInit, OnDestroy {
    public peepList = <any>[];

    copyOfList = [];
    userData = {};
    showModalLoader = false;
    selectedToArchive = {};
    selectedFromList = [];
    constructor(
        private authService : AuthService,
        private router : Router,
        private userService : UserService,
        private encDecrService : EncryptDecryptService,
        private dataProvider: PersonDataProviderService,
        private dashboardService : DashboardPreloaderService,
        private locationService: LocationsService
        ) {

    }

    ngOnInit(){
        this.dataProvider.buildArchivedPeepList().subscribe((peep) => {

            for(let i in peep){
                peep[i]['bg_class'] = this.generateRandomBGClass();
                if(peep[i]['location_account_user_id']){
                    peep[i]['id_encrypted'] = this.encDecrService.encrypt(peep[i]['location_account_user_id']).toString();
                }
            }
            this.peepList = peep;
            this.copyOfList = JSON.parse(JSON.stringify(peep));
            this.dashboardService.hide();
        }, (err: HttpErrorResponse) => {});
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

    filterByEvent(){

        $('select.filter-by').on('change', () => {
            let selected = $('select.filter-by').val();
            let temp = [];

            $('table tbody tr').show();

            if(selected == 'incomplete'){
                $('table tbody tr').each((i, elem) => {

                    if( $(elem).find('.peep-completion a').length == 0 ){
                        $(elem).hide();
                    }

                });
            }else if(selected == 'completed'){
                $('table tbody tr').each((i, elem) => {

                    if( $(elem).find('.peep-completion span').text().toLowerCase().trim() != 'completed' ){
                        $(elem).hide();
                    }

                });
            }else if(selected == 'user-validation-needed'){
                $('table tbody tr').each((i, elem) => {

                    if( $(elem).find('.peep-completion span').text().toLowerCase().trim() != 'waiting for user validation' ){
                        $(elem).hide();
                    }

                });
            }else{
                this.peepList = this.copyOfList;
            }
        });

    }

    sortByEvent(){
        $('select.sort-by').on('change', () => {
            let selected = $('select.sort-by').val();

            if(selected == 'loc-name-asc'){
                this.peepList.sort((a, b) => {
                    if(a.name < b.name) return -1;
                    if(a.name > b.name) return 1;
                    return 0;
                });
            }else if(selected == 'loc-name-desc'){
                this.peepList.sort((a, b) => {
                    if(a.name > b.name) return -1;
                    if(a.name < b.name) return 1;
                    return 0;
                });
            }else if(selected == 'user-name-asc'){
                this.peepList.sort((a, b) => {
                    if(a.first_name < b.first_name) return -1;
                    if(a.first_name > b.first_name) return 1;
                    return 0;
                });
            }else if(selected == 'user-name-desc'){
                this.peepList.sort((a, b) => {
                    if(a.first_name > b.first_name) return -1;
                    if(a.first_name < b.first_name) return 1;
                    return 0;
                });
            }else{
                this.peepList = this.copyOfList;
            }
        });
    }

    searchMemberEvent(event){
        let key = event.target.value,
        temp = [];

        if(key.length == 0){
            this.peepList = this.copyOfList;
        }else{
            for(let i in this.copyOfList){
                let name = (this.copyOfList[i]['first_name']+' '+this.copyOfList[i]['last_name']).toLowerCase();
                if(name.indexOf(key) > -1){
                    temp.push( this.copyOfList[i] );
                }
            }
            this.peepList = temp;
        }
    }

    ngOnDestroy(){}

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

    unArchiveClick(){
        this.showModalLoader = true;
        this.userService.unArchiveLocationUser([this.selectedToArchive['location_account_user_id']], (response) => {
            this.showModalLoader = false;
            $('#modalArchive').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
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
            for(let i in this.peepList){
                if(i == index){
                    this.singleCheckboxChangeEvent(this.peepList[i], { target : { checked : elem.checked } } );
                }
            }
        });
    }

    singleCheckboxChangeEvent(list, event){
        let copy = JSON.parse(JSON.stringify(this.selectedFromList));
        if(event.target.checked){
            if(list.location_account_user_id){
                this.selectedFromList.push(list);
            }
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
            arrIds.push(this.selectedFromList[i]['location_account_user_id']);
        }

        this.userService.unArchiveLocationUser(arrIds, (response) => {
            this.showModalLoader = false;
            $('#modalArchiveBulk').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
        });
    }
}
