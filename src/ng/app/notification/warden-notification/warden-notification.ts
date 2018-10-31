import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AdminService } from '../../services/admin.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { HttpParams, HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
    selector: 'app-warden-notification',
    templateUrl: './warden-notification.html',
    styleUrls: ['./warden-notification.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, UserService, AdminService, LocationsService]
})
export class WardenNotificationComponent implements OnInit, AfterViewInit, OnDestroy {

    encryptedToken = '';
    routeQuery = <any> {};
    routeParam = <any> {};
    locationData = <any> {};
    userData = <any> {};
    accountData = <any> {};
    roleText = 'Warden';

    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private cryptor: EncryptDecryptService,
        private accountService: AccountsDataProviderService,
        private elemRef : ElementRef,
        private userService: UserService,
        private preloader: DashboardPreloaderService,
        private personDataService: PersonDataProviderService,
        private adminService: AdminService,
        private platformLocation: PlatformLocation,
        public http: HttpClient,
        private locationService: LocationsService,
        private router: Router
        ) {

        this.userData = this.authService.getUserData();
        console.log('this.userData', this.userData);

        this.accountService.getById(this.userData['accountId'], (response) => {
            this.accountData = response.data;
            console.log('this.accountData', this.accountData);            
        });

    }

    getQueryParams(){
        let params = {};
        for(let i in this.routeQuery){
            params[i] = this.routeQuery[i];
        }

        return params;
    }

    clickStillOnLocation(yesNo){
        let params = this.getQueryParams();
        params['stillonlocation'] = yesNo;
        if(yesNo == 'yes'){
            params['step'] = '1';
        }
        this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
    }

    ngOnInit() {
        this.route.queryParams.subscribe((query) => {
            this.routeQuery = query;
            let params = this.getQueryParams();
            console.log(this.routeQuery);

            this.locationService.getById(this.routeQuery['locationid'], (response) => {
                this.locationData = response.location;
                if(response.parent.name.length > 0){
                    this.locationData['name'] = response.parent.name+', '+this.locationData.name;
                }
                console.log('this.locationData', this.locationData);

                let wardenRoleIds = [8, 9, 10, 11, 15, 16, 18];

                for(let i in response.users_locations){
                    if( response.users_locations[i]['location_id'] == this.routeQuery['locationid'] && 
                        ( wardenRoleIds.indexOf(  parseInt( response.users_locations[i]['em_roles_id'] ) ) ) > -1 
                        ){
                        this.roleText = response.users_locations[i]['role_name'];
                    }
                }
            });

        });


        this.route.params.subscribe((params) => {
            this.routeParam = params;


            console.log(this.routeParam);
        });
    }

    ngAfterViewInit() {
        
    }

    clickUpdateProfile(){
        
    }

    clickToStep2(){
        let params = this.getQueryParams();

        params['step'] = '2';
        this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
    }

    clickToStep3(){
        let params = this.getQueryParams();

        params['step'] = '3';
        this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
    }

    clickConfirmNotificationSettings(){
        let params = this.getQueryParams();
        params['step'] = '3';
        params['final'] = true;
        this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
    }

    clickConfirmNoAnswer(){
        let answer = (document.querySelectorAll('[name="no_answer"]:checked').length) ? document.querySelectorAll('[name="no_answer"]:checked')[0]['value'] : false;
        if(answer){
            let params = this.getQueryParams();
            params['ans'] = answer;
            this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
        }
    }

    noAnswerConfirm(){
        
    }

    ngOnDestroy() {

    }

}
