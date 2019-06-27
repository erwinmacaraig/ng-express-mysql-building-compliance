import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { LocationsService } from './../../services/locations';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AccountsDataProviderService  } from '../../services/accounts';
import { CourseService } from '../../services/course';
import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { DatepickerOptions } from 'ng2-datepicker';

declare var $: any;
@Component({
    selector: 'app-teams-list-warden',
    templateUrl: './list.wardens.component.html',
    styleUrls: ['./list.wardens.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService, AccountsDataProviderService, CourseService]
})
export class ListWardensComponent implements OnInit, OnDestroy {
    public wardenArr = <any>[];

    public myWardenTeam = [];
    private wardenTeamMembers = [];
    copyOfList = [];
    userData = <any> {};
    showModalLoader = false;
    selectedToArchive = {
        first_name : '', last_name : '', parent_data : {},  locations : [], parent_name: '', name: ''
    };
    selectedFromList = [];

    filters = [
        { value : 9, name : 'Warden' },
        { value : 10, name : 'Floor / Area Warden' },
        { value : 11, name : 'Chief Warden' },
        { value : 15, name : 'Deputy Chief Warden' },
        { value : 16, name : 'Building Warden' },
        { value : 18, name : 'Deputy Building Warden' }
    ];

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage: 0, selection : []
    };

    queries = {
        roles : 'users,no_gen_occ',
        impaired : -1,
        type : 'client',
        offset :  0,
        limit : 10,
        archived : 0,
        pagination : true,
        user_training : true,
        users_locations : true,
        search : '',
        location_id : 0
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
    selectedPeep = {name: ''};

    selectedToInvite = [];

    emTrainings = [];

    allAreSelected = false;
    sendInviteToAll = false;
    sendInviteToAllNonCompliant = false;

    isOnlineTrainingAvailable = false;

    isFRP = false;
    locations = <any> [];
    locationPagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    locationQueries = {
        offset :  0,
        limit : 20,
        search : '',
        sort : '',
        archived : 0,
        showparentonly: false,
        parent_id : 0
    };

    subscriptionType = 'free';

    constructor(
        private authService : AuthService,
        private router : Router,
        private userService : UserService,
        public encDecrService : EncryptDecryptService,
        private dataProvider: PersonDataProviderService,
        private dashboardService : DashboardPreloaderService,
        private locationService: LocationsService,
        private courseService : CourseService,
        private accountService : AccountsDataProviderService
    ) {

        this.userData = this.authService.getUserData();        
        for(let role of this.userData.roles){
            if(role.role_id == 1){
                this.isFRP = true;
            }
        }
        if (this.authService.userDataItem('confirmation_process')) {
            this.authService.setUserDataItem('confirmation_process', false);
            this.authService.setUserDataItem('confirmation_process_role', null);
        }
        

        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
        
        
    }

    ngOnInit(){
        this.subscriptionType = this.userData['subscription']['subscription_type'];
        if (this.userData['account_has_online_training'] == 1) {
            this.isOnlineTrainingAvailable = true;
        }
        
        this.dashboardService.show();     
        this.listWardens();
        setTimeout(() => {
            $('.row.filter-container select.filter-by').material_select('update');
            $('.row.filter-container select').material_select();
        }, 100);
        
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });
        $('#modalMobility select').material_select();
        this.filterByEvent();
        this.locationChangeEvent();
        //this.sortByEvent();
        //this.dashboardService.show();
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
            this.allAreSelected = true;
        }else{
            checkboxes.prop('checked', false);
            this.allAreSelected = false;
            this.selectedFromList = [];
        }

        checkboxes.each((indx, elem) => {
            let id = $(elem).attr('id'),
            index = id.replace('location-', '');
            for(let i in this.myWardenTeam){
                if(i == index){
                    this.singleCheckboxChangeEvent(this.myWardenTeam[i], { target : { checked : elem.checked } } );
                }
            }
        });
    }

    locationChangeEvent(){
        let __this = this;
        $('select.location').on('change', function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('select.location').val();
            __this.dashboardService.show();
            __this.myWardenTeam = [];
            const choosen = [];
            if(parseInt(selected, 10) == 0) {
                __this.myWardenTeam = __this.wardenTeamMembers;
            } else {
                for (let warden of __this.wardenTeamMembers) {
                    if (parseInt(warden['building_id'], 10) == parseInt(selected, 10)) {
                        __this.myWardenTeam.push(warden);
                    }
                }
            }
            __this.dashboardService.hide();
         
        });
    }

    filterByEvent(){
        let __this = this;
        $('#filter-roles').change(function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('#filter-roles').val();
            console.log(selected);
            __this.myWardenTeam = [];
            const choosen = [];
            
            if(parseInt(selected, 10) == 0) {
                __this.myWardenTeam = __this.wardenTeamMembers;
            } else {
                for (let warden of __this.wardenTeamMembers) {
                    if (warden['role_ids'].indexOf(parseInt(selected, 10)) !== -1) {
                        choosen.push(warden['location_id']);
                        __this.myWardenTeam.push(warden);                        
                    }
                }
            }
        });    
    }

    sortByEvent(){
        $('select.sort-by').on('change', () => {
            let selected = $('select.sort-by').val();

            if(selected == 'user-name-asc'){
                this.myWardenTeam.sort((a, b) => {
                    if(a.first_name < b.first_name) return -1;
                    if(a.first_name > b.first_name) return 1;
                    return 0;
                });
            }else if(selected == 'user-name-desc'){
                this.myWardenTeam.sort((a, b) => {
                    if(a.first_name > b.first_name) return -1;
                    if(a.first_name < b.first_name) return 1;
                    return 0;
                });
            }else{
                this.myWardenTeam = this.copyOfList;
            }
        });
    }

    searchMemberEvent(){
        this.searchMemberInput = Rx.Observable.fromEvent(document.querySelector('#searchMemberInput'), 'input');
        this.searchMemberInput.debounceTime(800)
            .map(event => event.target.value)
            .subscribe((value) => {
                this.myWardenTeam = [];
                const choosen = [];
                if (value.length == 0) {
                 this.myWardenTeam = this.wardenTeamMembers;   
                } else {
                    let searchKey = value.toLowerCase();
                    for (let user of this.wardenTeamMembers) {
                        if (user['name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(user['location_id']);
                            this.myWardenTeam.push(user);
                        }
                    }
                }
            });
    }

    onSelectFromTable(event, warden){
        let selected = event.target.value;
        if(selected == 'view'){
            this.router.navigate(["/teams/view-user/", warden.id_encrypted]);
        }else if(selected == 'peep'){
            this.selectedPeep = warden;
            event.target.value = 0;
            $('#modalMobility').modal('open');
        }else if(selected == 'healthy'){
            this.selectedPeep = warden;
            event.target.value = 0;
            $('#modalMobilityHealty').modal('open');
        }else if(selected == 'invite'){
            this.selectedToInvite = [];
            this.selectedToInvite.push(warden);
            event.target.value = 0;
            $('#modalSendInvitation').modal('open');
        }else if(selected == 'archive'){
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
        if(event.target.checked){
            list.isselected = true;
            this.selectedFromList.push(list);
            console.log(this.selectedFromList);
        }else{
            let temp = [];
            for(let i in this.selectedFromList){
                if(this.selectedFromList[i]['user_id'] != list['user_id']){
                    temp.push( this.selectedFromList[i] );
                }
            }
            this.selectedFromList = temp;
        }
       
    }

    bulkManageActionEvent(){
        $('select.bulk-manage').on('change', () => {
            let sel = $('select.bulk-manage').val();
            console.log(sel);
            if(sel == 'archive'){
                if(this.selectedFromList.length > 0){
                    $('#modalArchiveBulk').modal('open');
                }
            }else if(sel == 'invite-selected'){
                if(!this.allAreSelected){
                    this.selectedToInvite = [];
                    for(let user of this.selectedFromList){
                        this.selectedToInvite.push(user);
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

            if(this.selectedPeep['mobility_impaired_details'] && this.selectedPeep['mobility_impaired_details'].length > 0) {
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                for(let user of this.myWardenTeam){
                    if(user['user_id'] == this.selectedPeep['user_id']){
                        user['mobility_impaired'] = 1;
                        user['mobility_impaired_details'] = response.data;
                    }
                }

                f.reset();
                $('#modalMobility').modal('close');
                this.showModalLoader = false;
                this.ngOnInit();

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

            for(let user of this.myWardenTeam){
                if(user['user_id'] == this.selectedPeep['user_id']){
                    user['mobility_impaired'] = 0;
                    user['mobility_impaired_details'] = [];
                }
            }
  
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
            $('#trainingInviteResult').modal('open');
            for(let i in this.myWardenTeam){
                for(let sel of this.selectedFromList){
                    if(sel.user_id == this.myWardenTeam[i]['user_id']){
                        this.myWardenTeam[i]['isselected'] = false;                        
                    }
                }
            }  
        });
    }

    ngOnDestroy(){}


    private listWardens() {
        this.myWardenTeam = [];
        this.wardenTeamMembers = [];
        this.accountService.generateMyWardenList().subscribe((response) => {
            this.loadingTable = true;
            for (let warden of response.warden) {
                warden['id_encrypted'] = this.encDecrService.encrypt(warden['user_id']);
                warden['enc_location_id'] = this.encDecrService.encrypt(warden['location_id']);
                warden['isselected'] = false;
                this.myWardenTeam.push(warden);
                this.wardenTeamMembers.push(warden);
            }
            this.locations = response.buildings;
            this.loadingTable = false;
            setTimeout(() => {
                $('.row.filter-container select.location').material_select('update');
            }, 100);
            this.dashboardService.hide();
        }, (error) => {
            this.loadingTable = false;
            this.dashboardService.hide();
        });
    }
}
