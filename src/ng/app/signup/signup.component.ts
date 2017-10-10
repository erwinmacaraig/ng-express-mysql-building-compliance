import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgForm } from '@angular/forms';
declare var $: any;

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SignupComponent implements OnInit {

  constructor() { }

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

}
