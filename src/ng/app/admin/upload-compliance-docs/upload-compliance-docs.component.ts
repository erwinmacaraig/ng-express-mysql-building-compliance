import { Observable } from 'rxjs/Observable';
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';

import { AdminService } from './../../services/admin.service';
declare var moment: any;
@Component({
  selector: 'app-admin-compliance-doc-upload',
  templateUrl: './upload-compliance-docs.component.html',
  styleUrls: ['./upload-compliance-docs.component.css'],
  providers: [AdminService]
})

export class UploadComplianceDocComponent implements OnInit, AfterViewInit {
  title = 'This is a simple upload.';
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
  accountField = new FormControl();
  locationField = new FormControl();
  selectedAccount: number = 0;
  selectedLocation: number = 0;
  accountLocations = [];
  filteredList = [];
  accountList = [];
  accntSub: Subscription;

  
  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD',
    minDate: moment().toDate()
  };
  validTillDate = '';
  datepickerModel: Date;
  datepickerModelFormatted = '';
  isShowDatepicker = true;

  constructor(public http: HttpClient, platformLocation: PlatformLocation, public adminService: AdminService) {
    this.baseUrl = (platformLocation as any).location.origin;
    this.setDatePickerDefaultDate();
  }

  ngOnInit() {
    this.documentType = new FormControl(null, Validators.required);
    this.accntSub = this.getAccountChanges();
  }

  getAccountSelection(accountId: number = 0, accountName = '') {
    this.accntSub.unsubscribe();
    console.log(accountId);
    this.selectedAccount = accountId;

    this.accountField.setValue(accountName);
    this.filteredList = [];
    this.getAccountLocations();
    this.accntSub = this.getAccountChanges();

  }

  ngAfterViewInit() {

  }
  cancel() {
    this.progress = 0;
    if ( this.httpEmitter ) {
      console.log('cancelled');
      this.httpEmitter.unsubscribe();
    }
  }

  uploadFiles(files: File[]): Subscription {
    this.sendableFormData.append('account_id', '5');
    this.sendableFormData.append('building_id', '62');
    this.sendableFormData.append('compliance_kpis_id', '2');
    this.sendableFormData.append('viewable_by_trp', '1');

    this.sendableFormData.append('date_of_activity', '2018-06-01');
    this.sendableFormData.append('description', 'Manual Entry');
    const req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`, this.sendableFormData, {
      reportProgress: true
    });

    return this.httpEmitter = this.http.request(req)
    .subscribe(
      event => {
        this.httpEvent = event;

        if (event instanceof HttpResponse) {
          delete this.httpEmitter;
          console.log('request done', event);
        }
      },
      error => console.log('Error Uploading', error)
    );
  }
  getDate() {
    return new Date();
  }

  getAccountChanges(): Subscription {
    return this.accountField.valueChanges.debounceTime(350).subscribe((value) => {
      if (value.length > 0) {
        this.adminService.getAccountListingForAdmin(0, value).subscribe((response) => {
          this.filteredList = Object.keys(response['data']['list']).map((key) => {
            return response['data']['list'][key];
          });
        });
        console.log(this.filteredList);
      } else {
        this.filteredList = [];
      }
    });
  }

  getAccountLocations(): Subscription {
    return this.adminService.taggedLocationsOnAccount(this.selectedAccount).subscribe((response) => {
      this.accountLocations = response['data'];
      console.log(this.accountLocations);
    });
  }

  setDatePickerDefaultDate() {
    this.datepickerModel = moment().add(1, 'days').toDate();
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
    this.validTillDate = moment(this.datepickerModel).add(12, 'months').format('YYYY-MM-DD');
    this.isShowDatepicker = false;
  }

   showDatePicker() {
    this.isShowDatepicker = true;
  }
}
