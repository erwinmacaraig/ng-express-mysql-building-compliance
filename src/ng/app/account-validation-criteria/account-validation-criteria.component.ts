import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-account-validation-criteria',
  templateUrl: './account-validation-criteria.component.html',
  styleUrls: ['./account-validation-criteria.component.css']
})
export class AccountValidationCriteriaComponent implements OnInit, OnDestroy, AfterViewInit {
  public trpList = [];
  public frpList = [];
  private frpListSubscription;
  private trpListSubscription;
  private location = 0;
  private account = 0;
  toggleFRP: boolean = false;
  toggleTRP: boolean = false;
  isFRP = false;

  private elems = {};

  private modalLoader = {
    showLoader : true,
    loadingMessage : 'Loading...',
    showMessage : false,
    iconColor: 'green',
    icon: 'check',
    message: ''
};

  constructor(private route: ActivatedRoute, private dataProvider: PersonDataProviderService) {

    this.location = this.route.snapshot.queryParams['location_id'] || 0;
    this.account = this.route.snapshot.queryParams['account_id'] || 0;
    console.log(this.account);
    console.log(this.location);
    this.frpListSubscription = this.dataProvider.listAllFRP(this.account).subscribe((data) => {
      this.frpList = data['data'];
      console.log(data['data']);
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });

    this.trpListSubscription = this.dataProvider.listAllTRP(this.location, this.account).subscribe((data) => {
      this.trpList = data['data'];
      console.log(data['data']);
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });

   }

  ngOnInit() {
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
    console.log(this.frpList);

  }
  public listAllTRP() {
    $('#TRPs').material_select();
  }

  ngOnDestroy() {
    this.frpListSubscription.unsubscribe();
  }

  onSubmitForValidation() {}


  toggleFRPCtrl() {
    console.log('old value is ' + this.toggleFRP);
    this.toggleFRP = true;
    this.toggleTRP = false;
    if (this.toggleFRP) {
      console.log('I am here');
      $('#FRPs').material_select();

    }
    console.log('new value is ' + this.toggleFRP);
  }

  toggleTRPCtrl() {
    this.toggleFRP = false;
    this.toggleTRP = true;
    if (this.toggleTRP) {
      $('#TRPs').material_select();
    }
  }


}
