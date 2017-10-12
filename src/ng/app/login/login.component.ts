
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest } from '@angular/common/http';
import { NgForm } from '@angular/forms';
declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(public http: HttpClient) { }

  ngOnInit() {

  }

  signInFormSubmit(f: NgForm) {
    console.log(f.value.username);
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    this.http.post('http://localhost/authenticate', {
      'username': f.value.username,
      'password': f.value.password
    }, {
      headers: header
    }).subscribe(
      data => console.log(data),
      message => console.log(message)
    );

  }

  invitationCodeForm(f: NgForm) {

  }

}
