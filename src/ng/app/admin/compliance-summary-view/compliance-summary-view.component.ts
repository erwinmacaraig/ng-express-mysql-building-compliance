import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

import { AdminService } from './../../services/admin.service';
import { ComplianceService } from '../../services/compliance.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { combineLatest } from 'rxjs/observable/combineLatest';
declare var $: any;

@Component({
  selector: 'app-admin-compliance-summary',
  templateUrl: './compliance-summary-view.component.html',
  styleUrls: ['./compliance-summary-view.component.css'],
  providers: [ AdminService, ComplianceService, EncryptDecryptService ]
})

export class ComplianceSummaryViewComponent implements OnInit, AfterViewInit, OnDestroy {

  accountId = 0;
  locationId: number;
  KPIS: object[];
  selectedKPI;
  documentFiles = [];
  obsComb;
  kpisObject: object = {};
  kpisArrayForDisplay = [];
  locationName = '';

  constructor(
    private adminService: AdminService,
    private complianceService: ComplianceService,
    private encryptDecrypt: EncryptDecryptService,
    private route: ActivatedRoute,
    private router: Router) {

    }

  ngOnInit() {
    console.log(this.route.snapshot.params);
    this.accountId = this.route.snapshot.params['accntId'];
    this.locationId = this.route.snapshot.params['locationId'];
    this.selectedKPI = this.route.snapshot.params['kpi'];

    this.adminService.getKPIS().subscribe((response) => {
      let initKPI;
      this.kpisObject = response['data'];
      this.KPIS = Object.keys(response['data']).map((key) => {
        if (response['data'][key]['required']) {
          return response['data'][key];
        }
      });
      for ( let i = 0; i < this.KPIS.length; i++) {
        if (this.KPIS[i] == undefined) {
          this.KPIS.splice(i, 1);
        }
        if (this.KPIS[i] != undefined && this.selectedKPI == this.KPIS[i]['compliance_kpis_id']) {
          initKPI = this.KPIS[i];
        }
      }
        this.getUploadedDocumentsFromSelectedKPI(initKPI);
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  public getUploadedDocumentsFromSelectedKPI(kpi) {
    this.selectedKPI = kpi['compliance_kpis_id'];
    this.documentFiles = [];

    console.log(this.locationId);
    this.adminService.getDocumentList(this.accountId, this.locationId, this.selectedKPI).subscribe((response) => {
      this.documentFiles = response['data'];
      this.locationName = response['displayName'].join(' >> ');
    });

  }


}
