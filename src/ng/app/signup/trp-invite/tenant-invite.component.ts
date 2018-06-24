import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { SignupService } from './../../services/signup.service';
import { Countries } from '../../models/country.model';

declare var $: any;
@Component({
    selector: 'app-tenant-invitation-form',
    templateUrl: './tenant-invite.component.html',
    styleUrls: ['./tenant-invite.component.css']
})
export class TenantInvitationFormComponent implements OnInit, OnDestroy, AfterViewInit {

  public building_number;
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
  public location;
  public defaultCountry = 'AU';
  public countries;
  public password;
  public confirmPassword;
  private sublocationId;
  private parentLocationId;
  private invitedByUserId;
  @ViewChild('formTenantProfile') formTenantProfile: NgForm;
  constructor(private router: Router,
              private route: ActivatedRoute,
              private http: HttpClient,
              private signupService: SignupService) {

    this.route.params.subscribe(params => { this.token = params['token'] });

  }

  ngOnInit() {
    this.modalSignUp = $('#modalSignup');
    this.countries =  new Countries().getCountries();
    $('select').material_select();
    this.signUpSubscription = this.signupService.retrieveTenantInvitationInfo(this.token).subscribe((info) => {
      console.log(info);
      this.sublocationId = info['data']['location_id'];
      this.parentLocationId = info['data']['parent_location_id'];
      this.invitedByUserId = info['data']['invited_by_user'];
      this.first_name = info['data']['first_name'];
      this.last_name = info['data']['last_name'];
      this.email = info['data']['email'];
      this.account_name = info['data']['tenancy_name'];
      this.location = info['data']['sub_location_name'] + ', ' + info['data']['parent_location_name'];

      this.formTenantProfile.controls['first_name'].setValue(this.first_name);
      this.formTenantProfile.controls['last_name'].setValue(this.last_name);
      this.formTenantProfile.controls['email'].setValue(this.email);
      this.formTenantProfile.controls['account_name'].setValue(this.account_name);
      this.formTenantProfile.controls['location'].setValue(this.location);
      this.formTenantProfile.controls['billing_country'].setValue( this.defaultCountry );
      $('select').material_select('update');
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

  onCloseTenantProfileCompletion() {
    this.modalSignUp.modal('close');
  }

  completeProfile(tenantForm: NgForm) {
    console.log(tenantForm);
    if (tenantForm.controls.password.value !==
      tenantForm.controls.confirmPassword.value) {
        setTimeout(() => {
          this.modalSignUp.modal('close');
        }, 200);
        this.router.navigate(['/login']);
    }
    const body = {
      'first_name': tenantForm.controls.first_name.value,
      'last_name':  tenantForm.controls.last_name.value,
      'email': tenantForm.controls.email.value,
      'account_name': tenantForm.controls.account_name.value,
      'location_id': this.sublocationId,
      'parent_location_id': this.parentLocationId,
      'invited_by_user': this.invitedByUserId,
      'building_number': tenantForm.controls.building_number.value,
      'billing_street': tenantForm.controls.street.value,
      'billing_city': tenantForm.controls.city.value,
      'billing_state': tenantForm.controls.billing_state.value,
      'billing_postal_code': tenantForm.controls.postal_code.value,
      'billing_country': tenantForm.controls.billing_country.value,
      'account_domain': tenantForm.controls.account_domain.value,
      'str_password': tenantForm.controls.password.value,
      'token': this.token
    };
    console.log(body);
    this.signupService.signTenantUp(body).subscribe((data) => {
      this.router.navigate(['/login']);
    }, (e) => {
      console.log(e);
    });

  }
}
