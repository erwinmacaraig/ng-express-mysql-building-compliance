
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';


import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var $: any;

@Component({
  selector: 'app-admin-location-list',
  templateUrl: './list-accounts.component.html',
  styleUrls: ['./list-accounts.component.css'],
  providers: [AdminService, DashboardPreloaderService]
})
export class ListAccountsComponent implements OnInit, OnDestroy, AfterViewInit {
  public list = [];
  public total_pages = 0;
  public createRange;
  public currentPage = 0;
  public message = '';
  @ViewChild('selectPage') selectedPage: ElementRef;
  // @ViewChild('selectedAction') selectedAction: ElementRef;
  constructor(private adminService: AdminService,
    private router: Router,
    private dashboard: DashboardPreloaderService,) {}

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
    $('.modal').modal({
      dismissible: false
    });
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

  addressSelectedAction(accountId: number = 0) {
    const selectedAccountId = '#account-' + accountId;
    // console.log($(selectedAccountId).val());
    switch ($(selectedAccountId).val()) {
      case 'view':
        this.router.navigate(['/admin', 'users-in-accounts', accountId]);
      break;
      case 'archive':
        this.dashboard.show();  
        this.adminService.performArchiveOperationOnAccount([accountId], 1).subscribe((response) => {
          console.log(response);
          this.dashboard.hide();
          setTimeout(() => {
            this.message = 'User successfully archived.';
            $('#modalConfirm').modal('open');
          }, 200);
        }, (error) => {
          console.log(error);
          setTimeout(() => {
            this.message = 'Unable to perform operation. Try again later';
            $('#modalConfirm').modal('open');
          }, 200);
          this.dashboard.hide();
        });
      break;
    }
  }
}
