import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef, Input, TemplateRef, ViewEncapsulation  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from './../../services/admin.service';
import { AccountsDataProviderService } from './../../services/accounts';
import { LocationsService } from './../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Observable } from 'rxjs';

import 'formBuilder/dist/form-builder.min.js';
import 'formBuilder/dist/form-render.min.js';

declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-smart-form',
  templateUrl: './smart-form-component.html',
  styleUrls: ['./smart-form-component.css'],
  providers: [AdminService, DashboardPreloaderService, AccountsDataProviderService]
})

export class SmartFormComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('searchLocationInput') searchLocationInput : ElementRef;
    @ViewChild('searchAccountInput') searchAccountInput : ElementRef;
    accountSearched = <any> [];
    locationSearched = <any> [];
    selectedComplianceActivity = '';
    selectedAccount = <any> {};
    selectedLocation = <any> {};
    searchSubs = <any> {
        account : {}, location : {}
    };
    availableBoxSelect = false;

    constructor(
        private accountsService: AccountsDataProviderService,
        private adminService: AdminService,
        private locationsService: LocationsService,
        private dashboardService: DashboardPreloaderService,
        private router: Router,
        private activatedRoute: ActivatedRoute
        ){

    }

    ngOnInit(){
        
    }

    ngAfterViewInit(){

        this.searchSubs.account = Observable.fromEvent(this.searchAccountInput.nativeElement, 'keyup')
        .debounceTime(500)
        .subscribe((event:any) => {
            this.accountSearched = [];

            if(this.searchAccountInput.nativeElement.value.trim().length > 0){
                this.accountsService.searhByName(this.searchAccountInput.nativeElement.value, (response) => {
                    this.accountSearched = response.data;
                });
            }else{
                this.locationSearched = [];
                this.selectedAccount = <any> {};
                this.selectedLocation = <any> {};
                this.availableBoxSelect = false;
                $('.box-compliance.selected').removeClass('selected');
            }

        });

        this.searchSubs.location = Observable.fromEvent(this.searchLocationInput.nativeElement, 'keyup')
        .debounceTime(500)
        .subscribe((event:any) => {
            this.locationSearched = [];

            if(this.searchLocationInput.nativeElement.value.trim().length > 0){
                this.locationsService.searchBuildings(this.searchLocationInput.nativeElement.value, { account_id : this.selectedAccount.account_id }).subscribe((res) => {
                    this.locationSearched = res;
                });
            }else{
                this.availableBoxSelect = false;
                $('.box-compliance.selected').removeClass('selected');
            }

        });

        this.availableBoxSelect = false;
        this.accountSearched = <any> [];
        this.locationSearched = <any> [];
        this.selectedComplianceActivity = '';
        this.selectedAccount = <any> {};
        this.selectedLocation = <any> {};
        this.searchLocationInput.nativeElement.value = '';
        this.searchAccountInput.nativeElement.value = '';
        $('.box-compliance.selected').removeClass('selected');
    }

    formRenderOnSaveEvent(){
        $('#smartForm').off('submit').on('submit', function(e){
            e.preventDefault();
            alert();
        });
    }

    clickSelecteComplianceActivityBox(type, boxElem){
        this.selectedComplianceActivity = type;
        $('.box-compliance.selected').removeClass('selected');
        $(boxElem).addClass('selected');

        let compKpiId = 0;
        switch (type) {
            case "evac_exer":
                compKpiId = 9;
                break;
            case "fsa":
                compKpiId = 3;
                break;
            case "epc":
                compKpiId = 2;
                break;
            case "epm":
                compKpiId = 4;
                break;
        }

        let qParams = {
            'kpi' :  compKpiId, 
            'locid' : this.selectedLocation.location_id,
            'accountid' : this.selectedAccount.account_id
        };

        this.router.navigate([ '/admin/smart-form-render' ], {  queryParams : qParams  });
    }

    clickSelectAccountFromSearch(account){
        this.selectedAccount = account;
        this.searchAccountInput.nativeElement.value = account.account_name;
        this.accountSearched = [];
        this.adminService.taggedLocationsOnAccount(account.account_id).subscribe((res:any) => {
            this.locationSearched = res.data;
        });
    }

    clickSelectLocationFromSearch(loc){
        this.searchLocationInput.nativeElement.value = loc.name;
        this.selectedLocation = loc;
        this.locationSearched = [];
        this.availableBoxSelect = true;
    }

    ngOnDestroy(){
    }
}