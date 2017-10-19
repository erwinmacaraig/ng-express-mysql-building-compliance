import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class AuthService {
  public getToken() {
    return localStorage.getItem('currentUser');
  }

  public setToken(theToken) {
    return localStorage.setItem('currentUser', theToken);
  }

  public removeToken() {
    return localStorage.clear();
  }

  public setUserData(data){
  	localStorage.setItem('userData', JSON.stringify(data));
  }

  public getUserData(){
  	return (localStorage.getItem('userData') !== null) ? JSON.parse(localStorage.getItem('userData')) : {};
  }

  public removeUserData() {
    return localStorage.removeItem('userData');
  }

}
