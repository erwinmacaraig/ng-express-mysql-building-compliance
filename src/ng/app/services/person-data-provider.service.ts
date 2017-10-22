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

}
