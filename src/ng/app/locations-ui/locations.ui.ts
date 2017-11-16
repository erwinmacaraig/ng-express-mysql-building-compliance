import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-locations-ui',
  templateUrl: './locations.ui.html',
  styleUrls: ['./locations.ui.css']
})
export class LocationsUiComponent implements OnInit, OnDestroy {

	constructor(){

	}

	ngOnInit(){}

	ngOnDestroy(){}
}