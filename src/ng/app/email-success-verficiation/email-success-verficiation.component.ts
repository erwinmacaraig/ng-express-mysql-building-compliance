import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-email-success-verficiation',
  templateUrl: './email-success-verficiation.component.html',
  styleUrls: ['./email-success-verficiation.component.css']
})
export class EmailSuccessVerficiationComponent implements OnInit {
  public showCheckIcon = true;
	private modalElem;
  constructor(private router: Router) { }

  ngOnInit() {
    this.modalElem = $('#modalMsg');
		// init modal
		this.modalElem.modal({
			dismissible: false
		});

    this.modalElem.modal('open');   

  }

}
