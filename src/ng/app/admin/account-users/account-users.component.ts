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
  selector: 'app-admin-account-users',
  templateUrl: './account-users.component.html',
  styleUrls: ['./account-users.component.css'],
  providers: [AdminService]
})
export class AccountUsersListComponent implements OnInit, OnDestroy, AfterViewInit {
  accountId = 0;
  sub: Subscription;
  userObjects = [];
  locations = [];
  constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.accountId = +params['accntId'];

      this.sub = this.adminService.getAllAccountUsers(this.accountId).subscribe((response) => {
        this.userObjects = response['data'];
        /*
        Object.keys(this.userObjects).forEach((key) => {
          this.locations = this.locations.concat(this.userObjects[key]['locations']);
        });
        console.log(this.locations);
*/
      });

    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngAfterViewInit() {}

}
