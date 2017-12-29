import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-teams-list-warden',
  templateUrl: './list.wardens.component.html',
  styleUrls: ['./list.wardens.component.css']
})
export class ListWardensComponent implements OnInit, OnDestroy {

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