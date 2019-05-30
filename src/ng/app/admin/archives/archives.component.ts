import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AdminService } from '../../services/admin.service';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var $: any;
declare var moment: any;
declare var Materialize: any;

@Component({
    templateUrl: './archives.component.html',
    styleUrls: ['./archives.component.css'],
    providers: [AdminService, DashboardPreloaderService, UserService]
})
export class ArchiveComponent implements OnInit, AfterViewInit, OnDestroy {
    
    message = '';
    activeLink = 'users';
    public archiveUsers = [];
    public archiveAccounts = [];
    private users = [];
    private accounts = [];

    typingTimeout:any;
    sub:Subscription;
    constructor(private userService: UserService, private adminService: AdminService, public dashboard: DashboardPreloaderService,) {}

    ngOnInit() {
        this.listArchiveUsers();
        this.listArchiveAccounts();
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



}