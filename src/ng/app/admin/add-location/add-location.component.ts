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
    total_levels:FormControl;
    
    street:FormControl;
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
        this.street = new FormControl('test', Validators.required);
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
        street: this.street,
        city:  new FormControl('Sample City', Validators.required),
        state:  new FormControl('Sample State'),
        carpark: new FormControl('0', null),
        plantroom: new FormControl('0', null),
        others: new FormControl('0', null),
        levels: new FormArray([]),
        occupiableLvls: new FormControl('0'),
        total_levels: new FormControl(0, null)
    });

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
        this.newLocationFrmGroup.reset();
        this.managingRole = managing_role;
        this.selectedSublevels = [];
        if (this.selectedLocationFromSearch['location_id'] && !this.showSearchLocation) {
            this.showSearchLocation = false;
        } else {
            this.showSearchLocation = true;
        }

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

    onCreateNewBuildingLocation() {
        
    }

    addLevel(fieldName, ref:ElementRef) {
        if (parseInt(this.newLocationFrmGroup.get(fieldName).value, 10) >= 99) {
            this.newLocationFrmGroup.get(fieldName).setValue('1');
        } else {
            this.newLocationFrmGroup.get(fieldName).setValue((parseInt(this.newLocationFrmGroup.get(fieldName).value, 10) + 1).toString());
        }
    }
    subtractLevel(fieldName, elRef:ElementRef) { 
        console.log(fieldName);
        console.log(elRef);
        if (parseInt(this.newLocationFrmGroup.get(fieldName).value, 10) <= 0) {
            this.newLocationFrmGroup.get(fieldName).setValue('99');
        } else {
            this.newLocationFrmGroup.get(fieldName).setValue((parseInt(this.newLocationFrmGroup.get(fieldName).value, 10) - 1).toString());
        }
    }

    
}