
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PlatformLocation } from '@angular/common';
import { AuthService } from './auth.service';
import { Person } from '../models/person.model';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class PersonDataProviderService {

  private baseUrl: String;
  public person: Person;
  private headers;
  private options;

  constructor(private http: HttpClient,
              private auth: AuthService
            ) {    
		this.baseUrl = environment.backendUrl;
  }

  public getPersonInfo(): Observable<Person> {
    const userData = this.auth.getUserData();
    const userId = this.auth.userDataItem('userId');
    return this.http.get<Person>(
      this.baseUrl + '/person-info', { params: new HttpParams().set('userId', userId) });
  }

  public listAllFRP(location: number): Observable<any> {
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };

    /*
    this.options['params'] = new HttpParams()
                                .set('account_id', account.toString())
                                .set('location_id', location.toString());

    */
    this.options['params'] = new HttpParams().set('location_id', location.toString());
    return this.http.get<any>(this.baseUrl + '/listAllFRP', this.options);
  }

  public listAllTRP(location: number): Observable<any> {
    /*
    let http_params = new HttpParams().set('location_id', location.toString());
    if (account) {
      http_params = http_params.set('account_id', account.toString());
    }

    const http_params = new HttpParams()
                          .set('account_id',  account.toString())
                          .set('location_id', location.toString());
    */

    const http_params = new HttpParams().set('location_id', location.toString());
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers, params: http_params };
    return this.http.get<any>(this.baseUrl + '/listAllTRP', this.options);
  }

  public listValidationQuestion(location: number, account: number, qid: number = 0) {
    const role_id = this.auth.userDataItem('roleId');
    const http_params =
      new HttpParams().set('account_id', account.toString())
      .set('location_id', location.toString())
      .set('role_id', role_id)
      .set('currentQ', qid.toString());

    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers, params: http_params };
    return this.http.get<any>(this.baseUrl + '/list-validation-question', this.options);

  }

  public buildECORole() {
    return this.http.get<any>(this.baseUrl + '/team/eco-role-list', this.options);
  }

  public sendWardenInvitation(emails: string[]) {
    const emailStr = JSON.stringify(emails);
    return this.http.post<any>(this.baseUrl + '/team/add-bulk-warden', {'wardensEmail': emailStr});
  }

  public addBulkWarden(wardens: string) {
    return this.http.post<any>(this.baseUrl + '/team/form/add-bulk-warden', {'wardens': wardens});
  }

  public buildWardenList() {
    return this.http.get(this.baseUrl + '/team/list/wardens', this.options);
  }

  public buildArchivedWardenList() {
    return this.http.get(this.baseUrl + '/team/list/archived-wardens', this.options);
  }

  public addPEEP(peep: string) {
    return this.http.post<any>(this.baseUrl + '/team/form/add-bulk-peep', {'peep': peep});
  }

  public buildPeepList() {
    return this.http.get(this.baseUrl + '/team/list/peep', this.options);
  }

  public buildArchivedPeepList() {
    return this.http.get(this.baseUrl + '/team/list/archived-peep', this.options);
  }

  public uploadCSV(formData: any) {
    return this.http.post<any>(this.baseUrl + '/team/csv-upload', formData);
  }

  public finalizeCSVRecord(records: string, override: string) {
    return this.http.post<any>(this.baseUrl + '/team/finalize-csv-record', {'invitations': records, 'data_override': override});
  }
}
