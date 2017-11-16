import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-add-new-locations',
  templateUrl: './add.single.location.html',
  styleUrls: ['./add.single.location.css']
})
export class AddSingleLocationComponent implements OnInit, OnDestroy {

	constructor(){

	}

	ngOnInit(){
		$('select').material_select();
	}

	ngOnDestroy(){}
}