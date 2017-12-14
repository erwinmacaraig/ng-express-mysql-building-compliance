import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

declare var $: any;
@Component({
  selector: 'app-teams-add-warden',
  templateUrl: './add.wardens.html',
  styleUrls: ['./add.wardens.css']
})
export class TeamsAddWardenComponent implements OnInit, OnDestroy {

	constructor(){

	}

	ngOnInit(){}

	ngOnDestroy(){}
}