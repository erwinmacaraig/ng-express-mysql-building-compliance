import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../environments/environment';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { SignupService } from '../services/signup.service';
import { EncryptDecryptService } from '../services/encrypt.decrypt';

declare var $: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [EncryptDecryptService]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginMessageStatus: string;
  showInvalid = false;
  showInvalidCode = false;
  showErrorOccured = false;
  showSuccess = false;
  
  verification = {
    loader : false,
    success : false,
    buttons : true
  };
  public userRoles;
  errorOccuredMessage = '';
  private subscription;
  private baseUrl: String;
  private userId = 0;
  public has_account_role = false;
  constructor(public http: HttpClient,
    private auth: AuthService,
    private signupService: SignupService,
    private platformLocation: PlatformLocation,
    private encryptDecrypt: EncryptDecryptService,
    private router: Router) {
    this.baseUrl = environment.backendUrl;
  }

  ngOnInit() {
    this.auth.removeToken();
    $('.modal-overlay').remove();
    $('#modalSendVerification').modal({
      dismissible : false,
      startingTop : '0%',
      endingTop: '25%'
    });
  }

  ngAfterViewInit(){
    $('#username').on('focus', () => {
      $('#username').parent('.username-container').addClass('focus');
    });

    $('#username').on('blur', () => {
      $('#username').parent('.username-container').removeClass('focus');
    });

    $('#password').on('focus', () => {
      $('#password').parent('.password-container').addClass('focus');
    });

    $('#password').on('blur', () => {
      $('#password').parent('.password-container').removeClass('focus');
    });
  }

  signInFormSubmit(f: NgForm) {
    this.showInvalid = false;
    this.showErrorOccured = false;
    this.showSuccess = false;
    this.errorOccuredMessage = '';

    interface UserLoginResponse {
      status: string;
      message: string;
      token: string;
      expiresIn: number;
      data: any;
    }

    if (f.invalid) {
      this.showInvalid = true;
      return false;
    }

    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.post<UserLoginResponse>(this.baseUrl + '/authenticate', {
      'username': f.value.username,
      'password': f.value.password,
      'keepSignedin': f.value.keepSignedin
    }, {
      headers: header
    }).subscribe(data => {
      this.showSuccess = true;
      this.auth.setToken(data.token);
      this.auth.setAuthTimer(data.expiresIn);
      this.auth.setUserData(data.data);
      this.userRoles = data.data['roles'];
    
      for(let i in this.userRoles){
        if( this.userRoles[i]['role_id'] == 1 ){
          this.has_account_role = true
        }
        if( this.userRoles[i]['role_id'] == 2 ){
          this.has_account_role = true;
        }            
      }
    
    // checks how many buildings
    if (this.has_account_role) {
      if ((data.data['buildings'] as number[]).length > 1) {
        // go to location listing
        this.router.navigate(['/location', 'list']);
      } else {
        // go directly to compliance
        this.router.navigate(['/location', 'compliance', 'view', this.encryptDecrypt.encrypt(data.data['buildings'][0])]); 
      }
    } else {
      this.router.navigate(['/trainings', 'new-training']);
    }
      //this.router.navigate(['']);






    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        // todo error message for IO error
        this.loginMessageStatus = `An error occurred: ${err.error.message}`;
        console.log('An error occurred:', err.error.message);
        this.showInvalid = false;
        this.showErrorOccured = true;
        this.errorOccuredMessage = this.loginMessageStatus;

      } else {
        let errJSON = (typeof err.error == 'object') ? err.error : JSON.parse(JSON.stringify(err.error));
        if(errJSON.verified === false){
          $('#modalSendVerification').modal('open');
          this.userId = errJSON.data[2];
        }else{
          this.showInvalid = true;
        }
        
        // todo error message for invalid user
        this.loginMessageStatus = `${err.error.message}`;
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        this.showErrorOccured = false;
      }
    });

  }

  resendVerification(){
    this.verification.loader = true;
    this.verification.buttons = false;
    this.signupService.resendEmailVerification(this.userId, (response) => {
      this.verification.loader = false;
      this.verification.success = true;
      setTimeout(() => {
        this.verification.success = false;
        this.verification.buttons = true;
        $('#modalSendVerification').modal('close');
      }, 3000);
    });

  }

  invitationCodeForm(f: NgForm) {
    this.subscription = this.signupService.getPersonInvitationCode(f.value.code).subscribe((data) => {
      this.signupService.setInvitationCode(data['data']);
      this.router.navigate(['/signup/warden-signup']);
    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
        this.showInvalidCode = true;

      } else {
        this.showInvalidCode = true;
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
