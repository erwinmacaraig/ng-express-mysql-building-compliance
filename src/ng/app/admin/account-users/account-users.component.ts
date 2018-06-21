import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;

@Component({
  selector: 'app-admin-account-users',
  templateUrl: './account-users.component.html',
  styleUrls: ['./account-users.component.css'],
  providers: [AdminService, DashboardPreloaderService]
})
export class AccountUsersListComponent implements OnInit, OnDestroy, AfterViewInit {
  accountId = 0;
  sub: Subscription;
  userObjects = [];
  locations = [];
  public total_pages = 0;
  public createRange;
  public currentPage = 0;
  @ViewChild('selectPage') selectedPage: ElementRef;

  constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router,
    public dashboard: DashboardPreloaderService
  ) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.accountId = +params['accntId'];
      this.dashboard.show();

      this.sub = this.adminService.getAllAccountUsers(this.accountId).subscribe((response) => {
        this.userObjects = response['data']['list'];
        this.total_pages = response['data']['total_pages'];
        this.createRange = new Array(this.total_pages);
        this.dashboard.hide();

      }, (error) => {
        this.dashboard.hide();
        console.log(error);
      });

    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngAfterViewInit() {
    $('.row.filter-container select').material_select();

  }

  prevPage() {
    this.dashboard.show();

    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) - 1;
    if (this.currentPage < 0) {
      this.currentPage = this.total_pages - 1;
    }
    this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
      this.userObjects = response['data']['list'];
      this.total_pages = response['data']['total_pages'];
      this.createRange = new Array(this.total_pages);
      this.dashboard.hide();
    },
    (error) => {
      this.dashboard.hide();
      console.log(error);
    });

  }
  pageChange() {
    this.dashboard.show();
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
    this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
      this.userObjects = response['data']['list'];
      this.total_pages = response['data']['total_pages'];
      this.createRange = new Array(this.total_pages);
      this.dashboard.hide();
    },
    (error) => {
      this.dashboard.hide();
      console.log(error);
    });
  }

  nextPage() {
    this.dashboard.show();
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) + 1;
    if (this.currentPage > this.total_pages - 1) {
      this.currentPage = 0;
    }
    this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
      this.userObjects = response['data']['list'];
      this.total_pages = response['data']['total_pages'];
      this.createRange = new Array(this.total_pages);
      this.dashboard.hide();
    },
    (error) => {
      console.log(error);
      this.dashboard.hide();
    });
  }

  searchByUserAndEmail(event: KeyboardEvent) {

    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
    const searchKey = (<HTMLInputElement>event.target).value;
    this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage, searchKey).subscribe((response) => {
      this.userObjects = response['data']['list'];
      this.total_pages = response['data']['total_pages'];
      this.createRange = new Array(this.total_pages);

    }, (error) => {

      console.log(error);
    });
  }

}
