import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs/Rx';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';


import { AdminService } from './../../services/admin.service';

declare var $: any;

@Component({
  selector: 'app-admin-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css'],
  providers: [AdminService]
})
export class AddAccountUserComponent  implements OnInit, AfterViewInit {
  accountId = 0;
  userForm: FormGroup;
  users;
  sub: Subscription;
  buildings = [];
  levels = [];
  forbiddenRoleList = [-1];
  selectedRole = [];
  roles = [
    {
      role_id: 1,
      role_name: 'FRP'
    },
    {
      role_id: 2,
      role_name: 'TRP'
    },
    {
      role_id: 8,
      role_name: 'GOFR',
    },
    {
      role_id: 9,
      role_name: 'Warden',
    },
    {
      role_id: 10,
      role_name: 'Floor / Area Warden',
    },
    {
      role_id: 11,
      role_name: 'Chief Warden',
    },
    {
      role_id: 12,
      role_name: 'Fire Safety Advisor',
    },
    {
      role_id: 13,
      role_name: 'EPC Member',
    },
    {
      role_id: 14,
      role_name: 'Fire Aid Officer',
    },
    {
      role_id: 15,
      role_name: 'Deputy Chief Warden',
    },
    {
      role_id: 16,
      role_name: 'Building Warden',
    },
    {
      role_id: 18,
      role_name: 'Deputy Building Warden',
    },

  ];
  private baseUrl: String;

  constructor(public http: HttpClient,
    private platformLocation: PlatformLocation,
    private formBuilder: FormBuilder,
    private adminService: AdminService,
    private route: ActivatedRoute) {

    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {
    this.route.params.subscribe((parameters) => {
      this.accountId = parameters['accntId'];
      this.userForm = this.formBuilder.group({
        users: this.formBuilder.array([this.createFormItem()])
      });

      this.adminService.getAllLocationsOnAccount(this.accountId).subscribe((response) => {
        this.buildings = response['data']['buildings'];
        this.levels = response['data']['levels'];
      });
    });
  }

  ngAfterViewInit() {
    // $('select').material_select();
  }

  createFormItem(): FormGroup {
    return this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email], this.forbiddenEmails.bind(this)],
      role: ['', Validators.required],
      location: ['', Validators.required],
      contact: ''
    });
  }

  addUserFormItem(e: Event): void {
    e.preventDefault();
    this.users = this.userForm.get('users') as FormArray;
    this.users.push(this.createFormItem());
  }

  addUserOnSubmit() {
    const controlsArr = (<FormArray>this.userForm.get('users')).controls;
    const values = [];
    for (const ctrl of controlsArr) {
      values.push({
        first_name: ctrl.get('first_name').value,
        last_name: ctrl.get('last_name').value,
        password: ctrl.get('password').value,
        email: ctrl.get('email').value,
        role: ctrl.get('role').value,
        location: ctrl.get('location').value,
        contact: ctrl.get('contact').value,
        account_id: this.accountId
      });
    }
    console.log(JSON.stringify(values));
    this.sub = this.adminService.submitNewUsers(JSON.stringify(values)).subscribe((response) => {
      (<FormArray>this.userForm.get('users')).reset();
      for (let index = 1;
      index <= (<FormArray>this.userForm.get('users')).length; index++) {
        (<FormArray>this.userForm.get('users')).removeAt(index);
      }

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

  forbiddenRoles(control: FormControl): {[s: string]: boolean} {
    console.log('control value = ' + control.value);
    if (this.forbiddenRoleList.indexOf(+control.value) !== -1) {
      return { 'roleIsForbidden': true };
    } else {
      return null;
    }
  }
  switchLocationDropDown(e: any, index: number) {
    this.selectedRole[index] = +e.target.value;
    (<FormArray>this.userForm.get('users')).controls[index].get('role').setValue(+e.target.value);
    console.log(this.selectedRole);
  }

  cancelUserForm() {
    (<FormArray>this.userForm.get('users')).reset();
    for (let index = 1;
      index <= (<FormArray>this.userForm.get('users')).length; index++) {
        (<FormArray>this.userForm.get('users')).removeAt(index);
    }
  }

}

