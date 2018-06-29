

import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';

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
  dtTrainingField: FormControl;
  trainingCourseField: FormControl;
  trainingModeField: FormControl;
  training_requirements = [];
  userForm: FormGroup;
  allUsersFormArrName: FormArray;
  users = [];
  levelUsers;
  filteredList = [];
  filteredAccountList = [];
  filteredEmailList = [];
  locationId: number;
  genericSub: Subscription;
  genericEmailSearchSub: Subscription[] = [];

  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
  };
  datepickerModel: Date;
  datepickerModelFormatted = '';
  isShowDatepicker = false;

  constructor(private adminService: AdminService, private formBuilder: FormBuilder,
    public dashboard: DashboardPreloaderService) {}

  ngOnInit() {
    this.genericSub = this.getLocationChanges();

    this.trainingCourseField = new FormControl(null, Validators.required);
    this.trainingModeField = new FormControl(null, Validators.required);
    this.allUsersFormArrName = new FormArray([]);
    this.userForm = new FormGroup({});
    this.setDatePickerDefaultDate();
    this.dtTrainingField = new FormControl(this.datepickerModelFormatted, Validators.required);
    this.adminService.getTrainingRequirementList().subscribe((response) => {
      this.training_requirements = response['data'];
      // console.log(this.training_requirements);
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.genericSub.unsubscribe();
    for (const s of this.genericEmailSearchSub) {
      s.unsubscribe();
    }
  }

  public switchSearchSelection() {
    this.genericSub.unsubscribe();
    this.searchLocationField.reset();
    this.filteredList = [];
    this.users = [];
    this.filteredAccountList = [];
    this.genericSub = this.getLocationChanges();
    if ((<FormArray>this.userForm.get('levelUsers'))) {
      this.cancelUserForm();
    }
  }

  public getLocationChanges(): Subscription {
    return this.searchLocationField.valueChanges.debounceTime(350)
      .subscribe((searchValue) => {
        if (searchValue != null && searchValue.length > 0) {
            this.filteredList = [];
            this.adminService.searchLocationByName(searchValue).subscribe((response) => {
              this.filteredList = response['data'];
              console.log('location result', this.filteredList);
              this.adminService.getAccountListingForAdmin(0, searchValue)
                .subscribe((res) => {
                  console.log('account list', res['data']['list']);
                  Object.keys(res['data']['list']).forEach((k) => {
                    this.filteredList.push(res['data']['list'][k]);
                  });
                });
            });
        } else {
          this.filteredList = [];
          this.filteredEmailList = [];
        }
      });
  }

  public getEmailSelection(index: number = -1, item) {
    // console.log(this.genericEmailSearchSub[index]);
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


  }

  public getAccountSelection(accountId, accountName): void {
    this.genericSub.unsubscribe();
    this.filteredList = [];
    this.filteredAccountList = [];
    this.users = [];
    this.searchLocationField.setValue(accountName);
    this.genericSub = this.getLocationChanges();
    this.adminService.getAllAccountUsers(accountId, 0, 'all').subscribe((response) => {
      const list = response['data']['list'];
      for (const l of list) {
        for (const loc of l['locations-arr']) {
          this.users.push({
            email: l['email'],
            role_name: ((loc['account-role']).concat(loc['em-role'])).join(','),
            first_name: l['first_name'],
            last_name: l['last_name'],
            user_id: l['user_id'],
            account_name: l['account'],
            account_id: l['account_id'],
            name: `${loc['location-parent']} ${loc['location-name']}`,
            parent: loc['location-parent']
          });
        }
      }
      if (this.users.length > 0) {
        this.userForm = this.formBuilder.group({
          levelUsers: this.formBuilder.array([this.createFormItem()]),
          dtTraining: this.dtTrainingField,
          courseMethod: this.trainingModeField,
          courseTraining: this.trainingCourseField
        });
        this.levelUsers = this.userForm.get('levelUsers') as FormArray;
        this.assignSearchEmailAbility();
      }


    });


  }

  public getLocationSelection(selectedId, locationName): void {
    this.genericSub.unsubscribe();
    this.locationId = selectedId;
    this.searchLocationField.setValue(locationName);
    this.filteredList = [];
    this.filteredAccountList = [];
    this.genericSub = this.getLocationChanges();
    this.adminService.getLocationLevelUsers(this.locationId.toString()).subscribe((response) => {
      this.users = response['users'];
      if (this.users.length > 0) {
        this.userForm = this.formBuilder.group({
          levelUsers: this.formBuilder.array([this.createFormItem()]),
          dtTraining: this.dtTrainingField,
          courseMethod: this.trainingModeField,
          courseTraining: this.trainingCourseField
        });
        this.levelUsers = this.userForm.get('levelUsers') as FormArray;
        this.assignSearchEmailAbility();
      }
      // console.log(this.users);
    });
  }

  public getSelection(id, type, name) {
    if (type == 'location') {
      this.getLocationSelection(id, name);
    } else {
      this.getAccountSelection(id, name);
    }
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
    this.assignSearchEmailAbility();

  }
  private assignSearchEmailAbility(index?): void {
    let i = this.levelUsers.length - 1;
    if (index != null)  {
      i = index;
    }
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
    for (let index = 0;
      index <= (<FormArray>this.userForm.get('levelUsers')).length; index++) {
        (<FormArray>this.userForm.get('levelUsers')).removeAt(index);
        this.genericEmailSearchSub[index].unsubscribe();
    }
    (<FormArray>this.userForm.get('levelUsers')).removeAt(0);
  }

  public removeUser(index: number = 1) {
    this.genericEmailSearchSub[index].unsubscribe();
    (<FormArray>this.userForm.get('levelUsers')).removeAt(index);
  }

  setDatePickerDefaultDate() {
    this.datepickerModel = moment().toDate();
    this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
  }
  onChangeDatePicker(event) {
    if (!moment(this.datepickerModel).isValid()) {
        this.datepickerModel = new Date();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
    } else {
        this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
    }
    this.dtTrainingField.setValue(this.datepickerModelFormatted);
    this.isShowDatepicker = false;
  }

  showDatePicker() {
    this.isShowDatepicker = true;
  }

  public validateTrainingOnSubmit() {
    this.dashboard.show();
    const values = [];
    const formUserControls = (<FormArray>this.userForm.get('levelUsers')).controls;
    for (const ctrl of formUserControls) {
      values.push({
        email: ctrl.get('email').value,
        user_id: ctrl.get('user_id').value,
        first_name: ctrl.get('first_name').value,
        last_name: ctrl.get('last_name').value,
        certification_date: this.userForm.get('dtTraining').value,
        location_id: ctrl.get('sublocation_id').value,
        account_id: ctrl.get('accountId').value,
        course_method: this.userForm.get('courseMethod').value,
        training_requirement_id: this.userForm.get('courseTraining').value
      });
    }
    this.genericSub.unsubscribe();
    this.users = [];
    this.searchLocationField.reset();
    console.log(JSON.stringify(values));
    this.cancelUserForm();
    this.adminService.validateUserTrainings(JSON.stringify(values))
    .subscribe((response) => {
      this.genericSub = this.getLocationChanges();
      this.dashboard.hide();
    });

  }
}
