import { Component, OnInit } from '@angular/core';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-account-validation-criteria',
  templateUrl: './account-validation-criteria.component.html',
  styleUrls: ['./account-validation-criteria.component.css']
})
export class AccountValidationCriteriaComponent implements OnInit {
  public trpList = [];
  public frpList = [];
  constructor(private route: ActivatedRoute) {
    // ,private dataProvider: PersonDataProviderService
    this.listAllFRP();
   }

  ngOnInit() {
    $('select').material_select();
  }

  public listAllFRP() {
    this.route.data.subscribe((data) => {
      console.log(data);
      console.log(data['frpList']['data']);
      console.log(data['frpList']);
      this.trpList = data['frpList']['data'];
      $('#FRPs').material_select();
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }



}
