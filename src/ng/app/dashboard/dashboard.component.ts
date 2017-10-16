import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

	private baseUrl: String;
	public userData: Object;

	constructor(
		private http: HttpClient,
		private platform: PlatformLocation,
		private auth: AuthService
	) {
		this.baseUrl = (platform as any).location.origin;
	}

	ngOnInit() {
	}

}
