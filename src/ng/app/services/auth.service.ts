import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class AuthService {
  public getToken() {
    return localStorage.getItem('currentUser');
  }

  public setToken(theToken) {
    return localStorage.setItem('currentUser', JSON.stringify(theToken));
  }
}
