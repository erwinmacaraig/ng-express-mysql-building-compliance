
import { Observable } from 'rxjs/Observable';
import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';
import { Router, ActivatedRoute } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';


import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-training-validation',
  templateUrl: './training-validation.component.html',
  styleUrls: ['./training-validation.component.css'],
  providers: [AdminService, DashboardPreloaderService]
})

export class TrainingValidationComponent implements OnInit, AfterViewInit, OnDestroy {

  searchLocationField: FormControl = new FormControl(null, Validators.required);
  userForm: FormGroup;
  allUsersFormArrName: FormArray;
  users = [];
  levelUsers;
  filteredList = [];
  filteredEmailList = [];
  locationId: number;
  genericSub: Subscription;
  genericEmailSearchSub: Subscription[] = [];
  constructor(private adminService: AdminService, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.genericSub = this.getLocationChanges();
    this.allUsersFormArrName = new FormArray([]);
    this.userForm = new FormGroup({});
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  public getLocationChanges(): Subscription {
    return this.searchLocationField.valueChanges.debounceTime(350)
      .subscribe((searchValue) => {
        if (searchValue != null && searchValue.length > 0) {
          this.adminService.searchLocationByName(searchValue).subscribe((response) => {
            this.filteredList = response['data'];
          });
        } else {
          this.filteredList = [];
        }
      });
  }

  public getEmailSearchChanges() {

  }

  public getLocationSelection(selectedId, locationName) {
    this.genericSub.unsubscribe();
    this.locationId = selectedId;
    this.searchLocationField.setValue(locationName);
    this.filteredList = [];
    this.genericSub = this.getLocationChanges();
    this.adminService.getLocationLevelUsers(this.locationId.toString()).subscribe((response) => {
      this.users = response['users'];
      if (this.users.length > 0) {
        this.userForm = this.formBuilder.group({
          levelUsers: this.formBuilder.array([this.createFormItem()])
        });
        this.levelUsers = this.userForm.get('levelUsers') as FormArray;
        this.assignSearchEmailAbility();
      }
      console.log(this.users);
    });
  }

  public getEmailSelection(index) {

  }

  createFormItem(): FormGroup {
    return this.formBuilder.group({
      email: new FormControl(null, Validators.required),
      last_name: new FormControl(null, Validators.required),
      first_name: new FormControl(null, Validators.required),
      user_id: new FormControl('0', null),
      accountId: new FormControl('0', null),
      account_name: new FormControl(null, Validators.required),
      sublocation_name: new FormControl(null, Validators.required),
      sublocation_id: new FormControl('0', null)
    });
  }

  addUserFormItem(e: Event): void {
    e.preventDefault();
    this.levelUsers = this.userForm.get('levelUsers') as FormArray;
    this.levelUsers.push(this.createFormItem());
    this.filteredEmailList[this.levelUsers.length - 1] = [];
    /*
    console.log(this.levelUsers);
    console.log(this.levelUsers.length);
    console.log(this.levelUsers.controls[this.levelUsers.length - 1].get('email'));
    */
   this.assignSearchEmailAbility();

  }
  private assignSearchEmailAbility(): void {
    this.levelUsers.controls[this.levelUsers.length - 1].get('email').valueChanges.debounceTime(350)
    .subscribe((inputEmail) => {
      if (inputEmail.length > 0) {
        // loop over
        console.log('At index ' + (this.levelUsers.length - 1) + ' = ' + inputEmail);
        this.filteredEmailList[this.levelUsers.length - 1] = [];
        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i]['email'].toLowerCase().indexOf(inputEmail.toLowerCase()) > -1) {
            this.filteredEmailList[this.levelUsers.length - 1].push(this.users[i]);
          }
        }
      } else {
        this.filteredEmailList[this.levelUsers.length - 1] = [];
      }
    });
  }



}
