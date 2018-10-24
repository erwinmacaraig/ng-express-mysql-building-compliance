
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
import { LocationsService  } from '../../services/locations';
import {  UserService } from '../../services/users';
import { PaperAttendanceDocument } from '../../models/paper_attendance_document';
import { MessageService } from './../../services/messaging.service';
declare var $: any;
declare var moment: any;
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-admin-compliance-summary',
  templateUrl: './compliance-summary-view.component.html',
  styleUrls: ['./compliance-summary-view.component.css'],
  providers: [ AdminService, ComplianceService, EncryptDecryptService, DashboardPreloaderService, LocationsService, UserService ]
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
  FSAStatus: boolean =  false;
  showLoadingForSignedURL: boolean = true;
  
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

  totalPercentage = 0;
  complianceSublocations = [];
  selectedCompliance = <any> {};
  tenants = <any> [];
  fetchingWardenList = true;
  complianceDocuments: object = {    
    2: [],   
    4: [],
    5: [],
    6: [],        
    9: [],    
    13: []
  };

  paperAttendanceRecord: Array<PaperAttendanceDocument> = [];
  gofr_attendance_record: Array<PaperAttendanceDocument> = [];
  sundry_attendance_record: Array<PaperAttendanceDocument> = [];
  eco_attendance_record: Array<PaperAttendanceDocument> = [];
  chief_warden_attendance_record: Array<PaperAttendanceDocument> = [];
  showLoadingForSignedPaperURL:boolean = true;
  messagingSub:Subscription;

  @ViewChild('inpFileUploadDocs') inpFileUploadDocs: ElementRef;
  constructor(
    private adminService: AdminService,
    private complianceService: ComplianceService,
    public http: HttpClient,
    private route: ActivatedRoute,
    platformLocation: PlatformLocation,
    public dashboard: DashboardPreloaderService,
    private userService: UserService,
    private locationService: LocationsService,
    private messageService: MessageService) {

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
          if(k.description !== null){
            this.KPIS.push(k);
          }
      }
      
      for ( let i = 0; i < this.KPIS.length; i++) {
        if (this.KPIS[i] != undefined && this.selectedKPI == this.KPIS[i]['compliance_kpis_id']) {
          initKPI = this.KPIS[i];          
        }
        
        
      }
      this.getUploadedDocumentsFromSelectedKPI(initKPI, true);
      this.getLatestCompliance();
      this.dashboard.hide();
    });

    // get sublocations here
    this.adminService.getAccountSublocations(this.locationId).subscribe((response) => {
      this.sublocations = response['data'];
    });

    this.genericSub =
        this.adminService.FSA_EvacExer_Status(this.accountId.toString(), this.locationId.toString(), '3').subscribe((response) => {
          // console.log(response);
          if (response['data'] && 'compliance_status' in response['data']) {
            this.FSAStatus = (response['data']['compliance_status'] == 1) ? true : false;
          }
          
    });
    
    this.locationService.getByIdWithQueries({
      location_id : this.locationId,
      account_id : this.accountId,
      get_related_only : false
    }, (response) => {
      // console.log(response);
      if (response.sublocations.length > 0) {
      this.complianceSublocations = response.sublocations;
      } else {
      this.complianceSublocations.push(response.location);
      }
    });

    this.complianceService.getPaperAttendanceFileUpload(this.locationId).subscribe((response) => {
      this.paperAttendanceRecord = response['attendance_record'];
      for (let attendance of this.paperAttendanceRecord) {
          attendance['downloadCtrl'] = false;
          switch(attendance.compliance_kpis_id.toString()) {
              case '8':                            
                  this.gofr_attendance_record.push(attendance);                  
              break;
              case '6':
                  this.eco_attendance_record.push(attendance);
              break;
              case '12':
                  this.chief_warden_attendance_record.push(attendance);
              break;
              case '13':
                  this.sundry_attendance_record.push(attendance);
              break;
          } 
      }
      this.showLoadingForSignedPaperURL = false;                
  });
    
  }

  ngAfterViewInit() {
    $('.modal').modal({
      dismissible: false
    });
    this.messagingSub = this.messageService.getMessage().subscribe((message) => {
      if (message.Fire_Safety_Advisor_Updated) {
        this.getLatestCompliance();
      }      
    });
  }

  ngOnDestroy() {
    this.messagingSub.unsubscribe();
  }

  
  getLatestCompliance(){
      this.complianceService.getLocationsLatestCompliance({
          location_id : this.locationId,
          account_id : this.accountId
      }, (responseCompl) => {
        let latestComplianceData = responseCompl.data;
        for(let kpi of this.KPIS) {
            for(let comp of latestComplianceData){
                if( comp.compliance_kpis_id == kpi['compliance_kpis_id'] ){
                    kpi['compliance'] = comp;
                }

                if(comp.docs.length > 0) {
                    for(let doc of comp.docs){
                        doc['timestamp_formatted'] = moment(doc["timestamp"]).format("DD/MM/YYYY");
                        doc['display_format'] = moment(doc['timestamp']).format('DD/MM/YYYY');
                    }
                }
            }
        }

        this.totalPercentage = responseCompl.percent;

        let colors = this.complianceService.getColors();
        for(let kpis of this.KPIS) {
            let mes = kpis['measurement'].toLowerCase();
            if(mes == 'traffic' || mes == 'evac'){
                kpis['type'] = 'date';
            }else{
                kpis['type'] = 'percent';
            }

            kpis['background_color'] = colors[kpis['compliance_kpis_id']];
            if(kpis['compliance_kpis_id'] == 4){
                kpis['icon_class'] = 'epm-icon';
                kpis['short_code'] = 'epm';
            }else if(kpis['compliance_kpis_id'] == 2){
                kpis['icon_class'] = 'epc-icon';
                kpis['short_code'] = 'epc';
            }else if(kpis['compliance_kpis_id'] == 9){
                kpis['icon_class'] = 'evacuation-icon';
                kpis['short_code'] = 'evacution_exercise';
            }else if(kpis['compliance_kpis_id'] == 5){
                kpis['icon_class'] = 'diagram-icon';
                kpis['short_code'] = 'evac_diagram';
            }else if(kpis['compliance_kpis_id'] == 12){
                kpis['icon_class'] = 'chief-icon';
                kpis['short_code'] = 'chief_warden_training';
            }else if(kpis['compliance_kpis_id'] == 6){
                kpis['icon_class'] = 'warden-icon';
                kpis['short_code'] = 'warden_training';
            }else if(kpis['compliance_kpis_id'] == 3){
                kpis['icon_class'] = 'fsa-icon';
                kpis['short_code'] = 'fire_safety_advisor';
            }else if(kpis['compliance_kpis_id'] == 8){
                kpis['icon_class'] = 'gen-occ-icon';
                kpis['short_code'] = 'general_occupant_training';
            }else if(kpis['compliance_kpis_id'] == 13){
                kpis['icon_class'] = 'sundry-icon';
                kpis['short_code'] = 'sundry';
            }
        }

    });
  }

  
  public getUploadedDocumentsFromSelectedKPI(kpi, reload: boolean = false) {
    
    this.selectedKPI = kpi['compliance_kpis_id'];
    this.documentFiles = [];
    this.displayKPIName = kpi['name']; // clean this up
    this.displayKPIDescription = kpi['description']; // clean this up
   
    this.showLoadingForSignedURL = false;
    this.myKPI = kpi;
    console.log(`selected kpi is ${this.selectedKPI}`);
    if ( (this.selectedKPI in this.complianceDocuments && this.complianceDocuments[this.selectedKPI].length == 0) || ( this.selectedKPI in this.complianceDocuments && reload)) {
      this.adminService.getDocumentList(this.accountId, this.locationId, this.selectedKPI).subscribe((response) => {
        this.documentFiles = response['data'];        
        
        this.locationName = response['displayName'].join(' >> ');
        for (const doc of this.documentFiles) {
          doc['downloadCtrl'] = false; 
          this.complianceDocuments[this.selectedKPI].push(doc);
        }
        // this.complianceDocuments[this.selectedKPI].sort((obj1, obj2) => {
        //  return obj2.compliance_documents_id - obj1.compliance_documents_id;
        // }); 
        
      }, (error) => {
        console.log(error);
        this.showLoadingForSignedURL = false;
        alert("There was a problem getting the list of documents. Try again at a later time.");
      });
    }

   
    for(let k of this.KPIS){
      if(k['compliance_kpis_id'] == this.selectedKPI){
        this.selectedCompliance = k;
      }
    }
  }

  downloadPaperAttendanceFile(filename, kpi, index) {    
    switch(kpi.toString()) {
      case '8':                             
        this.gofr_attendance_record[index]['downloadCtrl'] = true;  
      break;
      case '6':
        this.eco_attendance_record[index]['downloadCtrl'] = true; 
      break;
      case '12':
        this.chief_warden_attendance_record[index]['downloadCtrl'] = true; 
      break;
      case '13':
        this.sundry_attendance_record[index]['downloadCtrl'] = true; 
      break;
    }
    this.complianceService.downloadComplianceFile(encodeURIComponent(`paper_attendance/${filename}`), encodeURIComponent(filename)).subscribe((data) => {
      const blob = new Blob([data.body], {type: data.headers.get('Content-Type')}); 
      FileSaver.saveAs(blob, filename); 
      switch(kpi.toString()) {
        case '8':                             
          this.gofr_attendance_record[index]['downloadCtrl'] = false;  
        break;
        case '6':
          this.eco_attendance_record[index]['downloadCtrl'] = false; 
        break;
        case '12':
          this.chief_warden_attendance_record[index]['downloadCtrl'] = false; 
        break;
        case '13':
          this.sundry_attendance_record[index]['downloadCtrl'] = false; 
        break;
      }
    },
    (error) => {
      // this.alertService.error('No file(s) available for download');
      switch(kpi.toString()) {
        case '8':                             
          this.gofr_attendance_record[index]['downloadCtrl'] = false;  
        break;
        case '6':
          this.eco_attendance_record[index]['downloadCtrl'] = false; 
        break;
        case '12':
          this.chief_warden_attendance_record[index]['downloadCtrl'] = false; 
        break;
        case '13':
          this.sundry_attendance_record[index]['downloadCtrl'] = false; 
        break;
      }      
      $('#modalfilenotfound').modal('open');
      console.log('There was an error', error);
    });

  }

  downloadKPIFile(kpi_file, filename, kpis_id?, index?) {
    if (kpis_id && index) {
      this.complianceDocuments[kpis_id][index]['downloadCtrl'] = true;   
    }
    this.complianceService.downloadComplianceFile(kpi_file, filename).subscribe((data) => {
      const blob = new Blob([data.body], {type: data.headers.get('Content-Type')});
      FileSaver.saveAs(blob, filename);
      if (kpis_id && index) { 
        this.complianceDocuments[kpis_id][index]['downloadCtrl'] = false;
      }
      
      
    },
    (error) => {
      // this.alertService.error('No file(s) available for download');
      if (kpis_id && index) { 
        this.complianceDocuments[kpis_id][index]['downloadCtrl'] = false;
      }      
      $('#modalfilenotfound').modal('open');
      console.log('There was an error', error);
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
          this.getUploadedDocumentsFromSelectedKPI(this.myKPI, true);
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

  showDiagramDetails(){

    let tableLeft = $('.row-table-content').position().left,
      tableW = $('.row-table-content').width(),
      diagramLeft = $('.row-diagram-details').position().left;

    $('.row-table-content').css({
      'left' : '-'+( tableW + 200 )+'px',
      'position' : 'absolute'
    });
    $('.row-diagram-details').css({
      'opacity' : '',
      'left' : '0px',
      'position' : 'relative'
    });
    
    setTimeout(() => { 
      $('.row-diagram-details').show(); 
      $('.row-diagram-details .hide-diagram').show();
      $('.row-table-content').hide();
    }, 200);
    
  }

  hideDiagramDetails(){
    let tableLeft = $('.row-table-content').position().left,
      tableW = $('.row-table-content').width(),
      diagramLeft = $('.row-diagram-details').position().left;

    $('.row-table-content').css({
      'left' : '0px',
      'position' : 'relative'
    });
    $('.row-diagram-details').css({
      'opacity' : '0.3',
      'left' : (tableW + diagramLeft) + 'px',
      'position' : 'absolute'
    });
    $('.row-table-content').show();
    setTimeout(() => { 
      $('.row-diagram-details').hide(); 
    }, 400);
    
  }

  public viewWardenList(location_id:number = 0) {
    this.fetchingWardenList = true;
    $('#modalWardenList').modal('open');
    this.tenants = [];
      this.userService.getTenantsInLocation(location_id, (tenantsResponse) => {
        if(tenantsResponse){
          this.tenants = tenantsResponse.data;
          // this.showModalNewTenantLoader = false;
          console.log(this.tenants);
        }
        this.fetchingWardenList = false;
      });
  }
/*
  downloadKPIFile(kpi_file, filename) {
      this.complianceService.downloadComplianceFile(kpi_file, filename).subscribe((data) => {
        const blob = new Blob([data.body], {type: data.headers.get('Content-Type')});
        FileSaver.saveAs(blob, filename);
        console.log(data);
      },
      (error) => {
        console.log('There was an error', error);
      });
  }
  */

}
