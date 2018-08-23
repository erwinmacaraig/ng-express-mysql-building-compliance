import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';


declare var $: any;
@Component({
  selector: 'app-notification-warden-list',
  templateUrl: './warden-list.component.html',
  styleUrls: ['./warden-list.component.css'],
  providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService]
})
export class NotificationWardenListComponent implements OnInit, AfterViewInit, OnDestroy {

  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  private building_id = 0;
  public wardens = [];
  public encryptedToken = '';

  addUserForm: FormGroup;
  first_name_field: FormControl;
  last_name_field: FormControl;
  email_field: FormControl;
  role_field: FormControl;
  location_field: FormControl;
  mobile_contact_field: FormControl;

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
  private accountService: AccountsDataProviderService,
  private preloader: DashboardPreloaderService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
        const token = this.cryptor.decryptUrlParam(params['token']);
        this.encryptedToken = params['token'];
        const parts: Array<string> = token.split('_');
        this.userId = +parts[0];
        this.location_id = +parts[1];
        this.configId = +parts[2];
        this.notification_token_id = +parts[3];
        this.building_id = +parts[4];
        this.preloader.show();
        this.accountService.listWardensOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
          this.wardens = response['data'];
          for (const warden of this.wardens) {
            warden['encrypted_user_id'] = this.cryptor.encrypt(warden['user_id']);
          }
          this.preloader.hide();
        }, (error) => {
          console.log(error);
          this.preloader.hide();
        });
    });

    this.addUserForm = new FormGroup({
      first_name_field: new FormControl(null, Validators.required),
      last_name_field: new FormControl(null, Validators.required),
      email_field: new FormControl(null, Validators.required),
      role_field: new FormControl(null, Validators.required),
      location_field: new FormControl(null, Validators.required),
      mobile_contact_field: new FormControl()
    });
  }

  ngAfterViewInit() {
    $('.modal').modal({
      dismissible: false
    });
  }

  ngOnDestroy() {
  }

  showAddUserForm() {
    $('#modalAddUser').modal('open');
  }
  cancelAddUserModal() {
    $('#modalAddUser').modal('close');
  }


}
