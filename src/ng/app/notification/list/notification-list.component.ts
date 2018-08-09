import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AccountsDataProviderService } from '../../services/accounts';
declare var $: any;
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css'],
  providers: [ AccountsDataProviderService ]
})
export class NotificationListComponent implements OnInit, AfterViewInit, OnDestroy {
  configList = [];
  constructor(private accountService: AccountsDataProviderService) {}

  ngOnInit() {
    this.accountService.listNotificationConfig().subscribe((response) => {
      this.configList = response['data'];
    });
  }

  ngAfterViewInit() {
    $('select').material_select();
  }

  ngOnDestroy() {}

}
