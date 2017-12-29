import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { SignupService } from './../../services/signup.service';

declare var $: any;
@Component({
  selector: 'app-warden-invitation-form',
  templateUrl: './warden-invite.component.html',
  styleUrls: ['./warden-invite.component.css']
})
export class WardenInvitationFormComponent implements OnInit, OnDestroy, AfterViewInit {
  public modalSignUp;
  public firstname;
  public lastname;
  public email: string;
  public password;
  public confirmPassword;
  public token;
  public account;
  private account_id;
  public parentLocations;
  public sublocations;
  public parent;
  public sublocation;
  public signupSubscription;
  public em_role_id;

  @ViewChild('formWardenProfile') formWardenProfile: NgForm;
  ngOnInit() {

    this.modalSignUp = $('#modalSignup');
    this.signupSubscription =  this.signupService.retrieveWardenInvitationInfo(this.token).subscribe(
      (data) => {
        this.em_role_id = data['role_id'];
       this.account_id = data['account_id'];
       this.formWardenProfile.controls['email'].setValue(data['email']);
       this.formWardenProfile.controls['account'].setValue(data['account']);
       this.parentLocations = data['locations'];
       console.log(this.parentLocations);
       console.log(data);
       setTimeout(() => {
        $('select').material_select();
        this.onSelectedMainBuilding();
       }, 300);
      },
      (err) => { console.log(err); }
    );
  }

  constructor(private router: Router, private signupService: SignupService,
              private route: ActivatedRoute,
              private http: HttpClient) {
                this.route.params.subscribe( params => {
                 this.token = params['token'];
                });
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
  ngOnDestroy() {}

  onCloseWardenProfileCompletion() {
    this.modalSignUp.modal('close');
    this.router.navigate(['/login']);
  }

  completeProfile(f: NgForm) {
    console.log(f);
    const formData = {
      'first_name': f.controls.first_name.value,
      'last_name': f.controls.last_name.value,
      'email': f.controls.email.value,
      'parent_location': this.parentLocations[$('#mainBuilding').val()].location_id,
      'sublocation': $('#sublocation').val(),
      'account_id': this.account_id,
      'token': this.token,
      'password': f.controls.password.value,
      'confirmPassword': f.controls.confirmPassword.value,
      'em_role': this.em_role_id

    };
    this.signupService.signWardenUp(formData).subscribe(() => {

      this.modalSignUp.modal('close');
      this.router.navigate(['/login']);
    }, (err) => {
      console.log('There was an error');
    });


  }

  public onSelectedMainBuilding() {
    let i = 0;
    $('#mainBuilding').on('change', () => {
      // console.log($('#mainBuilding').val());
      i = $('#mainBuilding').val();
      this.sublocations = this.parentLocations[i].sublocations;
      console.log(this.sublocations);
      setTimeout(() => {
        $('#sublocation').material_select();
       }, 300);

    });


  }
}

