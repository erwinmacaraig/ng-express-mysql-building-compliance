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
	public dataStore: Object;

  constructor(private http: HttpClient, platformLocation: PlatformLocation) {
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
    this.baseUrl = (platformLocation as any).location.origin;
  }

  getByInIds(ids, callBack) {
    this.http.post(this.baseUrl + '/location/get-by-ids', { 'ids' : ids.join(',') }, this.options)
      .subscribe(res => {
        callBack(res);
      }, err => {
        callBack( JSON.parse(err.error) );
      });
  }

  getById(id, callBack) {
    this.http.get(this.baseUrl + '/location/get/' + id, this.options)
      .subscribe(res => {
        callBack(res);
      }, err => {
        callBack( JSON.parse(err.error) );
      });
  }

  getDeepLocationsById(id, callBack) {
    this.http.get(this.baseUrl + '/location/get-deep-by-id/' + id, this.options)
      .subscribe(res => {
        callBack(res);
      }, err => {
        callBack( JSON.parse(err.error) );
      });
  }

  getByAccountId(accountid, callBack) {
    this.http.get(this.baseUrl + '/location/get-by-account/' + accountid, this.options)
      .subscribe(res => {
        callBack(res);
      }, err => {
        callBack( JSON.parse(err.error) );
      });
  }

	getLocationsByUserIdAndAccountId(opt, callBack){
		this.http.get(this.baseUrl+"/location/get-by-userid-accountid/"+opt.user_id+'/'+opt.account_id, this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	searchForLocation(location: Object): Observable<any> {
		return this.http.post<any>(this.baseUrl + '/location/search-db-location/', location);
	}

  locationDataStore(location) {
    this.dataStore = location;
  }
  getDataStore(key?: string) {
    if (this.dataStore instanceof Array) {
      return this.dataStore;
    }
    if ( this.dataStore && (key in this.dataStore)) {
      return this.dataStore[key];
    }
    return '';
  }

	createSingleLocation(location: Object): Observable<any> {
		return this.http.post<any>(this.baseUrl + '/location/create/', location);
	}

  createSubLocation(sublocation: Object): Observable<any>{
    return this.http.post<any>(this.baseUrl + '/sublocation/create', sublocation);
  }

  archiveLocation(oParam: Object): Observable<any>{
    return this.http.post<any>(this.baseUrl + '/location/archive', oParam);
  }

	getParentLocationsForListing(accountid, callBack){
		this.http.get(this.baseUrl + '/location/get-parent-locations-by-account-id/', this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

  checkUserVerified(param, callBack){
    this.http.post(this.baseUrl + '/location/check-user-verified', param, this.options)
      .subscribe(res => {
        callBack(res);
      }, err => {
        callBack( JSON.parse(err.error) );
      });
  }

}
