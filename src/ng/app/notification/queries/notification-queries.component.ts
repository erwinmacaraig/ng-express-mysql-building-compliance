import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { AccountsDataProviderService } from '../../services/accounts';
import { LocationsService } from '../../services/locations';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs/Subscription';
@Component({
  selector: 'app-notification-query',
  templateUrl: './notification-queries.component.html',
  styleUrls: ['./notification-queries.component.css'],
  providers: [EncryptDecryptService, AccountsDataProviderService, LocationsService, AuthService]
})
export class NotificationQueryComponent implements OnInit, AfterViewInit, OnDestroy {

  private token = '';
  public encryptedToken = '';
  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  public state = 0;
  public responses = [];
  private building_id = 0;
  public sublocations = [];
  private sub: Subscription;
  public isAccountRole = false;

  public primaryQuestionField: FormControl;
  public otherInfoField: FormControl;

  public newPersonAppointedName: FormControl;
  public newPersonAppointedEmail: FormControl;
  public newSublocationField: FormControl;

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
              private accountService: AccountsDataProviderService,
              private locationService: LocationsService,
              private authService: AuthService,
              private router: Router) {}

  ngOnInit() {
    this.primaryQuestionField = new FormControl(null, Validators.required);
    this.otherInfoField = new FormControl(null, Validators.required);

    this.newPersonAppointedName = new FormControl(null, Validators.required);
    this.newPersonAppointedEmail = new FormControl(null, Validators.required);
    this.newSublocationField = new FormControl(null, Validators.required);

    this.route.params.subscribe((params) => {
      this.token = this.cryptor.decryptUrlParam(params['token']);
      this.encryptedToken = params['token'];
      // split string
      const parts: Array<string> = this.token.split('_');
      console.log(parts);
      this.userId = +parts[0];
      this.location_id = +parts[1];
      this.configId = +parts[2];
      this.notification_token_id = +parts[3];
      this.building_id = +parts[4];

      this.locationService.getSublocationsOfParent(this.building_id).subscribe((response) => {
        this.sublocations =  response['data'];
      }, (error) => {
        console.log(error);
      });

    });

    const role = this.authService.getHighestRankRole();
    if (role <= 2) {
      this.isAccountRole = true;
    }

  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  confirmPrimaryQuestion() {
    this.state = 1;
    this.responses.push({
      question: 'Do you still hold the role to the appointed location',
      ans: this.primaryQuestionField.value
    });

    console.log(this.responses);
    if (this.primaryQuestionField.value == 'Tenancy changed') {
      this.sub = this.sendResponseToNotifcation(1, 'Resigned');
      this.state = -1;
    }
    if (this.primaryQuestionField.value == 'Other') {
      this.sub = this.sendResponseToNotifcation(0, 'In Progress');
      this.state = 7;
    }
    if (this.primaryQuestionField.value == 'My location has changed') {
      this.sub = this.sendResponseToNotifcation(0, 'In Progress');
      this.state = 6;
    }
    if (this.primaryQuestionField.value == 'New Person Appointed') {
      this.sub = this.sendResponseToNotifcation(0, 'In Progress');
      this.state = 5;
    }
    if (this.primaryQuestionField.value == 'I want to resign') {
      this.sub = this.sendResponseToNotifcation(1, 'Resigned');
      this.state = -1;
    }

    setTimeout(() => {
        window['Materialize'].updateTextFields();
    }, 300);

  }


  submitNominatedPerson() {
    this.responses.push({
      question: 'New person appointed name',
      ans: this.newPersonAppointedName.value
    });
    this.responses.push({
      question: 'New person appointed email',
      ans: this.newPersonAppointedEmail.value
    });
    this.sub = this.sendResponseToNotifcation(1, 'Resigned');
    this.state = -1;

  }
  submitOtherInfo() {
    this.responses.push({
      question: 'What other information provided',
      ans: this.otherInfoField.value
    });
    this.sub = this.sendResponseToNotifcation(1, 'Resigned');
    this.state = -1;
  }

  submitNewLocation() {
    this.responses.push({
      question: 'What is the location id of the new location provided',
      ans: this.sublocations[this.newSublocationField.value]['location_id']
    });
    this.responses.push({
      question: 'What is the location name of the new location provided',
      ans: this.sublocations[this.newSublocationField.value]['name']
    });
    this.sub = this.sendResponseToNotifcation(1, 'Validated');
    if (this.isAccountRole) {
      this.router.navigate(['/dashboard', 'notification-warden-list', this.encryptedToken]);
    } else {
      this.state = -1;
    }


  }

  private sendResponseToNotifcation(completed = 0, status = 'In Progress'): Subscription {
    const myAns = JSON.stringify(this.responses);
    return this.accountService.submitQueryResponses(myAns, this.notification_token_id, completed, status).subscribe(
      (response) => {
        if ( this.primaryQuestionField.value == 'Tenancy changed' ) {
          this.responses = [];
        }
      },
      (error) => {
        console.log('There was an error processing the request answer');
      }
    );




  }

}
