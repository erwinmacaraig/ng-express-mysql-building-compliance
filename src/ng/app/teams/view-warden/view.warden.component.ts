import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';


declare var $: any;
@Component({
  selector: 'app-view-warden-component',
  templateUrl: './view.warden.component.html',
  styleUrls: ['./view.warden.component.css']
})
export class ViewWardenComponent implements OnInit, OnDestroy {

	constructor(){
		console.log( );
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