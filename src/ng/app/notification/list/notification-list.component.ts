import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

declare var $: any;
@Component({
    selector: 'app-notification-list',
    templateUrl: './notification-list.component.html',
    styleUrls: ['./notification-list.component.css'],
    providers: [ AccountsDataProviderService, EncryptDecryptService, DashboardPreloaderService ]
})
export class NotificationListComponent implements OnInit, AfterViewInit, OnDestroy {
    configList = [];
    userData = <any> {};
    public hasAccountRole = false;
    isAdmin = false;
    constructor(private accountService: AccountsDataProviderService,
        public cryptor: EncryptDecryptService,
        private auth: AuthService,
        private router: Router,
        public dashboard: DashboardPreloaderService) {}

    ngOnInit() {
        this.dashboard.show();
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
        this.accountService.listNotificationConfig().subscribe((response) => {
            this.configList = response['data'];
            for (const config of this.configList) {
                config['notification_config_id'] = this.cryptor.encrypt(config['notification_config_id']);
            }
            this.dashboard.hide();
        }, (error) => {
            this.dashboard.hide();
        });
    }

    ngAfterViewInit() {
        $('select:not(.no-materialize)').material_select();
    }

    ngOnDestroy() {}

}
