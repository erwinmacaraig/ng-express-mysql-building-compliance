import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
  selector: 'app-location-list',
  templateUrl: './location.list.html',
  styleUrls: ['./location.list.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService]
})
export class LocationListComponent implements OnInit, OnDestroy {

	locations = [];
	private baseUrl: String;
	private options;
	private headers;

	public userData: Object;

	constructor(
		private platformLocation: PlatformLocation, 
		private http: HttpClient, 
		private auth: AuthService,
		private preloaderService : DashboardPreloaderService,
		private locationService : LocationsService
	){
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();
	}

	ngOnInit(){
		this.preloaderService.show();
		$('select').material_select();
	}

	ngAfterViewInit(){
		setTimeout(() => { this.preloaderService.hide(); }, 1000);
	}

	ngOnDestroy(){

	}
}