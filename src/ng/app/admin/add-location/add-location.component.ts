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

@Component({
    selector: 'app-admin-add-location',
    templateUrl: './add-location.component.html',
    styleUrls: ['./add-location.component.css'],
    providers: [AlertService]
})
export class AddAccountLocationComponent implements OnInit, AfterViewInit, OnDestroy {
    accountId:number = 0;
    paramSub:Subscription;
    accountInfo = {};
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
        
    @ViewChild('search')
    public searchElementRef: ElementRef;

    @ViewChild('inpOccupiable')
    public occupiableElementRef: ElementRef;


    constructor(
        private activatedRoute: ActivatedRoute,
        private adminService: AdminService,
        private locationService: LocationsService,
        private formBuilder: FormBuilder
    ) {}

    ngOnInit() {
        
        this.paramSub = this.activatedRoute.params.subscribe((params) => {
            this.accountId = params.accountId;
            this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
                this.accountInfo = response['data'];                
            });
        });
        this.managingRoleGroup = new FormGroup({
            managingRoleControl: new FormControl()
        });
        /*
        this.newLocationFrmGroup = this.formBuilder.group({
            name: new FormControl(null, Validators.required),
            street: this.street,
            city:  this.formBuilder.control('Sample City', Validators.required),
            state:  new FormControl({value: 'State'}),
            carpark: new FormControl('0', null),
            plantroom: new FormControl('0', null),
            others: new FormControl('0', null),
            levels: this.formBuilder.array([{}]),
            occupiableLvls: new FormControl('0'),
            total_levels: new FormControl(0, null)
        });
        */
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

    this.newLocationFrmGroup.get('total_levels').setValue('0');

    console.log(this.newLocationFrmGroup.controls);
    }

    ngAfterViewInit() {
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
            .subscribe((locs) => {
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
        this.adminService.addExistingLocationsToAccount(postBody).subscribe((response) => {
            console.log(response);
        });
    }

    createNewLocation() {
        console.log(this.newLocationFrmGroup.value);
        let role = '';
        let postBody = {};
        this.managingRole == 'FRP' ? role = 'Manager' :  role = 'Tenant';
        if (role=='Manager') {
            

        } else {
            postBody['role'] = 'Tenant';
            postBody['name'] = this.newLocationFrmGroup.get('name').value;
            postBody['street'] = this.newLocationFrmGroup.get('street').value;
            postBody['city'] = this.newLocationFrmGroup.get('city').value;
            postBody['state'] = this.newLocationFrmGroup.get('state').value;

            const sublocsArr = [];
            for (const s of this.newLocationFrmGroup.get('levels').value) {
                sublocsArr.push(s['new_level']);
            }
            postBody['sublocs'] = JSON.stringify(sublocsArr);

        } 
        console.log(postBody);

        this.cancelAll();

        
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
    }
    subtractLevel(fieldName, elRef:ElementRef) { 
        let totalLevels = 0;
        if (!isNaN(parseInt(this.newLocationFrmGroup.get(fieldName).value, 10))) {
            totalLevels = parseInt(this.newLocationFrmGroup.get(fieldName).value, 10);
        }
        if (totalLevels <= 0) {
            this.newLocationFrmGroup.get(fieldName).setValue('99');
        } else {
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

    
}