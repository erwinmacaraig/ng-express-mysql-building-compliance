import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { SignupService } from './../../services/signup.service';

declare var $: any;
@Component({
    selector: 'app-tenant-invitation-form',
    templateUrl: './tenant-invite.component.html',
    styleUrls: ['./tenant-invite.component.css']
})
export class TenantInvitationFormComponent implements OnInit, OnDestroy, AfterViewInit {

  public street;
  public city;
  public state;
  public postal_code;
  public country;
  public account_domain;
  public first_name;
  public last_name;
  public email;
  public account_name;
  private token;
  public modalSignUp;
  private signUpSubscription;
  
  @ViewChild('formTenantProfile') formTenantProfile: NgForm;
  constructor(private router: Router,
              private route: ActivatedRoute,
              private http: HttpClient,
              private signupService: SignupService) {
              
    this.route.params.subscribe(params => { this.token = params['token']});
  
  }
  
  ngOnInit() {
    this.modalSignUp = $('#modalSignup');

    this.signUpSubscription = this.signupService.retrieveTenantInvitationInfo(this.token).subscribe((info) => {
      console.log(info);
      this.first_name = info['data']['first_name'];
      this.last_name = info['data']['last_name'];
      this.email = info['data']['email'];
      this.account_name = info['data']['tenancy_name'];
      
      this.formTenantProfile.controls['first_name'].setValue(this.first_name);
      this.formTenantProfile.controls['last_name'].setValue(this.last_name);
      
      
    });
  }
  
  ngOnDestroy() {
  
  }
  
  ngAfterViewInit() {
    const  modalOpts = {
      dismissible: false,
      startingTop: '0%', // Starting top style attribute
      endingTop: '5%'
    };

    this.modalSignUp.modal(modalOpts);
    this.modalSignUp.modal('open');
  }
  
  
  
}