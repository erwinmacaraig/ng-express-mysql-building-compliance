import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-add-mobility-impaired',
  templateUrl: './add.mobility.impaired.html',
  styleUrls: ['./add.mobility.impaired.css']
})
export class AddMobilityImpairedComponent implements OnInit, OnDestroy {
	
	public addedUsers = [];
	public userProperty = {
		first_name : '',
		last_name : '',
		email_or_username : '',
		account_role_id : 0,
		eco_role_id : 0,
		location_name : 'Select Location',
		location_id : 0,
		mobile_number : ''
	};

	constructor(){

	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();
	}

	addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );
	}

	ngOnDestroy(){}
}