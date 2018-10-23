import { Component, Input, OnInit, ViewEncapsulation, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { MessageService } from '../services/messaging.service';

declare var $: any;


@Component({
  selector: 'breadcrumbs-component',
  templateUrl: './breadcrumbs.html',
  styleUrls: ['./breadcrumbs.css'],
  providers: []
})
export class BreadCrumbsComponent implements OnInit, AfterViewInit {

    list = [];
    msgsubs;

    constructor(
        private messageService:MessageService
        ){
    }

    ngOnInit(){
        this.msgsubs = this.messageService.getMessage().subscribe((data) => {

            console.log('data', data);

            if(data.breadcrumbs){
                this.list = [];
                for(let i in data.breadcrumbs){
                    if( (parseInt(i) + 1) == data.breadcrumbs.length ){
                        this.list.push({  'value' : data.breadcrumbs[i]['value'], 'link' : data.breadcrumbs[i]['link'],  'islast' : true });
                    }else{
                        this.list.push({  'value' : data.breadcrumbs[i]['value'], 'link' : data.breadcrumbs[i]['link'], 'islast' : false });
                        this.list.push({  'value' : '>', 'link' : false, 'islast' : false });
                    }
                }
            }
        });

        this.messageService.sendMessage({ 'getbreadcrumbs' : true });
    }

    ngAfterViewInit(){

    }

    ngOnDestroy(){
        this.msgsubs.unsubscribe();
    }

}