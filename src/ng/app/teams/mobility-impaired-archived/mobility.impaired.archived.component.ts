import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
import { DatepickerOptions } from 'ng2-datepicker';
import * as enLocale from 'date-fns/locale/en';
import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
    selector: 'app-archived-mobility-impaired',
    templateUrl: './mobility.impaired.archived.component.html',
    styleUrls: ['./mobility.impaired.archived.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService],
    host: {
        '(document:click)': 'onClick($event)'
    }
})
export class MobilityImpairedArchivedComponent implements OnInit, OnDestroy {
    public peepList = <any>[];
    @ViewChild("durationDate") durationDate: ElementRef;
    @ViewChild("formMobility") formMobility: NgForm;

    copyOfList = [];
    userData = {};
    showModalLoader = false;
    selectedToArchive = {
        first_name : '', last_name : '', parent_data : {}, locations : [], parent_name: '', name: ''
    };
    selectedFromList = [];

    options: DatepickerOptions = {
        displayFormat: 'MMM D[,] YYYY',
        minDate: new Date(Date.now())
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    selectedPeep = {};

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, selection : []
    };

    queries = {
        roles : 'trp,frp,users',
        impaired : 1,
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
        private authService : AuthService,
        private router : Router,
        private userService : UserService,
        private encDecrService : EncryptDecryptService,
        private dataProvider: PersonDataProviderService,
        private dashboardService : DashboardPreloaderService,
        private locationService: LocationsService
        ) {
        this.datepickerModel = new Date();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    }

    getListData(callBack?){

        this.userService.queryUsers(this.queries, (response) => {
            this.pagination.total = response.data.pagination.total;
            this.pagination.pages = response.data.pagination.pages;
            this.peepList = response.data.users;

            let tempRoles = {};
            for(let i in this.peepList){
                this.peepList[i]['bg_class'] = this.generateRandomBGClass();
                this.peepList[i]['id_encrypted'] = this.encDecrService.encrypt(this.peepList[i]['user_id']);

                for(let l in this.peepList[i]['locations']){
                    if(this.peepList[i]['locations'][l]['parent_name'] == null){
                        this.peepList[i]['locations'][l]['parent_name'] = '';
                    }
                }
            }
            this.copyOfList = JSON.parse( JSON.stringify(this.peepList) );

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
        this.filterByEvent();
        this.sortByEvent();
        this.bulkManageActionEvent();
        this.clickViewPeepEvent();
        this.searchMemberEvent();

        $('#modalMobility select[name="is_permanent"]').on('change', () => {
            if($('#modalMobility select[name="is_permanent"]').val() == '1'){
                this.isShowDatepicker = false;
                $('#durationDate').prop('disabled', true);
                this.durationDate.nativeElement.value = "no date available";
                this.formMobility.controls.duration_date.disable();
            }else{
                this.durationDate.nativeElement.value = "";
                this.formMobility.controls.duration_date.markAsPristine();
                this.formMobility.controls.duration_date.enable();

                $('#durationDate').prop('disabled', false);
            }

            $('#modalMobility select[name="is_permanent"]').material_select('update');
        });
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

    onSelectFromTable(event, peep){
        let selected = event.target.value;
        if(selected == 'view'){
            this.router.navigate(["/teams/view-user/", peep.id_encrypted]);
        }else{
            event.target.value = "0";
            this.showModalLoader = false;
            this.selectedToArchive = peep;
            $('#modalArchive').modal('open');
        }
    }

    unArchiveClick(){
        this.showModalLoader = true;

        let cb = (response) => {
            this.showModalLoader = false;
            $('#modalArchive').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
        },
        id = 0;

        if('user_id' in this.selectedToArchive){
            id = this.selectedToArchive['user_id'];
            this.userService.unArchiveUsers([id], cb);
        }else if('user_invitations_id' in this.selectedToArchive){
            id = this.selectedToArchive['user_invitations_id'];
            this.userService.unArchiveInvitedUsers([id], cb);
        }

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
            if(list.user_id){
                this.selectedFromList.push(list);
            }

            if(list.user_invitations_id){
                this.selectedFromList.push(list);
            }
        }else{
            let temp = [];
            for(let i in this.selectedFromList){
                if(this.selectedFromList[i]['user_id'] != list['user_id']){
                    temp.push( this.selectedFromList[i] );
                }

                if(this.selectedFromList[i]['user_invitations_id'] != list['user_invitations_id']){
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
        let arrIds = [],
            arrInviteesIds = [];

        for(let i in this.selectedFromList){
            if('user_id' in this.selectedFromList[i]){
                arrIds.push(this.selectedFromList[i]['user_id']);
            }

            if('user_invitations_id' in this.selectedFromList[i]){
                arrInviteesIds.push(this.selectedFromList[i]['user_invitations_id']);
            }
        }

        let cb = (response) => {
            $('#allLocations').prop('checked', false);
            this.showModalLoader = false;
            $('#modalArchiveBulk').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
        }

        this.userService.unArchiveUsers(arrIds, (response) => {
            this.userService.unArchiveInvitedUsers(arrInviteesIds, cb);
        });
    }

    clickViewPeepEvent(){
        $('body').off('click.viewpeeplink').on('click.viewpeeplink', 'a.view-peep-link', (event) => {
            let thisLink = $(event.target),
                attr = (thisLink.attr('user_id')) ? 'user' : 'invited',
                id = (attr == 'user') ? thisLink.attr('user_id') : thisLink.attr('user_invitations_id'),
                peep = {};

            for(let i in this.copyOfList){
                if( this.copyOfList[i]['user_id'] == id && attr == 'user' ){
                    peep = this.copyOfList[i];
                }else if( this.copyOfList[i]['user_invitations_id'] == id && attr == 'invited' ){
                    peep = this.copyOfList[i];
                }
            }

            this.clickShowPeepInfo(peep);

        });
    }

    clickShowPeepInfo(peep){
        $('#modalMobility select[name="is_permanent"]').val('0').trigger('change');
        this.datepickerModelFormatted = 'no date available';

        if(peep['mobility_impaired_details'].length > 0){
            for(let i in peep['mobility_impaired_details'][0]){
                if( this.formMobility.controls[i] && i != 'duration_date' ){
                    this.formMobility.controls[i].setValue(peep['mobility_impaired_details'][0][i]);
                }
            }

            $('#modalMobility select[name="is_permanent"]').val(peep['mobility_impaired_details'][0]['is_permanent']);

            if(peep['mobility_impaired_details'][0]['is_permanent'] == 0){
                this.datepickerModel = moment(peep['mobility_impaired_details'][0]['duration_date']).toDate();
                this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
            }else{
                $('#modalMobility select[name="is_permanent"]').val('1').trigger('change');
            }
        }

        this.selectedPeep = peep;

        $('#modalMobility').modal('open');
    }

    clickCompletePeepInfo(peep){
        $('#modalMobility').modal('open');
        this.selectedPeep = peep;
        this.formMobility.reset();
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

    onClick(event){
        // if(event.target == this.durationDate.nativeElement){
        //   this.isShowDatepicker = true;
        // }else if ( !this.durationDate.nativeElement.contains(event.target)  ) {
        //   this.isShowDatepicker = false;
        // }
    }

    showDatePicker(){
        this.isShowDatepicker = true;
    }

    modalPeepFormSubmit(f, event){
        event.preventDefault();

        if(f.valid){
            let paramData = JSON.parse(JSON.stringify(f.value));
            paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
            if('user_id' in this.selectedPeep){
                paramData['user_id'] = this.selectedPeep['user_id'];
            }else if('user_invitations_id' in this.selectedPeep){
                paramData['user_invitations_id'] = this.selectedPeep['user_invitations_id'];
            }

            if(this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val()

            this.showModalLoader = true;
            this.dashboardService.show();

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                this.ngOnInit();
                f.reset();
                $('#modalMobility').modal('close');
                this.showModalLoader = false;

            });
        }
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


    ngOnDestroy(){}
}
