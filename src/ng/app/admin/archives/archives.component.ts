import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AdminService } from '../../services/admin.service';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { LocationsService } from '../../services/locations';
declare var $: any;
declare var moment: any;
declare var Materialize: any;

@Component({
    templateUrl: './archives.component.html',
    styleUrls: ['./archives.component.css'],
    providers: [AdminService, DashboardPreloaderService, UserService, LocationsService]
})
export class ArchiveComponent implements OnInit, AfterViewInit, OnDestroy {
    
    message = '';
    activeLink = 'users';
    public archiveUsers = [];
    public archiveAccounts = [];
    public archiveLocations = [];

    private users = [];
    private accounts = [];
    private locations = [];

    private typeToDelete = '';
    private toDeleteId = 0;
    typingTimeout:any;
    sub:Subscription;
    constructor(private locationService: LocationsService, private userService: UserService, private adminService: AdminService, public dashboard: DashboardPreloaderService,) {}

    ngOnInit() {
        this.listArchiveUsers();
        this.listArchiveAccounts();
        this.listArchiveLocations();
    }

    ngAfterViewInit() {
        $('.modal').modal({
            dismissible: false
        });
    }

    ngOnDestroy() {}

    selectTab(act){
        this.activeLink = act;
        /*
        setTimeout(() => {
            Materialize.updateTextFields();
        }, 300);
        */
       switch(act) {
           case 'users':
                this.archiveUsers = [];
                this.archiveUsers = this.users;
           break;
           case 'accounts':
                this.archiveAccounts = [];
                this.archiveAccounts = this.accounts;
           break;
           case 'locations':

           break;
       }
       
    }

    private listArchiveUsers(search='') {
        this.archiveUsers = [];
        this.users = [];
        this.dashboard.show();
        this.adminService.generateArchiveUserList(search).subscribe((response) => {
            this.archiveUsers = response.archiveUsers;
            this.users = response.archiveUsers;
            this.dashboard.hide();
        }, (err) => {
            this.dashboard.hide();
        });
    }

    private listArchiveAccounts() {
        this.archiveAccounts = [];
        this.accounts = [];
        this.adminService.generateArchiveAccountList().subscribe((response) => {
            this.archiveAccounts = response.archive_accounts;
            this.accounts = response.archive_accounts;
        }, (error) => {
            console.log(error);
        });
    }

    private listArchiveLocations() {
        this.archiveLocations = [];
        this.locations = [];
        this.locationService.generateArchivedLocationList().subscribe((response) => {
            this.archiveLocations = response.archives;
            this.locations = response.archives;
        });

    }

    performActionOnLocation(e, locationId){
        const a = e.target.value;
        switch(a) {
            case 'restore':
                this.locationService.archiveLocation({
                    location_id: locationId,
                    archived: 0
                    }).subscribe((response) => {
                        this.listArchiveLocations();
                        setTimeout(() => {
                            this.message = 'Location successfully restored';
                            $('#modalConfirm').modal('open');
                        }, 300);            
                        
                        
                    }, (error) => {
                        this.message = 'There was a problem performing the operation. Try again later.';
                        $('#modalConfirm').modal('open');            
                        console.log(error);
                    
                    });
            break;
            case 'delete':
                this.typeToDelete = 'location';
                this.toDeleteId = locationId;
                $('#modalDeleteConfirm').modal('open');  

            break;
        }

        
    }

    performActionOnUser(e, userId) {        
        const a = e.target.value;
        switch(a) {
            case 'restore':
                this.userService.unArchiveUsers([userId], () => {
                    this.message = 'User successfully restored.';
                    $('#searchUsers').val('');                    
                    this.listArchiveUsers();
                    
                    $('#modalConfirm').modal('open');
                });

            break;
            case 'delete':
                this.typeToDelete = 'user';
                this.toDeleteId = userId;
                $('#modalDeleteConfirm').modal('open');
            break;
        }
    }

    performActionOnAccount(e, accountId) {
        const a = e.target.value;
        switch(a) {
            case 'restore':
                this.adminService.performArchiveOperationOnAccount([accountId], 0).subscribe((response) => {
                    this.message = 'Account successfully restored.';
                    $('#searchAccounts').val('');
                    this.listArchiveAccounts();                 
                    $('#modalConfirm').modal('open');
                });
            break;
            case 'delete':

            break;
        }
    }

    searchLocationName(event: KeyboardEvent) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            let searchKey = (<HTMLInputElement>event.target).value;
            searchKey = searchKey.toLowerCase();
            this.archiveLocations = [];
            const choosen = [];
            if (searchKey.length == 0) {
                this.archiveLocations = this.locations;
            } else {
                for (let location of this.locations) {

                    if (choosen.indexOf(location['location_id']) == -1) {                        
                        if (location['name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(location['location_id']);
                            this.archiveLocations.push(location);   
                        } else if (location['building'] != null && location['building'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(location['location_id']);
                            this.archiveLocations.push(location);   
                        } else if (location['street'] != null && location['street'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(location['location_id']);
                            this.archiveLocations.push(location);   
                        } else if (location['city'] != null && location['city'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(location['location_id']);
                            this.archiveLocations.push(location);
                            
                        } 
                    }
                }
                
            }
        });
    }
    
    searchByUserAndEmail(event: KeyboardEvent) {        
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {            
            let searchKey = (<HTMLInputElement>event.target).value;
            searchKey = searchKey.toLowerCase();
            this.archiveUsers = [];
            const choosen = [];
            //this.listArchiveUsers(searchKey);
            if (searchKey.length == 0) {
                this.archiveUsers = this.users;
            } else {
                for (let user of this.users) {
                    if (choosen.indexOf(user['user_id']) == -1) {
                        if ( user['email'].toLowerCase().search(searchKey) !== -1 ) {
                            choosen.push(user['user_id']);
                            this.archiveUsers.push(user);
                        } else if (user['first_name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(user['user_id']);
                            this.archiveUsers.push(user);
                        } else if (user['last_name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(user['user_id']);
                            this.archiveUsers.push(user);
                        } else if (user['account_name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(user['user_id']);
                            this.archiveUsers.push(user);
                        }
                    }
                    
                }
            }

        }, 300);

    }

    searchByAccountName(event: KeyboardEvent) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            const searchKey = (<HTMLInputElement>event.target).value;
            const choosen = [];
            this.archiveAccounts = [];
            if (searchKey.length == 0) {
                this.archiveAccounts = this.accounts;
            } else { 
                for (let account of this.accounts) {
                    if (choosen.indexOf(account['account_id']) == -1) {
                        if (account['account_name'].toLowerCase().search(searchKey.toLowerCase()) !== -1) {
                            choosen.push(account['account_id']);
                            this.archiveAccounts.push(account);
                        }                    
                    }
                }
            }
        }, 300);

    }

    public delete() {
        switch(this.typeToDelete) {
            case 'location':
                this.locationService.permanentlyDeleteLocation(this.toDeleteId).subscribe((response) => {
                    this.message = 'Permanently deleted the location and all relevant information';
                    this.listArchiveLocations();
                    setTimeout(() => {
                        this.message = 'Location successfully deleted';
                        $('#modalConfirm').modal('open');
                    }, 300);
                    
                    this.typeToDelete = '';
                    this.toDeleteId = 0;

                }, (error) => {
                    this.message = 'There was a problem with deleting the location. Try again later.';
                    $('#modalConfirm').modal('open');
                    this.typeToDelete = '';
                    this.toDeleteId = 0;
                });
            break;

            case 'user':
                    this.userService.permanentlyDeleteUser(this.toDeleteId).subscribe((response) => {
                        this.message = 'User permanently deleted and all relevant information';
                        this.listArchiveUsers();
                        setTimeout(() => {
                            this.message = 'User successfully deleted';
                            $('#modalConfirm').modal('open');
                        }, 300);
                    
                        this.typeToDelete = '';
                        this.toDeleteId = 0;
                    }, (error) => {
                        this.message = 'There was a problem with deleting the user . Try again later.';
                        $('#modalConfirm').modal('open');
                        this.typeToDelete = '';
                        this.toDeleteId = 0;
                    });
            break;
        }
    }



}