import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { AdminService } from './../../services/admin.service';

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
  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe((params) => {
      this.accountId = +params['accntId'];

      this.adminService.getAccountTrainings(this.accountId).subscribe((response:any) => {
        this.trainingData = response.data;
        console.log(this.trainingData);
      });

    });
  }

  ngOnDestroy() {}

  ngAfterViewInit() {}

  public assignTrainingToRole(training) {
     this.adminService.setTrainingToAccountRoles(this.accountId, training['course_id'], training['training_requirement_id'], training['role'] )
     .subscribe((response) => {

     });

  }

}
