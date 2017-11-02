import { Component, OnInit } from '@angular/core';
import { PersonDataProviderService } from '../services/person-data-provider.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-account-validation-criteria',
  templateUrl: './account-validation-criteria.component.html',
  styleUrls: ['./account-validation-criteria.component.css']
})
export class AccountValidationCriteriaComponent implements OnInit {

  constructor(private dataProvider: PersonDataProviderService) { }

  ngOnInit() {

  }

  public listAllFRP() {
    this.dataProvider.listAllFRP().subscribe((data) => {
    }, (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }

}
