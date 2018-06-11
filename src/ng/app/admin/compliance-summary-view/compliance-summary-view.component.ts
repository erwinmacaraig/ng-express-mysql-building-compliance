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
  locationId = 0;
  KPIS: object[];
  selectedKPI;
  documentFiles = [];
  obsComb;

  constructor(
    private adminService: AdminService,
    private complianceService: ComplianceService,
    private encryptDecrypt: EncryptDecryptService,
    private route: ActivatedRoute,
    private router: Router) {

    }

  ngOnInit() {
/*
    this.obsComb = Observable.combineLatest(this.route.params, this.route.queryParams,
      (params, qparams) => ({params, qparams}));

    this.obsComb.subscribe(allParams => {
      console.log(allParams);
      this.accountId = allParams.params['accntId'];

      this.locationId = this.encryptDecrypt.decrypt(allParams.params['locationId']);
      if ('kpis' in allParams['qparams']) {
        this.selectedKPI = allParams['qparams']['kpis'];
      }
      this.complianceService.getKPIS((response) => {
        this.KPIS = response.data;
      });
    });

    */


    this.route.params.subscribe((parameters) => {
      this.accountId = parameters['accntId'];
      this.locationId = this.encryptDecrypt.decrypt(parameters['locationId']);
      this.complianceService.getKPIS((response) => {
        this.KPIS = response.data;
      });
    });
/*
    this.route.queryParams.subscribe((params) => {
      if ('kpis' in params) {
        this.selectedKPI = params['kpis'];
      }
    });
*/
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  public getUploadedDocumentsFromSelectedKPI(kpi) {
    this.selectedKPI = kpi['compliance_kpis_id'];
    this.documentFiles = [];


    console.log(this.locationId);
    this.adminService.getDocumentList(this.accountId, this.locationId, this.selectedKPI).subscribe((response) => {
      this.documentFiles = response['data'];
    });

  }


}
