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
    selector: 'app-teams-add-general-occupant',
    templateUrl: './add.gen.occ.component.html',
    styleUrls: ['./add.gen.occ.component.css'],
    providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService, ExportToCSV, MessageService]
})
export class TeamsAddGeneralOccupantComponent implements OnInit, OnDestroy {
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
    selectRoleDropDownGenOct = {};

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
        this.dashboardPreloaderService.show();
        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
                this.ecoRoles = roles;
                for(let i in roles){
                    if(roles[i]['em_roles_id'] != 12){
                        this.selectRolesDropdown.push({
                            role_id : roles[i]['em_roles_id'], role_name : roles[i]['role_name']
                        });
                    }
                    if(roles[i]['em_roles_id'] == 8){
                        this.selectRoleDropDownGenOct = {
                            role_id : roles[i]['em_roles_id'], role_name : roles[i]['role_name']
                        }
                    }
                }
                this.userProperty.selected_roles.push(this.selectRoleDropDownGenOct);
                
            }, (err) => {
                this.dashboardPreloaderService.hide(); 
                console.log('Server Error. Unable to get the list');
            }
        );

        
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
        this.messageService.sendMessage({ 'csv-upload' : {  'title' : 'Nominate Wardens by CSV Upload'  } });

        let breadCrumbs = [];
        breadCrumbs.push({
          'value' : 'General Occupant', 'link' : '/teams/list-general-occupant'
        });
        breadCrumbs.push({
          'value' : 'Add General Occupant', 'link' : '/teams/add-general-occupant'
        });
        this.messageService.sendMessage({ 'breadcrumbs' : breadCrumbs });
    }

    onSelectRole($event, iterator, elem){
        this.selectedUser = this.addedUsers[iterator];
        console.log(this.selectedUser);
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

    removeAddedUser(index){
        let newList = [];
        for(let i=0; i<=this.addedUsers.length; i++){
            if(i !== index && this.addedUsers[i] !== undefined){
                newList.push(this.addedUsers[i]);
            }
        }
        this.addedUsers = newList;
    }


    changeRoleEvent(user){
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
    }

    showLocationSelection(user){
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
            // console.log('The selected user ', this.selectedUser);
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
      console.log(this.addedUsers);
      if (allInputValid) {
        this.userService.createBulkUsers(this.addedUsers, (response) => {
          this.addedUsers = response.data;
          if(this.addedUsers.length == 0){
              this.router.navigate(["/teams/list-general-occupant"]);
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
                            
            let findRelatedName = (data) => {
                let results = [];
                for(let d of data){
                    if (d.name) {
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
        this.searchModalLocationSubs.unsubscribe();
    }

    chooseLocation(locationId=0, buildingName = '', locationName='') {        
        this.selectedUser['account_location_id'] = locationId;
        this.selectedUser['location_name'] = `${buildingName} ${locationName}`;            
        $('#modalLocations').modal('close');
        this.modalSearchLocation.nativeElement.value = '';
        
        
    }


}
