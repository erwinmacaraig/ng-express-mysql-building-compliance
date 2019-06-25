import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { AdminService } from './../../services/admin.service';
import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

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

    isAdministrationsShow = false;

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

        if(this.router.url.indexOf("/teams/add-administrators") > -1){
            this.isAdministrationsShow = true;
        }
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
        }
        if(this.userRole == 1 || this.userRole == 2){
            this.selectRolesDropdown.push({
                role_id : 2, role_name : 'Tenant Responsible Person'
            });
        }
        this.dashboardPreloaderService.show();
        this.userService.listUserAccountLocations().subscribe((response) => {
            this.locations = response.hierarchy;
            this.locationsCopy = response.hierarchy;

            this.dashboardPreloaderService.hide();
            this.addMoreRow();

            console.log(response.hierarchy);
        }, (err) => {
            this.dashboardPreloaderService.hide(); 
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
        if(!this.isAdministrationsShow){
            breadCrumbs.push({
              'value' : 'All users', 'link' : '/teams/all-users'
            });
            breadCrumbs.push({
              'value' : 'Add new users', 'link' : '/teams/add-user'
            });
        }else{
            breadCrumbs.push({
              'value' : 'Administrators', 'link' : '/teams/list-administrators'
            });
            breadCrumbs.push({
              'value' : 'Add new administrators', 'link' : '/teams/add-administrators'
            });
        }
        this.messageService.sendMessage({ 'breadcrumbs' : breadCrumbs });
    }

    onSelectRole($event, iterator, elem){

        /*this.selectedUser = this.addedUsers[iterator];

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

        console.log(this.selectedUser);*/
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

    

    removeAddedUser(index){
        let newList = [];
        for(let i=0; i<=this.addedUsers.length; i++){
            if(i !== index && this.addedUsers[i] !== undefined){
                newList.push(this.addedUsers[i]);
            }
        }
        this.addedUsers = newList;
    }

    

    

    changeRoleEvent(user) {
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
        
    }

    showLocationSelection(user) {
        this.selectedUser = user;
        $('#modalLocations').modal('open');
       
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
                            
            let findRelatedName = (data) => {
                let results = [];
                for(let d of data){
                    let name = d.name.trim().toLowerCase();
                    name = name.replace(/[^a-zA-Z 0-9]/g, "");
                    if(name.indexOf(value) > -1){                        
                        //d['sublocations'] = [];
                        //console.log(d);
                        results.push(d);
                    }
                    try {
                        if(d.sublocations.length > 0){
                            let related = findRelatedName(d.sublocations);
                            for(let i in related) {
                                related[i]['name'] = `${related[i]['name']}, ${d['name']}`;
                                results.push(related[i]);                                
                            }
                        }

                    } catch(e) {
                        console.log('No sublocation');
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
        });
    }

    ngOnDestroy(){
        this.routeSub.unsubscribe();
        this.searchModalLocationSubs.unsubscribe();
    }
    chooseLocation(locationId=0, buildingName = '', locationName='') {        
        this.selectedUser['account_location_id'] = locationId;
        this.selectedUser['location_name'] = `${buildingName} ${locationName}`;            
        $('#modalLocations').modal('close');
        this.modalSearchLocation.nativeElement.value = '';
       
        
    }


}
