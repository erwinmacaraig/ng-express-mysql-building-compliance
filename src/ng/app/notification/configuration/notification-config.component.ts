import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';


declare var $: any;
@Component({
  selector: 'app-notification-config',
  templateUrl: './notification-config.component.html',
  styleUrls: ['./notification-config.component.css']
})
export class NotificationConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {

  public notConfigFormGrp: FormGroup;
  public buildingId = 0;
  public searchBldgField: FormControl;
  public trp_user: FormControl;
  public all_users: FormControl;
  public messageField: FormControl;
  public frequency_field: FormControl;
  public eco_user: FormControl;
  private sub: Subscription;
  private defaultMessage = 'Test Message';
  constructor() {}

  ngOnInit() {
    this.notConfigFormGrp = new FormGroup({
      all_users: new FormControl(false, null),
      eco_user: new FormControl(false, null),
      frequency_field: new FormControl(null, Validators.required),
      trp_user: new FormControl(false, null),
      messageField: new FormControl(this.defaultMessage, Validators.required)
    });
    this.searchBldgField = new FormControl();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

}
