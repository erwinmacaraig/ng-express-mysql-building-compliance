import { Component, OnInit, AfterViewInit } from '@angular/core';
import { PersonInfoResolver } from '../../services/person-info.resolver';
import { Observable } from 'rxjs/Observable';
import { Person } from '../../models/person.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { AccountTypes } from '../../models/account.types';

declare var $: any;

@Component({
  selector: 'app-person-info',
  templateUrl: './person-info.component.html',
  styleUrls: ['./person-info.component.css']
})
export class PersonInfoComponent implements OnInit, AfterViewInit {
  @ViewChild('f') personInfoForm: NgForm;
  public person;
  public accountTypes;
  editCtrl = false;
  private baseUrl;
  public message;
  constructor(private route: ActivatedRoute,
              private http: HttpClient,
              private platformLocation: PlatformLocation) {

    this.baseUrl = (platformLocation as any).location.origin;

  }

  ngOnInit() {
      this.route.data.subscribe(data => {
         this.person = new Person(data.personInfo.first_name,
          data.personInfo.last_name,
          data.personInfo.email,
          data.personInfo.phone_number,
          data.personInfo.occupation,
          data.personInfo.account_name,
          data.personInfo.user_name);
      }, (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          alert('There was a problem getting your account.');
        } else {
            alert(`Backend returned code ${err.status}, body was: ${err.error}`);
            console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        }
      }
    ); // end of subscribe
  }
  onSumbitModifyPersonInfo(f: NgForm) {
    const header = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    this.http.patch(this.baseUrl + '/update-person-info', {
      'first_name': f.value.first_name,
      'last_name': f.value.last_name,
      'occupation': f.value.occupation,
      'email': f.value.email,
      'phone_number': f.value.phone_number
    }, {
      headers: header
    }).subscribe(data => {
      this.person.first_name = f.value.first_name;
      this.person.last_name = f.value.last_name;
      this.person.email = f.value.email;
      this.person.phone_number = f.value.phone_number;
      this.person.occupation = f.value.occupation;
      this.onResetForm();
      alert('Update Successful');
      }, (err: HttpErrorResponse) => {
          if (err.error instanceof Error) {
            alert('There was a problem with the udpate query.');
          } else {
              alert(`Backend returned code ${err.status}, body was: ${err.error}`);
              console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
          }
      } // end HttpErrorResponse
    );
   } // emd onSubmitModifyPersonInfo

  onResetForm() {
    this.editCtrl = false;
    this.personInfoForm.resetForm(this.person);

  }

  ngAfterViewInit() {
    // $('select').prop('disabled', false).material_select();
    if (!$('.vertical-m').hasClass('fadeInRight')) {
      $('.vertical-m').addClass('fadeInRight animated');
    }
  }





}
