import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';


import { AdminService } from './../../services/admin.service';
declare var $: any;

@Component({
  selector: 'app-admin-side-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css'],
  providers: [AdminService]
})
export class NavComponent implements OnInit, OnDestroy, AfterViewInit {

  constructor() {}

  ngOnInit() {

  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    $('.button-collapse').sideNav({
      menuWidth: 300, // Default is 300
      edge: 'left', // Choose the horizontal origin
      closeOnClick: false, // Closes side-nav on <a> clicks, useful for Angular/Meteor
      draggable: true // Choose whether you can drag to open on touch screens
    }
    );
    // START OPEN
    // $('.button-collapse').sideNav('show');
  }

}
