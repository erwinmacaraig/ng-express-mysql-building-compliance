import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ViewChildren, ElementRef } from '@angular/core';

import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/users';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AuthService } from '../../services/auth.service';
import { ViewChild, QueryList } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $: any;
declare var Materialize: any;
declare var moment: any;

declare var $: any;
@Component({
  selector: 'app-view-warden-component',
  templateUrl: './view.warden.component.html',
  styleUrls: ['./view.warden.component.css'],
  providers : [UserService, DashboardPreloaderService, PersonDataProviderService, AuthService, EncryptDecryptService, AccountsDataProviderService]
})
export class ViewWardenComponent implements OnInit, OnDestroy, AfterViewInit {

	viewData = {
		team : [],
		user : {
			profilePic : ''
		},
		location : [],
		eco_role : []
	};
	private myEmRoles = [];
	showModalRequestWardenLoader = false;
	approvers = [];
	showModalRequestWardenSuccess = false;
	userData = <any> {};
	customMessageModal = {
		status : false,
		message : ''
	};
	hasRequest = false;
	copyTeam = [];
	info = '';
	private assignedLocs = [];
	public chosenRoleId = 0;
	public role_location_table: {[k: number]: Array<number>} = {};
	@ViewChild('invitefrm') emailInviteForm: NgForm;
	@ViewChildren('llist') locationListing: QueryList<ElementRef>;
	public bulkEmailInvite;
	public levels = [];
	public buildings = [];
	showModalResignLoader = false;
    userIdEnc = '';
	constructor(
		private auth: AuthService,
		private userService: UserService,
		private accountService: AccountsDataProviderService,
		private preloaderService: DashboardPreloaderService,
		private personService : PersonDataProviderService,
        private encryptDecrypt : EncryptDecryptService,
		private router : Router
		){
		this.userData = this.auth.getUserData();
        

		
	}

	ngOnInit(){
		this.userIdEnc = this.encryptDecrypt.encrypt(this.userData.userId);
		let roleId = 0;
		const emergency_roles = [];
		for(let i in this.userData['roles']){
			if(this.userData['roles'][i]['is_warden_role']){
				if( parseInt(this.userData['roles'][i]['role_id']) > 2 && parseInt(this.userData['roles'][i]['is_warden_role']) == 1){
					roleId = this.userData['roles'][i]['role_id'];
				}
			}
		}
		this.userService.getMyWardenTeam({
			role_id : roleId
		}, (response) => {
			this.viewData.user = response.data.user;
			this.viewData.team = response.data.team;
			// this.viewData.location = response.data.location;
			// this.viewData.eco_role = response.data.eco_role;
			this.copyTeam = JSON.parse(JSON.stringify(response.data.team));
			
			for (let loc of response.data.myEmRoles) {
				let name = '';
				if (loc.parent_name == null) {
					 name = loc.name;
				} else {
					name = loc.parent_name + ', ' + loc.name;
				}				
				this.viewData.location.push(name);
				if (emergency_roles.indexOf(loc['em_roles_id']) == -1) {					
					this.viewData.eco_role.push({
						em_roles_id: loc['em_roles_id'],
						role_name: loc['role_name']  
					});
					emergency_roles.push(loc['em_roles_id']);
					this.role_location_table[loc['em_roles_id']] = [loc['location_id']];
				} else {
					this.role_location_table[loc['em_roles_id']].push(loc['location_id']);
				}
			}
			console.log(this.assignedLocs);
			console.log(this.role_location_table);
			this.accountService.getTaggedLocation().subscribe((response) => {
				this.levels = response.locations;
				this.buildings = response.buildings;
				this.refreshLocationSelection();								
			}, error => {
				console.log(error);
			});

			this.preloaderService.hide();
			setTimeout(() => {
				// ('select').material_select();
			},300);
		});

		


	}

	ngAfterViewInit(){

		
		console.log(this.locationListing);

		$('.modal').modal({
			dismissible: false
		});

		// $('select').material_select();

		this.preloaderService.show();
		this.sortByEvent();
	}

	showModalInvite(){
		$('#modalInvite').modal('open');
	}

	public getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	sortByEvent(){
		$('select.sort-by').on('change', () => {
			let selected = $('select.sort-by').val();
			
			if(selected == 'loc-name-asc'){
				this.viewData.team.sort((a, b) => {
					if(a.location_name < b.location_name) return -1;
				    if(a.location_name > b.location_name) return 1;
				    return 0;
				});
			}else if(selected == 'loc-name-desc'){
				this.viewData.team.sort((a, b) => {
					if(a.location_name > b.location_name) return -1;
				    if(a.location_name < b.location_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-asc'){
				this.viewData.team.sort((a, b) => {
					if(a.first_name < b.first_name) return -1;
				    if(a.first_name > b.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.viewData.team.sort((a, b) => {
					if(a.first_name > b.first_name) return -1;
				    if(a.first_name < b.first_name) return 1;
				    return 0;
				});
			}else{
				this.viewData.team = this.copyTeam;
			}
		});
	}

	searchMemberEvent(event) {
		let key = event.target.value,
			temp = [];

		if(key.length == 0){
			this.viewData.team = this.copyTeam;
		}else{
			for(let i in this.copyTeam){
				let name = (this.copyTeam[i]['first_name']+' '+this.copyTeam[i]['last_name']).toLowerCase();
				if(name.indexOf(key) > -1){
					temp.push( this.copyTeam[i] );
				}
			}
			this.viewData.team = temp;
		}
	}

	sendInviteOnClick() {

		this.bulkEmailInvite = (this.emailInviteForm.controls.inviteTxtArea.value).split(',');
		const validEmails = [];
		const email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
		for (let x = 0; x < this.bulkEmailInvite.length; x++) {
			if (email_regex.test(this.bulkEmailInvite[x].trim())) {
				validEmails.push(this.bulkEmailInvite[x].trim());
			}
		}
		this.personService.sendWardenInvitation(validEmails).subscribe((data) => {
			console.log(data);
			$('#modalInvite').modal('close');
		}, (e) => {
			console.log(e);
		}
		);
		this.emailInviteForm.controls.inviteTxtArea.reset();
	}

	resignClicked(){
		$('#modalResign').modal('open');
	}

	resignConfirmClicked(){
		this.showModalResignLoader = true;
		this.userService.resignAsWarden({
			user_id : this.userData['userId'],
			location_id : this.viewData.location['location_id']
		}, (response) => {
			$('#modalResign').modal('close');
			let newRoles = [];
			newRoles.push({
				role_id : 8, role_name : 'General Occupant', is_warden_role : 0
			});
			this.userData['roles'] = newRoles;
			this.auth.setUserData(this.userData);
			setTimeout(() => {
				this.router.navigate(["/teams/view-gen-occupant"]);
			}, 300);
			
		});
	}

	ngOnDestroy(){}

	showUpdateLocForm() {
		this.locationListing.forEach(item => console.log(item.nativeElement.innerHTML));


		$('#modal-request-location-update').modal('open');
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
			em_role_id: this.chosenRoleId,
			oldLocation: JSON.stringify(this.role_location_table[this.chosenRoleId]),
			newLocation: JSON.stringify(updateLocation),
			info: this.info
		};

		this.userService.requestLocationUpdate(postBody).subscribe((response) => {
			this.resetUpdateSelection();
			$('#modal-request-location-update').modal('close');
		}, error => {
			this.resetUpdateSelection();
			$('#modal-request-location-update').modal('close');
		});
		

	}

	loadLocation(e) {
		this.refreshLocationSelection();
		this.assignedLocs = [];
		this.chosenRoleId = +e.target.value;
		this.assignedLocs = [...this.role_location_table[this.chosenRoleId]];
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

	resetUpdateSelection() {
		this.refreshLocationSelection();
		this.chosenRoleId = 0;
		this.info = '';
	}
}