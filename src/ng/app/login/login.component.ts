import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { SignupService } from '../services/signup.service';

declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginMessageStatus: string;
  showInvalid = false;
  showInvalidCode = false;
  showErrorOccured = false;
  showSuccess = false;
  errorOccuredMessage = '';
  private subscription;
  private baseUrl: String;
  constructor(public http: HttpClient,
    private auth: AuthService,
    private signupService: SignupService,
    private platformLocation: PlatformLocation,
    private router: Router) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {
    this.auth.removeToken();
    $('.modal-overlay').remove();
  }

  signInFormSubmit(f: NgForm) {
    this.showInvalid = false;
    this.showErrorOccured = false;
    this.showSuccess = false;
    this.errorOccuredMessage = '';

    interface UserLoginResponse {
      status: string;
      message: string;
      token: string;
      data: any;
    }

    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post<UserLoginResponse>(this.baseUrl + '/authenticate', {
      'username': f.value.username,
      'password': f.value.password,
      'keepSignedin': f.value.keepSignedin
    }, {
      headers: header
    }).subscribe(data => {
      this.showSuccess = true;
      this.auth.setToken(data.token);
      this.auth.setUserData(data.data);
      this.router.navigate(['']);
    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        // todo error message for IO error
        this.loginMessageStatus = `An error occurred: ${err.error.message}`;
        console.log('An error occurred:', err.error.message);
        this.showInvalid = false;
        this.showErrorOccured = true;
        this.errorOccuredMessage = this.loginMessageStatus;

      } else {
        this.showInvalid = true;
        // todo error message for invalid user
        this.loginMessageStatus = `${err.error.message}`;
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        this.showInvalid = true;
        this.showErrorOccured = false;
      }
    });

  }

  invitationCodeForm(f: NgForm) {
    this.subscription = this.signupService.getPersonInvitationCode(f.value.code).subscribe((data) => {
      this.signupService.setInvitationCode(data['data']);
      this.router.navigate(['/warden-signup']);
    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
        this.showInvalidCode = true;

      } else {
        this.showInvalidCode = true;
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
