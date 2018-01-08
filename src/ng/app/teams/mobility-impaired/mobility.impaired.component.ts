import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { LocationsService } from './../../services/locations';

declare var $: any;
@Component({
  selector: 'app-mobility-impaired',
  templateUrl: './mobility.impaired.component.html',
  styleUrls: ['./mobility.impaired.component.css']
})
export class MobilityImpairedComponent implements OnInit, OnDestroy {
  public peepList;
	constructor(
    private dataProvider: PersonDataProviderService,
    private locationService: LocationsService
  ) {

	}

	ngOnInit(){
    this.dataProvider.buildPeepList().subscribe((peep) => {
      this.peepList = peep;
      console.log(peep);
    }, (err: HttpErrorResponse) => {});
  }

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();
	}

	ngOnDestroy(){}
}
