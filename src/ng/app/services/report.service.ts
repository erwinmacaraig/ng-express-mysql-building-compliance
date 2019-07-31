import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class ReportService {
    private headers: Object;
    private options: Object;
    private baseUrl: String;

    constructor(private http: HttpClient,
        platformLocation: PlatformLocation) {
        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
       
		this.baseUrl = environment.backendUrl;
    }

    public getParentLocationsForReporting(qParams?) {
        let params = Object.create(this.options);
        if(qParams){
            params['params'] = qParams;
        }

        return this.http.get(this.baseUrl + '/reports/list-locations', params);
    }

    public getLocationTrainingReport(formData){
        return this.http.post(this.baseUrl + '/reports/location-trainings', formData, this.options);
    }

    public generateTeamReportingOnLocation(formdata) {
        return this.http.post(this.baseUrl + '/reports/team', formdata, this.options);
    }

    public getComplianceSummary(formData){
        return this.http.post(this.baseUrl + '/reports/get-compliance-summary', formData, this.options);
    }

    public getStatementOfCompliance(locId){
        return this.http.get(this.baseUrl + '/reports/get-statement-of-compliance/'+locId, this.options);
    }

    public getActivityReport(formdata){
        return this.http.post(this.baseUrl + '/reports/get-activity-report', formdata, this.options);
    }

    public getWardenListReport(formData){
        return this.http.post(this.baseUrl + '/reports/warden-list', formData, this.options);
    }

    public generateWardenTrainingReport(formData={}, options?) {
        if (options) {
            return this.http.post(`${this.baseUrl}/reports/warden-trainings/`, formData, {observe: 'response',
            responseType: 'arraybuffer'});
        }
        return this.http.post(`${this.baseUrl}/reports/warden-trainings/`, formData);
        
    }

    public listBuildingActivities(buildings=[]) {
        return this.http.post<{
            activity: object[],
            buildings: object[] 
        }>(`${this.baseUrl}/reports/summary-of-building-activities/`, {buildingIds: buildings});
    }

}
