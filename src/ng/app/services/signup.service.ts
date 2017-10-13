import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
declare var $: any;

@Injectable()
export class SignupService {

	private headers: Object;
  	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new Headers({ 'Content-type' : 'application/json' });
    	this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	sendUserData(data, callBack){
		this.http.post(this.baseUrl+"/register", data, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

}
