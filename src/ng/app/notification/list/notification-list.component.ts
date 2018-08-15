import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var $: any;
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css'],
  providers: [ AccountsDataProviderService, EncryptDecryptService, DashboardPreloaderService ]
})
export class NotificationListComponent implements OnInit, AfterViewInit, OnDestroy {
  configList = [];
  constructor(private accountService: AccountsDataProviderService,
    public cryptor: EncryptDecryptService,
    public dashboard: DashboardPreloaderService) {}

  ngOnInit() {
    this.dashboard.show();
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
    $('select').material_select();
  }

  ngOnDestroy() {}

}
