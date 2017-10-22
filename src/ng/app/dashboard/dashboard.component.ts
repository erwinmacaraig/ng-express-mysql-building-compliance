import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd  } from '@angular/router';

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
		private auth: AuthService,
		private router: Router
	) {
		this.baseUrl = (platform as any).location.origin;
		this.subscribeAndCheckUserHasAccountToSetup(router);
		
	}

	subscribeAndCheckUserHasAccountToSetup(router){
		router.events.subscribe((val) => {
			if(val instanceof NavigationEnd){
				let userData = this.auth.getUserData();
				if( userData ){
					if( userData.roleId == '1' || userData.roleId == '2' ){
						if(userData.accountId < 1){
							router.navigate(['/setup-company']);
						}
					}
				}
			}
	    });
	}

	ngOnInit() {
		
	}

}
