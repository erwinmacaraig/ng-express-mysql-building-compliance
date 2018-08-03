import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { DatepickerOptions } from 'ng2-datepicker';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AdminService } from './../../services/admin.service';

declare var moment: any;
@Component({
  selector: 'app-paper-attendance',
  templateUrl: './paper-attendance.component.html',
  styleUrls: ['./paper-attendance.component.css'],
  providers: [AdminService]
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
  constructor(private adminService: AdminService) {}

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

  uploadFiles(files: File[]) {
    console.log(files);
    const myForm = new FormData();
    myForm.append('file', files[0], files[0]['name']);
    myForm.append('dtTraining', this.dtTrainingField.value);
    myForm.append('training', this.courseTraining.value);

  }

}
