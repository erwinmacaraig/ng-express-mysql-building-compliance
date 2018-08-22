import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import { AccountsDataProviderService } from '../../services/accounts';

@Component({
  selector: 'app-notification-warden-list',
  templateUrl: './warden-list.component.html',
  styleUrls: ['./warden-list.component.css'],
  providers: [EncryptDecryptService, AccountsDataProviderService]
})
export class NotificationWardenListComponent implements OnInit, AfterViewInit, OnDestroy {

  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  private building_id = 0;
  public wardens = [];

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
  private accountService: AccountsDataProviderService) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
        const token = this.cryptor.decryptUrlParam(params['token']);
        const parts: Array<string> = token.split('_');
        this.userId = +parts[0];
        this.location_id = +parts[1];
        this.configId = +parts[2];
        this.notification_token_id = +parts[3];
        this.building_id = +parts[4];

        this.accountService.listWardensOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
          this.wardens = response['data'];
        }, (error) => {
          console.log(error);
        });
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}


}
