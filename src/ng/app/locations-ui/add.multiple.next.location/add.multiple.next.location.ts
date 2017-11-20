import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-add-multiple-next-locations',
  templateUrl: './add.multiple.next.location.html',
  styleUrls: ['./add.multiple.next.location.css']
})
export class AddMultipleNextLocationComponent implements OnInit, OnDestroy {

	constructor(){

	}

	ngOnInit(){
		$('select').material_select();
	}

	ngOnDestroy(){}
}