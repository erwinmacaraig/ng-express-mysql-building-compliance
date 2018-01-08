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

  copyOfList = [];
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

  filterByEvent(){

    $('select.filter-by').on('change', () => {
      let selected = $('select.filter-by').val();
      let temp = [];
      if(selected == 'frp'){
        for(let i in this.copyOfList){
          if(this.copyOfList[i]['role_id'] == 1){
            temp.push(this.copyOfList[i]);
          }
        }
        this.peepList = temp;
      }else if(selected == 'trp'){
        for(let i in this.copyOfList){
          if(this.copyOfList[i]['role_id'] == 2){
            temp.push(this.copyOfList[i]);
          }
        }
        this.peepList = temp;
      }else if(selected == 'user'){
        for(let i in this.copyOfList){
          if(this.copyOfList[i]['role_id'] != 1 && this.copyOfList[i]['role_id'] != 2){
            temp.push(this.copyOfList[i]);
          }
        }
        this.peepList = temp;
      }else{
        this.peepList = this.copyOfList;
      }
    });
    
  }

  sortByEvent(){
    $('select.sort-by').on('change', () => {
      let selected = $('select.sort-by').val();
      
      if(selected == 'loc-name-asc'){
        this.peepList.sort((a, b) => {
          if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        });
      }else if(selected == 'loc-name-desc'){
        this.peepList.sort((a, b) => {
          if(a.name > b.name) return -1;
            if(a.name < b.name) return 1;
            return 0;
        });
      }else if(selected == 'user-name-asc'){
        this.peepList.sort((a, b) => {
          if(a.first_name < b.first_name) return -1;
            if(a.first_name > b.first_name) return 1;
            return 0;
        });
      }else if(selected == 'user-name-desc'){
        this.peepList.sort((a, b) => {
          if(a.first_name > b.first_name) return -1;
            if(a.first_name < b.first_name) return 1;
            return 0;
        });
      }else{
        this.peepList = this.copyOfList;
      }
    });
  }

  searchMemberEvent(event){
    let key = event.target.value,
      temp = [];

    if(key.length == 0){
      this.peepList = this.copyOfList;
    }else{
      for(let i in this.copyOfList){
        let name = (this.copyOfList[i]['first_name']+' '+this.copyOfList[i]['last_name']).toLowerCase();
        if(name.indexOf(key) > -1){
          temp.push( this.copyOfList[i] );
        }
      }
      this.peepList = temp;
    }
  }

	ngOnDestroy(){}
}
