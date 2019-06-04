
import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { AdminService } from './../../services/admin.service';
import { MessageService } from './../../services/messaging.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
declare var $: any;

@Component({
  selector: 'app-admin-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.css'],
  providers: [AdminService]
})
export class AccountInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() accountId: number;
  sub: Subscription;
  accountInfo = {
    'account_code': '',
    'account_directory_name': '',
    'account_domain': '',
    'account_type': '',
    'archived': 0,
    'account_id': 0,
    'account_name': '',
    'billing_city': '',
    'billing_country': '',
    'billing_postal_code': '',
    'billing_state': '',
    'billing_street': '',
    'billing_unit': '',
    'email_add_user_exemption': '',
    'lead': '',
    'online_training': 0,
    'epc_committee_on_hq': 0,
    'fsa_by_evac': 0,
    'subscription': {}
  };
  account_billing = '';

  msgSrvSub;
  userData = <any> {};
  paramSubs;
  routerSubs;
  activeLink = 'users';

  constructor(private adminService: AdminService,
              private msgSrv : MessageService,
              private auth: AuthService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private alertService: AlertService ) {

    this.routerSubs = this.router.events.subscribe((observer) => {
      if(observer instanceof NavigationEnd){
        if(observer.url.indexOf('users-in-accounts') > -1){
          this.activeLink = 'users';
        }else if(observer.url.indexOf('locations-in-account') > -1 || observer.url.indexOf('add-location-to-account') > -1 || observer.url.indexOf('view-location-compliance') > -1){
          this.activeLink = 'locations';
        }else if(observer.url.indexOf('account-trainings') > -1){
          this.activeLink = 'trainings';
        }
      }
    });

    this.paramSubs = this.activatedRoute.params.subscribe((params) => {
      this.accountId = params.accntId;
      this.getAndSetAccountInfo();
    });
  }

  ngOnInit() {
    this.userData = this.auth.getUserData();
    if(this.userData.evac_role != 'admin'){
        this.router.navigate(['/signout']);
    }
    this.getAndSetAccountInfo();
  }

  getAndSetAccountInfo(){
    this.sub = this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
      if (response['message'] === 'Success') {
        Object.keys(this.accountInfo).forEach((key) => {
          this.accountInfo[key] = response['data'][key];
        });
        if (this.accountInfo['billing_street'].length > 0) {
          this.account_billing += this.accountInfo['billing_street'];
        }
        if (this.accountInfo['billing_city'].length > 0) {
          this.account_billing += `, ${this.accountInfo['billing_city']}`;
        }
        if (this.accountInfo['billing_state'].length > 0) {
          this.account_billing += `, ${this.accountInfo['billing_state']}`;
        }
        if (this.accountInfo['billing_postal_code'].length > 0) {
          this.account_billing += `, ${this.accountInfo['billing_postal_code']}`;
        }
        if (this.accountInfo['billing_country'].length > 0) {
          this.account_billing += `, ${this.accountInfo['billing_country']}`;
        }
        console.log(this.accountInfo);

        this.msgSrv.sendMessage({
          'accountInfo' : this.accountInfo
        });
      }
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.routerSubs.unsubscribe();
    this.paramSubs.unsubscribe();
  }

  public toggleOnlineTrainingAccess(e): void {
    let toggleOnlineAccess = 0;
    if (e.target.checked) {
      toggleOnlineAccess = 1;
    }
    this.adminService.toggleOnlineTrainingAccess({
      account: this.accountId,
      online_access: toggleOnlineAccess
    }).subscribe((response) => {
        console.log(response);
        this.msgSrv.sendMessage({
          'update_account_training_listing': true
        });
    });

  }

  public toggleFSAByEvac(e): void {
    let toggleFSATraining = 0;
    if (e.target.checked) {
      toggleFSATraining = 1;
    }
    this.adminService.toggleFSAByEvac({
      account: this.accountId,
      status: toggleFSATraining
    }).subscribe((response) => {
      console.log(response);
      this.alertService.info('Evac Services acts as Fire Safety Advisor for the account.');
      this.msgSrv.sendMessage({
        'Fire_Safety_Advisor_Updated': true
      });
      setTimeout(() => {
        this.alertService.info(null); 
      }, 5000);
    }, (error) => {
      console.log(error);
      this.alertService.error('There was an error setting FSA.');
      setTimeout(() => {this.alertService.info(null); }, 5000);
    });

  }
  performActionOnAccount(e): void {
    let control = 0;
    if (e.target.checked) {
      control = 1;
    }
    this.adminService.performArchiveOperationOnAccount([this.accountId], control).subscribe((response) => {
      this.alertService.info('Account successfully archived.');
    }, (error) => {
      this.alertService.error('There was problem archiving the account. Try again later.');
      setTimeout(() => {this.alertService.info(null); }, 5000);
      console.log(error);
    });

  }
}

