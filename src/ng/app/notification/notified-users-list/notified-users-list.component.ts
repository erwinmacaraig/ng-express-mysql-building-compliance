import {Component, OnInit, AfterViewInit,  OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';

declare var $: any;

@Component({
    selector: 'app-notified-users',
    templateUrl: './notified-users-list.component.html',
    styleUrls: ['./notified-users-list.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService]
})
export class NotifiedUsersListComponent implements OnInit, AfterViewInit,  OnDestroy {
    public configId;
    userData = <any> {};
    public notifiedUsers: Array<object> = [];
    public hasAccountRole = false;
    isAdmin = false;
    constructor(private route: ActivatedRoute,
        private auth: AuthService,
        private router: Router,
        private cryptor: EncryptDecryptService,
        private accountService: AccountsDataProviderService,
        public dashboard: DashboardPreloaderService
        ) {
    }

    ngOnInit() {        
        const role = this.auth.getHighestRankRole();
        this.userData = this.auth.getUserData();
        if(this.userData.evac_role != 'admin'){
            this.router.navigate(['/signout']);
        }
        /*
        if (role <= 2) {
            this.hasAccountRole = true;
        } else {
            this.router.navigate(['/']);
        }
        */
        this.route.params.subscribe((params) => {
            this.configId = this.cryptor.decrypt(params['config']);
            this.generateList();
        });
    }

    ngAfterViewInit() {
        $('select:not(.no-materialize)').material_select();
    }

    performNotificationAction(token) {
        console.log(`token_${token}`);
        console.log($(`#token_${token}`).val());

        const action = $(`#token_${token}`).val();
        this.accountService.execNotificationAction(action, token).subscribe((response) => {
            console.log(response);
            this.generateList();
        });



    }


    ngOnDestroy() {}

    private generateList() {
        this.dashboard.show();
        this.accountService.generateNotifiedUsersList(this.configId).subscribe((response) => {
            this.notifiedUsers = response['data'];
            this.dashboard.hide();
        }, (error) => {
            this.dashboard.hide();
        });
    }
}
