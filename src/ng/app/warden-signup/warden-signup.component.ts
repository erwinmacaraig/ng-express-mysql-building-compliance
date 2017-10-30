import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { InvitationCode } from '../models/invitation-code';
import { PlatformLocation } from '@angular/common';
import { SignupService } from '../services/signup.service';
import { AccountTypes } from '../models/account.types';

declare var $: any;
const role_id = 3;

@Component({
  selector: 'app-warden-signup',
  templateUrl: './warden-signup.component.html',
  styleUrls: ['./warden-signup.component.css']
})
export class WardenSignupComponent implements OnInit, OnDestroy,  AfterViewInit {
  private baseUrl: String;
  emailTaken = false;
  public invitationCodePresent = false;
  public inviCode;
  private UserType = new AccountTypes();
  arrUserType = Object.keys(this.UserType.getTypes()).map((key) => this.UserType.getTypes()[key] );

  modalLoader = {
    showLoader : true,
    loadingMessage : 'Signing up...',
    showMessage : false,
    iconColor: 'green',
    icon: 'check',
    message: 'Sign up successful!'
  };

  elems = {};

  constructor(private router: Router, private signupService: SignupService) {

    if (!this.signupService.getInvitationCode()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.elems['modalSignup'] = $('#modalSignup');
    this.elems['modalLoader'] = $('#modalLoader');

    if (this.signupService.getInvitationCode()) {
      this.inviCode = this.signupService.getInvitationCode();
      this.invitationCodePresent = true;
      this.inviCode.role_text = this.UserType.getTypeName()[role_id];
    } else {
      this.inviCode = new InvitationCode();
    }
    console.log(this.signupService.getInvitationCode());
  }

  ngAfterViewInit() {
    const modalOpts = {
      dismissible: false,
      startingTop: '0%', // Starting top style attribute
      endingTop: '5%'
    };
    this.elems['modalSignup'].modal(modalOpts);
    modalOpts.endingTop = '25%';
    this.elems['modalLoader'].modal(modalOpts);
    this.elems['modalSignup'].modal('open');
  }

  onCloseSelfSignUp() {
    this.signupService.invalidateInvitationCode();
    this.inviCode = new InvitationCode();
    this.invitationCodePresent = false;
    this.elems['modalSignup'].modal('close');
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.signupService.invalidateInvitationCode();
    this.invitationCodePresent = false;
    // this.elems['modalSignup'].modal('close');
    // this.elems['modalLoader'].modal('close');
  }

  signUpFormSubmit(f: NgForm, event) {
    event.preventDefault();
    const controls = f.controls;
    const userData = {
      'first_name': controls.first_name.value,
      'last_name': controls.last_name.value,
      'user_email': controls.user_email.value,
      'password': controls.password.value,
      'confirm_password': controls.confirm_password.value,
      'location_id': this.inviCode.location_id,
      'account_id': this.inviCode.account_id,
      'role_id': this.inviCode.role_id || 3,
      'invi_code_id': this.inviCode.invitation_code_id
    };
    if (f.valid) {
      this.modalLoader.showLoader = true;
      this.modalLoader.showMessage = false;

      this.elems['modalSignup'].modal('close');
      this.elems['modalLoader'].modal('open');

      this.emailTaken = false;
      this.signupService.sendUserData(userData, (res) => {
        this.signupResponse(res, f);
      });
    } else {
      for (let x in f.controls) {
        f.controls[x].markAsDirty();
      }
    }
  }

  resetFormElement(form) {
    form.reset();
    $('.invalid').removeClass('invalid');
    $('label.active').removeClass('active');
  }

  signupResponse(res, f) {
    this.modalLoader.showLoader = false;
    this.modalLoader.showMessage = true;
    console.log(res.data);
    if (res.status) {
      this.modalLoader.message = 'Sign up successful!';
      console.log(res.data);
      this.modalLoader.iconColor = 'green';
      this.modalLoader.icon = 'check';
      this.resetFormElement(f);
      this.elems['modalLoader'].modal('open');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } else {
      this.modalLoader.iconColor = 'red';
      this.modalLoader.icon = 'clear';
      for (let i in res.data) {
        if (i === 'email_taken') {
          this.emailTaken = true;
          this.modalLoader.message = 'The email that you used is already taken.';
        } else {
          f.controls[i].markAsDirty();
        }
      }
      this.modalLoader.message = res.message;
      setTimeout(() => {
        this.elems['modalLoader'].modal('close');
        this.elems['modalSignup'].modal('open');
      }, 2000);
    }
  }
}
