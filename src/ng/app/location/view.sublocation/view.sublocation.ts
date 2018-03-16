import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';
import { Countries } from '../../models/country.model';

declare var $: any;
declare var Materialize: any;
@Component({
	selector: 'app-view-locations-sub',
	templateUrl: './view.sublocation.html',
	styleUrls: ['./view.sublocation.css'],
	providers: [DashboardPreloaderService, EncryptDecryptService, LocationsService]
})
export class ViewSublocationComponent implements OnInit, OnDestroy {

	userData: Object;
	encryptedID;
	locationID = 0;
	locationData = {
		location_id : 0,
		name : '',
		frp : [],
		unit : '',
		street : '',
		city : '',
		country : '',
		sublocations : []
	};
	parentData = {
		location_id : 0,
		name : '',
		frp : [],
		unit : '',
		street : '',
		city : '',
		country : '',
		sublocations : []
	};

	errorMessageModalSublocation = '';
    showLoaderModalSublocation = false;
    selectedLocationToArchive = {};

    routeSubs;

	constructor(
		private auth: AuthService,
		private preloaderService : DashboardPreloaderService,
		private locationService : LocationsService,
		private encryptDecrypt : EncryptDecryptService,
		private route: ActivatedRoute,
		private router: Router,
		private userService : UserService
		){
		this.userData = this.auth.getUserData();
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .view-location').addClass('active');
		Materialize.updateTextFields();
	}

	ngOnInit(){
		$('select').material_select();

		this.routeSubs = this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
			this.locationService.getById(this.locationID, (response) => {
				this.locationData = response.location;
				this.parentData = response.parent;
				this.parentData['sublocations'] = response.siblings;
				this.parentData.location_id = this.encryptDecrypt.encrypt(this.parentData.location_id);
				if (response.siblings.length) {
					for (let i = 0; i < response.siblings.length; i++) {
						this.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(response.siblings[i].location_id);
					}
				}
				for(let i in this.locationData['sublocations']){
					this.locationData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id);
				}

				this.userService.getTenantsInLocation(this.locationID, (tenantsResponse) => {
					console.log(tenantsResponse);
				});
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

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}
