import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from './../../services/locations';
import { PersonDataProviderService } from './../../services/person-data-provider.service';

declare var $: any;
@Component({
  selector: 'app-teams-list-warden',
  templateUrl: './list.wardens.component.html',
  styleUrls: ['./list.wardens.component.css']
})
export class ListWardensComponent implements OnInit, OnDestroy {
  public wardenArr;
  constructor(private dataProvider: PersonDataProviderService,
    private locationService: LocationsService) {

	}

	ngOnInit(){
    this.dataProvider.buildWardenList().subscribe((data) => {
      this.wardenArr = data;
      console.log(this.wardenArr);
    }, (err: HttpErrorResponse) => {
      console.log(err);
    });
  }

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();
	}

	ngOnDestroy(){}
}
