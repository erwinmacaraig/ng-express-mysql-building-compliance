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
  styleUrls: ['./view-location.component.css'],
  providers: [ AdminService, DashboardPreloaderService ]
})

export class AdminViewLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  locationId: number;
  tab: any;
  people: Object[] = [];
  accounts: Object[] = [];
  location_details: Object = {};
  sublocations: Object[] = [];
  traversal: Object = {};

  constructor(private route: ActivatedRoute,
    public adminService: AdminService,
    public dashboard: DashboardPreloaderService) {}

  ngOnInit() {
    this.dashboard.show();
    this.route.params.subscribe((params: Params) => {
      this.locationId = +params['locationId'];
      this.location_details = {};
      this.sublocations = [];
      this.accounts = [];
      this.traversal = {};
      this.people = [];

      this.adminService.getLocationDetails(this.locationId).subscribe((response) => {
        this.location_details = response['data']['details'];
        this.sublocations = response['data']['children'];
        this.accounts = response['data']['account'];
        this.traversal = response['data']['traversal'][0];
        Object.keys(response['data']['people']).forEach((key) => {
          this.people.push(response['data']['people'][key]);
        });
        this.dashboard.hide();
        // console.log(this.people);
      }, (error) => {
        this.dashboard.hide();
        console.log(error);
      });
    });
  }

  ngAfterViewInit() {
    $('.tabs').tabs();
  }

  ngOnDestroy() {}

}
