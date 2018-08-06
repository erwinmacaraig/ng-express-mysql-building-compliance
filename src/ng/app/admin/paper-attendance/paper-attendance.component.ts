import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DatepickerOptions } from 'ng2-datepicker';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { AdminService } from './../../services/admin.service';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var moment: any;
@Component({
  selector: 'app-paper-attendance',
  templateUrl: './paper-attendance.component.html',
  styleUrls: ['./paper-attendance.component.css'],
  providers: [AdminService, DashboardPreloaderService]
})
export class PaperAttendanceComponent implements OnInit, AfterViewInit, OnDestroy {

  files: File[] = [];
  sendableFormData: FormData;
  progress: number;
  hasBaseDropZoneOver = false;
  httpEmitter: Subscription;
  httpEvent: any;
  maxSize: any;
  lastInvalids: any;
  baseDropValid: any;
  dragFiles: any;
  invalidsFiles = [];
  accept = '*';

  datepickerModel: Date;
  datepickerModelFormatted = '';
  isShowDatepicker = false;

  dtTrainingField: FormControl;
  courseTraining: FormControl;
  options: DatepickerOptions = {
    displayFormat: 'YYYY-MM-DD'
  };
  training_requirements = [];
  private baseUrl: String;
  constructor(
    private adminService: AdminService,
    public http: HttpClient,
    public router: Router,
    public dashboard: DashboardPreloaderService,
    private platformLocation: PlatformLocation) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {
    this.setDatePickerDefaultDate();
    this.dtTrainingField = new FormControl(this.datepickerModelFormatted, Validators.required);
    this.courseTraining = new FormControl(null, Validators.required);
    this.adminService.getTrainingRequirementList().subscribe((response) => {
      this.training_requirements = response['data'];
      // console.log(this.training_requirements);
    });

  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

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
  setDatePickerDefaultDate() {
    this.datepickerModel = moment().toDate();
    this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
  }

  uploadFiles(files: File[]): Subscription {
    console.log(files);
    const myForm = new FormData();
    myForm.append('file', files[0], files[0]['name']);
    myForm.append('dtTraining', this.dtTrainingField.value);
    myForm.append('training', this.courseTraining.value);
    let req;
    this.dashboard.show();
    req = new HttpRequest<FormData>('POST', `${this.baseUrl}/admin/upload/paper-attendance/`, myForm, {
      reportProgress: true
    });
    return this.httpEmitter = this.http.request(req).subscribe(
      event => {
          this.httpEvent = event;
          if (event instanceof HttpResponse) {
              delete this.httpEmitter;
              this.dashboard.hide();
              console.log('request done', event);
              this.router.navigate(['/admin', 'training-validation']);
          }
      },
      error => {
          console.log('Error Uploading', error);
          this.dashboard.hide();
      }
    );
  }

}
