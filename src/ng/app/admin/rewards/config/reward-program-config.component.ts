import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { AdminService } from '../../../services/admin.service';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Router } from '@angular/router';
import { routerNgProbeToken } from '@angular/router/src/router_module';

declare var $:any;

@Component({
    selector: 'app-admin-reward-config',
    templateUrl: './reward-program-config.component.html',
    styleUrls: ['./reward-program-config.component.css'],
    providers: [AdminService]
})

export class RewardProgramConfigComponent implements OnInit, AfterViewInit, OnDestroy {
    public configForm: FormGroup;
    public searchKeyValue = '';
    public filteredList = [];
    public locations = [];
    public selectedLocations = [];

    private searchSubscription:Subscription;

    private selectionType;
    private selectionTypeId;



    dropdownSettings = {
        singleSelection: false,
        idField: 'location_id',
        textField: 'location_name',
        selectAllText: 'Select All Locations',
        unSelectAllText: 'UnSelect All',
        itemsShowLimit: 5,
        allowSearchFilter: false,
        enableCheckAll: true,
        noDataAvailablePlaceholderText: 'Fetching data from server'
    };
    
    

    constructor(private adminService: AdminService, private router: Router) {

    }

    private jquery_code() {
        $(document).ready(function(){           
            $('select').material_select();
        });
    }
    ngOnInit() {      
        
        this.configForm = new FormGroup({
            search: new FormControl(null, Validators.required),
            sponsor: new FormControl(null, Validators.required),
            sponsor_emails: new FormControl(null, Validators.required),
            activities: new FormArray([
                new FormControl('Sign up', Validators.required),
                new FormControl('Anniversary', Validators.required),
                new FormControl('Training', Validators.required)
            ]),
            activity_points: new FormArray([
                new FormControl('10', Validators.required),
                new FormControl('10', Validators.required),
                new FormControl('10', Validators.required)
            ]),
            reward_items: new FormArray([
               new FormControl('Coffee Voucher', Validators.required) 
            ]),
            reward_item_points: new  FormArray([
                new FormControl('50', Validators.required)
            ]),
            config_locations: new FormControl([]),
            selection_type: new FormControl(null, Validators.required),
            selection_id: new FormControl(null, Validators.required)            
        });        

    }

    ngAfterViewInit() {
        this.searchSubscription = this.smartSearch();
        this.jquery_code();
    }

    ngOnDestroy() {

    }

    private smartSearch(): Subscription {
        return this.configForm.get('search').valueChanges.debounceTime(350)
        .subscribe((searchValue) => {
            this.filteredList = [];
            if (searchValue != null && searchValue.length > 0) {
                this.searchKeyValue = searchValue; 
                this.searchServer(searchValue).subscribe((data) => {
                    this.filteredList = [...data[0]['data']];
                    Object.keys(data[1]['data']['list']).forEach((k) => {
                        this.filteredList.push(data[1]['data']['list'][k]);
                    });
                });
            } else {
                this.filteredList = [];
            }
        });
    }

    private searchServer(key): Observable<any[]> {
        const locations = this.adminService.searchLocationByName(key, {is_building: 1});
        const accounts = this.adminService.getAccountListingForAdmin(0, key);

        return Observable.forkJoin([locations, accounts]);
        
    }

    addNewActivity() {
        (this.configForm.get('activities') as FormArray).push(new FormControl(null, Validators.required));
        (this.configForm.get('activity_points') as FormArray).push(new FormControl(null, Validators.required));
    }
    addNewReward() {
        (this.configForm.get('reward_items') as FormArray).push(new FormControl(null, Validators.required));
        (this.configForm.get('reward_item_points') as FormArray).push(new FormControl(null, Validators.required));
    }
    removeRewardItem(rewardIndex=1) {
        (this.configForm.get('reward_items') as FormArray).removeAt(rewardIndex);
        (this.configForm.get('reward_item_points') as FormArray).removeAt(rewardIndex);
    }

    removeActivityItem(activityIndex=3) {
        (this.configForm.get('activities') as FormArray).removeAt(activityIndex);
        (this.configForm.get('activity_points') as FormArray).removeAt(activityIndex);
    }

    getSelection(id, type, name) {
        this.searchSubscription.unsubscribe();
        this.configForm.get('search').setValue(name);
        this.selectionType = type;
        this.selectionTypeId = id;
        this.filteredList = [];
        this.configForm.controls['selection_id'].patchValue(id, {onlySelf: true});
        this.configForm.controls['selection_type'].patchValue(type, {onlySelf: true});

        //
        if (this.selectionType == 'account') {
            // get all related locations on this account
            this.adminService.getRelatedBuildings(id).subscribe((response) => {
                this.locations = [...response['locations']];
                this.searchSubscription = this.smartSearch();

            }, (error) => {
                console.log(error);
                this.searchSubscription = this.smartSearch();
            });
        } else {
            this.searchSubscription = this.smartSearch();

        } 

        

    }

    public finalizeConfig() {
        // console.log(this.configForm.value);
        
        this.adminService.createRewardProgramConfig(this.configForm.value).subscribe((data) => {
            this.router.navigate(['/admin', 'list-reward-configuration']);
        });
        

    }

    public onLocationSelect(item:any) {
        console.log(item);
        console.log(this.selectedLocations);
    }
    public onSelectAllLocation(item:any) {
        console.log(item);
        console.log(this.selectedLocations);
    }
    public onLocationDeSelect(item:any) {
        console.log(this.selectedLocations);
    }

    public onLocationDeSelectAll(item:any) {
        console.log(this.selectedLocations);
    }

}