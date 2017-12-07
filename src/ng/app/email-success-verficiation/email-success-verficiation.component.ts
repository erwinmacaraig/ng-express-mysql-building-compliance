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
  private modalElem;
  public message;
  public isUserVerification = false;
  constructor(private router: Router, private route: ActivatedRoute) {
    this.message = 'You have successfully verified your account.';

    if (this.route.snapshot.queryParams['account-validation']) {
      this.message = 'You have successfully validated the account.';
    }

    if( this.route.snapshot.queryParams['user-location-verification'] ){
      this.isUserVerification = true;
      if( this.route.snapshot.queryParams['user-location-verification'] == 'true' ){
        this.message = 'You have successfully validated the user.';
      }else{
        this.showCheckIcon = false;
        this.message = 'This may already verified or this request is invalid';
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
