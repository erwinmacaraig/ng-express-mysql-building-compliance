import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { EncryptDecryptService } from '../services/encrypt.decrypt';


@Injectable()
export class ComplianceService {

	private headers: Object;
	private options: Object;
	private baseUrl: String;
	public dataStore: Object;

	private behaviorSubject = new BehaviorSubject(null);
	public observableMessage = this.behaviorSubject.asObservable();

	constructor(
		private http: HttpClient, 
		private platformLocation: PlatformLocation,
		private route: ActivatedRoute,
		private router: Router,
		private encryptDecrypt : EncryptDecryptService
		) {

		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;

		this.router.events.subscribe((routes) => {
			if(routes instanceof NavigationEnd){
				if(routes.url.indexOf('/location/compliance/view/') > -1){
					let encryptedLocationID = routes.url.replace('/location/compliance/view/', ''),
						locationID = this.encryptDecrypt.decrypt(decodeURIComponent(encryptedLocationID));


					this.changeMessage({
						'locationID' : locationID
					});

				}
			}
		});
	}

	changeMessage(data){
		this.behaviorSubject.next(data);
	}

	public getKPIS(callBack){
		this.http.get(this.baseUrl + '/compliance/kpis', this.options)
			.subscribe(res => {
				callBack(res);
			}, err => {
				callBack( JSON.parse(err.error) );
			});
	}

	public getLocationsLatestCompliance(locationID, callBack){
		this.http.post(this.baseUrl + '/compliance/locations-latest-compliance', { location_id : locationID })
			.subscribe(res => {
				callBack(res);
			}, err => {
				callBack( JSON.parse(err.error) );
			});
	}

}