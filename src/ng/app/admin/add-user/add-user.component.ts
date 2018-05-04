import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AdminService } from './../../services/admin.service';
declare var $: any;

@Component({
  selector: 'app-admin-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
  providers: [AdminService]
})
export class AddAccountUserComponent  implements OnInit {
  accountId = 0;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((parameters) => {
      this.accountId = parameters['accntId'];

      // get all locations tagged to this account
      // buildings
      // levels
    });
  }
}

