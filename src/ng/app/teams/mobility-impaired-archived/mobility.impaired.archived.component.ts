import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService  } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { CourseService } from '../../services/course';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as moment from 'moment';
import { DatepickerOptions } from 'ng2-datepicker';

declare var $: any;
@Component({
    selector: 'app-archived-mobility-impaired',
    templateUrl: './mobility.impaired.archived.component.html',
    styleUrls: ['./mobility.impaired.archived.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService, AccountsDataProviderService, CourseService]
})
export class MobilityImpairedArchivedComponent implements OnInit, OnDestroy {
    @ViewChild('formMobility') formMobility : NgForm;
    userData = <any> {};
    listData = [];
    selectedToArchive = {
        first_name : '', last_name : '', parent_data : {}, locations : []
    };
    showModalLoader = false;
    copyOfList = [];
    selectedFromList = [];

    filters = [
        { value : 2, name : 'Tenant Responsible' },
        { value : 8, name : 'General Occupant' },
        { value : 9, name : 'Warden' },
        { value : 10, name : 'Floor / Area Warden' },
        { value : 11, name : 'Chief Warden' },
        { value : 12, name : 'Fire Safety Advisor' },
        { value : 13, name : 'Emergency Planning Committee Member' },
        { value : 14, name : 'First Aid Officer' },
        { value : 15, name : 'Deputy Chief Warden' },
        { value : 16, name : 'Building Warden' },
        { value : 18, name : 'Deputy Building Warden' }
    ];

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        roles : 'frp,trp,users,no_roles',
        impaired : 1,
        type : 'client',
        offset :  0,
        limit : 10,
        archived : 1,
        pagination : true,
        user_training : true,
        users_locations : true,
        search : '',
        online_trainings : true
    };

    multipleLocations = [];

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

    selectedToInvite = [];

    emTrainings = [];

    allAreSelected = false;
    sendInviteToAll = false;
    sendInviteToAllNonCompliant = false;

    isOnlineTrainingAvailable = false;

    constructor(
        private userService : UserService,
        private authService : AuthService,
        private dashboardService : DashboardPreloaderService,
        private encDecrService : EncryptDecryptService,
        private router : Router,
        private courseService : CourseService,
        private accountService : AccountsDataProviderService
        ){
        this.userData = this.authService.getUserData();

        for(let role of this.userData.roles){
            if(role.role_id == 1){
                this.filters.unshift({
                    value : 1, name : 'Building Manager'
                })
            }
        }

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
            this.listData = response.data.users;

            let tempRoles = {};
            
            for(let i in this.listData){
                this.listData[i]['bg_class'] = this.generateRandomBGClass();
                this.listData[i]['id_encrypted'] = this.encDecrService.encrypt(this.listData[i]['user_id']);

                for(let l in this.listData[i]['locations']){
                    if(this.listData[i]['locations'][l]['parent_name'] == null){
                        this.listData[i]['locations'][l]['parent_name'] = '';
                    }

                    this.listData[i]['locations'][l]['enc_location_id'] = this.encDecrService.encrypt( this.listData[i]['locations'][l]['location_id'] );
                }

                for(let r in this.listData[i]['roles']){
                    if( this.listData[i]['roles'][r]['role_name'] ){
                        if( !tempRoles[ this.listData[i]['roles'][r]['role_name'] ] ){
                            tempRoles[ this.listData[i]['roles'][r]['role_name'] ] = this.listData[i]['roles'][r]['role_name'];
                        }
                    }
                }

                this.listData[i]['sendinvitation'] = false;
                let hasEcoRole = false;
                for(let r in this.listData[i]['roles']){
                    if( this.listData[i]['roles'][r]['role_id'] != 1 && this.listData[i]['roles'][r]['role_id'] != 2 ){
                        hasEcoRole = true;
                    }
                }

                if(hasEcoRole){
                    this.listData[i]['sendinvitation'] = true;
                }

                let isSelected = false;
                this.listData[i]['isselected'] = false;
                for(let sel of this.selectedFromList){
                    if(sel.user_id == this.listData[i]['user_id']){
                        this.listData[i]['isselected'] = true;
                        isSelected = true;
                    }
                }

                if(!isSelected && this.allAreSelected){
                    this.listData[i]['isselected'] = true;
                    this.selectedFromList.push(this.listData[i]);
                }

            }

            setTimeout(() => { $('.row.filter-container select.filter-by').material_select('update'); }, 100);

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
                this.pagination.prevPage = 1;
            }

            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            this.dashboardService.hide();
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

        $('#modalMobility select').material_select();

        this.filterByEvent();
        this.sortByEvent();
        this.bulkManageActionEvent();
        this.searchMemberEvent();
        this.clickViewPeepEvent();
    }

    filterByEvent(){
        let __this = this;
        $('select.filter-by').on('change', function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('select.filter-by').val();
            __this.dashboardService.show();
            if(parseInt(selected) != 0){
                __this.queries.roles = selected;
            }else{
                __this.queries.roles = 'frp,trp,users,no_roles';
            }

            __this.pagination = {
                pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
            };

            __this.getListData(() => { 
                if(__this.pagination.pages > 0){
                    __this.pagination.currentPage = 1;
                    __this.pagination.prevPage = 1;
                }

                for(let i = 1; i<=__this.pagination.pages; i++){
                    __this.pagination.selection.push({ 'number' : i });
                }

                __this.dashboardService.hide();
            });
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
        }else if(selected == 'archive'){
            event.target.value = "0";
            this.showModalLoader = false;
            this.selectedToArchive = list;
            event.target.value = 0;
            $('#modalArchive').modal('open');
        }else if(selected == 'peep'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobility').modal('open');
        }else if(selected == 'healthy'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobilityHealty').modal('open');
        }else if(selected == 'invite'){
            this.selectedToInvite = [];
            this.selectedToInvite.push(list);
            event.target.value = 0;
            $('#modalSendInvitation').modal('open');
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
            this.allAreSelected = true;
        }else{
            checkboxes.prop('checked', false);
            this.allAreSelected = false;
            this.selectedFromList = [];
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
            list.isselected = true;
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

        /*let checkboxes = $('table tbody input[type="checkbox"]'),
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
        }*/
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
            paramData['user_id'] = this.selectedPeep['user_id'];

            if(this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                for(let user of this.listData){
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

            let newLists = [];
            for(let user of this.listData){
                if(user.user_id != this.selectedPeep['user_id']){
                    newLists.push(user);
                }
            }
            this.listData = newLists;
  
            $('#modalMobilityHealty').modal('close');
            this.showModalLoader = false;

        });
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

}