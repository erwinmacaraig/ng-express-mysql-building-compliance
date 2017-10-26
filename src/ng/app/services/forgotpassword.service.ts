import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class ForgotPasswordService {

  	private headers: any;
	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

  	public sendData(data, callBack){
		this.http.post(this.baseUrl+"/forgot/password/request", data, { headers: this.headers }).subscribe(
			(res) => {
		        callBack(res);
	      	},
	      	(err) => {
	        	callBack( JSON.parse(err.error) );
	      	}
	    );
	}

	public getTokenData(tokenId, userId, callBack){
		this.http.get(this.baseUrl+"/forgot/password/get-token-data/"+tokenId+"/"+userId,  { headers: this.headers }).subscribe(
			(res) => {
		        callBack(res);
	      	},
	      	(err) => {
	        	callBack( JSON.parse(err.error) );
	      	}
	    );
	}

	public changeUsersPassword(data, callBack){
		this.http.post(this.baseUrl+"/forgot/password/change/users/password", data, { headers: this.headers }).subscribe(
			(res) => {
		        callBack(res);
	      	},
	      	(err) => {
	        	callBack( JSON.parse(err.error) );
	      	}
	    );
	}

}
