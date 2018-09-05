import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { UserService } from '../../services/users';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { MessageService } from '../../services/messaging.service';
import { CourseService } from '../../services/course';
import { LocationsService } from '../../services/locations';
import { Observable } from 'rxjs/Rx';

declare var $: any;
declare var Materialize: any;

@Component({
    selector: 'app-admin-account-users',
    templateUrl: './account-users.component.html',
    styleUrls: ['./account-users.component.css'],
    providers: [AdminService, DashboardPreloaderService, UserService, CourseService, LocationsService]
})
export class AccountUsersListComponent implements OnInit, OnDestroy, AfterViewInit {
    accountId = 0;
    sub: Subscription;
    userObjects = [];
    locations = [];
    public total_pages = 0;
    public createRange;
    public currentPage = 0;
    @ViewChild('selectPage') selectedPage: ElementRef;
    isSearching = false;
    isTyping = false;
    typingTimeout:any;

    updateProfileData = {
        user : <any> {
            user_id : 0, first_name : '', last_name : ''
        },
        showForm : () => {
            $('.update-profile-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.update-profile-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    updateCredentialsData = {
        user : <any> {
            user_id : 0, first_name : '', last_name : '', email : ''
        },
        showForm : () => {
            $('.credentials-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
            $('#inpPassword').prop('value', '');
            $('#confirmPassword').prop('value', '');
        },
        hideForm : () => {
            $('.credentials-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    sendInvitationData = {
        user : <any> {},
        account : <any> {},
        fetching : true,
        trainings : <any> [],
        showForm : () => {
            $('.invitations-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.invitations-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    assignTrainingsData = {
        user : <any> {},
        fetching : true,
        trainings : <any> [],
        exisisting : {
            data : <any> [],
            fetching : true
        },
        showForm : () => {
            $('.assign-trainings-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.assign-trainings-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    @ViewChild('inpSearchLocation') inpSearchLocation : ElementRef;

    assignLocationRoleData = {
        searchLocationSubs : <any> {},
        user : <any> {},
        selectedLocationData : <any> {},
        role_text : <any> [],
        eco_roles : <any> [],
        locations : <any> [],
        buildings : <any> [],
        levels : <any> [],
        locationsCopy : <any> [],
        locationsBackup : <any> [],
        fetching : true,
        formLocValid: false,
        locationsListShow: false,
        showForm : () => {
            $('.location-role-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.location-role-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        },
        toEditLocations : [],
        assignNewClickEvent(){
            this.assignLocationRoleData.toEditLocations.push({
                location_id : 0,
                role_id : 0,
                id : this.generateRandomChars(20)
            });
        },
        removeAssigned(index){
            this.assignLocationRoleData.toEditLocations[index]['deleted'] = true;
        },
        clickSelectLocation(loc, selectElem){
            if(loc.role_id > 0){
                this.assignLocationRoleData.selectedLocationData = loc;
                this.assignLocationRoleData.onChangeSelectRole.bind(this)(loc, loc.role_id);
                this.assignLocationRoleData.buildLocationsList.bind(this)();
                this.assignLocationRoleData.locationsListShow = true;
            }else{
                selectElem.innerText = "Select role first";
                setTimeout(() => {
                    selectElem.innerText = "Select location"
                },500);
            }
        },
        onChangeSelectRole(location, roleId){
            this.assignLocationRoleData.selectedLocationData = location;

            let rolesForBuildingsOnly = [1,11,15,16,18];

            if( rolesForBuildingsOnly.indexOf( parseInt(roleId) ) > -1 ){
                this.assignLocationRoleData.locations = this.assignLocationRoleData.buildings;
            }else{
                this.assignLocationRoleData.locations = this.assignLocationRoleData.levels;
            }

            this.assignLocationRoleData.locationsCopy = JSON.parse( JSON.stringify(this.assignLocationRoleData.locations) );

            location.role_id = roleId;

            if(
                (this.assignLocationRoleData.selectedLocationData['is_building'] == 1 && rolesForBuildingsOnly.indexOf( parseInt(roleId) ) == -1) ||
                (this.assignLocationRoleData.selectedLocationData['is_building'] == 0 && rolesForBuildingsOnly.indexOf( parseInt(roleId) ) > -1)
                ){
                this.assignLocationRoleData.selectedLocationData['location_id'] = 0;
            }

            this.assignLocationRoleData.locationsListShow = true;
            this.assignLocationRoleData.buildLocationsList.bind(this)();
        },
        buildLocationsList(){
            this.assignLocationRoleData.locationsListShow = false;
            setTimeout(() => {

                const ulLocations = $('.location-role-container ul.locations');
                ulLocations.html('');
                $('body').off('click.radio').on('click.radio', 'input[type="radio"][name="selectLocation"]', () => {
                    this.assignLocationRoleData.formLocValid = true;
                });

                console.log( this.assignLocationRoleData.selectedLocationData );

                let maxDisplay = 25,
                    count = 1;

                if (parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 1 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 11 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 15 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 16 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 18
                   ) {
                  for (let loc of this.assignLocationRoleData.locations) {
                    if (count <= maxDisplay) {
                        let $li = $(`
                            <li class="list-division" id="${loc.location_id}">
                                <div class="name-radio-plus">
                                    <div class="input">
                                        <input required type="radio" name="selectLocation" value="${loc.location_id}" id="check-${loc.location_id}">
                                        <label for="check-${loc.location_id}">${loc.name}</label>
                                        <span hidden class="parent-id">${loc.parent_id}</span>
                                    </div>
                                </div>
                            </li>`);

                        ulLocations.append($li);
                        count++;
                    }
                  }
                } else {
                    for (const loc of this.assignLocationRoleData.locations) {
                        if (count <= maxDisplay) {
                            const $lh = $(`<lh lh-id="${loc['parent_location_id']}"><h6>${loc['parent_location_name']}</h6></lh>`);
                            ulLocations.append($lh);
                            if ('sublocations' in loc) {
                                for (const subloc of loc.sublocations) {
                                    const $li = $(`
                                        <li class="list-division" id="${subloc.id}">
                                        <div class="name-radio-plus">
                                        <div class="input">
                                        <input required type="radio"
                                        name="selectLocation"
                                        value="${subloc.id}" id="check-${subloc.id}" lh-target="${loc['parent_location_id']}">
                                        <label for="check-${subloc.id}">${subloc.name}</label>
                                        <span hidden class="parent-id">${loc.parent_location_id}</span>
                                        </div>
                                        </div>
                                        </li>`);
                                    ulLocations.append($li);
                                }
                            }
                            count++;
                        }
                    }
                }

            }, 200);
        },
        submitSelectLocationModal(formLoc:NgForm, event){
            event.preventDefault();
            let locationFound = false;
            if(this.assignLocationRoleData.formLocValid){
                let
                radio = $(formLoc).find('input[type="radio"]:checked'),
                lhTarget = radio.attr('lh-target'),
                selectedLocationId = radio.val(),
                locationName = radio.parent().find('label').text(),
                parentId = radio.parent().find('span.parent-id').text();

                if(lhTarget){
                    let parentName = $('lh[lh-id="'+lhTarget+'"]').text();
                    locationName = parentName + ', '+locationName;
                    parentId = lhTarget;
                }

                this.assignLocationRoleData.selectedLocationData['location_id'] = selectedLocationId;
                this.assignLocationRoleData.selectedLocationData['parent_id'] = parentId;
                this.assignLocationRoleData.selectedLocationData['name'] = locationName;

                console.log(this.assignLocationRoleData.selectedLocationData);
                console.log(this.assignLocationRoleData.toEditLocations);
                this.inpSearchLocation.nativeElement.value = "";
                formLoc.reset();
                this.assignLocationRoleData.locationsListShow = false;
            }
        },
        onKeyUpSearchLocationEvent(){
            this.assignLocationRoleData.searchLocationSubs = Observable.fromEvent(document.getElementById('inpSearchLocation'), 'keyup')
                .debounceTime(500)
                .subscribe((event) => {

                let value = event['target'].value,
                    result = [];
                let seenSubLocIndex = [];
                const seenIndex = [];
                let findRelatedName;
                this.assignLocationRoleData.formLocValid = false;

                if (parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 1 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 11 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 15 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 16 ||
                    parseInt(this.assignLocationRoleData.selectedLocationData['role_id'], 10) === 18
                    ) {
                    findRelatedName = (data, mainParent?) => {
                        for(let i in data){
                            if(data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1){
                                result.push(data[i]);
                            }
                        }
                        return result;
                    };
                } else {
                    findRelatedName = (data, mainParent?) => {
                        for ( let i = 0; i < data.length; i++) {
                            if (data[i]['parent_location_name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                                result.push(data[i]);
                            }
                        }
                        for ( let i = 0; i < data.length; i++) {
                            seenSubLocIndex = [];
                            for (let s = 0; s < data[i]['sublocations'].length; s++) {
                                if (data[i]['sublocations'][s]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                                    if (seenIndex.indexOf(i)) {
                                        seenIndex.push(i);
                                    }
                                    seenSubLocIndex.push(data[i]['sublocations'][s]);
                                    data[i]['sublocations'] = seenSubLocIndex;
                                }
                            }
                        }
                        for (let si = 0; si < seenIndex.length; si++) {
                            result.push(data[seenIndex[si]]);
                        }
                        return result;
                    };
                }

                if(value.length > 0){
                    result = [];
                    findRelatedName( JSON.parse(JSON.stringify(this.assignLocationRoleData.locationsCopy)) );
                    this.assignLocationRoleData.locations = result;
                }else{
                    this.assignLocationRoleData.locations = JSON.parse(JSON.stringify(this.assignLocationRoleData.locationsCopy));
                }
                this.assignLocationRoleData.buildLocationsList.call(this);
                this.assignLocationRoleData.locationsListShow = true;
            });

            $('body').off('click.radioscroll').on('click.radioscroll', '.name-radio-plus input[type="radio"]', () => {
                window.scroll(0, 0);
            });
        },
        saveLocationAssignments(event){
            event.preventDefault();
            let toSaveData = this.assignLocationRoleData.toEditLocations,
                error = 0;
            for(let data of toSaveData){
                if(data.location_id == 0 && !data.deleted || data.role_id == 0 && !data.deleted){
                    error++;
                }
            }

            if(error == 0){
                $('.sending-container').css('display', 'block');
                this.userService.userLocationRoleAssignments({
                    user_id : this.assignLocationRoleData.user.user_id, assignments : JSON.stringify(this.assignLocationRoleData.toEditLocations)
                }, (response) => {
                    $('.sending-container').css('display', '');
                    this.dashboard.show();
                    this.loadLastGetAllAccountsUsers();
                });
            }
        }
    };
    
    msgSubs;

    constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router,
        public dashboard: DashboardPreloaderService,
        private userService: UserService, private msgSrv: MessageService,
        private courseService: CourseService, private locationService: LocationsService,
        ) {

        this.msgSubs = this.msgSrv.getMessage().subscribe((data) => {
            if(data['accountInfo']){
                this.sendInvitationData.account = data['accountInfo'];
            }
        });
    }

    generateRandomChars(length){
        let chars = 'ABCDEFGHIJKKLMNOPQRSTUVWXYZ0987654321',
        len = (typeof length == 'number') ? length : 15,
        responseCode = '';

        for(let i=0; i<=len; i++){
           responseCode += chars[ Math.floor(Math.random() * chars.length) ];
        }

        return responseCode;
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe((params) => {
            this.accountId = +params['accntId'];
            this.dashboard.show();

            this.sub = this.adminService.getAllAccountUsers(this.accountId).subscribe((response) => {
                this.userObjects = response['data']['list'];
                this.total_pages = response['data']['total_pages'];
                this.createRange = new Array(this.total_pages);
            }, (error) => {
                this.dashboard.hide();
                console.log(error);
            });

            this.adminService.getAccountTrainings(this.accountId).subscribe((response:any) => {
                this.sendInvitationData.trainings = response.data;
                this.sendInvitationData.fetching = false;
            });

            this.adminService.getAllLocationsOnAccount(this.accountId).subscribe((response:any) => {
                this.assignLocationRoleData.buildings = response.data.buildings;
                this.assignLocationRoleData.levels = response.data.levels;
                this.dashboard.hide();
            });
        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        this.msgSubs.unsubscribe();
        this.assignLocationRoleData.searchLocationSubs.unsubscribe();
    }

    ngAfterViewInit() {
        $('.row.filter-container select').material_select();
        console.log('this.assignLocationRoleData', this.assignLocationRoleData);
        this.assignLocationRoleData.onKeyUpSearchLocationEvent.bind(this)();
    }

    prevPage() {
        this.dashboard.show();

        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) - 1;
        if (this.currentPage < 0) {
            this.currentPage = this.total_pages - 1;
        }
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            this.dashboard.hide();
            console.log(error);
        });

    }
    pageChange() {
        this.dashboard.show();
        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            this.dashboard.hide();
            console.log(error);
        });
    }

    nextPage() {
        this.dashboard.show();
        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) + 1;
        if (this.currentPage > this.total_pages - 1) {
            this.currentPage = 0;
        }
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            console.log(error);
            this.dashboard.hide();
        });
    }

    searchByUserAndEmail(event: KeyboardEvent) {
        //isSearching
        
        this.isTyping = true;
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
            const searchKey = (<HTMLInputElement>event.target).value;
            this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage, searchKey).subscribe((response) => {
                this.isTyping = false;
                this.userObjects = response['data']['list'];
                this.total_pages = response['data']['total_pages'];
                this.createRange = new Array(this.total_pages);

            }, (error) => {

                console.log(error);
            });
        }, 600);

    }

    selectActionChangeEvent(user, event){
        let val = event.target.value;
        if(val == 'profile'){
            this.updateProfileData.user = user;
            this.updateProfileData.showForm();

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 500);
        }else if(val == 'credential'){
            this.updateCredentialsData.user = user;
            this.updateCredentialsData.showForm();

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 500);
        }else if(val == 'invite'){
            this.sendInvitationData.user = user;
            this.sendInvitationData.showForm();
        }else if(val == 'assign'){
            this.assignTrainingsData.user = user;
            this.assignTrainingsData.showForm();
        }else if(val == 'location-role'){
            this.assignLocationRoleData.user = user;
            this.assignLocationRoleData.showForm();

            this.userService.getUserLocationTrainingsEcoRoles(user.user_id, (response) => {
                this.assignLocationRoleData.user = response.data.user;
                this.assignLocationRoleData.role_text = response.data.role_text;
                this.assignLocationRoleData.eco_roles = response.data.eco_roles;
                this.assignLocationRoleData.locations = response.data.locations;

                this.assignLocationRoleData.toEditLocations = JSON.parse( JSON.stringify(response.data.locations) );

                this.assignLocationRoleData.fetching = false;
            });
        }

        event.target.value = "0";
    }

    loadLastGetAllAccountsUsers(){
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        }, (error) => {
            this.dashboard.hide();
            console.log(error);
        });
    }

    submitUpdateProfile(formProfile:NgForm){
        if(formProfile.valid){
            this.dashboard.show();
            this.userService.update(formProfile.value, (response) => {
                this.updateProfileData.user.first_name = formProfile.value.first_name;
                this.updateProfileData.user.last_name = formProfile.value.last_name;
                this.loadLastGetAllAccountsUsers();
            });
        }
    }

    submitCredential(formCredential:NgForm){
        if(formCredential.valid){
            this.dashboard.show();
            this.userService.update(formCredential.value, (response) => {
                this.loadLastGetAllAccountsUsers();
                $('#inpPassword').prop('value', '');
                $('#confirmPassword').prop('value', '');
            });
        }
    }

    sendInvitationClickEvent(training, event){
        let target = event.target;
        target.disabled = true;
        target.textContent = "Sending";
        training['user_id'] = this.sendInvitationData.user.user_id;
        this.courseService.emailTrainingInvite(training).subscribe((response) => {
            target.textContent = "Success";
            setTimeout(() => {
                target.disabled = false;
                target.textContent = "SEND";
            }, 1000);
        }, (error: HttpErrorResponse) => {
            alert ('Error sending invitation. Try again later.');
        });
    }
    assignTraining(training, event) {

      this.adminService.setAccountUserTraining(this.sendInvitationData.user.user_id,
         training['course_id'], training['training_requirement_id']).subscribe((response) => {
           console.log(response);
         });
    }



}
