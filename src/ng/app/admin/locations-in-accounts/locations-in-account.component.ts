import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';

import { AdminService } from './../../services/admin.service';

declare var $: any;

@Component({
  selector: 'app-admin-account-locations',
  templateUrl: './locations-in-accounts.component.html',
  styleUrls: ['./locations-in-accounts.component.css'],
  providers: [ AdminService ]
})
export class LocationsInAccountComponent implements OnInit, AfterViewInit {

  accountId = 0;
  locations = [];
  constructor(public http: HttpClient,
    private adminService: AdminService,
    private route: ActivatedRoute) {

    }

  ngOnInit() {
    this.route.params.subscribe((parameters) => {
      this.accountId = parameters['accntId'];
      this.adminService.taggedLocationsOnAccount(this.accountId).subscribe((response) => {
        this.locations = response['data'];

        console.log(response);
      });

    });
  }

  ngAfterViewInit() {}

}
