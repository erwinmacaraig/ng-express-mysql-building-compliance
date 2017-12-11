import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';

declare var $: any;
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
    public parentData = {};

    errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    constructor(private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        $('select').material_select();
        $('.modal').modal({ dismissible: false });
        this.route.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            this.locationService.getById(this.locationID, (response) => {

                this.parentData = response.parent;
                this.locationData = response.location;
                this.parentData['location_id'] = this.encryptDecrypt.encrypt(this.parentData['location_id']).toString();
                this.parentData['sublocations'] = response.siblings;

                for (let i = 0; i < this.parentData['sublocations'].length; i++ ) {
                    this.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.parentData['sublocations'][i].location_id).toString();
                }
                console.log(this.parentData);


            });
        });
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

    ngOnDestroy() {}

}
