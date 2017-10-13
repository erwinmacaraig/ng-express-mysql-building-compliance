import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgotpassword.service';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;


@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangepasswordComponent implements OnInit {

  	private baseUrl: String;
	private options;
	private headers;

	constructor(private platformLocation: PlatformLocation, private fpService:ForgotPasswordService, private http: HttpClient) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new Headers({ 'Content-type' : 'application/json' });
	}

	ngOnInit() {
	}

}
