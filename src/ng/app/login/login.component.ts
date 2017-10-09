import { Component, OnInit, ViewEncapsulation } from '@angular/core'; 
import { NgForm } from '@angular/forms';
declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  signInFormSubmit(f: NgForm){
  	console.log(f);
  }

  invitationCodeForm(f: NgForm){
    console.log(f);
  }

}
