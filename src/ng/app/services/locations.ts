import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class LocationsService {

	private headers: Object;
  	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    	this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	getByAccountId(accountid, callBack){
		this.http.get(this.baseUrl+"/location/get-by-account/"+accountid, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	getUsersLocationByIdAndAccountId(opt, callBack){
		this.http.get(this.baseUrl+"/location/get-by-userid-accountid/"+opt.user_id+'/'+opt.account_id, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	getLocationsForListing(accountid, callBack){
		this.http.get(this.baseUrl+"/location/get-for-listing/"+accountid, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

}
