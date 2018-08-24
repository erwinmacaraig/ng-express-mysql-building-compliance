import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { AdminService } from '../services/admin.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { AccountsDataProviderService } from '../services/accounts';
import { DashboardPreloaderService } from '../services/dashboard.preloader';
import { UserService } from '../services/users';
import { LocationsService } from '../services/locations';
import { HttpParams, HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { DatepickerOptions } from 'ng2-datepicker';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
    selector: 'app-peep-form',
    templateUrl: './peep.form.html',
    styleUrls: ['./peep.form.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, UserService, AdminService, LocationsService]
})
export class PeepFormComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('formMobility') formMobility: NgForm;
    @ViewChild('durationDate') durationDate: ElementRef;
    options: DatepickerOptions = {
        displayFormat: 'MMM D[,] YYYY',
        minDate: moment().toDate()
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    sub;
    user = <any> {
        user_id: 0, first_name : '', last_name : ''
    };
    encryptedId = '';
    forModalDisplay = false;
    showModalLoader = false;
    paramDest = '';

    constructor(
        private encryptDecrypt: EncryptDecryptService,
        private accountsDataService: AccountsDataProviderService,
        private dashboardPreloaderService: DashboardPreloaderService,
        private userService: UserService,
        private adminService: AdminService,
        private locationsService: LocationsService,
        private route: ActivatedRoute,
        private router: Router
        ){

        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    }

    ngOnInit(){

        console.log( this.encryptDecrypt.encrypt("21517") );

        this.sub = this.route.queryParams.subscribe(params => {
            if(params['formodal']=='true'){
                this.forModalDisplay = true;
            }

            if(params['dest']){
                this.paramDest = params['dest'];
            }

            if(params["id"]){
                this.encryptedId = params["id"];
                this.user.user_id = this.encryptDecrypt.decrypt(this.encryptedId);

                this.userService.getUserLocationTrainingsEcoRoles(this.user.user_id, (response) => {
                    this.user = response.data.user;
                    
                    if(this.user.mobility_impaired_details){
                        if(this.user.mobility_impaired_details.length > 0){

                            if(Object.keys(this.formMobility.controls).length > 0){
                                this.formMobility.controls.is_permanent.setValue(this.user.mobility_impaired_details[0]['is_permanent']);
                                this.formMobility.controls.assistant_type.setValue(this.user.mobility_impaired_details[0]['assistant_type']);
                                this.formMobility.controls.equipment_type.setValue(this.user.mobility_impaired_details[0]['equipment_type']);
                                this.formMobility.controls.evacuation_procedure.setValue(this.user.mobility_impaired_details[0]['evacuation_procedure']);

                                if(this.user.mobility_impaired_details[0]['is_permanent']==0){
                                    this.datepickerModel = moment(this.user.mobility_impaired_details[0]['duration_date']).toDate();
                                    this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
                                }

                                $('select[name="is_permanent"]').trigger('change');
                            }

                        }
                    }
                })
            }
        });
    }

    ngAfterViewInit(){
        
        $('select[name="is_permanent"]').material_select();
        $('.modal').modal({
            dismissible: false
        });

        $('select[name="is_permanent"]').off('change').on('change', () => {
            if($('select[name="is_permanent"]').val() == '1'){
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

            $('select[name="is_permanent"]').material_select();
        });
    }

    showDatePicker(){
        this.isShowDatepicker = true;
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

    modalPeepFormSubmit(f, event){
        event.preventDefault();

        if(f.valid){
            let paramData = JSON.parse(JSON.stringify(f.value));
            paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
            paramData['user_id'] = this.user['user_id'];

            if(this.user['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.user['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }

            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

            this.showModalLoader = true;
            this.userService.sendMobilityImpaireInformation(paramData, (response) => { 
                this.showModalLoader = false;
            });
        }
    }

    cancelForm(){
        if(this.paramDest.length > 0){
            this.router.navigate([this.paramDest]);
        }
    }

    ngOnDestroy(){
        this.sub.unsubscribe();
    }

}