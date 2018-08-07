import { AccountsDataProviderService } from './../../services/accounts';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';


declare var $: any;
@Component({
  selector: 'app-notification-config',
  templateUrl: './notification-config.component.html',
  styleUrls: ['./notification-config.component.css'],
  providers: [ AccountsDataProviderService ]
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
  public defaultMessage = 'Test Message';
  public buildingArray = [];
  constructor(private accountService: AccountsDataProviderService) {}

  ngOnInit() {
    this.notConfigFormGrp = new FormGroup({
      all_users: new FormControl(false, null),
      eco_user: new FormControl(false, null),
      frequency_field: new FormControl(null, Validators.required),
      trp_user: new FormControl(false, null),
      messageField: new FormControl(this.defaultMessage, Validators.required)
    });
    this.searchBldgField = new FormControl();
    this.sub = this.buildingSearches();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  public buildingSearches(): Subscription {
    return this.searchBldgField.valueChanges.debounceTime(350).subscribe((val) => {
      if (val.length > 0) {
        this.buildingArray = [];
        this.accountService.searchForBuildings(val).subscribe((response) => {
          console.log(response);
          this.buildingArray = response['data'];
        });
      }
    });
  }

  public getSelection(locationId = 0, locationName = '') {
    this.sub.unsubscribe();
    this.buildingId = locationId;
    this.searchBldgField.setValue(locationName);
    this.buildingArray = [];
    this.sub = this.buildingSearches();
  }

  public createNewConfig() {
    let values = {};
    values = {
      frequency: this.notConfigFormGrp.get('frequency_field').value,
      all_users: this.notConfigFormGrp.get('all_users').value,
      eco_user: this.notConfigFormGrp.get('eco_user').value,
      trp_user: this.notConfigFormGrp.get('trp_user').value,
      message: this.notConfigFormGrp.get('messageField').value,
      building_id: this.buildingId
    };

    console.log(JSON.stringify(values));
  }

}
