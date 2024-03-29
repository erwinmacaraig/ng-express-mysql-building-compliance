import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AdminService } from '../../services/admin.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { ComplianceService } from './../../services/compliance.service';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
declare var user_course_relation: any;

@Component({
    selector: 'app-warden-notification',
    templateUrl: './warden-notification.html',
    styleUrls: ['./warden-notification.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, UserService, AdminService, ComplianceService, LocationsService]
})
export class WardenNotificationComponent implements OnInit, AfterViewInit, OnDestroy {

    encryptedToken = '';
    encryptedUserId = '';
    peepDestParam = '';
    peepDestQuery = '';
    routeQuery = <any> {};
    routeParam = <any> {};
    token = '';
    notification_token_id = 0;
    locationData = <any> {};
    userData = <any> {};
    accountData = <any> {};
    ecoRolesSelection = <any> [];
    ecoRoles = <any> {};
    roleText = 'Warden';
    locationRoles = <any> [];
    requiredTrainings = <any> [];
    notificationTokens = <any> [];
    showAssignedLocations = false;
    displayText = {
        yesUpdateProfile : {
            role : '',
            mobile : '',
            role_id : 0
        }
    };
    searchedLocations = <any> [];
    selectedSearchedLocations = <any> {
        sublocations : []
    };

    @ViewChild('inpChangeLocSearch') inpChangeLocSearch: ElementRef;
    searchChangeLocSubs;

    @ViewChild('inpsearchLocProfile') inpsearchLocProfile: ElementRef;
    searchLocProfileSubs;

    noSubLocs = false;
    hasTrainingReminder = false;

    selectedCourse = <any>{};
    baseUrl = '';
    courses = [];
    showLocationSelect = false;

    buildingSelections = <any> [];
    isCompliant = false;
    availableTrainings = <any> [];
    validTrainings = <any> [];
    trainingItems = <any> [];

    public email:string = '';
    public first_name: string = '';
    public last_name: string = '';
    public mobile: string = '';
    public building = 0;
    public selectedBuilding = 0;

    private getNotificationSub: Subscription;
    private routeParamsSub: Subscription;
    private verifyWardenSub: Subscription;
    private routeSub: Subscription;
    private assignedSublocations = [];

//

    sublocationList = [];
  selectedItems = [];
  dropdownSettings = {};
//



    constructor(
        private route: ActivatedRoute,
        private authService: AuthService,
        private cryptor: EncryptDecryptService,
        private accountService: AccountsDataProviderService,
        private userService: UserService,
        private preloader: DashboardPreloaderService,
        private personDataService: PersonDataProviderService,
        private adminService: AdminService,
        public http: HttpClient,
        private locationService: LocationsService,
        private sanitizer: DomSanitizer,
        private complianceService: ComplianceService,
        private router: Router
        ) {

        this.baseUrl = environment.backendUrl;
        this.userData = this.authService.getUserData();
        this.email = this.authService.userDataItem('email');
        this.first_name = this.authService.userDataItem('first_name');
        this.last_name = this.authService.userDataItem('last_name');
        this.mobile = this.authService.userDataItem('mobile');
        this.encryptedUserId = this.cryptor.encrypt(this.userData['userId']);

        this.accountService.getById(this.userData['accountId'], (response) => {
            this.accountData = response.data;
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

    updateProfile(updateForm: NgForm) {
        const locations = [];
        for (let loc of this.selectedItems) {
            locations.push(loc.location_id);
        }
        const postBody = {
            first_name: this.first_name,
            last_name: this.last_name,
            mobile: this.mobile,
            email:  this.email,
            building: this.building,
            assignedLocations: JSON.stringify(locations),
            oldLocations: JSON.stringify(this.assignedSublocations),
            user_em_role_id: 9
        };

        this.userService.updateWardenProfile(postBody).subscribe((response) => {
            console.log(response);
            this.authService.setUserDataItem('email', this.email);
            this.authService.setUserDataItem('first_name', this.first_name);
            this.authService.setUserDataItem('last_name', this.last_name);
            this.authService.setUserDataItem('mobile', this.mobile);
        });


    }

    getNotificationTokens(){
        this.getNotificationSub = this.userService.getNotificationToken(this.userData['userId']).subscribe((tokens) => {
            this.notificationTokens = tokens;
            console.log(tokens);
            for(let tok of this.notificationTokens){
                if(tok.training_reminder == 1){
                    this.hasTrainingReminder = true;
                }
            }
            this.verifyWardenSub = this.userService.verifyAsWarden(tokens[0]['notification_config_id']).subscribe((response) => {
                console.log(response);
            });

        });
    }

    formatDate(dt: string): string {
        return moment(dt).format('DD/MM/YYYY')
    }

    onItemSelect(item: any) {
        console.log(item);
      }


    ngOnInit() {

        this.preloader.show();

          this.dropdownSettings = {
            singleSelection: false,
            idField: 'location_id',
            textField: 'name',
            maxHeight: 350,
            itemsShowLimit: 3,
            enableCheckAll: false,
            allowSearchFilter: false,
            noDataAvailablePlaceholderText: 'Fetching data from server'
          };

        this.routeParamsSub =  this.route.queryParams.subscribe((query) => {
            this.routeQuery = query;
            let params = this.getQueryParams();

            this.token = this.cryptor.decryptUrlParam(this.routeQuery['token']);

            const parts: Array<string> = this.token.split('_');
            this.notification_token_id = +parts[3];

            if(Object.keys(this.locationData).length == 0){

                this.locationService.getById(this.routeQuery['locationid'], (response) => {
                    this.locationData = response.location;
                    if(response.parent.name.length > 0){
                        this.locationData['name'] = response.parent.name+', '+this.locationData.name;
                    }
                    if (response.sublocations) {
                        this.locationData['sublocations'] = response.sublocations;
                    } else {
                        this.locationData['sublocations'] = [];
                    }

                    let wardenRoleIds = [8, 9, 10, 11, 15, 16, 18];

                    for(let i in response.users_locations){
                        if( response.users_locations[i]['location_id'] == this.routeQuery['locationid'] &&
                            ( wardenRoleIds.indexOf(  parseInt( response.users_locations[i]['em_roles_id'] ) ) ) > -1
                            ){
                            this.roleText = response.users_locations[i]['role_name'];
                        }
                    }

                    if (this.locationData['is_building'] == 1) {
                        this.building = this.selectedBuilding = this.locationData['location_id'];
                        console.log(this.selectedBuilding);
                        this.sublocationList = this.locationData['sublocations'];
                        this.buildingSelections.push({
                            name: this.locationData['name'],
                            location_id: this.locationData['location_id'],
                            sublocations: this.locationData['sublocations']
                        });
                    } else {
                        this.building = this.selectedBuilding = response.parent['location_id'];
                        this.sublocationList = response.siblings;
                        this.buildingSelections.push({
                            name: response.parent['name'],
                            location_id: response.parent['location_id'],
                            sublocations:[]
                        });

                        for (let s of response.siblings) {
                            if (s['location_id'] == this.locationData['location_id']) {
                                continue;
                            } else {
                                (this.buildingSelections[0]['sublocations'] as Array<object>).push(s);
                            }

                        }
                    }

                });
                this.userService.getUserLocationTrainingsEcoRoles(this.userData['userId']).subscribe((response) => {
                  for(const loc of response.data.locations){
                      if(loc['user_em_roles_relation_id']){
                          this.locationRoles.push(loc);
                          this.selectedItems.push({
                              location_id: loc['location_id'],
                              name: loc['main_name']
                          });
                          this.assignedSublocations.push(loc['location_id']);
                      }
                      this.showAssignedLocations = true;
                  }
                  this.userData = Object.assign(this.userData, response.data.user);
                  this.requiredTrainings = response.data.required_trainings;
                  this.availableTrainings = response.data.trainings;
                  this.validTrainings = response.data.valid_trainings;

                  for(let vl of this.validTrainings){
                      vl['valid'] = true;
                  }

                  this.trainingItems = JSON.parse( JSON.stringify(this.validTrainings) );

                  for(let tr of this.requiredTrainings){
                      tr['valid'] = false;
                      this.trainingItems.push(tr);
                  }

                  this.isCompliant = (response.data.valid_trainings.length > 0 && response.data.required_trainings.length == 0) ? true : false;

                  this.ecoRoles = response.data.eco_roles;

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
                  this.preloader.hide();
              });

            }

            this.searchedLocations = <any> [];
            this.selectedSearchedLocations = <any> {
                sublocations : []
            };
            this.noSubLocs = false;
            this.ecoRolesSelection = [];

            setTimeout(() => {
                this.searchLocationEvent();
                this.getNotificationTokens();
            }, 500);

            this.peepDestParam = '/dashboard/warden-notification';
            this.peepDestQuery = '?userid='+this.userData['userId']+'&locationid='+this.routeQuery['locationid']+'&stillonlocation=yes&step=1';
        });

        this.routeSub = this.route.params.subscribe((params) => {
            this.routeParam = params;
            console.log(this.routeParam);
        });
        /*
        this.locationService.getParentLocationsForListing(this.userData['accountId'], (response) => {
            this.buildingSelections = response.locations;
        }, { sublocations:true });
        */



    }

    ngAfterViewInit() {
        this.searchLocationEvent();


        $('body').off('change', '#checkBoxOneMonth').on('change', '#checkBoxOneMonth', () => {
            this.userService.update({
                user_id : this.userData['userId'],
                training_reminder : ($('#checkBoxOneMonth').prop('checked')) ? 1 : 0
            }, (response) => { });
        });

    }

    ngAfterViewChecked(){
    }

    changeEventSubLocationReviewProfile(){
        let id = $('#selectLocReviewProf').val();
        for(let i in this.locationRoles){
            if( this.locationRoles[i]['user_em_roles_relation_id'] == id){
                this.displayText.yesUpdateProfile.role = this.locationRoles[i]['role_name'];
                this.displayText.yesUpdateProfile.role_id = this.locationRoles[i]['role_id'];
            }
        }
    }

    clickUpdateProfile(btn, num){
        if(num == 1){
            this.showLocationSelect = true;
            return false;
        }

        btn.innerText = "Updating...";
        btn.disabled = true;

        let
        idEmrolesRel = parseInt($('#selectLocReviewProf').val()),
        idFromLoc = 0,
        sublocid = parseInt($('#selectSubLocProfile').val()),
        locid = sublocid,
        fromLoc = <any> {},
        differentLocation = false,
        form = {
            user_id : this.userData['userId'],
            mobile_number : $('#mobile').val(),
            training_reminder : (this.hasTrainingReminder) ? 1 : 0
        },
        status = 'Location Changed',
        responses = <any> [];

        for(let i in this.locationRoles){
            if(idEmrolesRel == this.locationRoles[i]['user_em_roles_relation_id']){
                fromLoc = this.locationRoles[i];
                idFromLoc = fromLoc.location_id;
            }
        }

        responses.push({
            question: 'Old location',
            ans: idFromLoc
        });

        responses.push({
            question: 'New location',
            ans: locid
        });

        responses.push({
            question: 'user_em_roles_relation_id',
            ans: idEmrolesRel
        });

        $('.update-profile').css('pointer-events', 'none');

        let getUserLocationTrainingsEcoRoles = (callBack) => {
            this.userService.getUserLocationTrainingsEcoRoles(this.userData['userId']).subscribe((response) => {
                this.locationRoles = [];
                for (const loc of response.data.locations) {
                    if (loc['user_em_roles_relation_id']) {
                        this.locationRoles.push(loc);
                    }
                }
                btn.innerText = "Update Profile";
                btn.disabled = false;
                $('.update-profile').css('pointer-events', '');

                if (callBack) {
                    callBack();
                }

                if (differentLocation) {
                    setTimeout(() => {
                        $('#modalNewLocation').modal('close');
                    }, 1500);
                }
            });
        };

        this.userService.update(form, (response) => {

            const myAns = JSON.stringify(responses);
            this.accountService.submitQueryResponses(myAns, this.notification_token_id, 0, status).subscribe(
                (res) => {

                    this.showLocationSelect = false;

                    if(differentLocation){
                        $('#modalNewLocation').modal({ dismissible : false });
                        $('#modalNewLocation').modal('open');
                    }

                    getUserLocationTrainingsEcoRoles(() => {
                        if(differentLocation){
                            setTimeout(() => {
                                $('#modalNewLocation').modal('close');
                            }, 1500);
                        }
                    });
                },
                (error) => {
                    console.log('There was an error processing the request answer');
                }
            );

        });
    }

    clickToStep2(){
        let params = this.getQueryParams();

        params['step'] = '2';
        this.router.navigate(['/dashboard/warden-notification'], {  queryParams : params });
    }

    clickToStep3(btn){
        let params = this.getQueryParams();

        params['final'] = true;
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

            } else if( this.routeQuery['ans'] == 'resign' ) {
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

            }

            let
            idEmrolesRel = parseInt($('#selectSubLocNewLoc').val()),
            idFromLoc = 0,
            sublocid = parseInt($('#selSubLocationNewLoc').val()),
            locid = 0,
            fromLoc = <any> {},
            differentLocation = false;

            for(let i in this.locationRoles){
                if(idEmrolesRel == this.locationRoles[i]['user_em_roles_relation_id']){
                    fromLoc = this.locationRoles[i];
                    idFromLoc = fromLoc.location_id;
                }
            }

            if( this.routeQuery['ans'] == 'location_changed' ){
                if( !this.selectedSearchedLocations.location_id ){
                    // return false;
                }

                if(sublocid == -1 || sublocid == null){
                    locid = this.selectedSearchedLocations.location_id;
                }else{
                    locid = sublocid;
                }

                if( fromLoc.location_id == locid  ){
                    return false;
                }

                if( fromLoc.is_building == 1 ){
                    if( fromLoc.location_id != this.selectedSearchedLocations.location_id ){
                        differentLocation = true;
                    }
                }else{
                    if( fromLoc.parent_id != this.selectedSearchedLocations.location_id ){
                        differentLocation = true;
                    }
                }

                btnConfirm.disabled = true;
                btnConfirm.innerText = "Sending...";

                status = 'Location Changed';
                responses.push({
                    question: 'Old location',
                    ans: idFromLoc
                });

                responses.push({
                    question: 'New location',
                    ans: locid
                });

                responses.push({
                    question: 'user_em_roles_relation_id',
                    ans: idEmrolesRel
                });
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

                        if(differentLocation){
                            $('#modalNewLocation').modal({ dismissible : false });
                            $('#modalNewLocation').modal('open');
                            setTimeout(() => {
                                $('#modalNewLocation').modal('close');
                            }, 1500);
                            setTimeout(() => {
                                this.router.navigate(['/dashboard']);
                            }, 2000);
                        } else {
                            this.router.navigate(['/dashboard']);
                        }
                    }
                },
                (error) => {
                    console.log('There was an error processing the request answer');

                }
            );


        }
    }

    selectSearchLocation(loc, inpSearch){
        this.searchedLocations = [];
        console.log('loc', loc);
        this.selectedSearchedLocations = loc;
        inpSearch.value = loc.name;
        if(loc.sublocations.length == 0){
            this.noSubLocs = true;
        }else{
            loc.sublocations.unshift({
                location_id : -1,
                name : 'Building is selected, change this for sublocation'
            });
            this.noSubLocs = false;
        }

        setTimeout(() => {
            this.onSelectSubLocation();
        }, 300);
    }

    onSelectBuilding(){
        /*let bldgid = parseInt($('#selectBuildingSelections').val());


        for(let bldg of this.buildingSelections){
            if(bldg.location_id == bldgid){
                this.selectedSearchedLocations = bldg;
            }
        }*/

    }

    onSelectSubLocation(){
        let id = $('#selectSubLocProfile').val();
        let rolesInclude = [];
        this.ecoRolesSelection = [];

        if(id == "-1" || id == null){
            rolesInclude = [15,16,18];
        }else{
            rolesInclude = [8,9,10,11,12,13,14];
        }

        for(let eco of this.ecoRoles){
            if( rolesInclude.indexOf( eco['em_roles_id'] ) > -1 ){
                this.ecoRolesSelection.push(eco);
            }
        }
    }

    searchLocationEvent(){

        if(this.searchChangeLocSubs){
            this.searchChangeLocSubs.unsubscribe();
        }

        if(this.searchLocProfileSubs){
            this.searchLocProfileSubs.unsubscribe();
        }

        if(this.inpChangeLocSearch){
            this.searchChangeLocSubs = Observable.fromEvent(this.inpChangeLocSearch.nativeElement, "keyup").distinctUntilChanged().debounceTime(500).subscribe((event) => {
                let val = this.inpChangeLocSearch.nativeElement.value;
                this.selectedSearchedLocations = {
                    sublocations : []
                };
                this.ecoRolesSelection = [];
                if(val.trim().length > 0){
                    this.locationService.searchBuildings(val, { sublocations : true, account_id: this.userData['accountId'] }).subscribe((response) => {
                        this.searchedLocations = response;
                    });
                }else{
                    this.searchedLocations = [];
                    this.noSubLocs = false;

                }
            });
        }

        if(this.inpsearchLocProfile){
            this.searchLocProfileSubs = Observable.fromEvent(this.inpsearchLocProfile.nativeElement, "keyup").distinctUntilChanged().debounceTime(500).subscribe((event) => {
                let val = this.inpsearchLocProfile.nativeElement.value;
                this.selectedSearchedLocations = {
                    sublocations : []
                };
                this.ecoRolesSelection = [];
                if(val.trim().length > 0){
                    this.locationService.searchBuildings(val, { sublocations : true, account_id: this.userData['accountId'] }).subscribe((response) => {
                        this.searchedLocations = response;
                    });
                }else{
                    this.searchedLocations = [];
                    this.noSubLocs = false;

                }
            });
        }
    }

    closeStep2(){
        /*btn.disabled = true;
        this.accountService.submitQueryResponses(JSON.stringify([]), this.notification_token_id, 1, 'Validated').subscribe(
            (res) => {
                btn.disabled = false;
                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 100);
            },
            (error) => {
                console.log('There was an error processing the request answer');

            }
        );*/

        this.router.navigate(['/dashboard']);
    }

    loadTrainingCourse(course: object = {}) {
        user_course_relation = course['course_user_relation_id'] || 0;
        this.selectedCourse = course;
        this.selectedCourse['formatted_launcher_url'] =
        this.sanitizer.bypassSecurityTrustResourceUrl(this.baseUrl + '/' + this.selectedCourse['course_launcher']);
        this.complianceService.initializeLRS(user_course_relation).subscribe((data) => {
            setTimeout(() => {
                console.log(this.selectedCourse);
                $('.modal').modal({
                    dismissible : false,
                    startingTop : '0%',
                    endingTop: '5%'
                });
                $('#training').modal('open');
            }, 600);
        }, (error) => {
            alert('There was an error loading course. Try again later');
        });
    }

    onCloseCourseModule(course: object = {}) {

        this.complianceService.getAllRegisteredCourses().subscribe((data) => {
            console.log(data);
            if (data['courses'].length > 0) {
                this.courses = data['courses'];
                console.log('At onCloseCourseModule', this.courses);
            }
        }, (error) => {
            console.log('At onCloseCourseModule', error);
            this.courses = [];
        });
    }

    ngOnDestroy() {
        if(this.searchChangeLocSubs){
            this.searchChangeLocSubs.unsubscribe();
        }

        if(this.searchLocProfileSubs){
            this.searchLocProfileSubs.unsubscribe();
        }

        if (this.getNotificationSub) {
            this.getNotificationSub.unsubscribe();
        }
        if(this.routeParamsSub) {
            this.routeParamsSub.unsubscribe();
        }
        if (this.verifyWardenSub) {
            this.verifyWardenSub.unsubscribe();
        }
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
    }

}
