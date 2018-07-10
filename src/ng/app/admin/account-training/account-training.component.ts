import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { AdminService } from './../../services/admin.service';
import { FormGroup, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-admin-account-training',
  templateUrl: './account-training.component.html',
  styleUrls: ['./account-training.component.css'],
  providers: [AdminService]
})

export class AccountTrainingComponent implements OnInit, OnDestroy, AfterViewInit {

  accountId = 0;
  sub: Subscription;
  trainingData: Array<object>  = [];
  trainingFormGroup: FormGroup;
  scormCourseField: FormControl;
  trainingRqmtField: FormControl;
  roleField: FormControl;
  trqmts: Array<object> = [];
  courses: Array<object> = [];
  em_roles: Array<object> = [];
  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.accountId = +params['accntId'];

      this.adminService.getAccountTrainings(this.accountId).subscribe((response: any) => {
        this.trainingData = response.data;
        this.trqmts = response.trqmts;
        this.em_roles = response.em_roles;
        this.courses = response.courses;
      });

      this.trainingFormGroup = new FormGroup({
        scormCourseField: new FormControl(null, Validators.required),
        trainingRqmtField: new FormControl(null, Validators.required),
        roleField: new FormControl(null, Validators.required)
      });

    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {}

  public assignTrainingToRole(training) {
     this.adminService.setTrainingToAccountRoles(this.accountId,
      training['course_id'],
      training['training_requirement_id'],
      training['role'] )
     .subscribe((response) => {
      console.log(response);
     });
  }

  public createTraining() {
    if (this.trainingFormGroup.valid) {
      this.adminService.createTrainingRecordForAccount(
        this.accountId,
        this.trainingFormGroup.get('scormCourseField').value,
        this.trainingFormGroup.get('roleField').value,
        this.trainingFormGroup.get('trainingRqmtField').value
      ).subscribe((response) => {
        this.trainingData = response['trainings'];
        this.trainingFormGroup.reset();
      }, (error) => {
        console.log(error);
      });
    }
  }

}
