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
    public notifiedUsers: Array<object> = [];
    public hasAccountRole = false;
    constructor(private route: ActivatedRoute,
                private auth: AuthService,
                private router: Router,
                private cryptor: EncryptDecryptService,
                private accountService: AccountsDataProviderService,
                public dashboard: DashboardPreloaderService
              ) {}

    ngOnInit() {
      this.dashboard.show();
      const role = this.auth.getHighestRankRole();
      if (role <= 2) {
        this.hasAccountRole = true;
      } else {
        this.router.navigate(['']);
      }
      this.route.params.subscribe((params) => {
        this.configId = this.cryptor.decrypt(params['config']);
        this.accountService.generateNotifiedUsersList(this.configId).subscribe((response) => {
          this.notifiedUsers = response['data'];
          this.dashboard.hide();
        }, (error) => {
          this.dashboard.hide();
        });
      });
    }

    ngAfterViewInit() {
        $('select').material_select();
    }

    ngOnDestroy() {}
}
