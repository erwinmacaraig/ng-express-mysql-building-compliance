import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class ForgotPasswordService {

  	private headers: Object;
	private options: Object;
	private baseUrl: String;

	constructor(private http: Http, platformLocation: PlatformLocation) {
		this.headers = new Headers({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

  	public sendData(data, callBack){
		this.http.post(this.baseUrl+"/forgot/password/request", data, this.options)
	      .map((res) => res.json())
	      .catch((err:any) =>  Observable.throw( err ) )
	      .subscribe((res) => {
	        callBack(res);
	      }, (err) => {
	        callBack( JSON.parse(err._body) );
	      });
	}

}
