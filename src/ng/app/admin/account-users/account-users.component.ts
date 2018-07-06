import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { UserService } from '../../services/users';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { MessageService } from '../../services/messaging.service';
import { CourseService } from '../../services/course';


declare var $: any;
declare var Materialize: any;

@Component({
    selector: 'app-admin-account-users',
    templateUrl: './account-users.component.html',
    styleUrls: ['./account-users.component.css'],
    providers: [AdminService, DashboardPreloaderService, UserService, CourseService]
})
export class AccountUsersListComponent implements OnInit, OnDestroy, AfterViewInit {
    accountId = 0;
    sub: Subscription;
    userObjects = [];
    locations = [];
    public total_pages = 0;
    public createRange;
    public currentPage = 0;
    @ViewChild('selectPage') selectedPage: ElementRef;

    updateProfileData = {
        user : <any> {
            user_id : 0, first_name : '', last_name : ''
        },
        showForm : () => {
            $('.update-profile-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.update-profile-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    updateCredentialsData = {
        user : <any> {
            user_id : 0, first_name : '', last_name : '', email : ''
        },
        showForm : () => {
            $('.credentials-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
            $('#inpPassword').prop('value', '');
            $('#confirmPassword').prop('value', '');
        },
        hideForm : () => {
            $('.credentials-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    sendInvitationData = {
        user : <any> {},
        account : <any> {},
        fetching : true,
        trainings : <any> [],
        showForm : () => {
            $('.invitations-container').prop('hidden', false);
            $('.to-hide-in-show-profile-update').prop('hidden', true);
        },
        hideForm : () => {
            $('.invitations-container').prop('hidden', true);
            $('.to-hide-in-show-profile-update').prop('hidden', false);
        }
    };

    msgSubs;

    constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router,
        public dashboard: DashboardPreloaderService,
        private userService: UserService, private msgSrv: MessageService,
        private courseService: CourseService
        ) {

        this.msgSubs = this.msgSrv.getMessage().subscribe((data) => {
            if(data['accountInfo']){
                this.sendInvitationData.account = data['accountInfo'];
            }
        });
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe((params) => {
            this.accountId = +params['accntId'];
            this.dashboard.show();

            this.sub = this.adminService.getAllAccountUsers(this.accountId).subscribe((response) => {
                this.userObjects = response['data']['list'];
                this.total_pages = response['data']['total_pages'];
                this.createRange = new Array(this.total_pages);
                this.dashboard.hide();

            }, (error) => {
                this.dashboard.hide();
                console.log(error);
            });

            this.adminService.getAccountTrainings(this.accountId).subscribe((response:any) => {
                this.sendInvitationData.trainings = response.data;
                this.sendInvitationData.fetching = false;
            });

        });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
        this.msgSubs.unsubscribe();
    }

    ngAfterViewInit() {
        $('.row.filter-container select').material_select();

    }

    prevPage() {
        this.dashboard.show();

        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) - 1;
        if (this.currentPage < 0) {
            this.currentPage = this.total_pages - 1;
        }
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            this.dashboard.hide();
            console.log(error);
        });

    }
    pageChange() {
        this.dashboard.show();
        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            this.dashboard.hide();
            console.log(error);
        });
    }

    nextPage() {
        this.dashboard.show();
        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10) + 1;
        if (this.currentPage > this.total_pages - 1) {
            this.currentPage = 0;
        }
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        },
        (error) => {
            console.log(error);
            this.dashboard.hide();
        });
    }

    searchByUserAndEmail(event: KeyboardEvent) {

        this.currentPage = parseInt(this.selectedPage.nativeElement.value, 10);
        const searchKey = (<HTMLInputElement>event.target).value;
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage, searchKey).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);

        }, (error) => {

            console.log(error);
        });
    }

    selectActionChangeEvent(user, event){
        let val = event.target.value;
        if(val == 'profile'){
            this.updateProfileData.user = user;
            this.updateProfileData.showForm();

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 500);
        }else if(val == 'credential'){
            this.updateCredentialsData.user = user;
            this.updateCredentialsData.showForm();

            setTimeout(() => {
                Materialize.updateTextFields();
            }, 500);
        }else if(val == 'invite'){
            this.sendInvitationData.user = user;
            this.sendInvitationData.showForm();
        }

        event.target.value = "0";
    }

    loadLastGetAllAccountsUsers(){
        this.sub = this.adminService.getAllAccountUsers(this.accountId, this.currentPage).subscribe((response) => {
            this.userObjects = response['data']['list'];
            this.total_pages = response['data']['total_pages'];
            this.createRange = new Array(this.total_pages);
            this.dashboard.hide();
        }, (error) => {
            this.dashboard.hide();
            console.log(error);
        });
    }

    submitUpdateProfile(formProfile:NgForm){
        if(formProfile.valid){
            this.dashboard.show();
            this.userService.update(formProfile.value, (response) => {
                this.updateProfileData.user.first_name = formProfile.value.first_name;
                this.updateProfileData.user.last_name = formProfile.value.last_name;
                this.loadLastGetAllAccountsUsers();
            });
        }
    }

    submitCredential(formCredential:NgForm){
        if(formCredential.valid){
            this.dashboard.show();
            this.userService.update(formCredential.value, (response) => {
                this.loadLastGetAllAccountsUsers();
                $('#inpPassword').prop('value', '');
                $('#confirmPassword').prop('value', '');
            });
        }
    }

    sendInvitationClickEvent(training, event){
        let target = event.target;
        target.disabled = true;
        target.textContent = "Sending";
        training['user_id'] = this.sendInvitationData.user.user_id;
        training['no_role_email'] = true;
        this.courseService.emailTrainingInvite(training).subscribe((response) => {
            target.textContent = "Success";
            setTimeout(() => {
                target.disabled = false;
                target.textContent = "SEND";
            }, 1000);
        }, (error: HttpErrorResponse) => {
            alert ('Error sending invitation. Try again later.');
        });
    }

}
