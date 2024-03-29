import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { ResponseContentType } from '@angular/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { PaperAttendanceDocument } from '../models/paper_attendance_document';
import { AuthService } from './auth.service';

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
        private encryptDecrypt : EncryptDecryptService,
        private authService: AuthService
		) {

		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		
		this.baseUrl = environment.backendUrl;

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

    public getColors(){
        return {
            2 : '#835cb7',
            3 : '#f0932b',
            4 : '#eb4d4b',
            5 : '#6ab04c',
            6 : '#30336b',
            8 : '#22a6b3',
            9 : '#be2edd',
            12 : '#95afc0',
            13 : '#3d3d3d'
        }
    }

	public getKPIS(callBack){
		this.http.get(this.baseUrl + '/compliance/kpis', this.options)
			.subscribe(res => {
				callBack(res);
			}, err => {
				callBack( JSON.parse(err.error) );
			});
	}

	public getLocationsLatestCompliance(locationIDorForm, callBack){
        let param = { location_id : locationIDorForm };
        if(typeof locationIDorForm == 'object'){
            param = locationIDorForm;
        }
		this.http.post(this.baseUrl + '/compliance/locations-latest-compliance', param)
			.subscribe(res => {
				callBack(res);
			}, err => {                
                if (err.error == 'Not Authenticated') {
                    this.authService.logout();
                }
                callBack( JSON.parse(err.error) );
            });
    }

    public getBuildingLocationCompliance(building_id=0) {
        return this.http.post(this.baseUrl + '/compliance/locations-latest-compliance', {location_id: building_id});
			
    }

    public getSublocationsEvacDiagrams(form, callBack){
        this.http.post(this.baseUrl + '/compliance/get-sublocations-evac-diagrams', form)
            .subscribe(res => {
                callBack(res);
            }, err => {
                callBack( JSON.parse(err.error) );
            });
    }

    public saveEpcMinutesMeeting(formData, callBack){
        this.http.post(this.baseUrl + '/compliance/save-epc-minutes-of-meeting', formData)
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

    public loadUserTrainingModule(userTrainingModuleRelId=0) {
        return this.http.post(this.baseUrl + '/lms/loadUserTrainingModule/', {
            user_training_module_relation_id: userTrainingModuleRelId
        });
    }

    public setUpUserTrainingModule(postData = {}) {
        return this.http.post<{user_training_module_relation_id: number}>(this.baseUrl + '/lms/initLearningModule/', postData);
    }

    public evacExerciseCompleted(formData){
        return this.http.post(this.baseUrl + '/compliance/evac-exercise-completed', formData);
    }

    public fsaCompleted(formData){
        return this.http.post(this.baseUrl + '/compliance/fire-safety-completed', formData);
    }

    public totalComplianceRatingByLocationIds(locationIds){
        return this.http.post(this.baseUrl + '/compliance/total-compliance-rating-by-location', { ids : locationIds });
    }

    public paginateAllLocationIds(){
        return this.http.get(this.baseUrl + '/compliance/paginate-all-locationids');
    }

    public getPaperAttendanceFileUpload(building = 0, accountId = 0, responsibility = 0) {
        return this.http.post<PaperAttendanceDocument>(this.baseUrl + '/compliance/retrieve-paper-attendance-file-records/', {
            location: building,
            account: accountId,
            responsibilty_id: responsibility
        });
    }

    public locationComplianceSupportDetails(location_id=0) {
        return this.http.post<{
            sublocation_count: number,
            num_tenants: number,
            warden: object[],
            wardenUserIds: number[],
            mobility_impaired: object[],
            mobilityImpairedIds: number[],
            tenants: object[],
            fetchingComplianceSupport: boolean
        }>(`${this.baseUrl}/compliance/location/supporting-details/`, {location_id: location_id});
    }

}
