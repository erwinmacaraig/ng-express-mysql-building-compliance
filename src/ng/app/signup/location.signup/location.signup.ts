import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
declare var $: any;

@Component({
  selector: 'app-location-signup',
  templateUrl: './location.signup.html',
  styleUrls: ['./location.signup.css']
})
export class LocationSignupComponent implements OnInit, OnDestroy, AfterViewInit {

    constructor() { }

    ngOnInit() {
    }

    ngAfterViewInit(){
        $('#modalLocationSignup').modal({ dismissible: false });
        $('#modalLocationSignup').modal('open');
    }

    ngOnDestroy(){
        
    }

}
