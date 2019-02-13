import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { LocationsService } from '../../services/locations';

declare var $: any;

@Component({
    selector: 'app-admin-account-locations',
    templateUrl: './locations-in-accounts.component.html',
    styleUrls: ['./locations-in-accounts.component.css'],
    providers: [ AdminService, EncryptDecryptService, DashboardPreloaderService ]
})
export class LocationsInAccountComponent implements OnInit, AfterViewInit {

    accountId = 0;
    locations = [];
    isArchived = false;
    typingTimeout:any;
    private originalLocations = [];
    modalArchive = {
        loader : false,
        selected : {}
    };

    constructor(public http: HttpClient,
        private adminService: AdminService,
        private route: ActivatedRoute,
        private router: Router,
        public encryptDecrypt: EncryptDecryptService,
        public dashboard: DashboardPreloaderService,
        private locationsService: LocationsService) {

    }

    ngOnInit() {
        this.dashboard.show();
        this.route.params.subscribe((parameters) => {
            this.accountId = parameters['accntId'];
            this.getLocations();
        });

        this.route.queryParams.subscribe((query) => {
            this.dashboard.show();
            this.isArchived = (query['archived']) ? query['archived'] : false;
            this.getLocations();
        });
    }

    getLocations(){
        this.adminService.taggedLocationsOnAccount(this.accountId, this.isArchived).subscribe((response) => {
            this.locations = response['data'];
            this.originalLocations = [];
            for (const loc of this.locations) {
                loc['id_encrypted'] = this.encryptDecrypt.encrypt(loc['location_id']);
                this.originalLocations.push(loc);
            }
            this.dashboard.hide();
        }, (error) => {
            console.log(error);
            this.dashboard.hide();
        });
    }

    selectActionEvent(selectAction, location){
        let 
        encLocId = this.encryptDecrypt.encrypt(location.location_id),
        ecnAccntId = this.encryptDecrypt.encrypt(this.accountId);

        if(selectAction.value == "activity-log"){
            this.router.navigate(["/admin/activity-log-report/", encLocId, ecnAccntId])
        }else if(selectAction.value == "team"){
            this.router.navigate(["/admin/teams-report", encLocId, ecnAccntId]);
        }else if(selectAction.value == "training"){
            this.router.navigate(["/admin/trainings-report", encLocId, ecnAccntId]);
        }else if(selectAction.value == "archive" || selectAction.value == "restore"){
            this.modalArchive.selected = location;
            $('#modalArchive').modal({ dismissible: false });
            $('#modalArchive').modal('open');
        }


        selectAction.value = 0;
    }

    archiveClick(){
        if(Object.keys(this.modalArchive.selected).length > 0){
            this.modalArchive.loader = true;
            let locs = [];

            locs.push({
                location_id : this.modalArchive.selected['location_id'],
                archived : (!this.isArchived) ? 1 : 0
            });

            this.locationsService.archiveMultipleLocation({
                locations : locs
            }).subscribe(() => {
                this.getLocations();
                this.modalArchive.loader = false;
                $('#modalArchive').modal('close');
            });
        }
    }

    ngAfterViewInit() {}

    searchLocationInAccounts(event) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            let searchKey = event.target.value;
            let temp = [];
            this.locations = [];
            if (searchKey) {
                searchKey = searchKey.toLowerCase();
                for (let loc of this.originalLocations) {
                    let locationName = loc['name'].toLowerCase();
                    if (locationName.includes(searchKey)) {
                        temp.push(loc);
                    }
                }
                this.locations = [...temp];

            } else {
                this.locations = [...this.originalLocations];
            }
        }, 500);

    }

}
