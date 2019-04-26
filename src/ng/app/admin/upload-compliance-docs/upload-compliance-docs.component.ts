import { Observable } from 'rxjs/Observable';
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../../environments/environment';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';
import { Router} from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

import { AdminService } from './../../services/admin.service';
import { AlertService } from './../../services/alert.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var moment: any;
@Component({
    selector: 'app-admin-compliance-doc-upload',
    templateUrl: './upload-compliance-docs.component.html',
    styleUrls: ['./upload-compliance-docs.component.css'],
    providers: [AdminService, EncryptDecryptService, DashboardPreloaderService, AlertService ]
})

export class UploadComplianceDocComponent implements OnInit, AfterViewInit {
    accept = '*';
    files: File[] = [];
    progress: number;
    hasBaseDropZoneOver: boolean = false;
    httpEmitter: Subscription;
    // httpEvent: HttpEvent<Event>;
    httpEvent: any;
    lastFileAt: Date;
    private baseUrl: String;
    sendableFormData: FormData;

    docomentInfoForm: FormGroup;
    documentType: FormControl;
    accountField = new FormControl(null, Validators.required);
    locationField = new FormControl(null, Validators.required);
    accessType: FormControl;
    selectedAccount: number = 0;
    selectedLocation: number = 0;
    accountLocations = [];
    filteredList = [];
    accountList = [];
    accntSub: Subscription;
    dtActivityField = new FormControl(null, Validators.required);
    kpis: object = {};
    kpisArrayForDisplay = [];
    options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
    };
    validTillDate = '';
    datepickerModel: Date;
    datepickerModelFormatted = '';
    isShowDatepicker = false;

    maxSize: any;
    lastInvalids: any;
    baseDropValid: any;
    dragFiles: any;
    invalidsFiles = [];

    documentTypeValue = "0";

    constructor(
        public http: HttpClient,
        public encryptDecrypt: EncryptDecryptService,
        public router: Router,
        platformLocation: PlatformLocation,
        public adminService: AdminService,
        public dashboard: DashboardPreloaderService,
        private alertService: AlertService)
    {
        this.baseUrl = environment.backendUrl;
        this.setDatePickerDefaultDate();
    }

    ngOnInit() {
        this.dashboard.show();
        this.accessType = new FormControl(null, Validators.required);
        this.documentType = new FormControl(null, Validators.required);
        this.dtActivityField.setValue(this.datepickerModelFormatted);
        this.accntSub = this.getAccountChanges();
        this.adminService.getKPIS().subscribe((response) => {
            this.kpis = response['data'];
            for (const k of response['data']) {
                if (k['has_primary_document'] == 1) {
                    this.kpisArrayForDisplay.push(k);
                }
            }
            // console.log(this.kpisArrayForDisplay);
            this.dashboard.hide();
        });
    }

    getAccountSelection(accountId: number = 0, accountName = '') {
        this.accntSub.unsubscribe();
        // console.log(accountId);
        this.selectedAccount = accountId;
        this.accountField.setValue(accountName);
        this.filteredList = [];
        this.getAccountLocations();
        this.accntSub = this.getAccountChanges();
    }

    ngAfterViewInit() {
        $('.workspace.container').css('margin-bottom', '20%');
        $('.workspace.container').css('overflow', '');
    }

    cancel() {
        this.progress = 0;
        if ( this.httpEmitter ) {
            console.log('cancelled');
            this.httpEmitter.unsubscribe();
        }
    }

    uploadFiles(files: File[]): Subscription {
        let req;
        this.accntSub.unsubscribe();
        const myForm = new FormData();
        this.dashboard.show();
        if (parseInt(this.documentType.value, 10) !== 5) {
            /*
            for (const f of files) {
                myForm.append('file', f, f.name);                
            }
            myForm.append('account_id', this.selectedAccount.toString());
            myForm.append('building_id', this.locationField.value);
            myForm.append('compliance_kpis_id', this.documentType.value);
            myForm.append('document_type', this.accessType.value);
            myForm.append('viewable_by_trp', '1');
            myForm.append('date_of_activity', this.dtActivityField.value);
            myForm.append('description', 'Uploaded By Admin');
            myForm.append('override_document', '-1');

            
            console.log(this.sendableFormData.get('files'));
            console.log(files);
            console.log(myForm);
            req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`, myForm, {
                reportProgress: true
            });
            */
           this.sendableFormData.append('account_id', this.selectedAccount.toString());
           this.sendableFormData.append('building_id', this.locationField.value);
           this.sendableFormData.append('compliance_kpis_id', this.documentType.value);
           this.sendableFormData.append('document_type', this.accessType.value);
           this.sendableFormData.append('viewable_by_trp', '1');
           this.sendableFormData.append('date_of_activity', this.dtActivityField.value);
           this.sendableFormData.append('description', 'Uploaded By Admin');
           this.sendableFormData.append('override_document', '-1');
            req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`,this.sendableFormData, {
                reportProgress: true
           });

        } else {
            // console.log(this.sendableFormData.get('files'));
            req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance/evac-diagrams/`, this.sendableFormData, {
                reportProgress: true
            });
        }

        return this.httpEmitter = this.http.request(req).subscribe(
            event => {
                this.httpEvent = event;
                
                if (event instanceof HttpResponse) {
                    delete this.httpEmitter;                    
                    console.log('request done', event);
                    this.dashboard.hide();
                    if(this.documentType.value == 5){
                        let body = <any> event.body;
                        this.files = [];
                        this.invalidsFiles = [];

                        this.invalidsFiles.push( { name : 'Fail to upload' } );
                        for(let i in body.errorMsgs){
                            this.invalidsFiles.push( { name : body.rejected[i]+' ('+body.errorMsgs[i]+')' } );
                        }

                        if(body.rejected.length == 0){
                            this.alertService.info('Files successfully uploaded', true); 
                            this.invalidsFiles = [];                           
                        }
                    }else{
                        this.files = [];
                        this.alertService.info('Files successfully uploaded', true);
                        setTimeout(() => {
                            this.router.navigate(['/admin', 'view-location-compliance', this.selectedAccount.toString(),
                                 this.locationField.value, this.documentType.value]);
                        }, 3000);
                        /*
                        this.router.navigate(['/admin', 'view-location-compliance', this.selectedAccount.toString(),
                                 this.locationField.value, this.documentType.value]);
                                 */
                        
                    }



                }
            },
            error => {
                console.log('Error Uploading', error);
                this.dashboard.hide();
            }
        );
    }

    getDate() {
        return new Date();
    }

    getAccountChanges(): Subscription {
        return this.accountField.valueChanges.debounceTime(350).subscribe((value) => {
            if (value != null && value.length > 0) {
                this.adminService.getAccountListingForAdmin(0, value).subscribe((response) => {
                    this.filteredList = Object.keys(response['data']['list']).map((key) => {
                        return response['data']['list'][key];
                    });
                });
            } else {
                this.filteredList = [];
            }
        });
    }

    getAccountLocations(): Subscription {
        this.accountLocations = [];
        return this.adminService.taggedLocationsOnAccount(this.selectedAccount).subscribe((response) => {
            this.accountLocations = response['data'];
            console.log(response['data']);
        });
    }

    setDatePickerDefaultDate() {
        // this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModel = moment().toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        this.validTillDate = moment(this.datepickerModel).add(1, 'years').format('YYYY-MM-DD');
    }

    onChangeDatePicker(event) {
        if (!moment(this.datepickerModel).isValid()){
            this.datepickerModel = new Date();
            this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        } else {
            this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        }

        this.validTillDate = moment(this.datepickerModel)
        .add(this.kpis[this.documentType.value]['validity_in_months'], 'months')
        .format('YYYY-MM-DD');
        this.dtActivityField.setValue(this.datepickerModelFormatted);
        this.isShowDatepicker = false;
    }

    showDatePicker() {
        this.isShowDatepicker = true;
    }

    selectDocumentEvent(event){
        let val = event.target.value;
        if(this.documentTypeValue != val){
            this.files = [];
            this.invalidsFiles = [];
        }
    }

    fileChange(files){

        if(this.documentType.value == 5){
            let validfiles = [],
                invalids = [],
                dateStrLen = 0;
            for(let i in files){
                let name = files[i]['name'],
                    split = name.split(/\s+/);

                console.log(split);
                // check last part if valid date format
                dateStrLen = (split[split.length - 1]).lastIndexOf('.');
                console.log(dateStrLen);
                if (dateStrLen != 8) {
                    invalids.push(files[i]);
                    continue;
                }
                if (!this.isDateValid((split[split.length - 1]).substring(0,8))) {
                    invalids.push(files[i]);
                    continue;
                }
                if (split.length >= 4 && split.length <= 5){
                    validfiles.push(files[i]);
                } else{
                    invalids.push(files[i]);
                }
            }

            this.invalidsFiles = invalids;

            this.files = validfiles;
        }

    }

    private isDateValid(dateStr=''): boolean {
        console.log(dateStr);
        let day = parseInt(dateStr.substring(0, 2), 10),
        month = +dateStr.substring(2, 4),
        year = +dateStr.substring(4, 8);

        if (month < 1 || month > 12) { // check month range
            return false;
        }
        if (day < 1 || day > 31) {
            return false;
        }
        if ((month === 4 || month === 6 || month === 9 || month === 11) && day === 31) {
            return false;
        }
        if (month == 2) { // check for february 29th
            var isleap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
            if (day > 29 || (day === 29 && !isleap)) {
                return false;
            }
        }                

        return true;
    }
}
