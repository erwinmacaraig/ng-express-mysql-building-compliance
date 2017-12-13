import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';

declare var $: any;
@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.css'],
  providers: [UserService]
})
export class LocationComponent implements OnInit, OnDestroy {
  showEmailVerification = false;
  showResponse = false;
  responseMessage = '';
  public userData: Object;

   constructor(private userService: UserService, private auth: AuthService, private signupServices: SignupService) {
    this.userData = this.auth.getUserData();
   }

   ngOnInit() {
    this.userService.checkUserVerified( this.userData['userId'] , (response) => {
      console.log(response);
      if (response.status === false && response.message === 'not verified') {
        this.showEmailVerification = true;
        setTimeout(() => {
          $('.alert-email-verification').removeAttr('style').css('opacity', '1');
        }, 1000);
      } else {
        localStorage.removeItem('showemailverification');
      }
      });
   }

   ngOnDestroy() {}

   resendEmailVerification() {
    this.showResponse = true;
    this.responseMessage = 'Re-sending email for verification';
    this.signupServices.resendEmailVerification(this.userData['userId'], (response) => {
      this.responseMessage = response.message;
      setTimeout(() => {
        this.showResponse = false;
      }, 3000);
    });
  }

}
