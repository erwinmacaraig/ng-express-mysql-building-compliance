import { Component, OnInit, OnDestroy, AfterViewInit, Input} from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
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
    subRouter;

    userData = <any> {
        account : {
            account_id : 0,
            account_name : ''
        }
        
    };

    locationRoles = <any> [];
    trainings = <any> [];

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
        this.route.params.subscribe((params: Params) => {
            this.userId = +params['userId'];

            console.log('this.userId', this.userId);

            this.adminService.getUserInformation(this.userId).subscribe((response:any) => {
                if(Object.keys(response.data.user).length > 0){
                    this.userData = response.data.user;
                    this.userData['account'] = response.data.account;
                    this.locationRoles = response.data.location_roles;
                    this.trainings = response.data.trainings;
                }
                this.dashboard.hide();
            });

        });
    }

    ngAfterViewInit(){
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

    }


}
