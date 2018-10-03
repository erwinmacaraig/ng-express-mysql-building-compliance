import { Component, OnInit, OnDestroy, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { LocationsService } from './../../services/locations';

declare var $: any;
declare var Materialize: any;

@Component({
    selector: 'add-location-to-account',
    templateUrl: './add.location.to.account.html',
    styleUrls: ['./add.location.to.account.css'],
    providers: [ AdminService, LocationsService, EncryptDecryptService, DashboardPreloaderService ]
})
export class AddLocationToAccountComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('searchLocations') searchLocations: ElementRef;
    searchSubs;

    accountId = 0;
    account = <any> {

    }

    getAccountSubs;
    routeSubs;

    locations = <any> [];
    searchedLocations = <any> [];
    displaySearch = false;

    buildingNameModel = '';

    treeData = {};

    showAddingLocation = false;

    locationIdForRemove = 0;
    modalRemoveLoading = false;

    sublocations = <any> [];

    constructor(public http: HttpClient,
        private adminService: AdminService,
        private route: ActivatedRoute,
        private router: Router,
        public encryptDecrypt: EncryptDecryptService,
        public dashboard: DashboardPreloaderService,
        private locationsService: LocationsService) {

        this.routeSubs = this.route.params.subscribe((params) => {
            this.accountId = params['accountId'];

            this.getTaggedLocations();
        });

        this.sublocations.push({
            name : 'Level 1'
        });
    }

    getTaggedLocations(){
        this.adminService.getTaggedLocationsFromAccount(this.accountId).subscribe((response) => {
            this.locations = response;
            for (const loc of this.locations) {
                loc['id_encrypted'] = this.encryptDecrypt.encrypt(loc['location_id']);
            }
            console.log(response);
            this.dashboard.hide();
        }, (error) => {
            console.log(error);
            this.dashboard.hide();
        });
    }

    ngOnInit() {
        this.getAccountSubs = this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
            this.account = response['data'];
        });

        this.searchSubs = Observable.fromEvent(this.searchLocations.nativeElement, 'keyup')
        .debounceTime(400)
        .distinctUntilChanged()
        .subscribe((event:any) => {
            let key = event.target.value.trim();
            if(key.length > 0){
                
                this.locationsService.searchLocationHierarchy(key, true).subscribe((result) => {
                    this.searchedLocations = result;
                    this.displaySearch = true;
                });

            }else{
                this.displaySearch = false;
                this.searchedLocations = [];
            }
            console.log(key);
        });

    }

    ngAfterViewInit() {
        this.dashboard.show();
        $('select').material_select();
        $('select[name="isbuilding"]').on('change', (event) => {
            let val = event.target.value;
            if(val == '0'){
                //Campus


            }else{

            }
        });
    }

    selectLocationFromSearch(locId){
        this.displaySearch = false;
        this.searchedLocations = [];
        this.searchLocations.nativeElement.value = "";
        this.showAddingLocation = true;
        this.locationsService.addAccountToLocation(this.accountId, locId).subscribe(() => {
            this.getTaggedLocations();
            this.showAddingLocation = false;
        });
    }

    clickRemoveLocation(locId){
        this.locationIdForRemove = locId;
        $('#modalRemoveLoc').modal({ backdrop : 'static' });
        $('#modalRemoveLoc').modal('open');
    }

    clickConfirmRemoveLocation(){
        this.modalRemoveLoading = true;
        this.locationsService.removeAccountFromLocation(this.accountId, this.locationIdForRemove).subscribe(() => {
            this.getTaggedLocations();
            this.modalRemoveLoading = false;
            $('#modalRemoveLoc').modal('close');
        });
    }

    addSubLoc(){
        let len = (this.sublocations.length + 1);
        this.sublocations.push({
            name : 'Level '+ len
        });

        setTimeout(() => {
            console.log(this.sublocations);
            Materialize.updateTextFields();
        }, 300);
    }

    submitAddNewBuilding(form){
        if(form.valid){

            this.showAddingLocation = true;
            this.locationsService.createBuildingAddAccount({
                name : form.value.name,
                street : form.value.street,
                state : form.value.state,
                city : form.value.city,
                account_id : this.accountId,
                sublocations : this.sublocations
            }).subscribe(() => {
                this.sublocations = [{
                    name : "Level 1"
                }];
                form.reset();
                this.getTaggedLocations();
                this.showAddingLocation = false;
            });

        }
    }

    ngOnDestroy(){
        this.routeSubs.unsubscribe();
        this.getAccountSubs.unsubscribe();
        this.searchSubs.unsubscribe();
    }

}
