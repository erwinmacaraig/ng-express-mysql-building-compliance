import { Component, OnInit, OnDestroy, AfterViewInit, Input} from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { Subscription } from 'rxjs/Rx';
import { HttpErrorResponse } from '@angular/common/http';
declare var $: any;
declare var moment: any;
declare var Materialize: any;

@Component({
    selector: 'app-admin-view-user',
    templateUrl: './view.user.component.html',
    styleUrls: ['./view.user.component.css'],
    providers: [ AdminService, DashboardPreloaderService, UserService ]
})

export class AdminViewUserComponent implements OnInit, AfterViewInit, OnDestroy {
    userId: number;

    activeLink = 'rolesLocations';
    public originalAccountId = 0;
    subRouter;
    paramSub: Subscription;
    message = '';
    userData = <any> {
        account : {
            account_id : 0,
            account_name : ''
        },
        account_id: 0,        
        archived: 0,        
        email: null,
        evac_role: null,
        first_name: null,
        last_login: null,
        last_name: null,
        mobile_number: null,
        mobility_impaired: null,        
        occupation: null,
        password: null,
        phone_number: null,
        user_id: null
    };

    accounts: object[] = [];; 
    trainings = <any> [];
    accountLocationRoles = [];
    emLocationRoles = [];
    locationRoles = [];
    constructor(
        private route: ActivatedRoute,
        public adminService: AdminService,
        public dashboard: DashboardPreloaderService,
        private router: Router,
        private userService: UserService
        ) {
    }

    ngOnInit() {
        this.dashboard.show();
        this.accounts = [];
        this.locationRoles = [];
        this.paramSub = this.route.params.subscribe((params: Params) => {
            this.userId = +params['userId'];
            this.adminService.getUserInformation(this.userId).subscribe((response:any) => {
                try {
                    this.locationRoles = [];
                    if(Object.keys(response.data.user).length > 0){
                        this.userData = response.data.user;
                        this.originalAccountId = response.data.user.account_id;
                        this.userData['account'] = response.data.account;                    
                        this.trainings = response.data.trainings;
                        this.accountLocationRoles = response.data.account_location_roles;
                        this.emLocationRoles = response.data.em_location_roles;
                        for (let lr of response.data.location_roles) {
                            if (lr['location_id'] != null) {
                                this.locationRoles.push(lr);
                            }
                        } 
    
                    }
                } catch (e) {
                    console.log(e);
                }
                this.dashboard.hide();
            }, (e:HttpErrorResponse) => {
                console.log(e);
                this.dashboard.hide();
            });

            this.adminService.getActiveAccounts().subscribe((response) => {
                this.accounts = response.accounts;
            }, (error) => {
                this.accounts = [];
                console.log(error);
            });

        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });
    }

    selectTab(act){
        this.activeLink = act;
        setTimeout(() => {
            Materialize.updateTextFields();
        }, 300);
    }

    submitCredential(formCredential:NgForm){
        if(formCredential.valid){
            this.dashboard.show();
            this.userService.update(formCredential.value, (response) => {
                $('#inpPassword').prop('value', '');
                $('#confirmPassword').prop('value', '');
                this.dashboard.hide();
            });
        }
    }

    ngOnDestroy() {
        this.paramSub.unsubscribe();
    }


    toggleArchivedUser(e): void {
        let toggleArchivedUser = 0;
        if (e.target.checked) {
            this.userService.archiveUsers([this.userData.user_id], () => {
                this.message = 'User successfully archived.';
                $('#modalConfirm').modal('open');
            });
        } else {
            this.userService.unArchiveUsers([this.userData.user_id], () => {
                this.message = 'User successfully restored.';
                $('#modalConfirm').modal('open');
            });
        }

    }

    updateInfo(f:NgForm) {        
        this.adminService.updateUserInfo(f.value).subscribe((res) => {
            this.message = 'User info successfully updated.';
            $('#modalConfirm').modal('open');
            this.dashboard.show();
            this.locationRoles = [];
            this.accountLocationRoles = [];
            this.emLocationRoles = [];
            
            this.adminService.getUserInformation(this.userId).subscribe((response:any) => {
                try {
                    if(Object.keys(response.data.user).length > 0){
                        this.userData = response.data.user;
                        this.userData['account'] = response.data.account;                    
                        this.trainings = response.data.trainings;
                        this.accountLocationRoles = response.data.account_location_roles;
                        this.emLocationRoles = response.data.em_location_roles;
                        for (let lr of response.data.location_roles) {
                            if (lr['location_id'] != null) {
                                this.locationRoles.push(lr);
                            }
                        }   
                    }
                } catch (e) {
                    console.log(e);
                }
                this.dashboard.hide();
            }, (e:HttpErrorResponse) => {
                console.log(e);
                this.dashboard.hide();
            });

        }, (err) => {
            this.message = 'There was a problem updating user info. Try again later.';
            $('#modalConfirm').modal('open');
            console.log(err);
        });



    }


}
