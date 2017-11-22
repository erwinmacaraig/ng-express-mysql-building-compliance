import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-search-result',
  templateUrl: './search.result.html',
  styleUrls: ['./search.result.css']
})
export class SearchResultComponent implements OnInit, OnDestroy {

	constructor(){

	}

	ngOnInit(){
		$('select').material_select();
	}

	ngAfterViewInit(){
		
	}

	ngOnDestroy(){}
}