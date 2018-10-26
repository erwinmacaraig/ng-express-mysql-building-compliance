import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-admin-component',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  providers: [AdminService]
})

export class AdminComponent implements OnInit, OnDestroy {
  userData = <any> {};

  @ViewChild('searchInput') searchInput : ElementRef;
  @ViewChild('searchResults') searchResults : ElementRef;
  @ViewChild('filterSearch') filterSearch : ElementRef;
  searchSubs;
  searchedResult = <any> [];
  showResult = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private adminService: AdminService
    ) {}

  ngOnInit() {
    this.userData = this.auth.getUserData();
    if(this.userData.evac_role != 'admin'){
        this.router.navigate(['/signout']);
    }

    this.searchEvent();
  }

  search(){
      let target = this.searchInput.nativeElement,
          value = target.value,
          filter = this.filterSearch.nativeElement.value;

      if(value.trim().length > 0){
          this.showResult = true;
          this.adminService.searchUsersAccountsAndLocations(value.trim(), filter).subscribe((response:any) => {
            this.searchedResult = response;
          });
      }else{
        this.searchedResult = [];
        this.showResult = false;
      }
  }

  searchEvent(){
      this.searchSubs = Observable.fromEvent(this.searchInput.nativeElement, 'keyup')
      .debounceTime(500)
      .subscribe((event:any) => {
          this.search();
      });
  }

  filterSearchOnChange(){
      this.search();
  }

  searchClickEvent(result){
      this.searchInput.nativeElement.value = "";
      this.searchedResult = [];
      this.showResult = false;
      if(result.type == 'location'){
          this.router.navigate(['/admin/view-location/', result.id]);
      }else if(result.type == 'user'){
          this.router.navigate(['/admin/view-user/', result.id]);
      }else if(result.type == 'account'){
          this.router.navigate(['/admin/locations-in-account/', result.id]);
      }
  }

  ngOnDestroy() {
      this.searchSubs.unsubscribe();
  }

}
