
import { Component, OnInit, OnDestroy, AfterViewInit, Input} from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

import { AdminService } from './../../services/admin.service';
import { ComplianceService } from '../../services/compliance.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DatepickerOptions } from 'ng2-datepicker';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var $: any;
declare var moment: any;

@Component({
  selector: 'app-admin-compliance-summary',
  templateUrl: './compliance-summary-view.component.html',
  styleUrls: ['./compliance-summary-view.component.css'],
  providers: [ AdminService, ComplianceService, EncryptDecryptService, DashboardPreloaderService ]
})

export class ComplianceSummaryViewComponent implements OnInit, AfterViewInit, OnDestroy {

  accountId = 0;
  locationId: number;
  KPIS: object[] = [];
  selectedKPI;
  documentFiles = [];
  obsComb;
  kpisObject: object = {};
  kpisArrayForDisplay = [];
  locationName = '';
  displayKPIName = '';
  displayKPIDescription = '';
  showModalUploadDocsLoader = false;
  myKPI: object = {};
  validTillDate = '';
  FSAStatus: boolean;

  sublocations: Array<object> = [];
  httpEmitter: Subscription;
  httpEvent: any;

  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
  };

  datepickerModel: Date;
  isShowDatepicker = false;
  datepickerModelFormatted = '';
  baseUrl;
  genericSub: Subscription;

  @ViewChild('inpFileUploadDocs') inpFileUploadDocs: ElementRef;
  constructor(
    private adminService: AdminService,
    private complianceService: ComplianceService,
    public http: HttpClient,
    private route: ActivatedRoute,
    platformLocation: PlatformLocation,
    public dashboard: DashboardPreloaderService) {

      this.baseUrl = (platformLocation as any).location.origin;
    }

  ngOnInit() {
    // console.log(this.route.snapshot.params);
    this.dashboard.show();
    this.accountId = this.route.snapshot.params['accntId'];
    this.locationId = this.route.snapshot.params['locationId'];
    this.selectedKPI = this.route.snapshot.params['kpi'];
    this.setDatePickerDefaultDate();
    this.adminService.getKPIS().subscribe((response) => {
      let initKPI;
      this.kpisObject = response['data'];
      for (const k of response['data']) {
          this.KPIS.push(k);
      }
      for ( let i = 0; i < this.KPIS.length; i++) {
        if (this.KPIS[i] != undefined && this.selectedKPI == this.KPIS[i]['compliance_kpis_id']) {
          initKPI = this.KPIS[i];
        }
      }
      this.getUploadedDocumentsFromSelectedKPI(initKPI);
      this.dashboard.hide();
    });

    // get sublocations here
    this.adminService.getAccountSublocations(this.locationId).subscribe((response) => {
      this.sublocations = response['data'];
    });

    this.genericSub =
        this.adminService.FSA_EvacExer_Status(this.accountId.toString(), this.locationId.toString(), '3').subscribe((response) => {
          console.log(response);
          this.FSAStatus = (response['data']['compliance_status'] == 1) ? true : false;
    });

  }

  ngAfterViewInit() {
    $('.modal').modal({
      dismissible: false
    });
  }

  ngOnDestroy() {}

  public getUploadedDocumentsFromSelectedKPI(kpi) {
    this.selectedKPI = kpi['compliance_kpis_id'];
    this.documentFiles = [];
    this.displayKPIName = kpi['name']; // clean this up
    this.displayKPIDescription = kpi['description']; // clean this up

    this.myKPI = kpi;
    // console.log(this.locationId);
    this.adminService.getDocumentList(this.accountId, this.locationId, this.selectedKPI).subscribe((response) => {
      this.documentFiles = response['data'];
      this.locationName = response['displayName'].join(' >> ');
    });
  }

  showModalUploadDocs() {
    this.validTillDate = moment(this.datepickerModel).add(this.myKPI['validity_in_months'], 'months').format('YYYY-MM-DD');
    $('#modalManageUpload').modal('open');
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
    this.validTillDate = moment(this.datepickerModel).add(this.myKPI['validity_in_months'], 'months').format('YYYY-MM-DD');
    this.isShowDatepicker = false;
  }
  onFileSelected() {

  }
  submitUploadDocs(f: NgForm) {
    let req;
    console.log(f.value.sublocation);
    let locationData = this.locationId.toString();
    if (f.value.sublocation != undefined && f.value.sublocation != '0') {
      locationData = f.value.sublocation;
    }
    const formData = new FormData();
    formData.append('account_id', this.accountId.toString());
    formData.append('building_id', locationData); // <===========
    formData.append('compliance_kpis_id', this.selectedKPI);
    formData.append('viewable_by_trp', '1');
    formData.append('file', this.inpFileUploadDocs.nativeElement.files[0], this.inpFileUploadDocs.nativeElement.files[0].name);
    formData.append('date_of_activity', f.value.date_of_activity);
    formData.append('document_type', f.value.document_type);
    $('#modalManageUpload').css('width', 'fit-content');
    $('#modalManageUpload').modal('close');
    this.dashboard.show();
    req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/compliance-documents/`, formData, {
      reportProgress: true
    });
    this.showModalUploadDocsLoader = true;
    return this.httpEmitter = this.http.request(req)
    .subscribe(
      event => {
        this.httpEvent = event;
        if (event instanceof HttpResponse) {
          delete this.httpEmitter;
          console.log('request done', event);
          this.getUploadedDocumentsFromSelectedKPI(this.myKPI);
          this.showModalUploadDocsLoader = false;
          $('#modalManageUpload').css('width');
          this.cancelUploadDocs(f);
          this.dashboard.hide();
        }
      },
      error => {
        console.log('Error Uploading', error);
        this.showModalUploadDocsLoader = false;
        this.dashboard.hide();
      }
    );
  }

  cancelUploadDocs(form: NgForm) {
   form.reset();
   this.inpFileUploadDocs.nativeElement.value = '';
   this.setDatePickerDefaultDate();
  }

  showDatePicker() {
    this.isShowDatepicker = true;
  }

  public toggleStatus(event, compliance_kpis_id) {
    if (compliance_kpis_id == 3) {
      this.FSAStatus = event.target.checked;
      const dbStat = (event.target.checked == true) ? 1 : 0;
      this.genericSub =
        this.adminService.FSA_EvacExer_Status(this.accountId.toString(),
                                              this.locationId.toString(),
                                              '3',
                                              'set',
                                              dbStat.toString())
          .subscribe((response) => {
            this.FSAStatus = (response['data']['compliance_status'] == 1) ? true : false;
      });

    }
  }



}
