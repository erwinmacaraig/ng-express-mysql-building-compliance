import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class AuthService {
  private tokenTimer: any;

  constructor(private http: HttpClient, private router: Router) {


  }

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

  public userDataItem(item: string): any {
    return this.getUserData()[item];
  }

  public getHighestRankRole() {
    const rolesArray = this.userDataItem('roles');
    let r = 100;
    for (let i = 0; i < rolesArray.length; i++) {
      if (r > (rolesArray[i].role_id * 1) ) {
        r = (rolesArray[i].role_id * 1);
      }
    }
    return r;
  }

  public setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, duration * 1000);
  }

  public logout() {
    this.removeToken();
    this.removeUserData();
    localStorage.removeItem('showemailverification');
		localStorage.removeItem('parentLocationsForListing');
		localStorage.removeItem('locationHierarchy');
    localStorage.removeItem('archivedParentLocationsForListing');
    clearTimeout(this.tokenTimer);
    this.router.navigate(['/login']);    
  }

}
