import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
declare var $: any;

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  constructor(private router: Router) { }
  ngOnInit() {
  	$(document).ready(function(){
  		var modalSignup = $('#modalSignup');

  		// init modal
  		modalSignup.modal({
  			dismissible: false,
  			startingTop: '0%', // Starting top style attribute
      		endingTop: '5%',
  		});
  		modalSignup.modal('open');

  		// Init select field
  		$('select').material_select();
  	});
  }

  signUpFormSubmit(f: NgForm){

  }

  onCloseSelfSignUp() {
    $('#modalSignup').modal('close');
    this.router.navigate(['/login']);
  }

  ngOnDestroy () {

  }

}
