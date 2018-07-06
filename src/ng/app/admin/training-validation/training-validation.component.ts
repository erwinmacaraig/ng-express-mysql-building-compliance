

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
  defaultTrainingCourse = null;
  trainingModeField: FormControl;
  training_requirements = [];
  userForm: FormGroup;
  allUsersFormArrName: FormArray;
  smartSearchSelection: string;
  smartSearchSelectionId: number;
  users = [];
  parentLocationOptionGroup = [];
  parentLocationOptionGroupForNewUser = [];
  sublocationOptions = [];
  levelUsers;
  filteredList = [];
  filteredAccountList = [];
  filteredEmailList = [];
  locationId: number;
  genericSub: Subscription;
  genericEmailSearchSub: Subscription[] = [];
  genericAccountSearchSub: Subscription[] = [];
  buildings = [];
  buildingsForNewUser = [];
  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
  };
  datepickerModel: Date;
  datepickerModelFormatted = '';
  isShowDatepicker = false;

  newFirstName: FormControl;
  newLastname: FormControl;
  newUserEmail: FormControl;
  newUserRole: FormControl;
  newUserLocation: FormControl;
  newUserAccount: FormControl;
  selectedRole = 0;
  accountSearchResults = [];
  accountIdForAddUser = 0;
  accountSearchSub: Subscription;
  initialAccountName = null;
  selectedAccountId = 0;
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

  constructor(private adminService: AdminService, private formBuilder: FormBuilder,
    public dashboard: DashboardPreloaderService) {}

  ngOnInit() {
    this.genericSub = this.smartSearch();
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

  ngAfterViewInit() {
    $('.modal').modal({
      dismissible: false
    });
  }

  ngOnDestroy() {
    this.genericSub.unsubscribe();
    for (const s of this.genericEmailSearchSub) {
      s.unsubscribe();
    }
    for (const s of this.genericAccountSearchSub) {
      s.unsubscribe();
    }
  }

  public switchSearchSelection() {
    this.genericSub.unsubscribe();
    this.searchLocationField.reset();
    this.filteredList = [];
    this.users = [];
    this.filteredAccountList = [];
    this.genericSub = this.smartSearch();
    if ((<FormArray>this.userForm.get('levelUsers'))) {
      this.cancelUserForm();
    }
  }

  public smartSearch(): Subscription {
    return this.searchLocationField.valueChanges.debounceTime(350)
      .subscribe((searchValue) => {
        if (searchValue != null && searchValue.length > 0) {
            this.filteredList = [];
            this.adminService.searchLocationByName(searchValue).subscribe((response) => {
              this.filteredList = response['data'];
              // console.log('location result', this.filteredList);
              this.adminService.getAccountListingForAdmin(0, searchValue)
                .subscribe((res) => {
                // console.log('account list', res['data']['list']);
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
    this.genericAccountSearchSub[index].unsubscribe();
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
    .controls[index].get('role_id')
    .setValue(item['role_id']);

    (<FormArray>this.userForm.get('levelUsers'))
    .controls[index].get('accountId')
    .setValue(item['account_id']);

    this.filteredEmailList[index] = [];
    this.accountSearchResults[index] = [];
    this.assignSearchEmailAbility(index);
    this.searchAccount(index);
    console.log(item);

  }

  assignSucceedingDefaultCourse(index: number = 0): void {
    this.defaultTrainingCourse = (<FormArray>this.userForm.get('levelUsers')).controls[index].get('courseTraining').value;
  }

  public getAccountSelection(accountId, accountName): void {
    this.genericSub.unsubscribe();
    this.filteredList = [];
    this.filteredAccountList = [];
    this.users = [];
    this.searchLocationField.setValue(accountName);
    this.genericSub = this.smartSearch();
    this.adminService.getAllAccountUsers(accountId, 0, 'all').subscribe((response) => {
      const list = response['data']['list'];
      for (const l of list) {
        Object.keys(l['locations']).forEach((key) => {
          let role_id = 0;
          l['locations'][key]['location-parent'] =
            (l['locations'][key]['location-parent'] == null) ? '' : l['locations'][key]['location-parent'];
            if (l['locations'][key]['em-role-id'].length > 0) {
              role_id = l['locations'][key]['em-role-id'][0];
            } else if (l['locations'][key]['account-role-id'].length > 0) {
              role_id = l['locations'][key]['account-role-id'][0];
            }
            this.users.push({
              email: l['email'],
              role_name: ((l['locations'][key]['account-role']).concat(l['locations'][key]['em-role'])).join(','),
              first_name: l['first_name'],
              last_name: l['last_name'],
              user_id: l['user_id'],
              account_name: l['account'],
              account_id: l['account_id'],
              name: l['locations'][key]['location-name'],
              parent: l['locations'][key]['location-parent'],
              role_id: role_id,
              location_id: key
            });
        });
      }
      if (this.users.length > 0) {
        this.userForm = this.formBuilder.group({
          levelUsers: this.formBuilder.array([this.createFormItem()]),
          dtTraining: this.dtTrainingField,
          courseMethod: this.trainingModeField
        });
        this.levelUsers = this.userForm.get('levelUsers') as FormArray;
        this.assignSearchEmailAbility();
        this.searchAccount();
      }
    });

    this.adminService.getAllLocationsOnAccount(accountId).subscribe((response) => {
      this.buildings = response['data']['buildings'];
      this.parentLocationOptionGroup = response['data']['levels'];

      this.parentLocationOptionGroupForNewUser = response['data']['levels'];
      this.buildingsForNewUser = response['data']['buildings'];
    });


  }

  public getLocationSelection(selectedId, locationName): void {
    this.genericSub.unsubscribe();
    this.sublocationOptions = [];
    this.parentLocationOptionGroup = [];
    this.locationId = selectedId;
    this.searchLocationField.setValue(locationName);
    this.filteredList = [];
    this.filteredAccountList = [];
    this.genericSub = this.smartSearch();
    this.adminService.getLocationLevelUsers(this.locationId.toString()).subscribe((response) => {
      this.users = response['users'];
      this.parentLocationOptionGroup.push({
        parent_location_name: locationName,
        parent_location_id: selectedId,
        sublocations: response['sublocations']
      });
      this.sublocationOptions = response['sublocations'];
      if (this.users.length > 0) {
        this.userForm = this.formBuilder.group({
          levelUsers: this.formBuilder.array([this.createFormItem()]),
          dtTraining: this.dtTrainingField,
          courseMethod: this.trainingModeField
        });
        this.levelUsers = this.userForm.get('levelUsers') as FormArray;
        this.assignSearchEmailAbility();
        this.searchAccount();
      }
      // console.log(this.users);
    });
  }

  public getSelection(id, type, name) {
    this.smartSearchSelectionId = id;
    this.smartSearchSelection = type;

    if (type == 'location') {
      this.getLocationSelection(id, name);
      this.accountIdForAddUser = 0;
      this.accountSearchResults = [];
      this.selectedAccountId = 0;
      this.initialAccountName = null;
    } else {
      this.getAccountSelection(id, name);
      this.accountIdForAddUser = id;
      this.smartSearchSelection = 'account';
      this.selectedAccountId = id;
      this.initialAccountName = name;
    }
  }



  createFormItem(): FormGroup {
    return this.formBuilder.group({
      email: new FormControl(null, Validators.required),
      last_name: new FormControl(null, Validators.required),
      first_name: new FormControl(null, Validators.required),
      role_id: new FormControl(null, Validators.required),
      courseTraining: new FormControl(this.defaultTrainingCourse, Validators.required),
      user_id: new FormControl('0', null),
      accountId: new FormControl(this.selectedAccountId.toString(), null),
      account_name: new FormControl(this.initialAccountName, Validators.required),
      sublocation_name: new FormControl(null, null),
      sublocation_id: new FormControl('0', null)
    });
  }

  addUserFormItem(e: Event): void {
    e.preventDefault();
    this.levelUsers = this.userForm.get('levelUsers') as FormArray;
    this.levelUsers.push(this.createFormItem());
    this.filteredEmailList[this.levelUsers.length - 1] = [];
    this.accountSearchResults[this.levelUsers.length - 1] = [];
    this.assignSearchEmailAbility();
    this.searchAccount();

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
        this.genericAccountSearchSub[index].unsubscribe();
    }
    (<FormArray>this.userForm.get('levelUsers')).removeAt(0);
  }

  public removeUser(index: number = 1) {
    this.genericEmailSearchSub[index].unsubscribe();
    this.genericAccountSearchSub[index].unsubscribe();
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
      this.genericSub = this.smartSearch();
      this.dashboard.hide();
    });
  }

  switchLocationDropDown(e: any) {
    this.selectedRole = +e.target.value;
    this.newUserRole.setValue(+e.target.value);
  }

  getSelectedAccount(index, accountId, accountName): void {
    // this.accountSearchSub.unsubscribe();
    this.genericAccountSearchSub[index].unsubscribe();
    (<FormArray>this.userForm.get('levelUsers'))
      .controls[index].get('account_name')
      .setValue(accountName);

      this.genericAccountSearchSub[index].unsubscribe();
    (<FormArray>this.userForm.get('levelUsers'))
      .controls[index].get('accountId')
      .setValue(accountId);

    this.selectedAccountId = accountId;
    this.accountSearchResults[index] = [];
    this.searchAccount(index);

  }

  searchAccount(index?): void {
    console.log('searchAccount() was called');
    let i = this.levelUsers.length - 1;
    if (index != null)  {
      i = index;
    }
    this.genericAccountSearchSub[i] =
    this.levelUsers.controls[i].get('account_name').valueChanges.debounceTime(350).subscribe((value) => {
      if (value != null && value.length > 0) {
        this.adminService.getAccountListingForAdmin(0, value)
        .subscribe((res) => {
          this.accountSearchResults[i] = [];
          Object.keys(res['data']['list']).forEach((k) => {
            this.accountSearchResults[i].push(res['data']['list'][k]);
          });
        });
      } else {
        this.accountSearchResults[i] = [];
      }
    });
  }

  showModalNewUser() {
    $('#newUserModal').modal('open');
    // this.accountSearchSub = this.searchAccount();
    this.accountSearchResults = [];
  }

  cancelAddNewUser(): void {
    this.accountSearchSub.unsubscribe();
    this.accountIdForAddUser = 0;
    this.accountSearchResults = [];
    this.newFirstName.reset();
    this.newLastname.reset();
    this.newUserEmail.reset();
    this.newUserRole.reset();
    this.newUserLocation.reset();
    this.newUserAccount.reset();
  }

  public registerNewUser() {
    const values = [];
    values.push({
      first_name: this.newFirstName.value,
      last_name: this.newLastname.value,
      password: 'Password123',
      email: this.newUserEmail.value,
      role: this.newUserRole.value,
      location: this.newUserLocation.value,
      contact: '',
      account_id: this.accountIdForAddUser
    });
    console.log(JSON.stringify(values));
    this.adminService.submitNewUsers(JSON.stringify(values)).subscribe((response) => {

      // update all buffers
      if (this.smartSearchSelection == 'location') {
        this.adminService.getLocationLevelUsers(this.smartSearchSelectionId.toString()).subscribe((locRes) => {
          this.users = locRes['users'];
        });
      } else {
        this.adminService.getAllAccountUsers(this.smartSearchSelectionId, 0, 'all').subscribe((acctRes) => {
          const list = acctRes['data']['list'];
          this.users = [];
          const accountLocations = [];
          for (const l of list) {
            Object.keys(l['locations']).forEach((key) => {
              l['locations'][key]['location-parent'] =
                (l['locations'][key]['location-parent'] == null) ? '' : l['locations'][key]['location-parent'];
                this.users.push({
                  email: l['email'],
                  role_name: ((l['locations'][key]['account-role']).concat(l['locations'][key]['em-role'])).join(','),
                  first_name: l['first_name'],
                  last_name: l['last_name'],
                  user_id: l['user_id'],
                  account_name: l['account'],
                  account_id: l['account_id'],
                  name: l['locations'][key]['location-name'],
                  parent: l['locations'][key]['location-parent'],
                  location_id: key
                });
            });
          }
        });
      }
      this.cancelAddNewUser();
      $('#newUserModal').modal('close');
    });
  }

}
