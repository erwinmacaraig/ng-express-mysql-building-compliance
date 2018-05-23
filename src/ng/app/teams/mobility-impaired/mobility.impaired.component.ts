import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm, NgModel } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { LocationsService } from './../../services/locations';
import { AuthService } from '../../services/auth.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { UserService } from '../../services/users';
import { AccountsDataProviderService  } from '../../services/accounts';
import { CourseService } from '../../services/course';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { DatepickerOptions } from 'ng2-datepicker';
import * as enLocale from 'date-fns/locale/en';
import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
    selector: 'app-mobility-impaired',
    templateUrl: './mobility.impaired.component.html',
    styleUrls: ['./mobility.impaired.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService, AccountsDataProviderService, CourseService]
})
export class MobilityImpairedComponent implements OnInit, OnDestroy {
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
        minDate: moment().toDate()
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    selectedPeep = {
        first_name : '', last_name : ''
    };

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        roles : 'trp,frp,users',
        impaired : 1,
        type : 'client',
        offset :  0,
        limit : 10,
        archived : 0,
        pagination : true,
        user_training : true,
        users_locations : true,
        search : ''
    };

    searchMemberInput;

    multipleLocations = [];

    selectedToInvite = [];

    emTrainings = [];

    allAreSelected = false;
    sendInviteToAll = false;
    sendInviteToAllNonCompliant = false;

    isOnlineTrainingAvailable = false;

    constructor(
        private authService : AuthService,
        private router : Router,
        private userService : UserService,
        private encDecrService : EncryptDecryptService,
        private dataProvider: PersonDataProviderService,
        private dashboardService : DashboardPreloaderService,
        private locationService: LocationsService,
        private courseService : CourseService,
        private accountService : AccountsDataProviderService
        ) {
        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

        this.courseService.getAllEmRolesTrainings((response) => {
            this.emTrainings = response.data;
        });
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
                    this.peepList[i]['locations'][l]['enc_location_id'] = this.encDecrService.encrypt(this.peepList[i]['locations'][l]['location_id']);

                    if(this.peepList[i]['locations'][l]['parent_name'] == null){
                        this.peepList[i]['locations'][l]['parent_name'] = '';
                    }
                }

                this.peepList[i]['sendinvitation'] = false;
                let hasEcoRole = false;
                for(let r in this.peepList[i]['roles']){
                    if( this.peepList[i]['roles'][r]['role_id'] != 1 && this.peepList[i]['roles'][r]['role_id'] != 2 ){
                        hasEcoRole = true;
                    }
                }

                if(hasEcoRole){
                    this.peepList[i]['sendinvitation'] = true;
                }

                let isSelected = false;
                this.peepList[i]['isselected'] = false;
                for(let sel of this.selectedFromList){
                    if(sel.user_id == this.peepList[i]['user_id']){
                        this.peepList[i]['isselected'] = true;
                        isSelected = true;
                    }
                }

                if(!isSelected && this.allAreSelected){
                    this.peepList[i]['isselected'] = true;
                    this.selectedFromList.push(this.peepList[i]);
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

        this.accountService.isOnlineTrainingValid((response) => {
            if(response.valid){
                this.isOnlineTrainingAvailable = true;
            }
            setTimeout(() => {
                $('.row.filter-container select').material_select();
            }, 100);
        });
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
                    this.pagination.currentPage = 1;
                    this.pagination.prevPage = 1;
                    this.loadingTable = false;
                });
            });
    }

    onSelectFromTable(event, peep){
        let selected = event.target.value;
        if(selected == 'view'){
            this.router.navigate(["/teams/view-user/", peep.id_encrypted]);
        }else if(selected == 'healthy'){
            this.selectedPeep = peep;
            $('#modalMobilityHealty').modal('open');
        }else if(selected == 'invite'){
            this.selectedToInvite = [];
            this.selectedToInvite.push(peep);
            event.target.value = 0;
            $('#modalSendInvitation').modal('open');
        }else if(selected == 'archive'){
            event.target.value = "0";
            this.showModalLoader = false;
            this.selectedToArchive = peep;
            $('#modalArchive').modal('open');
        }

        event.target.value = 0;
    }

    archiveClick(){
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
            this.userService.archiveUsers([id], cb);
        }else if('user_invitations_id' in this.selectedToArchive){
            id = this.selectedToArchive['user_invitations_id'];
            this.userService.archiveInvitedUsers([id], cb);
        }
    }

    selectAllCheckboxEvent(event){
        let checkboxes = $('table tbody input[type="checkbox"]');
        if(event.target.checked){
            checkboxes.prop('checked', true);
            this.allAreSelected = true;
        }else{
            checkboxes.prop('checked', false);
            this.allAreSelected = false;
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
            list.isselected = true;
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
        this.allAreSelected = false;
        if(countChecked == checkboxes.length){
            $('#allLocations').prop('checked', true);
            this.allAreSelected = true;
        }
    }

    bulkManageActionEvent(){
        $('select.bulk-manage').on('change', () => {
            let sel = $('select.bulk-manage').val();

            if(sel == 'archive'){
                if(this.selectedFromList.length > 0){
                    $('#modalArchiveBulk').modal('open');
                }
            }else if(sel == 'invite-selected'){
                if(!this.allAreSelected){
                    this.selectedToInvite = [];
                    for(let user of this.selectedFromList){
                        if(user.sendinvitation){
                            this.selectedToInvite.push(user);
                        }
                    }
                    if(this.selectedToInvite.length > 0){
                        $('#modalSendInvitation').modal('open');
                    }
                }else{
                    this.sendInviteToAll = true;
                    $('#modalSendInvitation').modal('open');
                }
                
            }else if(sel == 'invite-all-non-compliant'){
                this.sendInviteToAllNonCompliant = true;
                $('#modalSendInvitation').modal('open');
            }else if(sel == 'invite-all'){
                this.sendInviteToAll = true;
                $('#modalSendInvitation').modal('open');
            }

            $('select.bulk-manage').val("0").material_select();

        });
    }

    bulkArchiveClick(){
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

        this.userService.archiveUsers(arrIds, (response) => {
            this.userService.archiveInvitedUsers(arrInviteesIds, cb);
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

        $('#modalMobility select').material_select('update');
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
            if('user_id' in this.selectedPeep){
                paramData['user_id'] = this.selectedPeep['user_id'];
            }else if('user_invitations_id' in this.selectedPeep){
                paramData['user_invitations_id'] = this.selectedPeep['user_invitations_id'];
            }

            if(this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

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

    markUserAsHealthy(){
        this.showModalLoader = true;

        let paramData = {
            user_id : this.selectedPeep['user_id'],
            mobility_impaired : 0
        };
        this.userService.markAsHealthy(paramData, (response) => {

            let newList = [];
            for(let user of this.peepList){
                if(user['user_id'] != this.selectedPeep['user_id']){
                    newList.push(user);
                }
            }

            this.peepList = newList;
  
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

    clickCancelSendInvitation(){
        this.sendInviteToAllNonCompliant = false;
        this.sendInviteToAll = false;
    }

    clickSendInvitation(){
        let form = {
            all : false,
            non_compliant : false,
            ids : []
        };

        form.all = (this.allAreSelected) ? true : (this.sendInviteToAll) ? true : false;
        form.non_compliant = (this.sendInviteToAllNonCompliant) ? true : false;

        for(let user of this.selectedToInvite){
            form.ids.push(user.user_id);
        }

        this.showModalLoader = true;
        this.courseService.sendTrainingInvitation(form, (response) => {
            $('#modalSendInvitation').modal('close');
            this.showModalLoader = false;
        });
    }

    ngOnDestroy(){}
}
