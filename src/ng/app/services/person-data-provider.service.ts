import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
              private platformLocation: PlatformLocation,
              private auth: AuthService
            ) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

  public getPersonInfo(): Observable<Person> {
    const userData = this.auth.getUserData();
    const userId = this.auth.userDataItem('userId');
    return this.http.get<Person>(
      this.baseUrl + '/person-info', { params: new HttpParams().set('userId', userId) });
  }

  public listAllFRP(account?: number): Observable<any> {
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };

    if (account) {
      this.options['params'] = new HttpParams().set('account_id', account.toString());
    }
    return this.http.get<any>(this.baseUrl + '/listAllFRP', this.options);
  }

  public listAllTRP(location: number, account?: number): Observable<any> {
    let http_params = new HttpParams().set('location_id', location.toString());
    if (account) {
      http_params = http_params.set('account_id', account.toString());
    }

    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers, params: http_params };
    return this.http.get<any>(this.baseUrl + '/listAllTRP', this.options);
  }

  public listValidationQuestion(location: number, account: number) {
    const role_id = this.auth.userDataItem('roleId');
    const http_params =
      new HttpParams().set('account_id', account.toString())
      .set('location_id', location.toString())
      .set('role_id', role_id)
      .set('currentQ', '1');

    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers, params: http_params };
    return this.http.get<any>(this.baseUrl + '/list-validation-question', this.options);

  }
}

