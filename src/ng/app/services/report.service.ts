import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
        this.baseUrl = (platformLocation as any).location.origin;
    }

    public getParentLocationsForReporting() {
        return this.http.get(this.baseUrl + '/reports/list-locations/', this.options);
    }

    public getLocationTrainingReport(formData){
        return this.http.post(this.baseUrl + '/reports/location-trainings', formData, this.options);
    }

    public generateTeamReportingOnLocation(location_id = -1) {
        const httpParams = new HttpParams().set('location_id', location_id.toString());
        this.options['params'] = httpParams;
        return this.http.get(this.baseUrl + '/reports/team/', this.options);
    }

    public getComplianceSummary(formData){
        return this.http.post(this.baseUrl + '/reports/get-compliance-summary', formData, this.options);
    }

    public getStatementOfCompliance(locId){
        return this.http.get(this.baseUrl + '/reports/get-statement-of-compliance/'+locId, this.options);
    }

}
