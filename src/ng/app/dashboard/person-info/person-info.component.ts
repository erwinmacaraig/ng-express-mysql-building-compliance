import { Component, OnInit } from '@angular/core';
import { PersonInfoResolver } from '../../services/person-info.resolver';
import { Observable } from 'rxjs/Observable';
import { Person } from '../../models/person.model';
import { ActivatedRoute } from '@angular/router';

declare var $: any;

@Component({
  selector: 'app-person-info',
  templateUrl: './person-info.component.html',
  styleUrls: ['./person-info.component.css']
})
export class PersonInfoComponent implements OnInit {
  public person;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    $('select').material_select();
      if (!$('.vertical-m').hasClass('fadeInRight')) {
        $('.vertical-m').addClass('fadeInRight animated');
      }
      this.route.data.subscribe(data => {
        this.person = new Person(data.personInfo.first_name, data.personInfo.last_name, data.personInfo.email,
          data.personInfo.phone_number, data.personInfo.user_name);

      });

  }



}
