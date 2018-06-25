
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

  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
  };
  trainingDate = '';
  datepickerModel: Date;
  datepickerModelFormatted = '';
  isShowDatepicker = false;

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

  public getEmailSelection(index: number = -1, item) {
    console.log(this.genericEmailSearchSub[index]);
    this.genericEmailSearchSub[index].unsubscribe();
    (<FormArray>this.userForm.get('levelUsers')).controls[index].get('email').setValue(item['email']);
    (<FormArray>this.userForm.get('levelUsers')).controls[index].get('user_id').setValue(item['user_id']);
    (<FormArray>this.userForm.get('levelUsers')).controls[index].get('first_name').setValue(item['first_name']);
    (<FormArray>this.userForm.get('levelUsers')).controls[index].get('last_name').setValue(item['last_name']);
    (<FormArray>this.userForm.get('levelUsers'))
      .controls[index].get('account_name')
      .setValue(item['account_name']);

    (<FormArray>this.userForm.get('levelUsers'))
    .controls[index].get('sublocation_name')
    .setValue(item['name']);

    (<FormArray>this.userForm.get('levelUsers'))
    .controls[index].get('sublocation_id')
    .setValue(item['location_id']);

    (<FormArray>this.userForm.get('levelUsers'))
    .controls[index].get('accountId')
    .setValue(item['account_id']);

    this.filteredEmailList[index] = [];
    this.assignSearchEmailAbility(index);

    console.log('=======================', this.genericEmailSearchSub);

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
      // console.log(this.users);
    });
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
  private assignSearchEmailAbility(index?): void {
    let i = this.levelUsers.length - 1;
    if (index != null)  {
      i = index;
    }
    console.log('at assignSearchAbility ', i);
    this.genericEmailSearchSub[i] =
    this.levelUsers.controls[i].get('email').valueChanges.debounceTime(350)
    .subscribe((inputEmail) => {
      if (inputEmail.length > 0) {
        // loop over
        // console.log('At index ' + (i) + ' = ' + inputEmail);
        this.filteredEmailList[i] = [];
        for (let x = 0; x < this.users.length; x++) {
          if (this.users[x]['email'].toLowerCase().indexOf(inputEmail.toLowerCase()) > -1) {
            this.filteredEmailList[i].push(this.users[x]);
          }
        }
      } else {
        this.filteredEmailList[i] = [];
      }
    }, (err) => {
      console.log(err, 'Error at index ' + i);
    });
  }

  cancelUserForm() {
    (<FormArray>this.userForm.get('levelUsers')).reset();
    for (let index = 1;
      index <= (<FormArray>this.userForm.get('levelUsers')).length; index++) {
        (<FormArray>this.userForm.get('levelUsers')).removeAt(index);
        this.genericEmailSearchSub[index].unsubscribe();
    }
  }

  public removeUser(index: number = 1) {
    this.genericEmailSearchSub[index].unsubscribe();
    (<FormArray>this.userForm.get('levelUsers')).removeAt(index);
  }

  setDatePickerDefaultDate() {
    this.datepickerModel = moment().toDate();
    this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
    this.trainingDate = moment(this.datepickerModel).format('YYYY-MM-DD');
  }


}
