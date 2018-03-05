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

declare var $: any;
@Component({
    selector: 'app-mobility-impaired',
    templateUrl: './mobility.impaired.component.html',
    styleUrls: ['./mobility.impaired.component.css'],
    providers : [EncryptDecryptService, UserService, DashboardPreloaderService],
    host: {
        '(document:click)': 'onClick($event)'
    }
})
export class MobilityImpairedComponent implements OnInit, OnDestroy {
    public peepList = <any>[];
    @ViewChild("durationDate") durationDate: ElementRef;
    @ViewChild("formMobility") formMobility: NgForm;

    copyOfList = [];
    userData = {};
    showModalLoader = false;
    selectedToArchive = {
        first_name : '', last_name : '', parent_data : {}, locations : []
    };
    selectedFromList = [];

    options: DatepickerOptions = {
        locale: enLocale,
        displayFormat: 'MMM D[,] YYYY',
        minDate: new Date(Date.now()),
        maxDate: new Date(Date.now())
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    selectedPeep = {};

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

    ngOnInit(){
        this.dataProvider.buildPeepList().subscribe((response) => {

            let tempRoles = {},
                peep = response['data'];
            for(let i in peep){
                peep[i]['bg_class'] = this.generateRandomBGClass();
                if(peep[i]['user_id']){
                    peep[i]['id_encrypted'] = this.encDecrService.encrypt(peep[i]['user_id']).toString();
                    peep[i]['last_login'] = moment(peep[i]['last_login']).format('MMM. DD, YYYY hh:mmA');
                }
            }
            this.peepList = peep;
            this.copyOfList = JSON.parse(JSON.stringify(peep));

            setTimeout(() => {
                $('.row.filter-container select').material_select();
                this.dashboardService.hide();
            }, 500);
        }, (err: HttpErrorResponse) => {});
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });

        $('select').material_select();
        this.filterByEvent();
        this.sortByEvent();
        this.bulkManageActionEvent();

        $('#modalMobility select[name="is_permanent"]').on('change', () => {
            if($('#modalMobility select[name="is_permanent"]').val() == '1'){
                this.isShowDatepicker = false;
                $('#durationDate').prop('disabled', true);
            }else{
                $('#durationDate').prop('disabled', false);
            }
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

    searchMemberEvent(event){
        let key = event.target.value,
        temp = [];

        if(key.length == 0){
            this.peepList = this.copyOfList;
        }else{
            for(let i in this.copyOfList){
                let name = (this.copyOfList[i]['first_name']+' '+this.copyOfList[i]['last_name']).toLowerCase(),
                    email = this.copyOfList[i]['email'];
                if(name.indexOf(key) > -1 || email.indexOf(key) > -1){
                    temp.push( this.copyOfList[i] );
                }
            }
            this.peepList = temp;
        }
    }

    ngOnDestroy(){}

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

    archiveClick(){
        this.showModalLoader = true;
        this.userService.archiveUsers([this.selectedToArchive['user_id']], (response) => {
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
            if(list.user_id){
                this.selectedFromList.push(list);
            }
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
            this.showModalLoader = false;
            $('#modalArchiveBulk').modal('close');
            this.dashboardService.show();
            this.ngOnInit();
        });
    }

    clickShowPeepInfo(peep){
        for(let i in peep['mobility_impaired_details'][0]){
            if( this.formMobility.controls[i] ){
                this.formMobility.controls[i].setValue(peep['mobility_impaired_details'][0][i]);
            }
        }

        this.datepickerModel = moment(peep['mobility_impaired_details'][0]['duration_date'], ['YYYY-MM-DD']).toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

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
            paramData['user_id'] = this.selectedPeep['user_id'];
            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val()

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                this.ngOnInit();
                f.reset();
                $('#modalMobility').modal('close');
                this.showModalLoader = false;

            });
        }
    }
}
