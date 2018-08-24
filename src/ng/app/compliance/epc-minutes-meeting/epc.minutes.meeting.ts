import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { ComplianceService } from '../../services/compliance.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { MessageService } from '../../services/messaging.service';
import { Observable } from 'rxjs/Rx';
import { DatepickerOptions } from 'ng2-datepicker';
import * as FileSaver from 'file-saver';

declare var $: any;
declare var moment: any;
declare var Materialize: any;

@Component({
    selector : 'epc-minutes-meeting',
    templateUrl : './epc.minutes.meeting.html',
    styleUrls : [ './epc.minutes.meeting.css' ],
  providers : [AuthService, UserService, ComplianceService, EncryptDecryptService]
})
export class EpcMinutesMeetingComponent implements OnInit, OnDestroy{
    @ViewChild('checkboxEpcMeething12Months') checkboxEpcMeething12Months : ElementRef;
    @ViewChild('formEPC') formEPC : NgForm;

    userData = {};

    options: DatepickerOptions = {
        displayFormat: 'YYYY-MM-DD',
        minDate: moment().toDate()
    };

    dateOfEvacServicesObj = {
        model : <Date> {},
        showPicker : false,
        formatted : '',
        options : {
            displayFormat: 'DD/MM/YYYY',
            minDate: moment().toDate()
        },
        onChangeEvent : (event) => {
            if(!moment(this.dateOfEvacServicesObj.model).isValid()){
                this.dateOfEvacServicesObj.model = new Date();
                this.dateOfEvacServicesObj.formatted = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
            }else{
                this.dateOfEvacServicesObj.formatted  = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
            }

            this.dateOfEvacServicesObj.showPicker = false;
        },
        showDatePicker : () => {
            this.dateOfEvacServicesObj.showPicker = true;
        }
    };

    lastEpcMeetingObj = {
        model : <Date> {},
        showPicker : false,
        formatted : '',
        options : {
            displayFormat: 'DD/MM/YYYY',
            minDate: moment().toDate()
        },
        onChangeEvent : (event) => {
            if(!moment(this.lastEpcMeetingObj.model).isValid()){
                this.lastEpcMeetingObj.model = new Date();
                this.lastEpcMeetingObj.formatted = moment(this.lastEpcMeetingObj.model).format('DD/MM/YYYY');
            }else{
                this.lastEpcMeetingObj.formatted  = moment(this.lastEpcMeetingObj.model).format('DD/MM/YYYY');
            }

            this.lastEpcMeetingObj.showPicker = false;
        },
        showDatePicker : () => {
            this.lastEpcMeetingObj.showPicker = true;
        }
    };

    attendies = [];

    showEPCform = false;

    epcMeetingMinutesQuestions = {

        'review the eco and discuss any requirements to replace personnel' : {
            action : '', bywho : '', bywhen : ''
        },
        'update site contacts including new tenants' : {
            action : '', bywho : '', bywhen : ''
        },
        'movement of tenants since last meeting, both arriving and leaving' : {
            action : '', bywho : '', bywhen : ''
        },
        'has there been any alarms, fires, bomb threats or external emergencies etc' : {
            action : '', bywho : '', bywhen : ''
        },
        'review the emergency procedures for the site and confirm they are suitable' : {
            action : '', bywho : '', bywhen : ''
        },
        'document any upcoming construction and/or refurbishment work and their likely date of completion' : {
            action : '', bywho : '', bywhen : ''
        },
        'review the previous ECO training & evacuation exercise and discuss any improvements' : {
            action : '', bywho : '', bywhen : ''
        },
        'discuss any feedback from Wardens regarding the emergency procedures' : {
            action : '', bywho : '', bywhen : ''
        },
        'confirm scheduled dates for next training and possible scenarios for the next evacuation exercise' : {
            action : '', bywho : '', bywhen : ''
        },
        'tenant compliance program' : {
            action : '', bywho : '', bywhen : ''
        }

    };

    epc_meeting_minutes_id = 0;

    epcMeetingMinutesQuestionsArray = [];

    formSubmitted = false;
    formSuccess = false;

    locationID = 0;
    msgSubs;
    epcFormCallBackSuccess;

    constructor(
        private router : Router,
        private route: ActivatedRoute,
        private authService : AuthService,
        private userService: UserService,
        private complianceService : ComplianceService,
        private encryptDecrypt : EncryptDecryptService,
        private messageService : MessageService
        ){

        this.userData = this.authService.getUserData();

        this.setDatePickerDefaultDate();

        for(let i=0; i<=9; i++){
            this.attendies.push({
                name : '', company : ''
            });
        }

        for(let i in this.epcMeetingMinutesQuestions){
            this.epcMeetingMinutesQuestionsArray.push({
                'question' : i,
                'action' : this.epcMeetingMinutesQuestions[i]['action'],
                'bywho' : this.epcMeetingMinutesQuestions[i]['bywho'],
                'bywhen' : this.epcMeetingMinutesQuestions[i]['bywhen']
            });
        }

        this.msgSubs = this.messageService.getMessage().subscribe((message) => {
            if(message.locationId){
                this.locationID = message.locationId;
            }
            if(message.epcData && message.epcData['data']){
                this.attendies = message.epcData.data.attendies;
                for(let i in this.epcMeetingMinutesQuestionsArray){
                    if(message.epcData.data.questionnaires[ this.epcMeetingMinutesQuestionsArray[i]['question']  ]){
                        this.epcMeetingMinutesQuestionsArray[i] = {
                            'question' : this.epcMeetingMinutesQuestionsArray[i]['question'],
                            'action' : message.epcData.data.questionnaires[ this.epcMeetingMinutesQuestionsArray[i]['question']  ]['action'],
                            'bywho' : message.epcData.data.questionnaires[ this.epcMeetingMinutesQuestionsArray[i]['question']  ]['bywho'],
                            'bywhen' : message.epcData.data.questionnaires[ this.epcMeetingMinutesQuestionsArray[i]['question']  ]['bywhen']
                        }
                    }
                }
                
                for(let i in message.epcData.data){
                    if(this.formEPC.controls[i]){
                        if(i == 'date_evacservices_attendance'){
                            this.dateOfEvacServicesObj.model = moment(message.epcData.data.date_evacservices_attendance, ['DD/MM/YYYY']).toDate();
                            this.dateOfEvacServicesObj.formatted = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
                        }else if(i == 'last_epc_meeting_date'){
                            this.lastEpcMeetingObj.model = moment(message.epcData.data.last_epc_meeting_date, ['DD/MM/YYYY']).toDate();
                            this.lastEpcMeetingObj.formatted = moment(this.lastEpcMeetingObj.model).format('DD/MM/YYYY');
                        }else{
                            this.formEPC.controls[i].setValue(message.epcData.data[i]);
                        }
                    }
                }

                this.epc_meeting_minutes_id = message.epcData.epc_meeting_minutes_id;

                setTimeout(() => {
                    Materialize.updateTextFields();
                }, 500);
            }

            if(message.epcFormCallBackSuccess){
                this.epcFormCallBackSuccess = message.epcFormCallBackSuccess;
            }
        });

        this.messageService.sendMessage({
            'getLocationId' : true
        });

    }

    setDatePickerDefaultDate(){
        this.dateOfEvacServicesObj.model = new Date();
        this.dateOfEvacServicesObj.formatted = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');

        this.lastEpcMeetingObj.model = new Date();
        this.lastEpcMeetingObj.formatted = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
    }

    addAttendies(){
        this.attendies.push({
            name : '', company : ''
        });
    }

    cancelEpcForm(){

        console.log(this.messageService);

        this.messageService.sendMessage({
            'epcform' : 'hide'
        });
    }

    submitEPCform(formEPC){
        if(formEPC.valid){

            let formValue = JSON.parse(JSON.stringify(formEPC.value));

            formValue['has_epc_meeting_within_12_months'] = (formValue['has_epc_meeting_within_12_months']) ? true : false;
            formValue['attendies'] = this.attendies;
            
            
            for(let i in this.epcMeetingMinutesQuestionsArray){
                if( this.epcMeetingMinutesQuestions[  this.epcMeetingMinutesQuestionsArray[i]['question']   ] ){
                    this.epcMeetingMinutesQuestions[  this.epcMeetingMinutesQuestionsArray[i]['question']   ]['action'] = this.epcMeetingMinutesQuestionsArray[i]['action'];
                    this.epcMeetingMinutesQuestions[  this.epcMeetingMinutesQuestionsArray[i]['question']   ]['bywho'] = this.epcMeetingMinutesQuestionsArray[i]['bywho'];
                    this.epcMeetingMinutesQuestions[  this.epcMeetingMinutesQuestionsArray[i]['question']   ]['bywhen'] = this.epcMeetingMinutesQuestionsArray[i]['bywhen'];
                }
            }
            formValue['questionnaires'] = this.epcMeetingMinutesQuestions;

            this.formSubmitted = true;

            this.complianceService.saveEpcMinutesMeeting({
                'data' : formValue,
                'account_id' : this.userData['accountId'],
                'location_id' : this.locationID,
                'id' : this.epc_meeting_minutes_id
            }, (response) => {
                console.log(response);
                this.formSubmitted = false;
                this.formSuccess = true;

                if(this.epcFormCallBackSuccess){
                    this.epcFormCallBackSuccess();
                }

                setTimeout(() => {
                    this.formSuccess = false;
                }, 500);
            });
        }
    }

    ngOnInit(){}

    ngOnDestroy(){}

}