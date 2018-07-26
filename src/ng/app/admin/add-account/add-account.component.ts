
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import { AdminService } from './../../services/admin.service';
@Component({
  selector: 'app-admin-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.css'],
  providers: [AdminService]
})
export class AdminAddAccountComponent implements OnInit, OnDestroy, AfterViewInit {
  newAccountForm: FormGroup;
  account_name: FormControl;
  key_contact: FormControl;
  new_account_type: FormControl;
  billing_street: FormControl;
  billing_city: FormControl;
  billing_state: FormControl;
  billing_postal_code: FormControl;
  account_contact_num: FormControl;
  account_email: FormControl;
  epc_committee_on_hq: FormControl;
  online_training: FormControl;

  filteredAccounts = [];

  private accountFormValue: object = {
    account_name: null,
    key_contact: null,
    new_account_type: null,
    billing_street: null,
    billing_city: null,
    billing_state: null,
    billing_postal_code: null,
    account_contact_num: null,
    account_email: null,
    epc_committee_on_hq: false,
    online_training: false,
    account_id: 0
  };
  public accountId = 0;
  public sub: Subscription;
  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit() {
    this.newAccountForm = new FormGroup({
      account_name: new FormControl(this.accountFormValue['account_name'], Validators.required),
      key_contact: new FormControl(this.accountFormValue['key_contact']),
      new_account_type: new FormControl(this.accountFormValue['new_account_type']),
      billing_street: new FormControl(this.accountFormValue['billing_street'], Validators.required),
      billing_city: new FormControl(this.accountFormValue['billing_city'], Validators.required),
      billing_state: new FormControl(this.accountFormValue['billing_state'], Validators.required),
      billing_postal_code: new FormControl(this.accountFormValue['billing_postal_code']),
      account_contact_num: new FormControl(this.accountFormValue['account_contact_num']),
      account_email: new FormControl(this.accountFormValue['account_email']),
      epc_committee_on_hq: new FormControl(this.accountFormValue['epc_committee_on_hq']),
      online_training: new FormControl(this.accountFormValue['online_training'])
    });

    this.sub = this.getAccountChanges();
  }

  getAccountChanges(): Subscription {
    return this.newAccountForm.get('account_name').valueChanges.debounceTime(350).subscribe((val) => {
      if (val != null && val.length > 0) {
        this.adminService.getAccountListingForAdmin(0, val).subscribe((response) => {
          this.filteredAccounts = Object.keys(response['data']['list']).map((key) => {
            return response['data']['list'][key];
          });
        });
      } else {
        this.filteredAccounts = [];
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  ngAfterViewInit() {}

  public addNewThisAccount() {
    this.accountFormValue = this.newAccountForm.value;
    this.accountFormValue['account_id'] = this.accountId;
    this.adminService.createAccount(this.accountFormValue).subscribe((response) => {
      this.accountFormValue = response['data'];
      this.router.navigate(['/admin', 'users-in-accounts', this.accountFormValue['account_id']]);
    }, (error) => {
      console.log(error);
    });
  }
  getAccountSelection(accountDetails) {
    this.sub.unsubscribe();
    this.filteredAccounts = [];
    Object.keys(this.accountFormValue).forEach((field) => {
      this.accountFormValue[field] = accountDetails[field];
    });
    this.accountId = accountDetails['account_id'];
    console.log(this.accountFormValue);
    this.ngOnInit();
  }

  resetNewAccountForm() {
    this.newAccountForm.reset();
    this.filteredAccounts = [];
    this.accountId = 0;
    this.accountFormValue = {
      account_name: null,
      key_contact: null,
      new_account_type: null,
      billing_street: null,
      billing_city: null,
      billing_state: null,
      billing_postal_code: null,
      account_contact_num: null,
      account_email: null,
      epc_committee_on_hq: false,
      online_training: false,
      account_id: 0
    };

  }

}
