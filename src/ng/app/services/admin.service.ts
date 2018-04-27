import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Injectable()
export class AdminService {
  private headers: Object;
  private options: Object;
  private baseUrl: String;

  constructor(private http: HttpClient, platformLocation: PlatformLocation) {
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
    this.baseUrl = (platformLocation as any).location.origin;
  }

  getAccountListingForAdmin(page = 0, query = '') {
    let httpParams = new HttpParams().set('page_num', page.toString());

    if (query.length > 0) {
      httpParams = httpParams.set('search_key', query);
    }
    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/admin/accounts/list/', this.options);
  }
}
