
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';


import { AdminService } from './../../services/admin.service';
declare var $: any;

@Component({
  selector: 'app-admin-location-list',
  templateUrl: './list-accounts.component.html',
  styleUrls: ['./list-accounts.component.css'],
  providers: [AdminService]
})
export class ListAccountsComponent implements OnInit, OnDestroy, AfterViewInit {
  public list = [];
  public total_pages = 0;
  public createRange;
  public currentPage = 0;
  @ViewChild('selectPage') selectedPage: ElementRef;
  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAccountListingForAdmin().subscribe((response) => {
      this.list = Object.keys(response['data']['list']).map((key) => {
        return response['data']['list'][key];
      }) ;
      this.total_pages = response['data']['total_pages'];
      this.createRange = new Array(this.total_pages);
      console.log(this.list);
    });
  }

  ngAfterViewInit() {
    $('.row.filter-container select').material_select();
  }

  ngOnDestroy() {}

  nextPage() {
    console.log('current page is ' + this.selectedPage.nativeElement.value);
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) + 1;
    if (this.currentPage > this.total_pages - 1) {
      this.currentPage = 0;
    }
    console.log(this.selectedPage);
    this.adminService.getAccountListingForAdmin(this.currentPage).subscribe((response) => {
      this.list = Object.keys(response['data']['list']).map((key) => {
        return response['data']['list'][key];
      });
    });
  }

  pageChange() {
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
    this.adminService.getAccountListingForAdmin(this.currentPage).subscribe((response) => {
      this.list = Object.keys(response['data']['list']).map((key) => {
        return response['data']['list'][key];
      });
    });
  }

  prevPage() {
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) - 1;
    console.log('current Page at this point is ' + this.currentPage);
    if (this.currentPage < 0) {
      this.currentPage = this.total_pages - 1;
    }
    this.adminService.getAccountListingForAdmin(this.currentPage).subscribe((response) => {
      this.list = Object.keys(response['data']['list']).map((key) => {
        return response['data']['list'][key];
      }) ;
    });

  }
  searchByAccoutName(event: KeyboardEvent) {
    console.log(( (<HTMLInputElement>event.target).value));
    this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
    const searchKey = (<HTMLInputElement>event.target).value;
    this.adminService.getAccountListingForAdmin(this.currentPage, searchKey).subscribe((response) => {
      this.list = Object.keys(response['data']['list']).map((key) => {
        return response['data']['list'][key];
      });
    });
  }
}
