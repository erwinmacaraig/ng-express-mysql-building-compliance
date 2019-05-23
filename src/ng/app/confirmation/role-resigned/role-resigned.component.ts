import { Component,
ViewChild,
ElementRef
 } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AccountsDataProviderService } from '../../services/accounts';
import { Subscription } from 'rxjs/Subscription';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';

declare var $: any;

@Component({
    templateUrl: './role-resigned.component.html',
    styleUrls: ['./role-resigned.component.css'],
    providers: [AccountsDataProviderService, EncryptDecryptService, LocationsService, DashboardPreloaderService]
})
export class RoleResignedComponent implements OnInit, AfterViewInit, OnDestroy {
    
    @ViewChild('reasons') selectReason: ElementRef;
    @ViewChild('info') info: ElementRef;
    selectedReasonIndex = -1;
    public selectedSubIndex = -1;
    public reasonList = [
        'My location has changed',
        'Tenancy moved out',
        'I am no longer part of this organisation',
        'I want to resign as ',
        'Others'
    ];
    private myAccountId = 0;
    private mySub:Subscription;
    private routeParamsSub:Subscription;
    private decryptedToken = '';
    public locations = [];
    public sublocations = [];    
    public buildingName = '';
    public emergencyRole = '';
    private buildingSelectionChoosenId = -1;
    public nominated_person = '';
    private configId = 0;
    public nominated_person_email = '';
    public myName = '';
    public textAreaPlaceHolder = '';
    public validInfo = true;
    constructor(
        private authService: AuthService,
        private accountService: AccountsDataProviderService,
        private route: ActivatedRoute,
        private cryptor: EncryptDecryptService,
        private locationService: LocationsService,
        private preloader: DashboardPreloaderService,
        private router: Router
    ) {}

    ngOnInit() {
        $('.modal').modal({
            dismissible: false,
            endingTop: '25%',
            opacity: 0.7
        });

        this.myName = this.authService.userDataItem('name');
        let tokenParts:Array<string> = [];
        this.routeParamsSub = this.route.queryParamMap.subscribe((params) => {            
            if (params.has('token')) {
                console.log(params.get('token'));
                tokenParts = [];
                this.decryptedToken = this.cryptor.decryptUrlParam(params.get('token'));
                tokenParts = this.decryptedToken.split('_');
                console.log(tokenParts.length);
                if (tokenParts.length !== 5) {
                    this.authService.logout();
                }
                if (this.authService.userDataItem('userId') != tokenParts[0]) {
                    this.authService.logout();
                    console.log(this.authService.userDataItem('userId'));
                }
                this.configId = +tokenParts[2];
                console.log(tokenParts);
                this.emergencyRole = tokenParts[4];
                this.reasonList[3] = this.reasonList[3] + this.emergencyRole;
                this.retrieveLocationInformation(tokenParts); 
                               
            }
        });

    }

    ngAfterViewInit() {
        
    }

    private getRelatedLocations() {
        this.myAccountId = this.authService.userDataItem('accountId');
        this.mySub = this.accountService.getTaggedLocation().subscribe((response) => {
            this.locations = response.locations;
        }, (error) => {
            console.log(error);
        });
    }

    ngOnDestroy() {
        if (this.mySub) {
            this.mySub.unsubscribe();
        }
        if (this.routeParamsSub) {
            this.routeParamsSub.unsubscribe();
        }
        
    }

    onSelectReason(e) {                
        console.log(this.selectReason.nativeElement.value);
        this.selectedReasonIndex = +this.selectReason.nativeElement.value;
        if (this.selectedReasonIndex == 3) {
            this.textAreaPlaceHolder = 'Please provide additional information why you are resigning.';
        } else {            
            this.textAreaPlaceHolder = 'Please provide us additional information';
        }
        this.validInfo = true;
    }

    loadSublevel(e) {
        this.sublocations = [];
        this.selectedSubIndex = -1;
        let i:number = +e.target.value;        
        if (i >= 0) {
            this.buildingSelectionChoosenId = i;        
            this.sublocations = this.locations[i]['sublocation'];
        }
        
    }

    private retrieveLocationInformation(tokens:Array<string>) {
        const buildingId = +tokens[3];
        this.preloader.show();
        this.locationService.getLocationInformation(buildingId).subscribe((response) => {
            this.buildingName = response.name;
            this.getRelatedLocations();
            this.preloader.hide();
        }, (error) => {
            console.log(error);
            this.preloader.hide();
        });

    }

    public collateAnswers() {
        this.preloader.show();
        const mainReason = this.reasonList[this.selectedReasonIndex];
        const postBody = {
            configId: this.configId,
            query_responses: ''
        };
        const query_responses = {};
        query_responses['reason'] = mainReason;
        switch(this.selectedReasonIndex) {
            case 0:                
                if(this.buildingSelectionChoosenId >= 0) {
                    query_responses['new_bulding_location'] = this.locations[this.buildingSelectionChoosenId]['location_id'];
                    query_responses['new_building_location_name'] = this.locations[this.buildingSelectionChoosenId]['name']
                    query_responses['new_level_location'] = this.locations[this.buildingSelectionChoosenId]['sublocation'][this.selectedSubIndex]['location_id'];
                    query_responses['new_level_location_name'] = this.locations[this.buildingSelectionChoosenId]['sublocation'][this.selectedSubIndex]['name'];
                } else {
                    query_responses['new_building_location_name'] = 'Location not in the list';
                }
            break;
            case 1:
            case 2:
            case 3:
            case 4:            
            query_responses['info'] = this.info.nativeElement.value; 
            break;
        }

        // query_responses['nominated_person'] = this.nominated_person;
        // query_responses['nominated_person_email'] = this.nominated_person_email;
        
        if (this.selectedReasonIndex == 3 &&  this.info.nativeElement.value == '') {
            this.validInfo = false;
            setTimeout(() => {
                this.preloader.hide();
            }, 600);
            return false;
        }
        postBody.query_responses = JSON.stringify(query_responses);
        console.log(query_responses);
        console.log(this.configId);
        this.accountService.submitQueryResponses(
            postBody.query_responses,
            this.configId,
            1,
            'Resigned',
            false
        ).subscribe((response) => {
            console.log(response);
            this.preloader.hide();
            setTimeout(() => {
                $('#modal-thanks-confirmation').modal('open');
            }, 300);
            
        },
        (error) => {
            console.log(error);
            this.preloader.hide();
        });
    }
}