import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { ForgotPasswordService } from '../services/forgotpassword.service';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
	selector: 'app-forgotpassword',
	templateUrl: './forgotpassword.component.html',
	styleUrls: ['./forgotpassword.component.css'],
	providers: [ForgotPasswordService]
})
export class ForgotpasswordComponent implements OnInit {

	private baseUrl: String;
	private modalElem;
	private options;
	private headers;
	public showCheckIcon = false;
	public showCloseIcon = false;
	public message = '';
  public UserType: Object;
  public showResendLinkText = true;

  public user_email: string;

	constructor(private platformLocation: PlatformLocation, private fpService:ForgotPasswordService, private http: HttpClient) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
	}

	ngOnInit() {

		this.modalElem = $('#modalMsg');
		// init modal
		this.modalElem.modal({
			dismissible: false
		});
	}

	resetFormElement(form){
	    form.reset();
	    this.enableElem();
	    $('.invalid').removeClass('invalid');
	}

	enableElem(){
		$('.btn-submit').html('Reset Password').prop('disabled', false);
		$('input').each(function(){ $(this).prop('disabled', false); });
	}

	disableFormElement(){
	    let templateLoader = `<div class="preloader-wrapper small active" style="width: 24px; height: 24px; margin-top:10px;">
	        <div class="spinner-layer spinner-blue--only">
	          <div class="circle-clipper left">
	            <div class="circle" ></div>
	          </div><div class="gap-patch">
	            <div class="circle"></div>
	          </div><div class="circle-clipper right">
	            <div class="circle"></div>
	          </div>
	        </div>
	      </div>`;
		$('.btn-submit').html(templateLoader).prop('disabled', true);

		$('input').each(function(){ $(this).prop('disabled', true); });
	  }

	resetPassFormSubmit(f: NgForm, event){
		event.preventDefault();
		this.showCheckIcon = false;
		this.showCloseIcon = false;
		if(f.valid){
      this.disableFormElement();
      this.user_email = f.controls.email.value;
			this.fpService.sendData({ email : f.controls.email.value }, (res) => {
				this.message = res.message;
				if(res.status){
					this.showCheckIcon = true;
					this.resetFormElement(f);
				}else{
					this.showCloseIcon = true;
					this.enableElem();
				}
				this.modalElem.modal('open');
			});
		}
  }

  onResendPasswordLink() {
    this.showCheckIcon = false;
    this.showCloseIcon = false;
    this.showResendLinkText = false;
    this.fpService.sendData({ email : this.user_email }, (res) => {
      this.message = res.message;
      this.showResendLinkText = true;
      if (res.status) {
        this.showCheckIcon = true;
      } else {
        this.showCloseIcon = true;
        this.enableElem();
      }
      this.modalElem.modal('open');
    });
  }

}
