import { Component, OnInit, AfterViewInit } from '@angular/core';
import { PersonInfoResolver } from '../../services/person-info.resolver';
import { Observable } from 'rxjs/Observable';
import { Person } from '../../models/person.model';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';

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
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
      this.accountTypes = new AccountTypes().getTypesInArray();
      this.route.data.subscribe(data => {
         this.person = new Person(data.personInfo.first_name, data.personInfo.last_name, data.personInfo.email,
          data.personInfo.phone_number, data.personInfo.user_name);
      });
      console.log(this.person);

  }
  onSumbitModifyPersonInfo() {

  }

  onResetForm() {
    console.log('I was called3.');
    console.log(this.personInfoForm);

    this.personInfoForm.resetForm(this.person);

  }

  ngAfterViewInit() {
    $('select').prop('disabled', false).material_select();
    if (!$('.vertical-m').hasClass('fadeInRight')) {
      $('.vertical-m').addClass('fadeInRight animated');
    }
  }



}
