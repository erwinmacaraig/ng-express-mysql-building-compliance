import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

declare var $: any;

@Component({
  selector: 'app-email-success-verficiation',
  templateUrl: './email-success-verficiation.component.html',
  styleUrls: ['./email-success-verficiation.component.css']

})
export class EmailSuccessVerficiationComponent implements OnInit {
  public showCheckIcon = true;
  public showClose = false;
  private modalElem;
  public message;
  public isUserVerification = false;
  public notification_token = '';
  public isAccountRole = false;
  public content = 'main';
  public showLogin = false;
  constructor(private router: Router, private route: ActivatedRoute, private authService: AuthService) {


  }

  closeWindow(){
    window.close();
  }

  showNotificationWardenList() {
    setTimeout(() => {
      this.router.navigate(['/dashboard', 'notification-warden-list', this.notification_token]);
    }, 1500);

  }

  ngOnInit() {
    this.modalElem = $('#modalMsg');
		// init modal
		this.modalElem.modal({
			dismissible: false
		});

    this.modalElem.modal('open');
    //
    this.message = 'You have successfully verified your account.';

    if (this.route.snapshot.queryParams['account-validation']) {
      this.message = 'You have successfully validated the account.';
    }

    if (this.route.snapshot.queryParams['account-validation-invalid-token']) {
      this.message = 'Token is invalid';
      this.showClose = true;
      this.showCheckIcon = false;
    }

    if (this.route.snapshot.queryParams['user-location-verification'] ){
      this.isUserVerification = true;
      if (this.route.snapshot.queryParams['user-location-verification'] == 'true' ){
        this.message = 'You have successfully validated the user.';
      } else {
        this.showCheckIcon = false;
        this.message = 'This may already verified or this request is invalid';
        this.showClose = true;
      }
    }

    if (this.route.snapshot.queryParams['verify-notified-user']) {
      const verification = this.route.snapshot.queryParams['verify-notified-user'];
      this.isUserVerification = true;
      if (verification == 1) {
        this.message = 'You successfully validated your tenancy.';

        if (this.route.snapshot.queryParams['token']) {
          this.notification_token = this.route.snapshot.queryParams['token'];

          const role = this.authService.getHighestRankRole();
          if (role <= 2) {
            this.isAccountRole = true;
          }

          if(this.isUserVerification && this.isAccountRole){
             this.content = 'steps';
          }
        }

      } else if (verification == 2) {
        this.showCheckIcon = false;
        this.message = `Invalid token used.

        There is no such token exists in our system.
        `;
        this.showClose = true;
        this.showLogin = true;
      } 
       else {
        this.showCheckIcon = false;
        this.message = `Your token has expired.

        For security reasons, tokens only remain valid for 1 use or 24 hours.

        Don't worry though, you can still manage your compliance by logging in to EvacConnect
        `;
        this.showClose = true;
        this.showLogin = true;
      }
    }

    if (this.route.snapshot.queryParams['query-notified-user']) {
      const queryCode = this.route.snapshot.queryParams['query-notified-user'];
      this.isUserVerification = true;
      if (queryCode == 0) {
        this.showCheckIcon = false;
        this.message = 'Invalid user';
        this.showClose = true;
      }
    }
    //





  }

}
