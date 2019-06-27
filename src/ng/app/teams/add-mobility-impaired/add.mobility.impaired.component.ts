import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { AdminService } from './../../services/admin.service';
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';

import { NgForm } from '@angular/forms';
import { Router} from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { MessageService } from '../../services/messaging.service';

declare var $: any;
@Component({
  selector: 'app-add-mobility-impaired',
  templateUrl: './add.mobility.impaired.component.html',
  styleUrls: ['./add.mobility.impaired.component.css'],
  providers : [DashboardPreloaderService, UserService, AdminService, MessageService]
})
export class AddMobilityImpairedComponent implements OnInit, OnDestroy {
	@ViewChild('addMobilityImpairedForm') addMobilityImpairedForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public addedUsers = [];
    public userProperty = {
        first_name : '',
        last_name : '',
        email: '',
        role_id : 3,
        account_location_id : 0,
        account_role_id : 0,
        eco_role_id : 0,
        eco_location_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        contact_number : '',
        mobile_number : '',
        mobility_impaired: 1,
        selected_roles : [],        
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

    public bulkEmailInvite;
    public CSVFileToUpload;

    searchModalLocationSubs;
    formLocValid = false;

    modalCSVMessage = '';

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
        private adminService : AdminService,
        private messageService: MessageService
        ) {

        this.userData = this.authService.getUserData();
    }

	ngOnInit() { 
        this.dashboardPreloaderService.show();       
        // get ECO Roles from db
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

		$('select').material_select();
        this.onKeyUpSearchModalLocationEvent();

        this.messageService.sendMessage({ 'csv-upload' : {  'title' : 'Add Mobility Impaired by CSV Upload', mobility_impaired : true  } });

        let breadCrumbs = [];
        breadCrumbs.push({
          'value' : 'Mobility impaired', 'link' : '/teams/mobility-impaired'
        });
        breadCrumbs.push({
          'value' : 'Add mobility impaired', 'link' : '/teams/add-mobility-impaired'
        });
        this.messageService.sendMessage({ 'breadcrumbs' : breadCrumbs });
	}

    onSelectRole($event, iterator, elem){

        this.selectedUser = this.addedUsers[iterator];

        console.log(this.selectedUser);
    }

	addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );

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
    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
        this.modalSearchLocation.nativeElement.value = "";
    }

    public submitPEEP(f) {
      let allInputValid = true;
      if (f.valid) {
        for(let i in this.addedUsers){
          //this.addedUsers[i]['role_id'] = (this.addedUsers[i]['account_role_id'] == 1 ||
          //this.addedUsers[i]['account_role_id'] == 2) ? this.addedUsers[i]['account_role_id'] : 0;
          //this.addedUsers[i]['eco_role_id'] = (this.addedUsers[i]['account_role_id'] != 1 || this.addedUsers[i]['account_role_id'] != 2) ? this.addedUsers[i]['account_role_id'] : 0;
          this.addedUsers[i]['eco_role_id'] = 8;
        }
        for (const u of this.addedUsers) {
          if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
            u.errors['invalid'] = `${u['email']} is invalid`;
            allInputValid = false;
          }
        }
        if (allInputValid) {
          this.userService.createBulkUsers(this.addedUsers, (response) => {
            this.addedUsers = response.data;
            if(this.addedUsers.length == 0){
                this.router.navigate(["/teams/mobility-impaired"]);
            }
          });
        }

      }
        
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
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
        this.searchModalLocationSubs.unsubscribe();
    }

    chooseLocation(locationId=0, buildingName = '', locationName='') {        
        this.selectedUser['account_location_id'] = locationId;
        this.selectedUser['location_name'] = `${buildingName} ${locationName}`;            
        $('#modalLocations').modal('close');
        this.modalSearchLocation.nativeElement.value = '';
        
        
    }

    submitSelectLocationModal(form, event){}
}
