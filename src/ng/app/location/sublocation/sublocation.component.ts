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
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ComplianceService } from '../../services/compliance.service';
import { DonutService } from '../../services/donut';

import { Countries } from '../../models/country.model';
import { Timezone } from '../../models/timezone';
import { MessageService } from '../../services/messaging.service';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
declare var Materialize: any;
@Component({
    selector: 'app-view-locations-sub',
    templateUrl: './sublocation.component.html',
    styleUrls: ['./sublocation.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, ComplianceService, DonutService]
})
export class SublocationComponent implements OnInit, OnDestroy {
    @ViewChild('formAddTenant') formAddTenant: NgForm;
    userData = <any> {};
    isFrp = false;
    isTrp = false;
    role = 100;
    encryptedID;
    selectedWardenList = [];
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

    latestCompliance = <any> {};

    breadCrumbs = [];

    constructor(private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private activeRoute: ActivatedRoute,
        private router: Router,
        private userService : UserService,
        private elemRef: ElementRef,
        private auth: AuthService,
        private accountService: AccountsDataProviderService,
        private dashboardService: DashboardPreloaderService,
        private complianceService: ComplianceService,
        private donutService: DonutService,
        private messageService: MessageService
    ) {

        this.userData = this.auth.getUserData();
        for( let rol of this.userData.roles) {

            if (this.role > rol.role_id) {
              this.role = rol.role_id;
            }
        }
    }

    getLocationData(callBack){
        this.locationService.getByIdWithQueries({
            location_id : this.locationID,
            get_related_only : (this.role == 2) ? true : false
        }, (response) => {

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

            /*if(response.show_compliance){
                this.showCompliance = true;
            }else{
                this.showCompliance = false;
            }*/

            this.breadCrumbs = [];
            this.breadCrumbs.push({
              'value' : 'Location list', 'link' : '/location/list'
            });
            for(let i in response.ancestries){

                if( response.ancestries[i].parent_is_building == 1 || response.ancestries[i].has_child_building == 1 || response.ancestries[i].is_building == 1 ){
                    let
                    queryParams = {},
                    encId =  this.encryptDecrypt.encrypt(response.ancestries[i]['location_id']),
                    url = (response.ancestries[i].is_building == 1) ? '/location/view/'+encId 
                        : (response.ancestries[i].parent_is_building == 1) ? '/location/view-sublocation/'+encId : '/location/list' ;

                    if( response.ancestries[i].has_child_building == 1  ){
                        queryParams['undrlocid'] = encId;
                    }

                    this.breadCrumbs.push({
                      'value' : response.ancestries[i].name, 'link' : url, 'queryParams' : queryParams
                    });
                }

            }

            this.messageService.sendMessage({ 'breadcrumbs' : this.breadCrumbs });

            callBack();
        });
    }

    ngOnInit() {
        // Materialize.updateTextFields();
        this.routeSubs = this.activeRoute.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            this.dashboardService.show();
            this.getLocationData(() => {
                this.userService.getTenantsInLocation(this.locationID, (tenantsResponse) => {
                    this.tenants = tenantsResponse.data;
                    // console.log(this.tenants);

                });
                this.dashboardService.hide();
            });
            this.complianceService.getLocationsLatestCompliance(this.locationID, (response) => {
                this.donutService.updateDonutChart('#specificChart', response.percent, true);
                let nom = 0, denom = 0;
                for(let com of response.data){
                    if(com.compliance_kpis_id != 13){
                        if(com.valid == 1){
                            nom++;
                        }
                        denom++;
                    }
                }
                $('.manage-compliance .completion .start').html(nom);
                $('.manage-compliance .completion .end-num').html(denom);
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

    public viewWardenList(warden = []) {
        this.selectedWardenList = [];
        this.selectedWardenList = warden;
        $('#modalWardenList').modal('open');
    }

}
