import { Component, OnInit, ViewEncapsulation, OnDestroy, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { DonutService } from '../../services/donut';
import { Countries } from '../../models/country.model';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
    selector: 'app-view-locations-single',
    templateUrl: './view-single.component.html',
    styleUrls: ['./view-single.component.css'],
    providers: [DashboardPreloaderService, EncryptDecryptService, DonutService]
})
export class ViewSingleLocation implements OnInit, OnDestroy, OnChanges {

	private countries = new Countries().getCountries();
	userData: Object;
	encryptedID;
    locationID = 0;
    isHome = false;
    locationData = {
        parent_id: 0 ,
        name : '',
        frp : [],
        unit : '',
        street : '',
        city : '',
        country : '',
        google_photo_url: '',
        formatted_address: '',
        sublocations : []
    };
    private sub;
    private loc_sub;
    errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    public locationsSublocations = [];

    public sameSublocation = [];
    public sameSublocationCopy = [];
    public inpSublocationNameTwoWayData = "";
    public selectedSubLocationFromModal = {};
    @ViewChild('inputSublocation') public inputSublocation: ElementRef;

    constructor(
        private auth: AuthService,
        private preloaderService: DashboardPreloaderService,
        private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private donut: DonutService
        ){
        this.userData = this.auth.getUserData();
    }

    ngOnChanges() {
    }


    ngOnInit() {
        $('select').material_select();
        $('.modal').modal({ dismissible: false });

        this.sub = this.route.params.subscribe((params) => {
            this.encryptedID = params['encrypted'];
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
            if ((this.locationID * 1) === -1) {
                this.router.navigate(['/location', 'list']);
            } else {
                this.preloaderService.show();
                this.loc_sub = this.locationService.getById(this.locationID, (response) => {
                    if ('location' in response === false) {
                        // this.router.navigate(['/location', 'list']);
                    }

                    setTimeout(() => {
                        this.preloaderService.hide();
                    }, 250);
                    this.locationData.name = response.location.name;
                    this.locationData.formatted_address = response.location.formatted_address;
                    this.locationData.sublocations = response.sublocations;
                    this.locationData.google_photo_url = response.location.google_photo_url || undefined;
                    if (response.location.parent_id === -1) {
                        this.isHome = true;
                    }
                    this.locationData.parent_id =  this.encryptDecrypt.encrypt(response.location.parent_id).toString();

                    for (let i = 0; i < this.locationData['sublocations'].length; i++) {
                        this.locationData['sublocations'][i]['location_id']
                        = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
                    }
                });
            }

        });

        this.locationService.getSublocationsOfParent(this.locationID)
            .subscribe((response) => {
                this.locationsSublocations = response.data;
                this.sameSublocationCopy = JSON.parse( JSON.stringify(this.locationsSublocations) );
            });

		// DONUT update
		// this.donut.updateDonutChart('#specificChart', 30, true);
	}

    addNewSubLocationSubmit(form, e) {
        if(form.valid){
            this.errorMessageModalSublocation = '';
            this.showLoaderModalSublocation = true;
            if(Object.keys(this.selectedSubLocationFromModal).length > 0){
                this.locationService.assignSublocations([this.selectedSubLocationFromModal['location_id']])
                .subscribe((response) => {
                    this.loc_sub = this.locationService.getById(this.locationID, (response) => {
                        this.locationData.sublocations = response.sublocations;
                        for (let i = 0; i < this.locationData['sublocations'].length; i++) {
                            this.locationData['sublocations'][i]['location_id']
                            = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
                        }
                        this.inpSublocationNameTwoWayData = '';
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = '';
                        $('#modalAddSublocation').modal('close');
                    });
                });
            }else{
                this.locationService.createSubLocation({
                    name : form.controls.name.value,
                    parent_id : this.locationID
                }).subscribe(
                    (response) => {
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = '';

                        if ('sublocations' in this.locationData == false){
                            this.locationData['sublocations'] = [];
                        }

                        response.data['children'] = [];

                        response.data['location_id'] = this.encryptDecrypt.encrypt(response.data['location_id']).toString();
                        this.locationData['sublocations'].push(response.data);
                        $('#modalAddSublocation').modal('close');
                    },
                    (msg) => {
                        this.showLoaderModalSublocation = false;
                        this.errorMessageModalSublocation = msg.error;
                        setTimeout(() => {
                            this.errorMessageModalSublocation = '';
                        }, 2000);
                    }
                );
            }

        }else{
            form.controls.name.markAsDirty();
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

                this.router.navigate(['/location/view', this.locationData['parent_id']]);
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

	ngAfterViewInit(){
        $('.nav-list-locations').addClass('active');
        $('.location-navigation .active').removeClass('active');
        $('.location-navigation .view-location').addClass('active');
    }

	getCountryName(abbr){
		let name = '';
		for(let i in this.countries){
			if(this.countries[i]['abbr'] == abbr){
				name = this.countries[i]['name'];
			}
		}

		return name;
	}

    onKeyUpTypeSublocation(value){
        let trimmed = value.trim(),
        trimmedLow = trimmed.toLowerCase(),
        results = [];
        if(trimmed.length == 0){
            this.sameSublocation = [];
        }else{
            let searchChild = (children) => {
              for(let i in children){
                let name = children[i]['name'],
                  low = name.toLowerCase();

                if(low.indexOf(trimmedLow) > -1){
                  results.push( JSON.parse(JSON.stringify(children[i])) );
                }
              }
            };

            searchChild(this.sameSublocationCopy);
            this.sameSublocation = results;
        }
    }

    selectAddNewSubResult(sub, selectElement){
        $('.select-sub.red-text').removeClass('red-text').addClass('blue-text').html('select');
        if($(selectElement).hasClass('blue-text')){
          $(selectElement).removeClass('blue-text').addClass('red-text').html('selected');
        }else{
          $(selectElement).removeClass('red-text').addClass('blue-text').html('select');
        }
        $(this.inputSublocation.nativeElement).trigger('focusin');
        this.inpSublocationNameTwoWayData = sub.name;
        this.selectedSubLocationFromModal = sub;
    }

	ngOnDestroy() {
        /*
        this.sub.unsubsribe();
        this.loc_sub.unsubsribe();
        */
    }



}