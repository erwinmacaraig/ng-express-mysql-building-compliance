import { Component, OnInit } from '@angular/core';

import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { PersonInfoResolver } from '../../services/person-info.resolver';
import { Observable } from 'rxjs/Observable';

import { Person } from '../../models/person.model';
import { ActivatedRouteSnapshot, RouterStateSnapshot, ActivatedRoute } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-person-info',
  templateUrl: './person-info.component.html',
  styleUrls: ['./person-info.component.css'],
  // providers: [PersonDataProviderService]
  providers: [PersonDataProviderService, PersonInfoResolver]
})
export class PersonInfoComponent implements OnInit {

  public person;

  /*
  constructor(private personDataService: PersonDataProviderService) {
    const personSubscription = this.personDataService.getPersonInfo();
    personSubscription.subscribe( data => {
      console.log(data);
      this.person = new Person(data.first_name, data.last_name, data.email, data.phone_number, data.user_name);
      this.dataFullyLoaded = true;
    });
  }
  */

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    $('select').material_select();
      if (!$('.vertical-m').hasClass('fadeInRight')) {
        $('.vertical-m').addClass('fadeInRight animated');
      }
      // this.route.paramMap.subscribe(data => { console.log(data); });

      this.route.data.subscribe(data => {
        this.person = new Person(data.personInfo.first_name, data.personInfo.last_name, data.personInfo.email,
          data.personInfo.phone_number, data.personInfo.user_name);

      });

  }



}
