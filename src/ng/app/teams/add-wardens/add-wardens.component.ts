import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { AdminService } from './../../services/admin.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ExportToCSV } from '../../services/export.to.csv';
import { MessageService } from '../../services/messaging.service';

declare var $: any;
@Component({
    selector: 'app-teams-add-warden',
    templateUrl: './add-wardens.component.html',
    styleUrls: ['./add-wardens.component.css'],
    providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService, ExportToCSV, MessageService]
})
export class TeamsAddWardenComponent implements OnInit, OnDestroy {
    @ViewChild('f') addWardenForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public addedUsers = [];
    public userProperty = {
        first_name : '',
        last_name : '',
        email : '',
        role_id : 0,
        account_role_id : 0,
        account_location_id : 0,
        eco_role_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        contact_number : '',
        mobile_number : '',
        selected_roles : [],
        new_account : {
            valid : false,
            name : '',
            trp : {
                firstname : '', lastname : '', email : ''
            }
        },
        errors : {}
    };

    public csvValidRecords = [];
    public csvInvalidRecords = [];
    private userRole;
    public accountRoles;
    public ecoRoles;
    public ecoDisplayRoles = [];
    public locations = [];
    public buildings = [];
    public levels = [];
    public locationsCopy = [];
    public userData = {};
    public selectedUser = {};
    public bulkEmailInvite;
    public CSVFileToUpload;
    public csvHeaderNames;
    public recordOverride;
    droppedFile;

    public routeSub;
    public paramLocIdEnc = '';
    public paramLocId = '';

    searchModalLocationSubs;
    showLocationsRecursive = false;
    formLocValid = false;

    selectRolesDropdown = [];
    dropdownSettings = {
        singleSelection: false,
        idField: 'role_id',
        textField: 'role_name',
        selectAllText: 'Select All',
        unSelectAllText: 'UnSelect All',
        itemsShowLimit: 1,
        allowSearchFilter: false,
        enableCheckAll: false,
        noDataAvailablePlaceholderText: 'Fetching data from server'
    };

    constructor(
        private authService: AuthService,
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService,
        private dashboardPreloaderService : DashboardPreloaderService,
        private userService : UserService,
        private router : Router,
        private actRoute : ActivatedRoute,
        private encdecrypt : EncryptDecryptService,
        private adminService : AdminService,
        private exportToCSV : ExportToCSV,
        private messageService: MessageService
        ) {

        this.userData = this.authService.getUserData();

        this.routeSub = this.actRoute.params.subscribe((params) => {
            if('location_id' in params){
                this.paramLocIdEnc = params.location_id;
                this.paramLocId = this.encdecrypt.decrypt(params.location_id);
            }
        });
    }

    ngOnInit() {
        this.accountRoles = [{
            role_id: 3,
            role_name: 'User'
        },
        {
            role_id: 2,
            role_name: 'Tenant'
        }
        ];
        this.userRole = this.authService.getHighestRankRole();
        if (this.userRole == 1) {
            this.accountRoles.push({
                role_id: 1,
                role_name: 'Building Manager'
            });
        }

        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
                this.ecoRoles = roles;
                for(let i in roles){
                    if(roles[i]['em_roles_id'] != 12 && roles[i]['em_roles_id'] != 8){
                        this.selectRolesDropdown.push({
                            role_id : roles[i]['em_roles_id'], role_name : roles[i]['role_name']
                        });
                    }
                }
                this.dashboardPreloaderService.show();
            }, (err) => {
                this.dashboardPreloaderService.show();
                console.log('Server Error. Unable to get the list');
            }
        );

        // this.dashboardPreloaderService.show();

        this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response:any) => {
            this.locations = JSON.parse( JSON.stringify( response.locations ) );
            this.locationsCopy = JSON.parse( JSON.stringify( response.locations ) );

            this.dashboardPreloaderService.hide();
            this.addMoreRow();
        });

        this.adminService.getAllLocationsOnAccount(this.userData['accountId']).subscribe((response:any) => {
            this.buildings = response.data.buildings;
            this.levels = response.data.levels;
        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });

        this.onKeyUpSearchModalLocationEvent();
        this.messageService.sendMessage({ 'csv-upload' : {  'title' : 'Nominate Wardens by CSV Upload'  } });

        let breadCrumbs = [];
        breadCrumbs.push({
          'value' : 'ECO Member', 'link' : '/teams/list-wardens'
        });
        breadCrumbs.push({
          'value' : 'Nominate warden', 'link' : '/teams/add-wardens'
        });
        this.messageService.sendMessage({ 'breadcrumbs' : breadCrumbs });
    }

    onSelectRole($event, iterator, elem){

        this.selectedUser = this.addedUsers[iterator];

        console.log(this.selectedUser);
    }

    filterLocationForSelectedValue(){
        let selected = {};
        let loopAddKey = (data, mainParent?) => {
            for(let i in data){
                if(typeof mainParent === 'undefined'){
                    mainParent = JSON.parse(JSON.stringify(data[i]));
                }else if(mainParent.location_id != data[i]['location_id'] && data[i]['parent_id'] == -1){
                    mainParent = JSON.parse(JSON.stringify(data[i]));
                }

                if(this.paramLocIdEnc.length > 0){
                    if(this.paramLocId == data[i]['location_id']){
                        if('location_id' in mainParent){
                            selected = mainParent;
                        }else{
                            selected = data[i];
                        }
                    }
                }

                if(mainParent){
                    data[i]['main_parent'] = (mainParent.location_id != data[i]['location_id']) ? mainParent : {};
                }else{
                    data[i]['main_parent'] = {};
                }

                if(data[i]['sublocations'].length > 0){
                    loopAddKey(data[i]['sublocations'], mainParent);
                }
            }
        };

        loopAddKey(this.locations);

        return [selected];
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
    }

    addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );

        for ( let r of this.ecoRoles ) {
            if (r.is_warden_role == 1) {
                if(!this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ]){
                    this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ] =  [];
                }
                (this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ]).push(r);
            }
        }

        setTimeout(() => {
            $('form table tbody tr:last-child').find('input.first-name').focus();
        },300);
    }

    onSelectedAccountRole(srcId: number) {
        let r = this.addWardenForm.controls['accountRole' + srcId].value * 1;
        this.ecoDisplayRoles[srcId] = [];
        switch(r) {
            case 1:
            case 2:
            this.ecoDisplayRoles[srcId] = this.ecoRoles;
            break;
            case 3:
            for ( let r of this.ecoRoles ) {
                if (r.is_warden_role == 1) {
                    (this.ecoDisplayRoles[srcId]).push(r);
                }
            }
            break;

        }
        console.log(this.ecoDisplayRoles);
    }

    onChangeDropDown(event){
        if(event.currentTarget.checked){
            $( $(event.currentTarget).parents('.list-division')[0] ).addClass('show-drop-down');
        }else{
            $( $(event.currentTarget).parents('.list-division')[0] ).removeClass('show-drop-down');
        }
    }

    removeAddedUser(index){
        let newList = [];
        for(let i=0; i<=this.addedUsers.length; i++){
            if(i !== index && this.addedUsers[i] !== undefined){
                newList.push(this.addedUsers[i]);
            }
        }
        this.addedUsers = newList;
    }

    filterLocationsToDisplayByUserRole(user, data){
        let resp = [],
            copy = JSON.parse(JSON.stringify(data));
            
        return JSON.parse( JSON.stringify( this.locationsCopy ) );
    }

    buildLocationsListInModal(){
        const ulModal = $('#modalLocations ul.locations');
        ulModal.html('');
        $('body').off('click.radio').on('click.radio', 'input[type="radio"][name="selectLocation"]', () => {
            $('#modalLocations')[0].scrollTop = 0;
            this.formLocValid = true;
        });

        let maxDisplay = 25,
            count = 1,
            buildChildList = (locations) => {
                let ul = ``;

                if(locations.length > 0){
                    ul += '<ul style="padding-left: 20px; max-height: 153px; overflow: auto;">';
                    for(let loc of locations){
                        let subUl = (loc.sublocations.length > 0) ? buildChildList(loc.sublocations) : '';
                        ul += `
                            <li class="list-division" id="${loc.location_id}">
                                <div class="name-radio-plus">
                                    <div class="input">
                                        <input required type="radio" name="selectLocation" loc-name="${loc.name}" value="${loc.location_id}" id="check-${loc.location_id}">
                                        <label for="check-${loc.location_id}">${loc.name}</label>
                                    </div>
                                </div>

                                ${subUl}
                            </li>
                        `;
                    }
                    ul += '</ul>';
                }

                return ul;

            };

        for (const loc of this.locations) {
            if (count <= maxDisplay) {
                let ul = ``;
                if(loc.sublocations.length > 0){
                    ul += buildChildList(loc.sublocations);
                }
                let $li = $(`
                <li class="list-division" id="${loc.location_id}">
                    <div class="name-radio-plus">
                        <div class="input">
                            <input required type="radio" name="selectLocation" value="${loc.location_id}" loc-name="${loc.name}" id="check-${loc.location_id}">
                            <label for="check-${loc.location_id}">${loc.name}</label>
                        </div>
                    </div>
                    ${ul}
                </li>`);

                ulModal.append($li);
                count++;
            }
        }
    }

    changeRoleEvent(user){
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
    }

    showLocationSelection(user){
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
        $('#modalLocations').modal('open');
        this.formLocValid = false;
    }

    submitSelectLocationModal(form, event){
        event.preventDefault();

        if(this.formLocValid){
            let selectedLocationId = $('#formLoc').find('input[type="radio"]:checked').val();
            let target = $('#check-'+selectedLocationId);

            this.selectedUser['account_location_id'] = selectedLocationId;
            if( parseInt(this.selectedUser['eco_role_id']) > 0){
                this.selectedUser['eco_location_id'] = selectedLocationId;
            }

            this.selectedUser['location_name'] = target.attr('loc-name');

            for (const u of this.addedUsers) {
                if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
                    u.errors['invalid'] = `${u['email']} is invalid`;
                }
            }

            // console.log(this.addedUsers);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
        this.modalSearchLocation.nativeElement.value = "";
    }

    addBulkWarden(f) {
      let allInputValid = true;
      if (this.addedUsers.length > 0 && f.valid) {
        for (const u of this.addedUsers) {
          if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
            u.errors['invalid'] = `${u['email']} is invalid`;
            allInputValid = false;
          }
        }
      }
      if (allInputValid) {
        this.userService.createBulkUsers(this.addedUsers, (response) => {
          this.addedUsers = response.data;
          if(this.addedUsers.length == 0){
              this.router.navigate(["/teams/list-wardens"]);
          }
        });
      }
    }

    sendInviteOnClick() {
        this.bulkEmailInvite = (this.emailInviteForm.controls.inviteTxtArea.value).split(',');
        const validEmails = [];
        const email_regex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
        for (let x = 0; x < this.bulkEmailInvite.length; x++) {
          if (email_regex.test(this.bulkEmailInvite[x].trim())) {
            validEmails.push(this.bulkEmailInvite[x].trim());
          }
        }
        this.dataProvider.sendWardenInvitation(validEmails).subscribe((data) => {
          this.addedUsers = data;
          console.log(data);
          $('#modalInvite').modal('close');
        }, (e) => {
          console.log(e);
        }
        );
        this.emailInviteForm.controls.inviteTxtArea.reset();
    }

    onKeyUpSearchModalLocationEvent(){
        this.searchModalLocationSubs = Observable.fromEvent(this.modalSearchLocation.nativeElement, 'keyup')
            .debounceTime(500)
            .subscribe((event) => {
            this.formLocValid = false;
            let value = event['target'].value.trim().toLowerCase();
            value = value.replace(/[^a-zA-Z 0-9]/g, "");
            let seenSubLocIndex = [];
            const seenIndex = [];

            let findRelatedName = (data) => {
                let results = [];
                for(let d of data){
                    let name = d.name.trim().toLowerCase();
                    name = name.replace(/[^a-zA-Z 0-9]/g, "");
                    if(name.indexOf(value) > -1){
                        d['sublocations'] = [];
                        results.push(d);
                    }
                    if(d.sublocations.length > 0){
                        let related = findRelatedName(d.sublocations);
                        for(let i in related){
                            results.push(related[i]);
                        }
                    }
                }

                return results;
            };

            if(value.length > 0){
                let found = findRelatedName( JSON.parse(JSON.stringify(this.locationsCopy)) );
                let finalResults = [],
                    ids = [];
                for(let f of found){
                    if(ids.indexOf(f.location_id) == -1){
                        finalResults.push(f);
                        ids.push(f.location_id);
                    }
                }
                this.locations = finalResults;
            }else{
                this.locations = JSON.parse(JSON.stringify(this.locationsCopy));
            }

            this.buildLocationsListInModal();
        });
    }

    ngOnDestroy(){
        this.searchModalLocationSubs.unsubscribe();
    }

}
