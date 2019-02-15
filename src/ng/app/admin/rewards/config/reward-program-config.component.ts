import { Component, ElementRef } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { AdminService } from '../../../services/admin.service';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';


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
    public rewardProgramId;
    public showLoading = true;
    public activityTable = [];
    private myChosenActivities = [];

    private searchSubscription: Subscription;

    public selectionType;
    public selectionTypeId;

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

    @ViewChild('programActivities') programActivities: ElementRef;
    constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router) {

    }

    private jquery_code() {
        $(document).ready(function() {
            $('select').material_select();
        });
    }
    ngOnInit() {

        this.configForm = new FormGroup({
            search: new FormControl(null, Validators.required),
            sponsor: new FormControl(null, Validators.required),
            sponsor_emails: new FormControl(null, Validators.required),
            activities: new FormArray([]),
            activity_points: new FormArray([]),
            activity_ids: new FormControl(),
            reward_items: new FormArray([]),
            reward_item_points: new  FormArray([]),
            config_locations: new FormControl([]),
            selection_type: new FormControl(null, Validators.required),
            selection_id: new FormControl(null, Validators.required)
        });

        this.adminService.loadActivitiesFromLookup().subscribe((response) => {
            this.activityTable = response.activities;
        });

        this.route.paramMap.subscribe((paramMap: ParamMap) => {
            if (paramMap.has('programConfig')) {
                this.rewardProgramId = paramMap.get('programConfig');

                this.adminService.getRewardProgramConfigDetails(this.rewardProgramId).subscribe((res) => {
                   if (res.selectionType == 'account') {
                       this.selectedLocations = res.buildings;
                       this.locations = res.accountLocations;

                   }

                   this.selectionType = res.selectionType;
                   this.selectionTypeId = res.selectionId;

                    this.configForm.get('sponsor').patchValue(res.sponsor);
                    this.configForm.get('search').patchValue(res.searchKey);
                    this.configForm.get('sponsor_emails').patchValue(res.sponsor_emails);
                    this.configForm.get('selection_type').patchValue(res.selectionType);
                    this.configForm.get('selection_id').patchValue(res.selectionId);
                    this.configForm.addControl('reward_proram_config_id', new FormControl(this.rewardProgramId, Validators.required));

                    for (let activity of res.activities) {
                       (this.configForm.get('activities') as FormArray).push(
                           new FormControl(activity['activity'], Validators.required)
                       );
                       (this.configForm.get('activity_points') as FormArray).push(
                           new FormControl(activity['activity_points'], Validators.required)
                       );
                    }
                    for (let reward of res.incentives) {
                        (this.configForm.get('reward_items') as FormArray).push(new FormControl(reward['incentive'], Validators.required));
                        (this.configForm.get('reward_item_points') as FormArray).push(
                            new FormControl(reward['points_to_earn'], Validators.required)
                        );
                    }
                    this.searchSubscription = this.smartSearch();

                });
            } /*else {
                (this.configForm.get('activities') as FormArray).push(new FormControl('Sign up', Validators.required));
                (this.configForm.get('activities') as FormArray).push(new FormControl('Anniversary', Validators.required));
                (this.configForm.get('activities') as FormArray).push(new FormControl('Training', Validators.required));


                (this.configForm.get('activity_points') as FormArray).push(new FormControl('10', Validators.required));
                (this.configForm.get('activity_points') as FormArray).push(new FormControl('10', Validators.required));
                (this.configForm.get('activity_points') as FormArray).push(new FormControl('10', Validators.required));

                (this.configForm.get('reward_items') as FormArray).push(new FormControl('Coffee Voucher', Validators.required));
                (this.configForm.get('reward_item_points') as FormArray).push(new FormControl('50', Validators.required));
                this.searchSubscription = this.smartSearch();
            }*/
        });
        setTimeout(() => {  this.showLoading = false; }, 500);
    }

    ngAfterViewInit() {
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
        const subjectIndex = this.programActivities.nativeElement.value;
        const activity = this.activityTable[subjectIndex]['activity_name'];
        const points = this.activityTable[subjectIndex]['default_points'];
        if (this.myChosenActivities.indexOf(subjectIndex) === -1) {
            this.myChosenActivities.push(subjectIndex);
            (this.configForm.get('activities') as FormArray).push(new FormControl(activity, Validators.required));
            (this.configForm.get('activity_points') as FormArray).push(new FormControl(points, Validators.required));

            console.log(this.myChosenActivities);
        }
    }
    addNewReward() {
        (this.configForm.get('reward_items') as FormArray).push(new FormControl(null, Validators.required));
        (this.configForm.get('reward_item_points') as FormArray).push(new FormControl(null, Validators.required));
    }
    removeRewardItem(rewardIndex=1) {
        (this.configForm.get('reward_items') as FormArray).removeAt(rewardIndex);
        (this.configForm.get('reward_item_points') as FormArray).removeAt(rewardIndex);
    }

    removeActivityItem(activityIndex=0) {
        this.myChosenActivities.splice(activityIndex, 1);
        (this.configForm.get('activities') as FormArray).removeAt(activityIndex);
        (this.configForm.get('activity_points') as FormArray).removeAt(activityIndex);
        console.log(this.myChosenActivities);
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