import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

@Component({
  selector: 'app-notification-warden-list',
  templateUrl: './peep-list.component.html',
  styleUrls: ['./peep-list.component.css'],
  providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService]
})
export class NotificationPEEPListComponent implements OnInit, AfterViewInit, OnDestroy {

  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  private building_id = 0;
  public peep = [];

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
  private accountService: AccountsDataProviderService,
  private preloader: DashboardPreloaderService) {}

  container = 'main';

  ngOnInit() {
    this.route.params.subscribe((params) => {
        const token = this.cryptor.decryptUrlParam(params['token']);
        const parts: Array<string> = token.split('_');
        this.userId = +parts[0];
        this.location_id = +parts[1];
        this.configId = +parts[2];
        this.notification_token_id = +parts[3];
        this.building_id = +parts[4];
        this.preloader.show();
        this.accountService.listPeepOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
          this.peep = response['data'];
          for (const p of this.peep) {
            p['encrypted_user_id'] = this.cryptor.encrypt(p['user_id']);
          }
          this.preloader.hide();
        }, (error) => {
          this.preloader.hide();
          console.log(error);
        });
    });
  }

  nextAction(){
      this.container = 'thankyou';
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
  }


}
