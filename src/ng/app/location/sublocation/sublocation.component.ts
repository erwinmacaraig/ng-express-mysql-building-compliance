import { Component, OnInit, ViewEncapsulation, OnDestroy, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';
import { UserService } from '../../services/users';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
declare var Materialize: any;
@Component({
    selector: 'app-view-locations-sub',
    templateUrl: './sublocation.component.html',
    styleUrls: ['./sublocation.component.css'],
    providers: [EncryptDecryptService]
})
export class SublocationComponent implements OnInit, OnDestroy {
    userData: Object;
    encryptedID;
    locationID = 0;
    locationData = {};
    public parentData = {
        name : ''
    };
    encLocId = '';

    errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    routeSubs;

    tenants = [];

    mutationOversable = <any> {};

    constructor(private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private userService : UserService,
        private elemRef: ElementRef
    ) {

        this.mutationOversable = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if(mutation.target.nodeName != '#text'){
                    let target = $(mutation.target);
                    if(target.find('select:not(.initialized)').length > 0){

                        target.find('select:not(.initialized)').material_select();

                    }
                }
            });
        });

        this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });
    }

    ngOnInit() {
        $('select').material_select();
        $('.modal').modal({ dismissible: false });
        // Materialize.updateTextFields();
        this.routeSubs = this.route.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            this.locationService.getById(this.locationID, (response) => {

                this.parentData = response.parent;
                this.locationData = response.location;
                this.encLocId = this.encryptDecrypt.encrypt(this.locationData['location_id']).toString();
                this.parentData['location_id'] = this.encryptDecrypt.encrypt(this.parentData['location_id']).toString();
                this.parentData['sublocations'] = response.siblings;

                for (let i = 0; i < this.parentData['sublocations'].length; i++ ) {
                    this.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.parentData['sublocations'][i].location_id).toString();
                }
                if (this.parentData['name'].length === 0) {
                  this.parentData['name'] = this.parentData['formatted_address'];
                }
                console.log(this.parentData);

                this.userService.getTenantsInLocation(this.locationID, (tenantsResponse) => {
                    this.tenants = tenantsResponse.data;
                });


            });
        });
    }

    ngAfterViewInit(){
        $('.nav-list-locations').addClass('active');
        $('.location-navigation .active').removeClass('active');
        $('.location-navigation .view-location').addClass('active');
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

                this.router.navigate(['/location/view', this.encryptDecrypt.encrypt(this.locationData['parent_id']).toString() ]);
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

    ngOnDestroy() {
        this.routeSubs.unsubscribe();
        this.mutationOversable.disconnect();
    }

}
