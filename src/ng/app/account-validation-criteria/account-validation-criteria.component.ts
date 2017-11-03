import { Component, OnInit, OnDestroy } from '@angular/core';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-account-validation-criteria',
  templateUrl: './account-validation-criteria.component.html',
  styleUrls: ['./account-validation-criteria.component.css']
})
export class AccountValidationCriteriaComponent implements OnInit, OnDestroy {
  public trpList = [];
  public frpList = [];
  private frpListSubscription;
  private trpListSubscription;
  private location = 0;
  private account = 0;
  constructor(private route: ActivatedRoute, private dataProvider: PersonDataProviderService) {

    this.location = this.route.snapshot.queryParams['location'] || 0;
    this.account = this.route.snapshot.queryParams['account'] || 0;
    this.frpListSubscription = this.dataProvider.listAllFRP().subscribe((data) => {
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
    $('select').material_select();

  }

  public listAllFRP() {
    $('#FRPs').material_select();
    console.log(this.frpList);

    /*
    this.route.data.subscribe((data) => {
      console.log(data);
      console.log(data['frpList']['data']);
      console.log(data['frpList']);
      this.trpList = data['frpList']['data'];
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
    */
  }
  public listAllTRP() {
    $('#TRPs').material_select();
  }

  ngOnDestroy() {
    this.frpListSubscription.unsubscribe();
  }


}
