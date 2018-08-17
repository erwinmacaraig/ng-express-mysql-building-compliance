import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

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
  constructor(private router: Router, private route: ActivatedRoute) {
    this.message = 'You have successfully verified your account.';

    if (this.route.snapshot.queryParams['account-validation']) {
      this.message = 'You have successfully validated the account.';
    }

    if (this.route.snapshot.queryParams['account-validation-invalid-token']) {
      this.message = 'Token is invalid';
      this.showClose = true;
      this.showCheckIcon = false;
    }

    if( this.route.snapshot.queryParams['user-location-verification'] ){
      this.isUserVerification = true;
      if( this.route.snapshot.queryParams['user-location-verification'] == 'true' ){
        this.message = 'You have successfully validated the user.';
      }else{
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
      } else {
        this.showCheckIcon = false;
        this.message = 'Invalid token used.';
        this.showClose = true;
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

  }

  closeWindow(){
    window.close();
  }

  ngOnInit() {
    this.modalElem = $('#modalMsg');
		// init modal
		this.modalElem.modal({
			dismissible: false
		});

    this.modalElem.modal('open');

  }

}
