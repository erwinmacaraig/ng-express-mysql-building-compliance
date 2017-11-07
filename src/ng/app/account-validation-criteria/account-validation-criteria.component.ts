import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { PlatformLocation } from '@angular/common';

import { HttpClient, HttpHeaders, HttpResponse, HttpRequest } from '@angular/common/http';

declare var $: any;

@Component({
  selector: 'app-account-validation-criteria',
  templateUrl: './account-validation-criteria.component.html',
  styleUrls: ['./account-validation-criteria.component.css']
})
export class AccountValidationCriteriaComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('f') validationForm: NgForm;
  public trpList = [];
  public frpList = [];
  private frpListSubscription;
  private trpListSubscription;
  private location = 0;
  private account = 0;
  toggleFRP = false;
  toggleTRP = false;
  public emailDomain;
  public baseUrl;
  private elems = {};
  public errMsg = '';

  public modalLoader = {
    showLoader : true,
    loadingMessage : '',
    showMessage : false,
    iconColor: 'green',
    icon: 'check',
    message: ''
  };
  public showCheckIcon = true;
  private modalElem;

  constructor(private route: ActivatedRoute,
    private dataProvider: PersonDataProviderService,
    private authService: AuthService,
    private http: HttpClient,
    private platformLocation: PlatformLocation
  ) {

    this.baseUrl = (platformLocation as any).location.origin;
    this.emailDomain = this.authService.getUserData()['email'];
    this.emailDomain =  this.emailDomain.substr(this.emailDomain.indexOf('@') + 1, this.emailDomain.length);
    this.location = this.route.snapshot.queryParams['location_id'] || 0;
    this.account = this.route.snapshot.queryParams['account_id'] || 0;

    this.frpListSubscription = this.dataProvider.listAllFRP(this.account).subscribe((data) => {
      this.frpList = data['data'];
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });

    this.trpListSubscription = this.dataProvider.listAllTRP(this.location, this.account).subscribe((data) => {
      this.trpList = data['data'];
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });

   }

  ngOnInit() {
    this.modalElem = $('#modalMsg');
  }

  ngAfterViewInit() {

    this.elems['modalSignup'] = $('#modalSignup');
    const  modalOpts = {
      dismissible: false,
      startingTop: '0%', // Starting top style attribute
      endingTop: '5%'
    };

    // init modal
    this.elems['modalSignup'].modal(modalOpts);
    modalOpts.endingTop = '25%';
    this.elems['modalSignup'].modal('open');

  }

  public listAllFRP() {
    $('#FRPs').material_select();

  }
  public listAllTRP() {
    $('#TRPs').material_select();
  }

  ngOnDestroy() {
    this.frpListSubscription.unsubscribe();
  }

  onSubmitForValidation() {
    this.errMsg = '';
    console.log(this.validationForm);
    const emailTo = this.validationForm.controls.emailcriteria.value;
    let approvalFrom = 0;

    if ( emailTo === 'FRPs' ) {
      approvalFrom = $('#FRPs').val();
    } else if (emailTo === 'TRPs') {
      approvalFrom = $('#TRPs').val();
    }

    if (this.validationForm.controls.emailcriteria.invalid) {
      this.errMsg = `Please choose between verified by another FRP/TRP of your account.

      `;
    }
    if (this.validationForm.controls.trp_code.invalid) {
      this.errMsg = this.errMsg + `Please provide the TRP Code for this account.`;
    }
    if (this.validationForm.valid) {

      this.modalElem.modal({
        dismissible: false
      });
      const userData = {
        'approvalFrom': approvalFrom,
        'trp_code': this.validationForm.controls.trp_code.value,
        'account_id': this.account,
        'location_id': this.location
      };
      const header = new HttpHeaders({
        'Content-Type': 'application/json'
      });

      this.http.post<any>(this.baseUrl + '/validate-info', userData, {
          headers: header
      }).subscribe((data) => {
      this.elems['modalSignup'].modal('open');
      this.modalElem.modal('open');

      });
    }
  }


  toggleFRPCtrl() {
    this.toggleFRP = true;
    this.toggleTRP = false;
    if (this.toggleFRP) {
      $('#FRPs').material_select();

    }
  }

  toggleTRPCtrl() {
    this.toggleFRP = false;
    this.toggleTRP = true;
    if (this.toggleTRP) {
      $('#TRPs').material_select();
    }
  }


}
