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
import { MessageService } from '../../services/messaging.service';
import { Subscription } from 'rxjs/Subscription';

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

	private msgSub:Subscription;

	viewData = {
		team : [],
		user : {
			profilePic : ''
		},
		location : [],
		eco_role : []
	};
	public confirmationHeader='';
	public confirmationMessage='';
	private myEmRoles = [];
	private initRole = 0;
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
		private router : Router,
		private messageService: MessageService,
		){
		this.userData = this.auth.getUserData();
        

		
	}

	ngOnInit(){
		this.preloaderService.show();
		this.userIdEnc = this.encryptDecrypt.encrypt(this.userData.userId);
		for(let i in this.userData['roles']){
			if(this.userData['roles'][i]['is_warden_role']){
				if( parseInt(this.userData['roles'][i]['role_id']) > 2 && parseInt(this.userData['roles'][i]['is_warden_role']) == 1){
					this.initRole = this.userData['roles'][i]['role_id'];
				}
			}
		}
		this.accountService.getTaggedLocation().subscribe((response) => {
			this.levels = response.locations;
			this.buildings = response.buildings;
			this.refreshLocationSelection();								
		}, error => {
			console.log(error);
		});

		this.getWardenDetails();

	}

	private getWardenDetails() {
		const emergency_roles = [];
		this.viewData.location = [];
		this.viewData.eco_role = [];
		this.role_location_table = {};
		this.userService.getMyWardenTeam({
			role_id : this.initRole
		}, (response) => {
			this.viewData.user = response.data.user;
			this.viewData.team = response.data.team;			
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
			this.preloaderService.hide();
			setTimeout(() => {
				// ('select').material_select();
			},300);
		});
	}

	ngAfterViewInit(){

		$('.modal').modal({
			dismissible: false
		});

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
			this.confirmationHeader = 'Success';
			this.confirmationMessage = 'Location request change sent successfully.';
			$('#modal-request-location-update').modal('close');
			setTimeout(() => {
				$('#modal-confirmation').modal('open');
			}, 500);
			this.preloaderService.show();
			this.getWardenDetails();
			this.messageService.sendMessage({location_updated: true});
		}, error => {
			this.resetUpdateSelection();
			this.confirmationHeader = 'Error';
			this.confirmationMessage = 'There was an error processing your request. Try again later.';
			$('#modal-request-location-update').modal('close');
			setTimeout(() => {
				$('#modal-confirmation').modal('open');
			}, 500);
			this.messageService.sendMessage({location_updated: true});
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