import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
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

  constructor(private router: Router, private http: Http, platformLocation: PlatformLocation, private signupService:SignupService) {
    this.headers = new Headers({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
    this.baseUrl = (platformLocation as any).location.origin;
  }

  documentReady(){
    $(document).ready(() => {
      var modalSignup = $('#modalSignup');

      // init modal
      modalSignup.modal({
        dismissible: false,
        startingTop: '0%', // Starting top style attribute
        endingTop: '5%',
      });
      modalSignup.modal('open');

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
      .map((res) => res.json())
      .catch((error:any)=> Observable.throw(error.json() || 'Server error') )
      .subscribe((res) => {
        this.UserType = res.account_type;
        this.documentReady();
      });
    }else{
      this.documentReady();
    }
  }

  resetFormElement(form){
    form.reset();
    this.enableElem();
    $('.invalid').removeClass('invalid');
    $('label.active').removeClass('active');
  }

  enableElem(){
    $('.btn-submit').html('Submit');
    $('input').each(function(){ $(this).prop('disabled', false); });
    $('.btn').each(function(){ $(this).removeClass('disabled'); });
    $('#accountType').siblings('input.select-dropdown').prop('disabled', false);
  }

  disableFormElement(controls){
    let templateLoader = `<div class="preloader-wrapper small active" style="width: 24px; height: 24px; margin-top:10px;">
        <div class="spinner-layer spinner-blue--only">
          <div class="circle-clipper left">
            <div class="circle" ></div>
          </div><div class="gap-patch">
            <div class="circle"></div>
          </div><div class="circle-clipper right">
            <div class="circle"></div>
          </div>
        </div>
      </div>`;
      $('.btn-submit').html(templateLoader);

      $('input').each(function(){ $(this).prop('disabled', true); });
      $('.btn').each(function(){ $(this).addClass('disabled'); });
      $('#accountType').siblings('input.select-dropdown').prop('disabled', true);
  }

  signupResponse(res, f){
    if(res.status){
      $('.btn-submit').html('<i class="material-icons small icon-demo green-text text-darken-2">check</i>');
      setTimeout(() => {
        this.resetFormElement(f);
      },1000);
    }else{
      for(let i in res.data){
        if(i == 'email_taken'){
          this.emailTaken = true;
        }else{
          f.controls[i].markAsDirty();
        }
      }
      this.enableElem();
    }
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
        this.emailTaken = false;
        this.disableFormElement(controls);
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
    $('#modalSignup').modal('close');
    this.router.navigate(['/login']);
  }

  ngOnDestroy () {

  }

}
