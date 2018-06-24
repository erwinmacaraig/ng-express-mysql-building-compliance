
import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AdminService } from './../../services/admin.service';
declare var $: any;

@Component({
  selector: 'app-admin-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css'],
  providers: [AdminService]
})
export class AccountInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() accountId: number;
  sub: Subscription;
  accountInfo = {
    'account_code': '',
    'account_directory_name': '',
    'account_domain': '',
    'account_type': '',
    'archived': 0,
    'account_id': 0,
    'account_name': '',
    'billing_city': '',
    'billing_country': '',
    'billing_postal_code': '',
    'billing_state': '',
    'billing_street': '',
    'billing_unit': '',
    'email_add_user_exemption': '',
    'lead': '',
    'online_training': ''
  };
  account_billing = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {


      this.sub = this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
        if (response['message'] === 'Success') {
          Object.keys(this.accountInfo).forEach((key) => {
            this.accountInfo[key] = response['data'][key];
          });
          if (this.accountInfo['billing_street'].length > 0) {
            this.account_billing += this.accountInfo['billing_street'];
          }
          if (this.accountInfo['billing_city'].length > 0) {
            this.account_billing += `, ${this.accountInfo['billing_city']}`;
          }
          if (this.accountInfo['billing_state'].length > 0) {
            this.account_billing += `, ${this.accountInfo['billing_state']}`;
          }
          if (this.accountInfo['billing_postal_code'].length > 0) {
            this.account_billing += `, ${this.accountInfo['billing_postal_code']}`;
          }
          if (this.accountInfo['billing_country'].length > 0) {
            this.account_billing += `, ${this.accountInfo['billing_country']}`;
          }
          console.log(this.accountInfo);
        }
      });


  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}

