import { Component, OnInit, ViewEncapsulation, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';
import { UserService } from '../../services/users';
import { AccountsDataProviderService } from '../../services/accounts';
import { AuthService } from '../../services/auth.service';

import { Countries } from '../../models/country.model';
import { Timezone } from '../../models/timezone';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
declare var Materialize: any;
@Component({
    selector: 'app-view-locations-sub',
    templateUrl: './sublocation.component.html',
    styleUrls: ['./sublocation.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService]
})
export class SublocationComponent implements OnInit, OnDestroy {
    @ViewChild('formAddTenant') formAddTenant: NgForm;
    userData = <any> {};
    isFrp = false;
    isTrp = false;
    role = 100;
    encryptedID;
    locationID = 0;
    locationData = {
      google_photo_url: '',
      formatted_address: '',
      name: ''

    };
    sublocations = [];
    public parentData = {
        name : '',
        sublocations: [],
        location_id: 0
    };
    encLocId = '';

    errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    routeSubs;
    routeQuerySubs;

    tenants = [];

    mutationOversable = <any> {};

    showModalNewTenantLoader = false;

    countries = new Countries().getCountries();
    timezones = new Timezone().get();
    defaultCountry = 'AU';
    defaultTimeZone = 'AEST';

    queryParams = {};
    public subLocationsArr;

    showCompliance = false;

    constructor(private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private activeRoute: ActivatedRoute,
        private router: Router,
        private userService : UserService,
        private elemRef: ElementRef,
        private auth: AuthService,
        private accountService: AccountsDataProviderService
    ) {

        this.userData = this.auth.getUserData();
        for( let rol of this.userData.roles) {

            if (this.role > rol.role_id) {
              this.role = rol.role_id;
            }

        }
    }

    getLocationData(callBack){
        this.locationService.getById(this.locationID, (response) => {

            this.parentData = response.parent;
            this.locationData = response.location;
            this.encLocId = this.encryptDecrypt.encrypt(this.locationData['location_id']).toString();
            this.parentData['location_id'] = this.encryptDecrypt.encrypt(this.parentData['location_id']);
            this.parentData['sublocations'] = response.siblings;
            this.sublocations = response.sublocations;
            for (let i = 0; i < this.sublocations.length; i++ ) {
                this.sublocations[i]['location_id'] = this.encryptDecrypt.encrypt(this.sublocations[i].location_id);
            }
            for (let i = 0; i < this.parentData['sublocations'].length; i++ ) {
                this.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.parentData['sublocations'][i].location_id);
            }
            if (this.parentData['name'].length === 0) {
              this.parentData['name'] = this.parentData['formatted_address'];
            }

            let isInLocation = false,
                itInLocationEmRole = false,
                itInLocationTrpFrpRole = false;
            for(let rl of response.users_locations){
                if(rl.location_id == this.locationData['location_id']){
                    isInLocation = true;
                    if('user_em_roles_relation_id' in rl){
                        itInLocationEmRole = true;
                    }
                    if('location_account_user_id' in rl && itInLocationTrpFrpRole == false){
                        itInLocationTrpFrpRole = true;
                    }
                }
            }

            this.showCompliance = false;
            if(isInLocation && itInLocationTrpFrpRole){
                this.showCompliance = true;
            }

            callBack();
        });
    }

    ngOnInit() {
        // Materialize.updateTextFields();
        this.routeSubs = this.activeRoute.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            this.getLocationData(() => {
                this.userService.getTenantsInLocation(this.locationID, (tenantsResponse) => {
                    this.tenants = tenantsResponse.data;
                    // console.log(this.tenants);

                });
            });
        });

        this.routeQuerySubs = this.activeRoute.queryParams.subscribe((params) => {
            this.queryParams = params;
        });
    }

    ngAfterViewInit(){
        $('.nav-list-locations').addClass('active');
        $('.location-navigation .active').removeClass('active');
        $('.location-navigation .view-location').addClass('active');


        $('select').material_select();
        $('.modal').modal({ dismissible: false });
        /*
        let formAddTenant = this.formAddTenant;
        $('body').off('change.countrychange').on('change.countrychange', 'select.billing-country', (event) => {
            formAddTenant.controls.billing_country.setValue( event.currentTarget.value );
        });

        $('body').off('change.timechange').on('change.timechange', 'select.time-zone', (event) => {
            formAddTenant.controls.time_zone.setValue( event.currentTarget.value );
        });
        */
        if('showaddtenant' in this.queryParams){
            if(this.queryParams['showaddtenant']){
                setTimeout(() => {
                    this.addNewTenantClickEvent();
                }, 500);
            }
        }
    }

    onClickArchiveLocation(locationData){
        this.selectedLocationToArchive = locationData;
        $('#modalArchive').modal('open');
    }

    onClickYesArchive(){
        this.errorMessageModalSublocation = '';
        this.showLoaderModalSublocation = true;
        this.locationService.archiveLocation({
            location_id : this.locationID
        }).subscribe(
            (response) => {
                this.showLoaderModalSublocation = false;
                this.errorMessageModalSublocation = '';
                $('#modalArchive').modal('close');

                this.router.navigate(['/location/view', this.encryptDecrypt.encrypt(this.locationData['parent_id']) ]);
            },
            (msg) => {
                this.showLoaderModalSublocation = false;
                this.errorMessageModalSublocation = msg;
                setTimeout(() => {
                    this.errorMessageModalSublocation = '';
                }, 2000);
            }
        );
    }

    addNewTenantClickEvent(){
        this.formAddTenant.reset();
        // this.formAddTenant.controls.billing_country.setValue( this.defaultCountry );
        // this.formAddTenant.controls.time_zone.setValue( this.defaultTimeZone );
        // $('#modalAddNewTenant select').material_select('update');
        $('#modalAddNewTenant').modal('open');
    }

    submitNewTenant(formAddTenant:NgForm) {
        if(formAddTenant.valid){
            this.showModalNewTenantLoader = true;
            let formData = formAddTenant.value;
            formData['location_id'] = this.locationID;
            console.log('formData', formData);
            this.userService.sendTRPInvitation(formData).subscribe(() => {
              this.getLocationData(() => {
                this.userService.getTenantsInLocation(this.locationID, (tenantsResponse) => {
                    this.tenants = tenantsResponse.data;
                    this.showModalNewTenantLoader = false;
                    $('#modalAddNewTenant').modal('close');
                });
              });
            }, (e) => {
              console.log(e);
              this.showModalNewTenantLoader = false;
              $('#modalAddNewTenant').modal('close');
              const errorObject = JSON.parse(e.error);
              alert(errorObject.message);
            });
        }
    }

    ngOnDestroy() {
        this.routeSubs.unsubscribe();
        this.routeQuerySubs.unsubscribe();
        // this.mutationOversable.disconnect();
    }

}
