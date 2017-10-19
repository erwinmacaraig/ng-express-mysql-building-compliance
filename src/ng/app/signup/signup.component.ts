import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
declare var $: any;
import { SignupService } from '../services/signup.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  providers: [ SignupService ]
})
export class SignupComponent implements OnInit {

  private UserType: Object;
  private headers: Object;
  private options: Object;
  private baseUrl: String;
  emailTaken = false;

  modalLoader = {
    showLoader : true,
    loadingMessage : "Signing up...",
    showMessage : false,
    iconColor: 'green',
    icon: 'check',
    message: 'Sign up successful! Please open your email and click the verification link.'
  };

  elems = {};

  constructor(private router: Router, private http: HttpClient, platformLocation: PlatformLocation, private signupService:SignupService) {
    this.headers = new Headers({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
    this.baseUrl = (platformLocation as any).location.origin;
  }

  documentReady(){
    $(document).ready(() => {
      this.elems['modalSignup'] = $('#modalSignup');
      this.elems['modalLoader'] = $('#modalLoader');
      let  modalOpts = {
        dismissible: false,
        startingTop: '0%', // Starting top style attribute
        endingTop: '5%'
      };

      // init modal
      this.elems['modalSignup'].modal(modalOpts);
      modalOpts.endingTop = '25%';
      this.elems['modalLoader'].modal(modalOpts);

      this.elems['modalSignup'].modal('open');

      for(let i in this.UserType){
        $('#accountType').append('<option value="'+this.UserType[i]['role_id']+'"> '+this.UserType[i]['description']+' </option>');
      }

      // Init select field
      $('select').material_select();
      $(".dropdown-content li:not(.disabled) span").attr('style', 'color: #39a1ff !important;');
    });
  }

  ngOnInit() {
    if(this.UserType === undefined){
      this.http.get(this.baseUrl+"/static-data", this.options)
        .subscribe(data => {
          this.UserType = data['account_type'];
          this.documentReady();
        });
    }else{
      this.documentReady();
    }
  }

  resetFormElement(form){
    form.reset();
    $('.invalid').removeClass('invalid');
    $('label.active').removeClass('active');
    $('#accountType').val("-1").material_select();
  }

  signupResponse(res, f){
    if(res.status){
      this.modalLoader.showLoader = false;
      this.modalLoader.showMessage = true;
      this.modalLoader.message = 'Sign up successful! Please open your email and click the verification link.';
      this.modalLoader.iconColor = 'green';
      this.modalLoader.icon = 'check';
      this.resetFormElement(f);
    }else{
      this.modalLoader.iconColor = 'red';
      for(let i in res.data){
        if(i == 'email_taken'){
          this.emailTaken = true;
          this.modalLoader.message = 'The email that you used is already taken.';
        }else{
          f.controls[i].markAsDirty();
          this.modalLoader.message = 'There\'s an invalid field, please review tour form again.';
        }
      }
    }

    setTimeout(() => {
      this.elems['modalLoader'].modal('close');
      this.elems['modalSignup'].modal('open');
    },2000);

  }

  signUpFormSubmit(f: NgForm, event){
    event.preventDefault();
    let
      controls = f.controls,
      accountType = $('#accountType'),
      userData = {
        'first_name' : controls.first_name.value,
        'last_name' : controls.last_name.value,
        'email' : controls.email.value,
        'password' : controls.password.value,
        'confirm_password' : controls.confirm_password.value,
        'role_id' : parseInt(accountType.val())
      };

    if( isNaN(userData.role_id) ){
      if(f.valid){
        accountType.siblings('input.select-dropdown').css('border-bottom', '1px solid #F44336');
      }else{
        for(let x in f.controls){
          f.controls[x].markAsDirty();
        }
      }
    }else{
      accountType.siblings('input.select-dropdown').css('border-bottom', '1px solid #9e9e9e');
      if(f.valid){
        this.modalLoader.showLoader = true;
        this.modalLoader.showMessage = false;

        this.elems['modalSignup'].modal('close');
        this.elems['modalLoader'].modal('open');

        this.emailTaken = false;
        this.signupService.sendUserData(userData, (res) => {
          this.signupResponse(res, f);
        });
      }else{
        for(let x in f.controls){
          f.controls[x].markAsDirty();
        }
      }
    }
  }

  onCloseSelfSignUp() {
    this.elems['modalSignup'].modal('close');
    this.router.navigate(['/login']);
  }

  ngOnDestroy () {

  }

}
