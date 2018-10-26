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
import { MessageService } from '../../services/messaging.service';

declare var $: any;
@Component({
    selector: 'app-add-user',
    templateUrl: './add.user.component.html',
    styleUrls: ['./add.user.component.css'],
    providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService]
})

export class AddUserComponent implements OnInit, OnDestroy {
	@ViewChild('f') addWardenForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public userProperty = {
        first_name : '',
        last_name : '',
        email : '',
        account_role_id : 0,
        account_location_id : 0,
        eco_role_id : 0,
        eco_location_id : 0,
        location_name : 'Select Location',
        location_id : 0,
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
    public addedUsers = [];
    showLoadingButton = false;

    public bulkEmailInvite;
    public CSVFileToUpload;

    public routeSub;
    private paramRole = '';
    private paramLocIdEnc = '';
    private paramLocId = '';

    searchModalLocationSubs;
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
        enableCheckAll: false
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
        private messageService: MessageService
        ) {

        this.userData = this.authService.getUserData();

        this.routeSub = this.actRoute.params.subscribe((params) => {
            if('location_id' in params){
                this.paramLocIdEnc = params.location_id;
                this.paramLocId = this.encdecrypt.decrypt(params.location_id);
                this.paramRole = params.role;
            }
        });
    }

    ngOnInit(){
        this.accountRoles = [
            {
                role_id: 2,
                role_name: 'Tenancy Responsible Personnel',
                selected : (this.paramRole == 'tenant') ? true : false
            }
        ];
        /*this.selectRolesDropdown.push({
            role_id : 2, role_name : 'Add Tenant'
        });*/

        this.userRole = this.authService.getHighestRankRole();
        if (this.userRole == 1) {
            this.accountRoles.push({
                role_id: 1,
                role_name: 'Building Manager',
                selected : (this.paramRole == 'building manager') ? true : false
            });

            this.selectRolesDropdown.push({
                role_id : 1, role_name : 'Building Manager'
            });

            this.selectRolesDropdown.push({
                role_id : 2, role_name : 'Tenant'
            });
        }

        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
            this.ecoRoles = roles;
            for(let i in roles){
                if(roles[i]['em_roles_id'] != 12){
                    this.accountRoles.push({
                        role_id : roles[i]['em_roles_id'],
                        role_name : roles[i]['role_name']
                    });

                    this.selectRolesDropdown.push({
                        role_id : roles[i]['em_roles_id'], role_name : roles[i]['role_name']
                    });
                }
            }

            if(this.paramRole.length > 0){
                let newAccRole = [];
                for(let i in this.accountRoles){
                    if(this.accountRoles[i]['selected']){
                        newAccRole.push(this.accountRoles[i]);
                    }
                }

                this.accountRoles = newAccRole;
            }
        }, (err) => {
            console.log('Server Error. Unable to get the list');
        }
        );

        this.dashboardPreloaderService.show();

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
        this.messageService.sendMessage({ 'csv-upload' : {  'title' : 'Add Users by CSV Upload'  } });

        $('#modalAddNewTenant').off('click.sametrp').on('click.sametrp', '#inputSameAs', (e) => {
            let target = $(e.target),
                checked = target.prop('checked'),
                trpFirstName = $('#trpFirstName'),
                trpLastName = $('#trpLastName'),
                trpEmail = $('#trpEmail');

            if(checked){
                trpFirstName.val(this.selectedUser["first_name"]).prop("disabled", true);
                trpLastName.val(this.selectedUser["last_name"]).prop("disabled", true);
                trpEmail.val(this.selectedUser["email"]).prop("disabled", true);
            }else{
                trpFirstName.val("").prop("disabled", false);
                trpLastName.val("").prop("disabled", false);
                trpEmail.val("").prop("disabled", false);
            }
            window['Materialize'].updateTextFields();
        });

        let breadCrumbs = [];
        breadCrumbs.push({
          'value' : 'All users', 'link' : '/teams/all-users'
        });
        breadCrumbs.push({
          'value' : 'Add new users', 'link' : '/teams/add-user'
        });
        this.messageService.sendMessage({ 'breadcrumbs' : breadCrumbs });
    }

    onSelectRole($event, iterator, elem){

        this.selectedUser = this.addedUsers[iterator];

        if($event.role_id == 2){
            let newSelected = [];
            for(let i in this.addedUsers[iterator]['selected_roles']){
                if(this.addedUsers[iterator]['selected_roles'][i]['role_id'] != 2){
                    newSelected.push(this.addedUsers[iterator]['selected_roles'][i]);
                }
            }

            this.addedUsers[iterator]['selected_roles'] = newSelected;

            elem.closeDropdown();
            $('#modalAddNewTenant').modal('open');
            $('#inputSameAs').prop('checked', false).trigger('click');
        }

        console.log(this.selectedUser);
    }

    addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));

        if(this.paramRole.length > 0){
            for(let i in this.accountRoles){
                if(this.accountRoles[i]['selected']){
                    prop.account_role_id = this.accountRoles[i]['role_id']
                }
            }
        }

        this.addedUsers.push( prop );

        setTimeout(() => {
            $("form table tbody tr:last-child").find('input.first-name').focus();
        },300);

        setTimeout(() => {
            $('.multiselect-item-checkbox').each(function(){
                let divText = $(this).find('div').text();
                if(divText.toLowerCase() == 'add tenant'){
                    $(this).children('div').replaceWith('<p>+Add New Tenant</p>');
                }
            });
        }, 700);
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
                                        <input required type="radio" name="selectLocation" loc-name="${loc.location_name}" value="${loc.location_id}" id="check-${loc.location_id}">
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
                            <input required type="radio" name="selectLocation" value="${loc.location_id}" loc-name="${loc.location_name}" id="check-${loc.location_id}">
                            <label for="check-${loc.location_id}">${loc.location_name}</label>
                        </div>
                    </div>
                    ${ul}
                </li>`);

                ulModal.append($li);
                count++;
            }
        }
    }

    changeRoleEvent(user) {
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
    }

    showLocationSelection(user) {
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
        $('#modalLocations').modal('open');
        this.formLocValid = false;
    }

    submitSelectLocationModal(form, event){
        event.preventDefault();

        if(this.formLocValid){
            let selectedLocationId = $(form).find('input[type="radio"]:checked').val();
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

    submitUsers(f) {
      // console.log(f);
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
          this.showLoadingButton = true;
          this.userService.createBulkUsers(this.addedUsers, (response) => {
              this.addedUsers = response.data;
              if(this.addedUsers.length == 0){
                  // let prop = JSON.parse(JSON.stringify(this.userProperty));
                  // this.addedUsers.push( prop );

                  this.router.navigate(['/teams', 'all-users']);
              }
              this.showLoadingButton = false;
          });
      }
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
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
                    let name = d.location_name.trim().toLowerCase();
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
        this.routeSub.unsubscribe();
        this.searchModalLocationSubs.unsubscribe();
    }


}
