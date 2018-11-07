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
    encryptedUserId = '';
    routeQuery = <any> {};
    routeParam = <any> {};
    token = '';
    notification_token_id = 0;
    locationData = <any> {};
    userData = <any> {};
    accountData = <any> {};
    roleText = 'Warden';
    locationRoles = <any> [];
    requiredTrainings = <any> [];
    displayText = {
        yesUpdateProfile : {
            role : '',
            mobile : ''
        }
    };
    searchedLocations = <any> [];
    selectedSearchedLocations = <any> {
        sublocation : []
    };

    @ViewChild('inpChangeLocSearch') inpChangeLocSearch: ElementRef;
    searchChangeLocSubs;

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
        this.encryptedUserId = this.cryptor.encrypt(this.userData['userId']);
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

            if(Object.keys(this.locationData).length == 0){

                this.locationService.getById(this.routeQuery['locationid'], (response) => {
                    this.locationData = response.location;
                    if(response.parent.name.length > 0){
                        this.locationData['name'] = response.parent.name+', '+this.locationData.name;
                    }

                    let wardenRoleIds = [8, 9, 10, 11, 15, 16, 18];

                    for(let i in response.users_locations){
                        if( response.users_locations[i]['location_id'] == this.routeQuery['locationid'] && 
                            ( wardenRoleIds.indexOf(  parseInt( response.users_locations[i]['em_roles_id'] ) ) ) > -1 
                            ){
                            this.roleText = response.users_locations[i]['role_name'];
                        }
                    }
                });

                this.userService.getUserLocationTrainingsEcoRoles(this.userData['userId'], (response) => {
                    this.locationRoles = response.data.locations;
                    this.userData = Object.assign(this.userData, response.data.user);
                    this.requiredTrainings = response.data.required_trainings;

                    if( this.userData.mobile_number !== null ){
                        if(this.userData.mobile_number.trim().length > 0){
                            this.displayText.yesUpdateProfile.mobile = this.userData.mobile_number;
                        }else if( this.userData.phone_number !== null ){
                            if(this.userData.phone_number.trim().length > 0){
                                this.displayText.yesUpdateProfile.mobile = this.userData.phone_number;
                            }
                        }
                    }else if( this.userData.phone_number !== null ){
                        if(this.userData.phone_number.trim().length > 0){
                            this.displayText.yesUpdateProfile.mobile = this.userData.phone_number;
                        }
                    }

                    setTimeout(() => {
                        this.changeEventSubLocationReviewProfile();
                    }, 500);
                });

            }
        });

        this.route.params.subscribe((params) => {
            this.routeParam = params;


            console.log(this.routeParam);
        }); 
    }

    ngAfterViewInit() {
        this.searchLocationEvent();
    }

    changeEventSubLocationReviewProfile(){
        let id = $('#selectSubLocReviewProf').val();
        for(let i in this.locationRoles){
            if( this.locationRoles[i]['user_em_roles_relation_id'] == id){
                this.displayText.yesUpdateProfile.role = this.locationRoles[i]['role_name'];
            }
        }
    }

    clickUpdateProfile(btn){
        btn.innerText = "Updating...";
        btn.disabled = true;

        this.userService.update({
            user_id : this.userData['userId'],
            mobile_number : $('#mobile').val()
        }, (response) => {
            console.log('update user', response);
            btn.innerText = "Update Profile";
            btn.disabled = false;
        });
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
        if($('[name="settings"]:checked').length > 0){
            $('#btnConfirmUpdateNotif').html('Updating...').prop('disabled', true);

            this.userService.updateNotificationSettings({
                user_id : this.userData['userId'],
                frequency : ($('#threeMonths').prop('checked')) ? 3 : 0,
                one_month_training_reminder : ($('#oneMonth').prop('checked')) ? 1 : 0
            }).subscribe((response) => {
                $('#btnConfirmUpdateNotif').html('Confirm').prop('disabled', false);
                let params = this.getQueryParams();
                params['step'] = '3';
                params['final'] = true;
                this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
            });
        }

    }

    clickConfirmNoAnswer(){
        let answer = (document.querySelectorAll('[name="no_answer"]:checked').length) ? document.querySelectorAll('[name="no_answer"]:checked')[0]['value'] : false;
        if(answer){
            let params = this.getQueryParams();
            params['ans'] = answer;
            this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
        }
    }

    noAnswerConfirm(btnConfirm){
        const responses = [];
        this.token = this.cryptor.decryptUrlParam(this.routeQuery['token']);
        let params = this.getQueryParams();
        
        const parts: Array<string> = this.token.split('_');
        this.notification_token_id = +parts[3];
        let status = '';
        responses.push({
            question: 'Do you still hold the role to the appointed location',
            ans: 'No'
        });
        if( this.routeQuery['ans'] ){
            if( this.routeQuery['ans'] == 'tenancy_moved_out' ){
                status = 'Tenancy Moved Out';
                responses.push({
                    question: 'reason',
                    ans: 'Tenancy moved out'
                });
                if( $('#messageTenancyMovedOut').val().trim().length > 0 ){
                    btnConfirm.disabled = true;
                    btnConfirm.innerText = "Sending...";                    
                    responses.push({
                        question: 'addtional information',
                        ans: $('#messageTenancyMovedOut').val().trim()
                    });
                }
                params['stillonlocation'] = 'no';                

            }else if( this.routeQuery['ans'] == 'resign' ){
                status = 'Resigned';
                params['stillonlocation'] = 'no';
                params['final'] = 'true';
                responses.push({
                    question: 'reason',
                    ans: 'I want to resign'
                });
                if( $('[name="nominate"]:checked').length > 0 ){                    
                    let 
                    val = $('[name="nominate"]:checked').val(),
                    email = $('#inpEmailNominate').val(),
                    re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                    
                    email = (re.test(String(email).toLowerCase())) ? email : '';
                    
                    if(  email.trim().length > 0 || val == "no" ){
                        
                        $('[name="nominate"]').prop('disabled', true);
                        $('#inpEmailNominate').prop('disabled', true);
                        btnConfirm.disabled = true;
                        btnConfirm.innerText = "Sending...";

                        if(  email.trim().length > 0 ) {
                            responses.push({
                                question: 'Who do you want to nominate for the role',
                                ans: email
                            });
                        }
                        
                    }

                }

            } else if( this.routeQuery['ans'] == 'location_changed' ){
                status = 'Location Changed';
                
            }            
            const myAns = JSON.stringify(responses);
            this.accountService.submitQueryResponses(myAns, this.notification_token_id, 1, status).subscribe(
                (res) => {
                    console.log(res);
                    if( this.routeQuery['ans'] == 'tenancy_moved_out' ) {
                        this.router.navigate(['/dashboard']);
                    } else if( this.routeQuery['ans'] == 'resign' ) { 
                        this.router.navigate(['/dashboard/warden-notification'], {queryParams: params});
                    } else {
                        this.router.navigate(['/dashboard']);
                    }
                },
                (error) => {
                    console.log('There was an error processing the request answer');
                    
                }
            );


        }
    }

  
    searchLocationEvent(){

        this.searchChangeLocSubs = Observable.fromEvent(this.inpChangeLocSearch.nativeElement, "keyup").distinctUntilChanged().debounceTime(500).subscribe((event) => {
            let val = this.inpChangeLocSearch.nativeElement.value;

            this.locationService.searchBuildings(val, { sublocations : true }).subscribe((response) => {
                this.searchedLocations = response;
            });

        });
    }

    ngOnDestroy() {
        if (this.searchChangeLocSubs) {
            this.searchChangeLocSubs.unsubscribe();
        }
    }

}
