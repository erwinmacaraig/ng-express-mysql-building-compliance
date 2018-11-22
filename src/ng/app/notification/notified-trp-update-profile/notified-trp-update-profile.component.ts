import { Component, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';

import 'rxjs/add/observable/forkJoin';
import * as cryptoJs from 'crypto-js';

@Component({
    selector: 'app-notified-trp-update-profile',
    templateUrl: './notified-trp-update-profile.component.html',
    styleUrls: ['./notified-trp-update-profile.component.css'],
    providers: [EncryptDecryptService, LocationsService, UserService]
})
export class NotifiedTrpUpdateProfileComponent implements OnInit, AfterViewInit, OnDestroy {

    // public properties
    public encryptedToken = '';
    public userId = 0;
    public location_id = 0;
    public configId = 0;
    public notification_token_id = 0;
    public building_id = 0;
    public showUpdateField = false;
    public encryptedUserId;
    public buildingData:{
        parent_id: number,
        name: string,
        unit: string,
        street: string,
        city: string,
        state: string,
        postal_code: string,
        country: string,
        formatted_address: string,
        lat: string,
        lng: string,
        time_zone: string,
        location_id: number,
        order: number,
        is_building: number,
        location_directory_name: string,
        archive: number,
        google_place_id: string,
        google_photo_url: string,
        admin_verified: string,
        admin_verified_date: string,
        admin_id: number,
        online_training: number
    };
    public buildingLevels:  Array<{
        parent_id: number,
        name: string,
        unit: string,
        street: string,
        city: string,
        state: string,
        postal_code: string,
        country: string,
        formatted_address: string,
        lat: string,
        lng: string,
        time_zone: string,
        location_id: number,
        order: number,
        is_building: number,
        location_directory_name: string,
        archive: number,
        google_place_id: string,
        google_photo_url: string,
        admin_verified: string,
        admin_verified_date: string,
        admin_id: number,
        online_training: number
    }> = [];
    public locationLabelText = '';
    public selectedIndex = 0;
    public assignedLocations: Array<{
        parent_id: number,
        name: string,
        unit: string,
        street: string,
        city: string,
        state: string,
        postal_code: string,
        country: string,
        formatted_address: string,
        lat: string,
        lng: string,
        time_zone: string,
        location_id: number,
        order: number,
        is_building: number,
        location_directory_name: string,
        archive: number,
        google_place_id: string,
        google_photo_url: string,
        admin_verified: string,
        admin_verified_date: string,
        admin_id: number,
        online_training: number
    }> = [];
    personUserInfo: {
        user_id: number,
        first_name: string,
        last_name: string,
        email: string,
        phone_number: string,
        mobile_number: string,
        mobility_impaired: number, 
        evac_role: string
    } = {
        user_id: 0,
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        mobile_number: '',
        mobility_impaired: 0, 
        evac_role: ''
    };

    // private properties
    private tempMobile = '';
    private chosenLevelToModify;
    private locAcctUserId;


    @ViewChild('assignedLocation') assignedLocation: ElementRef;
    @ViewChild('newLevelNomination') newLevelNomination: ElementRef;

    constructor(private route: ActivatedRoute,
        private router: Router,
        private cryptor: EncryptDecryptService,
        private locationService: LocationsService,
        private authService: AuthService,
        private userService: UserService) {}

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const token = this.cryptor.decryptUrlParam(params['token']);
            this.encryptedToken = params['token'];
            const parts: Array<string> = token.split('_');
            this.userId = +parts[0];
            this.location_id = +parts[1];
            this.configId = +parts[2];
            this.notification_token_id = +parts[3];
            this.building_id = +parts[4];
            console.log(parts);
            this.encryptedToken = cryptoJs.AES.encrypt(`${this.userId}_${this.location_id}_${this.building_id}_${2}_${this.authService.userDataItem('accountId')}`, 'NifLed').toString();
            this.encryptedUserId = this.cryptor.encrypt(this.userId);
        });
        
        this.getLocationData().subscribe(responseDataList => {

            this.buildingData = responseDataList[0];
            this.buildingLevels = responseDataList[1];
            this.assignedLocations = responseDataList[2];
            this.personUserInfo = responseDataList[3];
            this.tempMobile = responseDataList[3]['mobile_number'];

            if (this.location_id == this.building_id) {
                // this.assignedLocations.push(this.buildingData);                
            } else {
                this.selectedIndex = this.buildingLevels.findIndex(el => el.location_id == this.location_id);
                this.locationLabelText = this.buildingData.name + ', ' +  this.buildingLevels[this.selectedIndex].name;
            }
        });
        
    }

    ngAfterViewInit() {
         
    }

    ngOnDestroy () {}

    
    private getLocationData() {
        let buildingResponse = this.locationService.getLocationInformation(this.building_id);
        let buildingLevelsResponse = this.locationService.getLevelsOfBuilding(this.building_id);
        let assignedLevelsResponse = this.locationService.taggedLocationsForTRPInBuilding(this.userId, this.building_id);
        let uData = this.userService.userInfo(this.userId);
        return Observable.forkJoin([buildingResponse, buildingLevelsResponse, assignedLevelsResponse, uData]);
    }

    changeEventSubLocationReviewProfile(event) {
        console.log(event.target.value);
        
    }

    updateUserProfile() {
        console.log(this.personUserInfo.mobile_number);
        console.log(this.assignedLocation.nativeElement.value); // location_account_user_id        
        console.log(this.newLevelNomination.nativeElement.value);
        const location_account_user = this.assignedLocation.nativeElement.value;
        const newLocation = this.newLevelNomination.nativeElement.value;
        if (this.tempMobile != this.personUserInfo.mobile_number) {
            this.userService.update({
                mobile_number: this.personUserInfo.mobile_number,
                user_id: this.userId
            }, (response) => {
                console.log(response);
            });
        }
        this.userService.updateLocationAccountUser(location_account_user,newLocation)
        .subscribe((response) => {
            console.log(response.message);
            this.router.navigate(['/dashboard', 'notification-summary-view', this.encryptedToken]);
        });
    }

    nominateNewLevel(event) {
        console.log(event.target.value);
    }
    


}