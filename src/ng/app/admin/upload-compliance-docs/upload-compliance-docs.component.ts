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

  constructor(public http: HttpClient, platformLocation: PlatformLocation, public adminService: AdminService) {
    this.baseUrl = (platformLocation as any).location.origin;
    this.setDatePickerDefaultDate();
  }

  ngOnInit() {
    this.accessType = new FormControl();
    this.documentType = new FormControl(null, Validators.required);
    this.dtActivityField.setValue(this.datepickerModelFormatted);
    this.accntSub = this.getAccountChanges();
    this.adminService.getKPIS().subscribe((response) => {
      this.kpis = response['data'];
      this.kpisArrayForDisplay = Object.keys(response['data']).map((key) => {
        if (response['data'][key]['required']) {
          return response['data'][key];
        }
      });
      for ( let i = 0; i < this.kpisArrayForDisplay.length; i++) {
        if (this.kpisArrayForDisplay[i] == undefined) {
          this.kpisArrayForDisplay.splice(i, 1);
        }
      }
      // console.log(this.kpisArrayForDisplay);
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
    if (parseInt(this.documentType.value, 10) !== 5) {
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
      // console.log(files);
      req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`, myForm, {
        reportProgress: true
      });
    } else {
      console.log(this.sendableFormData.get('files'));
      req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance/evac-diagrams/`, this.sendableFormData, {
        reportProgress: true
      });
    }
    return this.httpEmitter = this.http.request(req)
    .subscribe(
      event => {
        this.httpEvent = event;

        if (event instanceof HttpResponse) {
          delete this.httpEmitter;
          console.log('request done', event);
        }
        this.sendableFormData.delete('account_id');
        this.sendableFormData.delete('building_id');
        this.sendableFormData.delete('compliance_kpis_id');
        this.sendableFormData.delete('date_of_activity');
        this.sendableFormData.delete('description');
        this.sendableFormData.delete('file');
        this.files = [];

        this.documentType.reset();
        this.accountField.reset();
        this.accountLocations = [];
        this.locationField.reset();
        this.dtActivityField.setValue(this.datepickerModelFormatted);
        this.setDatePickerDefaultDate();
        this.accntSub = this.getAccountChanges();
      },
      error => console.log('Error Uploading', error)
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
    this.validTillDate = moment(this.datepickerModel)
    .add(this.kpis[this.documentType.value]['validity_in_months'], 'months')
    .format('YYYY-MM-DD');
    this.dtActivityField.setValue(this.datepickerModelFormatted);
    this.isShowDatepicker = false;
  }

   showDatePicker() {
    this.isShowDatepicker = true;
  }
}
