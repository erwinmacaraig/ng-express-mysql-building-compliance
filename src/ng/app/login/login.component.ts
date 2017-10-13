
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';

declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginMessageStatus: string;
  showInvalid = false;
  showErrorOccured = false;
  showSuccess = false;
  errorOccuredMessage = '';
  constructor(public http: HttpClient, private auth: AuthService) { }

  ngOnInit() {

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
    this.http.post<UserLoginResponse>('http://localhost/authenticate', {
      'username': f.value.username,
      'password': f.value.password,
      'keepSignedin': f.value.keepSignedin
    }, {
      headers: header
    }).subscribe(data => {
      this.showSuccess = true;
      this.auth.setToken(data.token);
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

  }

}
