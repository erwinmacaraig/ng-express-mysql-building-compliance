
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
  constructor(public http: HttpClient, private auth: AuthService) { }

  ngOnInit() {

  }

  signInFormSubmit(f: NgForm) {
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
      this.auth.setToken(data.token);
    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        // todo error message for IO error
        this.loginMessageStatus = `An error occurred: ${err.error.message}`;
        console.log('An error occurred:', err.error.message);
      } else {
        // todo error message for invalid user
        this.loginMessageStatus = `${err.error.message}`;
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });

  }

  invitationCodeForm(f: NgForm) {

  }

}
