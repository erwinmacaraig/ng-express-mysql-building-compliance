import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef  } from "@angular/core";
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Subscription } from 'rxjs/Subscription';
import { NgForm } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
import { MessageService } from '../../services/messaging.service';
import * as moment from 'moment';

declare var $: any;

@Component({
    selector: 'app-notified-warden',
    templateUrl: './notified-warden-list.component.html',
    styleUrls: ['./notified-warden-list.component.css'],
    providers: [UserService, EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, AuthService]
})

export class NotifiedWardenListComponent implements OnInit, AfterViewInit, OnDestroy {

    private myLocations = [];
    public wardenList = [];
    public validatedList = [];
    public myBuildings = [];
    public responders = 0;
    public receivers = 0;
    public showSummary = false;
    public allWarden = [];
    public accountMobilityImpaired = [];
    public emergencyMobilityImpaired = [];
    public showPEEPList = false;
    private messageSub:Subscription;
    private allPending = [];
    public inConfirmationProcess = false;
    
    loadingTable = false;
    showModalLoader = false;
    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    public selectedPeep = {};
    options: DatepickerOptions = {
      displayFormat: 'MMM D[,] YYYY',
      minDate: moment().toDate()
  };


    public emailSentHeading = '';
    public emailSendingStat = '';

    @ViewChild('formMobility') formMobility : NgForm;
    @ViewChild('durationDate') durationDate : ElementRef;

    constructor(private auth: AuthService,
        private messageService: MessageService,
        private userService: UserService,
        private preloader: DashboardPreloaderService,
        private accountService: AccountsDataProviderService
        ) {}

    ngOnInit() {
      if(this.auth.userDataItem('confirmation_process') && this.auth.userDataItem('confirmation_process') == true) {
        this.inConfirmationProcess = true;
      }
      this.messageSub =  this.messageService.getMessage().subscribe(message => {        
        if (message.showWardenSummary) {
          this.showSummary = true;
          this.showPEEPList = false;
        }
        if (message.showPEEPSummary) {
          this.showSummary = false;
          this.showPEEPList = true;
        }
      });
        // need to know what building I am building the list
        const roles: object[] = this.auth.userDataItem('roles');
        const checker = [];
        for (let r of roles) {
            if (r['role_id'] <= 2) {
                this.myLocations.push(r['location_id']);
            }
        }
        
        this.generateList();
        this.generateMobilityImpairedList();
        // other initialization
        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    }

    

    ngAfterViewInit() {

      $('.modal').modal({
        dismissible: false
      });
      $('#modalMobility select').material_select();

      $('#modalMobility select[name="is_permanent"]').off('change').on('change', () => {
        if($('#modalMobility select[name="is_permanent"]').val() == '1'){
            this.isShowDatepicker = false;
            $('#durationDate').prop('disabled', true);
            this.durationDate.nativeElement.value = "no date available";
            this.formMobility.controls.duration_date.disable();
        }else{
            this.durationDate.nativeElement.value = "";
            this.formMobility.controls.duration_date.markAsPristine();
            this.formMobility.controls.duration_date.enable();

            $('#durationDate').prop('disabled', false);
        }

        $('#modalMobility select[name="is_permanent"]').material_select();
    });

    }

    ngOnDestroy() {
      if (this.messageSub) {
        this.messageSub.unsubscribe();
      }
    }

    private generateList() {
        this.preloader.show();
        this.responders = 0;
        this.wardenList = [];
        this.validatedList = [];
        this.myBuildings = [];
        let wardenInformation = [];
        //build the team here
        this.userService.generateConfirmationWardenList({
            'assignedLocations': JSON.stringify(this.myLocations)
        }).subscribe((response) => {
            this.receivers = response.list.length;
            this.allWarden = response.list;
            for (let warden of response.list) {
              wardenInformation = [];
              if (warden['strStatus'] != 'Pending') {
                this.responders+= 1;
                } else if (warden['strStatus'] == 'Pending') {
                  this.allPending.push(warden['notification_token_id']);
                }
                if (warden['lastActionTaken'] != null) {
                    continue;
                }
                warden['jsonResponse'] = {};
                warden['additional_info'] = [];
                let queryResponse = {};
                if (warden['strResponse'] != null) {
                  try {
                    queryResponse = JSON.parse(warden['strResponse']);                    
                    warden['jsonResponse'] = queryResponse;
                    /*
                    if (queryResponse['nominated_person']) {
                      if (queryResponse['nominated_person'].length > 0) {
                        warden['showNominatedReviewButton'] = 1;
                      }
                    }
                    */
                    Object.keys(queryResponse).forEach((key) => {
                      switch(key) {
                        case 'new_building_location_name':
                            if (queryResponse['new_building_location_name'].length) { 
                              wardenInformation.push(`New building location: ${queryResponse['new_building_location_name']}`);                            
                            }                            
                        break;
                        case 'new_level_location_name':
                            if (queryResponse['new_level_location_name'].length) { 
                              wardenInformation.push(`New level location: ${queryResponse['new_level_location_name']}`);
                            }
                        break;
                        case 'nominated_person':
                            if (queryResponse['nominated_person'].length) {
                              wardenInformation.push(`Nominated person: ${queryResponse['nominated_person']}`);
                            }                            
                        break;
                        case 'nominated_person_email':
                            if(queryResponse['nominated_person_email'].length) {
                              wardenInformation.push(`Nominated person email: ${queryResponse['nominated_person_email']}`);
                            }
                        break;
                        case 'info':
                            if (queryResponse['info'].length) {
                              wardenInformation.push(`Additional info: ${queryResponse['info']}`);
                            }
                        break;

                      }
                    });
                    warden['additional_info'] = wardenInformation;

                  } catch(e) {
                    console.log(e);
                    warden['jsonResponse']['reason'] = '';
                    warden['additional_info'] = [];
                  }
                    

                } else {
                    warden['showNominatedReviewButton'] = 0;
                }
                switch(warden['strStatus']) {
                  case 'Pending':
                      warden['statusText'] = 'No Response';
                  break;
                  case 'Validated':
                      warden['statusText'] = 'Confirmed';
                  break;
                  default:
                      warden['statusText'] = warden['strStatus'];
                }

                if (warden['strStatus'] == 'Validated'){
                  this.validatedList.push(warden);
                } else {
                  this.wardenList.push(warden);
                }
            }
            this.myBuildings = response.building;
            this.preloader.hide(); this.generateSummary();
        },
        (error) => {
            console.log(error);
            this.preloader.hide();
        });
    }

    public acceptResignation(user = 0, location = 0, cfg = 0) {
      this.preloader.show();
      this.accountService.acceptResignationFromConfirmation(user, location, cfg).subscribe((response) => {
        this.generateList();
      }, (error) => {
        this.preloader.hide();
      });


    }

    public rejectResignation(user = 0, location = 0, cfg = 0) {
      this.preloader.show();
      this.accountService.rejectResignationFromConfirmation(user, location, cfg).subscribe((response) => {
        this.generateList();
      }, (error) => {
        this.preloader.hide();
      });
    }

    public generateSummary() {
      let wardenInformation = [];
      
      for (let warden of this.allWarden) {
      
        if (warden['lastActionTaken'] != null) {
          wardenInformation = [];
          let actionTakenByTrpObj = JSON.parse(warden['lastActionTaken']);
          warden['actionTakenByTrp'] = actionTakenByTrpObj['action'];
          console.log(warden['actionTakenByTrp']);
        }
        warden['additional_info'] = [];
        let queryResponse = {};
        if (warden['strResponse'] != null) {
          try {
            queryResponse = JSON.parse(warden['strResponse']);         
            warden['jsonResponse'] = queryResponse;
            Object.keys(queryResponse).forEach((key) => {
              switch(key) {
                case 'new_building_location_name':
                    if (queryResponse['new_building_location_name'].length) { 
                      wardenInformation.push(`New building location: ${queryResponse['new_building_location_name']}`);                            
                    }                            
                break;
                case 'new_level_location_name':
                    if (queryResponse['new_level_location_name'].length) { 
                      wardenInformation.push(`New level location: ${queryResponse['new_level_location_name']}`);
                    }
                break;
                case 'nominated_person':
                    if (queryResponse['nominated_person'].length) {
                      wardenInformation.push(`Nominated person: ${queryResponse['nominated_person']}`);
                    }                            
                break;
                case 'nominated_person_email':
                    if(queryResponse['nominated_person_email'].length) {
                      wardenInformation.push(`Nominated person email: ${queryResponse['nominated_person_email']}`);
                    }
                break;
                case 'info':
                    if (queryResponse['info'].length) {
                      wardenInformation.push(`Additional info: ${queryResponse['info']}`);
                    }
                break;

              }
            });
            warden['additional_info'] = wardenInformation;
            wardenInformation = [];
          } catch(e) {
            console.log(e);
            warden['jsonResponse']['reason'] = '';
            warden['additional_info'] = [];
          }
        }
        switch(warden['strStatus']) {
          case 'Pending':
              warden['statusText'] = 'No Response';
          break;
          case 'Validated':
              warden['statusText'] = 'Confirmed';
          break;
          default:
              warden['statusText'] = warden['strStatus'];
        }
      }
    }

    private generateMobilityImpairedList() {
      this.accountMobilityImpaired = [];
      this.emergencyMobilityImpaired = [];
      this.accountService.listPeepForConfirmation(JSON.stringify(this.myLocations)).subscribe((response) => {
        this.accountMobilityImpaired = response.account_users;
        this.emergencyMobilityImpaired = response.emergency_users; 
        for (let peep of this.emergencyMobilityImpaired) {
          if (peep['mobility_impaired_details_id'] != null) {
            if (peep['expiry'] == 'expired' && peep['is_permanent'] == 0) {
              peep['status'] = 'Expired';
            } else if (peep['is_permanent'] == 1) {
              peep['status'] = 'Permanent';
            } else if (peep['expiry'] == 'active' && peep['is_permanent'] == 0) {
              peep['status'] = 'Temporary';
            }            
          } else {
            peep['status'] = '';
          }
        }       
      }, (error) => {
        console.log(error);
        this.accountMobilityImpaired = [];
        this.emergencyMobilityImpaired = [];
      });

    }

    onChangeDatePicker(event){
      if(!moment(this.datepickerModel).isValid()){
          this.datepickerModel = new Date();
          this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
      }else{
          this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
      }
      this.isShowDatepicker = false;
  }

  showDatePicker(){
      this.isShowDatepicker = true;
  }
  
  clickCompletePeepInfo(peep){
    $('#modalMobility').modal('open');
    this.selectedPeep = peep;
    console.log(this.selectedPeep);
    this.formMobility.reset();

    $('#modalMobility select').material_select('update');
  }

  clickShowPeepInfo(peep) {
    $('#modalMobility select[name="is_permanent"]').val('0').trigger('change');
    this.datepickerModelFormatted = 'no date available';
    for(let i in peep){
      if( this.formMobility.controls[i] && i != 'duration_date' ){
          this.formMobility.controls[i].setValue(peep[i]);
      }
    }
    $('#modalMobility select[name="is_permanent"]').val(peep['is_permanent']);
    if(peep['is_permanent'] == 0){
      this.datepickerModel = moment(peep['duration_date']).toDate();
      this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
    }else{
        $('#modalMobility select[name="is_permanent"]').val('1').trigger('change');
    }
    this.selectedPeep = peep;
    console.log(this.selectedPeep);
    $('#modalMobility').modal('open');

  }



  modalPeepFormSubmit(f, event){
    event.preventDefault();
    

    if(f.valid){
        this.loadingTable = true;
        let paramData = JSON.parse(JSON.stringify(f.value));
        paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
        paramData['user_id'] = this.selectedPeep['user_id'];

        if(this.selectedPeep['mobility_impaired_details_id'] != null){
            paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details_id'];
        }

        paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

        this.showModalLoader = true;

        this.userService.sendMobilityImpaireInformation(paramData, (response) => {
          this.generateMobilityImpairedList();
            f.reset();
            $('#modalMobility').modal('close');
            this.showModalLoader = false;
            this.loadingTable = false; 
        });
    }
  }
  resendNotificationToUser(notificationId=0) {
    this.preloader.show();
    this.accountService.execNotificationAction('resend', notificationId).subscribe((response) => {
      this.emailSentHeading = 'Success!';
      this.emailSendingStat = 'Notification sent successfully.';
      this.preloader.hide();
      setTimeout(() => {
        $('#modal-email-confirmation').modal('open');
    }, 300);
      console.log(response);
    }, (error) => {
      this.preloader.hide();
      this.emailSentHeading = 'Fail!';
      this.emailSendingStat = 'Error sending email. Try again later.';
      setTimeout(() => {
        $('#modal-email-confirmation').modal('open');
    }, 300);
      console.log(error);
    });
  }

  public resendToAllPending() {
    this.preloader.show();
    this.accountService.execNotificationAction('resend-bulk', JSON.stringify(this.allPending)).subscribe((response) => {
      this.emailSentHeading = 'Success!';
      this.emailSendingStat = 'Notification sent successfully.';
      this.preloader.hide();
      setTimeout(() => {
        $('#modal-email-confirmation').modal('open');
    }, 300);
      console.log(response);
    }, (error) => {
      this.preloader.hide();
      this.emailSentHeading = 'Fail!';
      this.emailSendingStat = 'Error sending email. Try again later.';
      setTimeout(() => {
        $('#modal-email-confirmation').modal('open');
    }, 300);
      console.log(error);
    });
  }

  showSummaryInThisPage() {
    this.showSummary = true;
    this.showPEEPList = false;
    console.log(this.showSummary);
  }
  showWardenListInThisPage() {
    this.showPEEPList = false;
    this.showSummary = false;
  }
    

}
