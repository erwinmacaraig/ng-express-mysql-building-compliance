import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from './../../services/locations';

declare var $: any;
@Component({
  selector: 'app-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.css']
})
export class SearchResultComponent implements OnInit, OnDestroy {

  public results;
  componentForm = {
    street_number: 'short_name',
    route: 'long_name',
    locality: 'long_name',
    administrative_area_level_1: 'short_name',
    administrative_area_level_2: 'short_name',
    country: 'short_name',
    postal_code: 'short_name',

    };

  constructor(private locationService: LocationsService,
    private router: Router) {
      this.results = this.locationService.getDataStore();
      console.log(this.results);
	}

	ngOnInit(){
		$('select').material_select();
	}

	ngAfterViewInit(){

	}

	ngOnDestroy() { }
}
