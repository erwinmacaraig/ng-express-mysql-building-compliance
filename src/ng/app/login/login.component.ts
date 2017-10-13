
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';

declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

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
    }).subscribe(
       token => this.auth.setToken(token.token)
    );

  }

  invitationCodeForm(f: NgForm) {

  }

}
