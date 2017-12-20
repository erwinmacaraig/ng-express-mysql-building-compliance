import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-mobility-impaired',
  templateUrl: './mobility.impaired.component.html',
  styleUrls: ['./mobility.impaired.component.css']
})
export class MobilityImpairedComponent implements OnInit, OnDestroy {
	constructor(){

	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();
	}

	ngOnDestroy(){}
}