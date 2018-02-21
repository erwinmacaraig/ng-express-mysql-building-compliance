import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { ResponseContentType } from '@angular/http';
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

  public downloadAllComplianceDocumentPack(location) {
    const headers = new HttpHeaders(
      { 'Content-type' : 'application/json',
        'Accept': 'application/zip'
      });

    const requestOptions = {
      'params': new HttpParams().set('location_id', location.toString()),
      'headers': headers,
      'responseType': ResponseContentType.Blob
    };

     return this.http.get(this.baseUrl + '/compliance/download-compliance-documents-pack/', {headers: headers,
      responseType: 'arraybuffer', observe: 'response', params: new HttpParams().set('location_id', location.toString())} );
  }

  public downloadComplianceFile(path: string = '', filename: string = '') {
    return this.http.get(this.baseUrl +
      '/compliance/download-compliance-file/',
      {params: new HttpParams().set('keyname', path).set('fname', filename),
      observe: 'response',
      responseType: 'arraybuffer'});
  }

  public toggleTRPViewAccess(compliance_documents_id: number = 0, access: boolean = false) {
    return this.http.post<any>(this.baseUrl + '/compliance/toggleTPRViewAccess/', {
      'compliance_documents_id': compliance_documents_id,
      'viewable_by_trp': access
    });
  }

  public getAllRegisteredCourses() {
    return this.http.get<Array<object>>(this.baseUrl + '/lms/getAllCourses/', this.options);
  }

  public initializeLRS(relation: number = 0) {
    return this.http.post<any>(this.baseUrl + '/lms/initLRS/', {
      'relation': relation
    });
  }

}
