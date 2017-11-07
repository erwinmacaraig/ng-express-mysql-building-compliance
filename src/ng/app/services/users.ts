import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class UserService {

	private headers: Object;
  	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    	this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	uploadProfilePicture(formData, callBack){

		this.http.post(this.baseUrl+"/users/upload-profile-picture", formData, {
			headers : new HttpHeaders({ 'Content-type' : 'multipart/form-data'  })
		})
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( err );
		});
	}

}
