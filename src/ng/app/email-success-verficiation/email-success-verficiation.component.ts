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
  constructor(private router: Router, private route: ActivatedRoute) {
    this.message = 'You have successfully verified your account.';

    if (this.route.snapshot.queryParams['account-validation']) {
      this.message = 'You have successfully validated the account.';
    }

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
