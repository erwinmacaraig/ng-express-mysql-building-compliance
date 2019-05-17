import { Component, OnInit, OnDestroy, AfterViewInit, ViewChildren, ElementRef } from '@angular/core';

import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { ViewChild, QueryList } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { MessageService } from '../../services/messaging.service';
import { Subscription } from 'rxjs/Subscription';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
declare var $: any;

@Component({
    templateUrl: './view-account-role.component.html',
    styleUrls: ['./view-account-role.component.css', '../view-warden/view.warden.component.css'],
    providers : [UserService, DashboardPreloaderService, PersonDataProviderService, AuthService, EncryptDecryptService, AccountsDataProviderService]
})
export class ViewAccountRoleComponent implements OnInit, OnDestroy, AfterViewInit {

    viewData = {
		team : [],
		user : {
            profilePic : '',
            name: ''
		},
		location : [],
		sublocation: [],
        eco_role : [],
        account_role: [],
		display_role: []
    };
    apiSub:Subscription;
    private accountRoles = [
        "",
        "FRP",
        "TRP"
    ];
    myAccountRoles = [];
    myLocations = [];
    myTeam = [];
    public levels = [];
	public buildings = [];
    public assignedLocs = [];
    public chosenRoleId = 0;
    public role_location_table: {[k: number]: Array<number>} = {};
    public confirmationHeader='';
    public confirmationMessage='';
    
    @ViewChildren('llist') locationListing: QueryList<ElementRef>;

    constructor(
        private auth: AuthService,
		private userService: UserService,
		private accountService: AccountsDataProviderService,
		private preloaderService: DashboardPreloaderService,
		private personService : PersonDataProviderService,
        private encryptDecrypt : EncryptDecryptService,
		private router : Router,
		private messageService: MessageService,
    ) {

    }

    ngOnInit() {
        this.viewData.user.name = this.auth.userDataItem('name');
        this.viewData.user.profilePic = this.auth.userDataItem('profilePic');
        const roles: object[] = this.auth.userDataItem('roles');
        const checker = [];
        for (let r of roles) {
            if (r['role_id'] <= 2) {                
                if (checker.indexOf(r['role_id']) == -1) {
                    checker.push(r['role_id']);
                    this.viewData.display_role.push(this.accountRoles[r['role_id']]);
                }               
                this.myLocations.push(r['location_id']);
            }
        }
        this.accountService.getAccountRoleInLocation(this.myLocations).subscribe((response) => {
            this.viewData.team = response.account_roles;
            for (let member of this.viewData.team) {
   
                if (this.auth.userDataItem('userId') == member['user_id']) {
                    if (member['building']) {
                        this.viewData.location.push(member['building']);
                    }
                    if (member['name']) {
                        this.viewData.sublocation.push(member['name']);
                    }                    
                }
            }        
        });
        this.accountService.getTaggedLocation().subscribe((response) => {
			this.levels = response.locations;
			this.buildings = response.buildings;
			this.refreshLocationSelection();								
		}, error => {
			console.log(error);
		});


    }

    ngAfterViewInit() {
        $('.modal').modal({
			dismissible: false
		});
    }

    ngOnDestroy() {}

    public getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
    }
    refreshLocationSelection() {
		for (let level of this.levels) {
			for (let sub of level.sublocation) {
				sub['checked'] = false;										
			}
		}

		for (let building of this.buildings) {
			building['checked'] = false;
		}
    }
    loadLocation() {
		this.refreshLocationSelection();
        this.assignedLocs = [];
		this.assignedLocs = this.myLocations;
        console.log(this.assignedLocs);
        
		for (let level of this.levels) {
			for (let sub of level.sublocation) {
				if (this.assignedLocs.indexOf(sub['location_id']) !== -1) {
					sub['checked'] = true;
				}										
			}
		}
		for (let building of this.buildings) {
			if (this.assignedLocs.indexOf(building['location_id']) !== -1) {
				building['checked'] = true;
			}
		}
		
    }
    
    showUpdateLocForm() {
        this.locationListing.forEach(item => console.log(item.nativeElement.innerHTML));
        this.loadLocation();
		$('#modal-request-location-update').modal('open');
    }
    
    resetUpdateSelection() {
		this.refreshLocationSelection();
		this.chosenRoleId = 0;		
    }
    
    requestLocationUpdate () {
        const inputs = this.locationListing.toArray();
		const updateLocation = [];
		for (let input of inputs) {
			if (input.nativeElement.checked) {
				let id = input.nativeElement.id.substring(9);
				updateLocation.push(id);
			}
		}
		const postBody = {
			role_id: this.chosenRoleId,
			oldLocation: JSON.stringify(this.myLocations),
			newLocation: JSON.stringify(updateLocation)
        };
        
        this.preloaderService.show();
        this.userService.requestAccountUserLocationUpdate(postBody).subscribe((response) => {            
            $('#modal-request-location-update').modal('close');
            this.confirmationHeader = 'Success';
            this.confirmationMessage = 'Location change successfull.';
            this.myLocations = [];
            this.viewData.location = [];
            this.viewData.sublocation = [];

            for (let loc of response.assigned_locations) {
                this.myLocations.push(loc['location_id']);
                this.viewData.location.push(loc['building']);
                this.viewData.sublocation.push(loc['name']);
            }
			setTimeout(() => {
				$('#modal-confirmation').modal('open');
			}, 600);
            this.preloaderService.hide();
            this.messageService.sendMessage({location_updated: true});
        },  (error) => {
            console.log(error);
            this.preloaderService.hide();
            $('#modal-request-location-update').modal('close');
           
        });
        return;
    }
   
}
