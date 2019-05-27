import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AdminService } from './../../services/admin.service';
import { Observable } from 'rxjs/Rx';
import { FormControl, FormArray, FormGroup, Validators, FormBuilder } from '@angular/forms';
import { LocationsService } from '../../services/locations';
import { AlertService } from '../../services/alert.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;

@Component({
    selector: 'app-admin-add-location',
    templateUrl: './add-location.component.html',
    styleUrls: ['./add-location.component.css'],
    providers: [AlertService, DashboardPreloaderService]
})
export class AddAccountLocationComponent implements OnInit, AfterViewInit, OnDestroy {
    accountId:number = 0;
    paramSub:Subscription;
    accountInfo = {};
    public accntSubType = '';
    searchLocsSubs;
    searchText = "Searching...";
    searchedLocations = [];
    showTextSearch = false;
    selectedLocationFromSearch = <any> {};
    sublocations:Array<object> = [];
    selectedSublevels:Array<number | string> = [];
    managingRoleGroup:FormGroup;
    newLocationFrmGroup:FormGroup;
    managingRole:string = '';
    showSearchLocation:boolean = false;
    showNewBuildingForm: boolean = false;
    showLevelForm:boolean = false;
    addLocationBldgFRPCtrl = false;
    frpBuildingLocationConfirmation:boolean = false;   
    
    accountLocations = 0;
    continueToAddUser:boolean = false;
    occupiableLevelArr:Array<number>;
    @ViewChild('search')
    public searchElementRef: ElementRef;

    @ViewChild('inpOccupiable')
    public occupiableElementRef: ElementRef;


    constructor(
        private activatedRoute: ActivatedRoute,
        private adminService: AdminService,
        private locationService: LocationsService,
        private router: Router,
        private dashboard: DashboardPreloaderService,
    ) { }

    ngOnInit() {
        
        this.paramSub = this.activatedRoute.params.subscribe((params) => {
            this.accountId = params.accountId; 
            // this.dashboard.show();           
            this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
                this.accountInfo = response['data'];
                this.accntSubType  = this.accountInfo['subscription']['type'];
                console.log(this.accountInfo);
                // this.dashboard.hide();             
            });
        });
        this.activatedRoute.queryParams.subscribe((query) => {
            console.log(query);
            if (query['ctau']) {
                this.continueToAddUser = true;
            }
        });
       
        this.managingRoleGroup = new FormGroup({
            managingRoleControl: new FormControl()
        });
        
        this.newLocationFrmGroup = new FormGroup({
            name: new FormControl(null, Validators.required),
            street: new FormControl(null, Validators.required),
            city:  new FormControl(null, Validators.required),
            state:  new FormControl(null, Validators.required),
            carpark: new FormControl('0', null),
            plantroom: new FormControl('0', null),
            others: new FormControl('0', null),
            levels: new FormArray([]),
            occupiableLvls: new FormControl('0'),
            total_levels: new FormControl("0", Validators.required)        
        });

          
    }

    ngAfterViewInit() {
        this.adminService.taggedLocationsOnAccount(this.accountId, false).subscribe((response) => {
            this.accountLocations = (response['data'] as Array<object>).length; 
            if (this.accountLocations >=3 && this.accntSubType == 'free') {
                this.dashboard.show();
                setTimeout(() => {
                    this.dashboard.hide();
                    this.router.navigate(['/admin', 'locations-in-account', this.accountId]);
                }, 800);
                                
            }               
        }, (error) => {
            console.log(error);
        });
        $('.workspace.container').css({ 'overflow' : '', 'margin-bottom' : '10%' });

        this.searchLocsSubs = Observable.fromEvent(this.searchElementRef.nativeElement, 'keyup')
        .debounceTime(500).distinctUntilChanged().subscribe((event:KeyboardEvent) => {
            this.searchedLocations = [];
            if(this.searchElementRef.nativeElement.value.length == 0){ 
                this.showTextSearch = false;
                return false;
             }
            this.searchText = this.searchElementRef.nativeElement.value;
            this.showTextSearch = true;
            this.locationService.searchBuildings(this.searchElementRef.nativeElement.value)
            .subscribe((locs:any) => {
                if(locs.length == 0){
                    this.searchText = "No result found";
                    this.showTextSearch = true;
                }else{
                    this.showTextSearch = false;
                }
                this.searchedLocations = locs;
            });
        });
        this.newLocationFrmGroup.get('total_levels').setValue('0');
        
    }

    ngOnDestroy() {
        this.paramSub.unsubscribe();
    }
    selectLocationFromSearch(location){
        this.searchedLocations = [];
        this.showTextSearch = false;
        this.searchElementRef.nativeElement.value = "";

        this.selectedLocationFromSearch = location;
        this.showSearchLocation = false;

        // get Sublevels
        this.adminService.getAccountSublocations(this.selectedLocationFromSearch['location_id']).subscribe((response) => {
            console.log(response);
            this.sublocations = response['data'];
        });
        
        console.log('location', location);
    }
    
    onChangeSublocation(e, locationId) {
        console.log('logging, ', e);
        /*
        if (this.accountInfo['subscription']['type'] == 'free') {
            let remaining = 3 - this.accountLocations;
            if (this.selectedSublevels.length >= remaining) {
                this.addExistingLocToAccount();                
            }
        }
        */

        if (e.target.checked) {
            this.selectedSublevels.push(locationId);
        } else {
            const i = this.selectedSublevels.indexOf(locationId);
            this.selectedSublevels.splice(i,1); 
        }
        console.log(this.selectedSublevels);
        
        
    }
    setLocationManagingRole(e, managing_role) {
        console.log(managing_role);
        this.showNewBuildingForm = false;
        this.showLevelForm = false;
        this.newLocationFrmGroup.reset();
        this.managingRole = managing_role;
        this.selectedSublevels = [];
        if (this.selectedLocationFromSearch['location_id'] && !this.showSearchLocation) {
            this.showSearchLocation = false;
        } else {
            this.showSearchLocation = true;
        }

    }

    cancelAll() {
        this.newLocationFrmGroup.reset();
        this.managingRoleGroup.reset();
        this.showSearchLocation = false;
        this.showNewBuildingForm = false;
        this.frpBuildingLocationConfirmation = false;
        this.showLevelForm = false;
        this.selectedSublevels = [];
        this.selectedLocationFromSearch = {};
        this.sublocations = [];
        this.managingRole = '';
    }

    resetSelections() {
        this.managingRoleGroup.reset();
        this.selectedSublevels = [];
        this.selectedLocationFromSearch = {};
        this.sublocations = [];
        this.managingRole = '';
        this.showSearchLocation = false;
        this.newLocationFrmGroup.reset();
    }
    cancelNewLoc(){
        this.searchElementRef.nativeElement.value = "";
        this.showTextSearch = false;
    }
    showNewLocForm() {
        this.showNewBuildingForm=true;
        this.showTextSearch = false;
        this.showSearchLocation = false;
        this.newLocationFrmGroup.get('name').setValue(this.searchElementRef.nativeElement.value);
        this.searchElementRef.nativeElement.value = "";
        

    }

    addExistingLocToAccount() {
        let role = '';
        if (this.managingRole == 'FRP' || this.managingRole == 'TRP All Levels') {
            this.selectedSublevels = [];
            for (let s of this.sublocations) {
                this.selectedSublevels.push(s['location_id']);
            }
            this.managingRole == 'FRP' ? role = 'Manager' :  role = 'Tenant';
        } else {
            role = 'Tenant';
        }
        
        const postBody = {
            building: this.selectedLocationFromSearch['location_id'],
            accountId: this.accountId,
            managing_role: role,
            sublocs: JSON.stringify(this.selectedSublevels)
        }
        console.log(postBody);
        this.cancelAll();        
        this.adminService.addExistingLocationsToAccount(postBody).subscribe((response) => {
            if (this.continueToAddUser) {
                this.router.navigate(['/admin', 'add-account-user', this.accountId]);
            } else {
                this.router.navigate(['/admin', 'locations-in-account', this.accountId]);    
            }
            
        });

        
    }

    createNewLocation() {
        console.log(this.newLocationFrmGroup.value);
        let role = '';
        let postBody = {};
        this.managingRole == 'FRP' ? role = 'Manager' :  role = 'Tenant';
        postBody['name'] = this.newLocationFrmGroup.get('name').value;
        postBody['street'] = this.newLocationFrmGroup.get('street').value;
        postBody['city'] = this.newLocationFrmGroup.get('city').value;
        postBody['state'] = this.newLocationFrmGroup.get('state').value;
        postBody['account_id'] = this.accountId;
        if (role=='Manager') {
            postBody['role'] = 'Manager';
            postBody['occupiable_levels'] = this.newLocationFrmGroup.get('occupiableLvls').value;
            postBody['carpark'] = this.newLocationFrmGroup.get('carpark').value;
            postBody['plantroom'] = this.newLocationFrmGroup.get('plantroom').value;
            postBody['others'] = this.newLocationFrmGroup.get('others').value;
        } else {
            postBody['role'] = 'Tenant';
            const sublocsArr = [];
            for (const s of this.newLocationFrmGroup.get('levels').value) {
                sublocsArr.push(s['new_level']);
            }
            postBody['sublocs'] = JSON.stringify(sublocsArr);

        } 
        console.log(postBody);
        this.cancelAll();

        this.adminService.addNewLocation(postBody).subscribe((response) => {
            console.log(response);
            if (this.continueToAddUser) {
                this.router.navigate(['/admin', 'add-account-user', this.accountId]);
            } else {
                this.router.navigate(['/admin', 'locations-in-account', this.accountId]);
            }
            
        });
    }
    
    removeLevelForFRPBuilding(fieldName) {
        let carparkTotal = 0;
        let occupiableTotal = 0;
        let plantroomTotal = 0;
        let othersTotal = 0;
        let levels = 0;
        let total = 0;

        if (!isNaN(parseInt(this.newLocationFrmGroup.get('total_levels').value, 10))) {
            total = parseInt(this.newLocationFrmGroup.get('total_levels').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('occupiableLvls').value, 10))) {
            occupiableTotal = parseInt(this.newLocationFrmGroup.get('occupiableLvls').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('carpark').value, 10))) {
            carparkTotal = parseInt(this.newLocationFrmGroup.get('carpark').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('plantroom').value, 10))) {
            plantroomTotal = parseInt(this.newLocationFrmGroup.get('plantroom').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('others').value, 10))) {
            othersTotal = parseInt(this.newLocationFrmGroup.get('others').value, 10);
        }
               
        switch(fieldName) {
            case 'occupiableLvls':
                if (occupiableTotal > 0) {
                    occupiableTotal -= 1;
                    this.newLocationFrmGroup.get('occupiableLvls').setValue(occupiableTotal);                                
                }                    
                break;
            case 'carpark':
                if (carparkTotal > 0) {
                    carparkTotal -= 1;
                    this.newLocationFrmGroup.get('carpark').setValue(carparkTotal);
                }                    
                break;
            case 'plantroom':
                if (plantroomTotal > 0) {
                    plantroomTotal -= 1;
                    this.newLocationFrmGroup.get('plantroom').setValue(plantroomTotal);
                }                    
                break;
            case 'others':
                if (othersTotal > 0) {
                    othersTotal -= 1;
                    this.newLocationFrmGroup.get('others').setValue(othersTotal);
                }                    
                break;
        }
        levels = occupiableTotal + carparkTotal + plantroomTotal + othersTotal;                     
        if (levels != total) {
            this.addLocationBldgFRPCtrl = false;
        }
    }
    addLevelForFRPBuilding(fieldName) {
        let carparkTotal = 0;
        let occupiableTotal = 0;
        let plantroomTotal = 0;
        let othersTotal = 0;
        let levels = 0;
        let total = 0;

        if (!isNaN(parseInt(this.newLocationFrmGroup.get('total_levels').value, 10))) {
            total = parseInt(this.newLocationFrmGroup.get('total_levels').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('occupiableLvls').value, 10))) {
            occupiableTotal = parseInt(this.newLocationFrmGroup.get('occupiableLvls').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('carpark').value, 10))) {
            carparkTotal = parseInt(this.newLocationFrmGroup.get('carpark').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('plantroom').value, 10))) {
            plantroomTotal = parseInt(this.newLocationFrmGroup.get('plantroom').value, 10);
        }
        if (!isNaN(parseInt(this.newLocationFrmGroup.get('others').value, 10))) {
            othersTotal = parseInt(this.newLocationFrmGroup.get('others').value, 10);
        }
        levels = occupiableTotal + carparkTotal + plantroomTotal + othersTotal;

        if (levels < total) {
            switch(fieldName) {
                case 'occupiableLvls':
                    occupiableTotal += 1;
                    this.newLocationFrmGroup.get('occupiableLvls').setValue(occupiableTotal);                                
                    break;
                case 'carpark':
                    carparkTotal += 1;
                    this.newLocationFrmGroup.get('carpark').setValue(carparkTotal);
                    break;
                case 'plantroom':
                    plantroomTotal += 1;
                    this.newLocationFrmGroup.get('plantroom').setValue(plantroomTotal);
                    break;
                case 'others':
                    othersTotal += 1;
                    this.newLocationFrmGroup.get('others').setValue(othersTotal);
                    break;
            }                    
        }
        levels = occupiableTotal + carparkTotal + plantroomTotal + othersTotal;
        if (levels == total) {
            this.addLocationBldgFRPCtrl = true;
        } else {
            this.addLocationBldgFRPCtrl = false;
        }
        console.log(this.addLocationBldgFRPCtrl);
    }

    addLevel(fieldName) {   
        let totalLevels = 0; 
        if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
            totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
        }
        if (totalLevels >= 99) {
            this.newLocationFrmGroup.get(fieldName).setValue('1');
        } else {
            totalLevels += 1;
            this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
        }

        /*
        if (this.accountInfo['subscription']['type'] == 'free' && this.managingRole == 'TRP') { 
            
            let remaining = 3 - this.accountLocations;
            console.log('remaining is ' + remaining);
            if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
                totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
            }
            if (totalLevels >= remaining) {        
                     
                this.newLocationFrmGroup.get(fieldName).setValue(remaining);
            } else {
                
                totalLevels += 1;
                console.log('in else total levels after increment = ' +  totalLevels);
                this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
            }

        } else {
            if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
                totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
            }
            if (totalLevels >= 99) {
                this.newLocationFrmGroup.get(fieldName).setValue('1');
            } else {
                totalLevels += 1;
                this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
            }
        }
        if (this.accountInfo['subscription']['type'] == 'free') {
            if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
                totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
                console.log('total levels here = ' + totalLevels);
            }
            let remaining = 3 - this.accountLocations;
            if (totalLevels >= remaining) {                
                this.newLocationFrmGroup.get(fieldName).setValue(remaining);
            } else {
                totalLevels += 1;
                this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
            }
        } else {
            if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
                totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
            }
            if (totalLevels >= 99) {
                this.newLocationFrmGroup.get(fieldName).setValue('1');
            } else {
                totalLevels += 1;
                this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
            }
        }

        
        */
        
        
        


    }
    subtractLevel(fieldName) { 
        let totalLevels = 0;
        if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
            totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
        }
        if (totalLevels > 0) {            
            totalLevels -= 1;
            this.newLocationFrmGroup.get(fieldName).setValue(totalLevels);
        }
    }
    showDynamicLevelForm() {
        this.showLevelForm = true;
        this.showNewBuildingForm = false;
        const totalLevels =  parseInt(this.newLocationFrmGroup.get('total_levels').value, 10);
        for(let i = 0; i < totalLevels; i++) {
            (<FormArray>this.newLocationFrmGroup.controls['levels']).push(new FormGroup({
                new_level: new FormControl(null, Validators.required)
            }));
        }
    }

    showFRPNewLocationDetails() {
        this.frpBuildingLocationConfirmation = true;
        this.showNewBuildingForm = false;
        this.occupiableLevelArr = new Array( parseInt(this.newLocationFrmGroup.get('occupiableLvls').value, 10));
    }

    
}