import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { AccountsDataProviderService } from '../../services/accounts';
import { Subscription } from 'rxjs/Subscription';
@Component({
  selector: 'app-notification-query',
  templateUrl: './notification-queries.component.html',
  styleUrls: ['./notification-queries.component.css'],
  providers: [EncryptDecryptService, AccountsDataProviderService]
})
export class NotificationQueryComponent implements OnInit, AfterViewInit, OnDestroy {

  private token = '';
  private userId = 0;
  private location_id = 0;
  private configId = 0;
  private notification_token_id = 0;
  public state = 0;
  public responses = [];
  private isCompleted = 0;
  private sub: Subscription;

  public primaryQuestionField: FormControl;

  constructor(private route: ActivatedRoute, private cryptor: EncryptDecryptService,
              private accountService: AccountsDataProviderService) {}

  ngOnInit() {
    this.primaryQuestionField = new FormControl(null, Validators.required);

    this.route.params.subscribe((params) => {
      this.token = this.cryptor.decryptUrlParam(params['token']);
      // split string
      const parts: Array<string> = this.token.split('_');
      console.log(parts);
      this.userId = +parts[0];
      this.location_id = +parts[1];
      this.configId = +parts[2];
      this.notification_token_id = +parts[3];

    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() {

  }
  confirmPrimaryQuestion() {
    this.state = 1;
    this.responses.push({
      question: 'Do you still hold the role to the appointed location',
      ans: this.primaryQuestionField.value
    });

    console.log(this.responses);

  }

  private sendResponseToNotifcation() {
    const myAns = JSON.stringify(this.responses);




  }

}
