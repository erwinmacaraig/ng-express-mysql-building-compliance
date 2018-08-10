import { UserService } from './../../services/users';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewEncapsulation, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ViewChild } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { DatepickerOptions } from 'ng2-datepicker';
import { Router, NavigationEnd  } from '@angular/router';
import * as moment from 'moment';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DonutService } from '../../services/donut';

declare var $: any;

@Component({
	selector: 'app-user-dashboard',
	templateUrl: './user.component.html',
	styleUrls: ['./user.component.css'],
	providers: [AccountsDataProviderService, AuthService, LocationsService, DashboardPreloaderService, DonutService]
})

export class UserDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('durationDate') durationDate: ElementRef;
  @ViewChild('formMobility') formMobility: NgForm;
	userData = {};
  training_percentage = 0;
  assignedCourses = [];
  trainings = [];
  showModalLoader = false;

  options: DatepickerOptions = {
    displayFormat: 'MMM D[,] YYYY',
    minDate: new Date(Date.now())
};

datepickerModel: Date;
isShowDatepicker = false;
datepickerModelFormatted = '';
peep = {};
locationStr = '';
	constructor(
		private authService: AuthService,
    private donut: DonutService,
    private dashboardService: DashboardPreloaderService,
    private userService: UserService
		){

    this.userData = this.authService.getUserData();

    this.datepickerModel = new Date();
    this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

	}

	ngOnInit() {
    this.userService.getEmUserDashboardInfo().subscribe((response) => {
      // console.log(response);
      this.training_percentage = parseInt(response['percentage_training'], 10);
      this.assignedCourses = response['courses'];
      this.trainings = response['trainings'];
      if (response['peepDetails']) {
        this.peep = response['peepDetails'][0];
      }
      this.locationStr = response['locations'].join(',');
      // console.log(this.peep);
      this.donut.updateDonutChart('#specificChart', this.training_percentage, true);
    }, (e) => {
      console.log(e);
    });

	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '1% 3%');
    $('select').material_select();
    $('.modal').modal({
      dismissible: false
    });

		// DONUT update
    // Donut Service

	}

	ngOnDestroy() {

  }
  showPeepForm() {
    $('#modalMobility select[name="is_permanent"]').val('0').trigger('change');
    this.datepickerModelFormatted = moment().format('MMM. DD, YYYY');
    this.showModalLoader = false;

    if ((Object.keys(this.peep)).length > 0) {
      Object.keys(this.peep).forEach((i) => {
        if (this.formMobility.controls[i] && i !== 'duration_date') {
          this.formMobility.controls[i].setValue(this.peep[i]);
        }
      });
      $('#modalMobility select[name="is_permanent"]').val(this.peep['is_permanent']);
      if (this.peep['is_permanent'] === 0) {
        this.datepickerModel = moment(this.peep['duration_date']).toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
        $('#modalMobility select[name="is_permanent"]').val('0').trigger('change');
      } else {
        $('#modalMobility select[name="is_permanent"]').val('1').trigger('change');
      }
    }



    $('#modalMobility').modal('open');
  }
  onChangeDatePicker(event) {
    if (!moment(this.datepickerModel).isValid()) {
      this.datepickerModel = new Date();
      this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    } else {
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    }
    this.isShowDatepicker = false;
}

  showDatePicker() {
      this.isShowDatepicker = true;
  }
  modalPeepFormSubmit(f, event) {
    if (f.valid) {
      const paramData = JSON.parse(JSON.stringify(f.value));
      paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD') || null;
      paramData['user_id'] = this.userData['userId'];
      paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();
      if (this.peep) {
        paramData['mobility_impaired_details_id'] = this.peep['mobility_impaired_details_id'];
      }
      paramData['locations'] = this.locationStr;
      this.showModalLoader = true;
      this.dashboardService.show();
      this.userService.sendMobilityImpaireInformation(paramData, (response) => {
        this.ngOnInit();
        f.reset();
        $('#modalMobility').modal('close');
        this.showModalLoader = false;
        this.dashboardService.hide();
      });
    }

  }
}
