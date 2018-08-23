import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute } from '@angular/router';

import { Subscription, Observable } from 'rxjs/Rx';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';
import { HttpParams, HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';

declare var $: any;
@Component({
  selector: 'app-notification-warden-list',
  templateUrl: './warden-list.component.html',
  styleUrls: ['./warden-list.component.css'],
  providers: [UserService, EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, LocationsService]
})
export class NotificationWardenListComponent implements OnInit, AfterViewInit, OnDestroy {

  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  private building_id = 0;
  public wardens = [];
  public encryptedToken = '';
  public sublocations = [];

  private baseUrl: String;

  addUserForm: FormGroup;
  first_name_field: FormControl;
  last_name_field: FormControl;
  email_field: FormControl;
  role_field: FormControl;
  location_field: FormControl;
  mobile_contact_field: FormControl;

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
  private accountService: AccountsDataProviderService,
  private preloader: DashboardPreloaderService,
  private platformLocation: PlatformLocation,
  public http: HttpClient,
  private userService: UserService,
  private locationService: LocationsService
  ) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

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

        this.generateWardenList();
        this.locationService.getSublocationsOfParent(this.building_id).subscribe((response) => {
          this.sublocations.push(response['building']);
          this.sublocations =  this.sublocations.concat(response['data']);
        }, (error) => {
          console.log(error);
        });
    });

    this.addUserForm = new FormGroup({
      first_name_field: new FormControl(null, Validators.required),
      last_name_field: new FormControl(null, Validators.required),
      email_field: new FormControl(null, [Validators.required, Validators.email], this.forbiddenEmails.bind(this)),
      role_field: new FormControl(null, Validators.required),
      location_field: new FormControl(null, Validators.required),
      mobile_contact_field: new FormControl()
    });
  }

  private generateWardenList() {
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
    this.addUserForm.reset();
    $('#modalAddUser').modal('close');
  }

  createUser() {
    console.log('Attempt');
    console.log(this.addUserForm.value);
    const values = [];
    values.push({
      'first_name': this.addUserForm.get('first_name_field').value,
      'last_name': this.addUserForm.get('last_name_field').value,
      'email': this.addUserForm.get('email_field').value,
      'eco_role_id': this.addUserForm.get('role_field').value,
      'mobile_number': this.addUserForm.get('mobile_contact_field').value,
      'account_location_id': this.addUserForm.get('location_field').value
    });
    this.userService.createBulkUsers(values, (response) => {
      this.generateWardenList();
      this.addUserForm.reset();
      $('#modalAddUser').modal('close');
    });
  }

  forbiddenEmails(control: FormControl): Promise<any> | Observable<any> {
    const httpParams = new HttpParams().set('user_email', control.value);
    return new Promise((resolve, reject) => {
      this.http.get(this.baseUrl + '/admin/check-user-email/', {'params': httpParams}).subscribe((response) => {
        if (response['forbidden']) {
          resolve({
            emailIsForbidden: true
          });
        } else {
          resolve(null);
        }

      });
    });
  }


}
