import { Component, OnInit, OnDestroy, AfterViewInit, Input} from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute, Params } from '@angular/router';
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
  selector: 'app-admin-view-location',
  templateUrl: './view-location.component.html',
  styleUrls: [],
  providers: [ AdminService, DashboardPreloaderService ]
})

export class AdminViewLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  locationId: number;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.locationId = +params['locationId'];

    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

}
