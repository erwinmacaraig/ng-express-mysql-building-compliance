import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AccountsDataProviderService } from '../../services/accounts';
import { ExportToCSV } from '../../services/export.to.csv';
import * as Rx from 'rxjs/Rx';
import * as moment from 'moment';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
    templateUrl: './summary-changes.component.html',
    styleUrls: ['./summary-changes.component.css'],
    providers: [UserService, DashboardPreloaderService, AccountsDataProviderService, ExportToCSV]
})
export class SummaryOfChangesComponent implements OnInit, AfterViewInit, OnDestroy {
    
    private trpLocations = [];
    private frpLocations = [];
    private myWardenList = [];
    private myValidatedWardenList = [];
    public wardenList = [];
    public myBuildings = [];
    public validatedList = [];
    public allWarden = [];
    public emailSentHeading = '';
    public emailSendingStat = '';
    public total_records = 0;
    public showing_records = 0;
    public searchMemberInput;

    constructor(
        private auth: AuthService,
        private preloader: DashboardPreloaderService,
        private userService: UserService,
        private accountService: AccountsDataProviderService,
        private exportToCSV: ExportToCSV,
    ) {}

    ngOnInit() {
        // need to know what building I am building the list
        const roles: object[] = this.auth.userDataItem('roles');        
        for (let r of roles) {
            if (r['role_id'] == 2) {              
            this.trpLocations.push(r['location_id']);
            }
            if (r['role_id'] == 1) {
            this.frpLocations.push(r['location_id']);
            }
        }
        this.generateList();
    }

    ngAfterViewInit() {

        setTimeout(() => {
            $('.row.filter-container select.location').material_select('update');                
            $('.row.filter-container select').material_select();
        }, 500);

        $('.modal').modal({
            dismissible: false
        });

        this.searchMemberEvent();
        this.filterByLocation();
        
    }

    private generateList() {
        this.preloader.show();
        
        this.wardenList = [];
        this.validatedList = [];
        this.myBuildings = [];
        let wardenInformation = [];
        //build the team here
        this.userService.generateConfirmationWardenList({
            'trpLocations': JSON.stringify(this.trpLocations),
            'frpLocations': JSON.stringify(this.frpLocations),
            'assignedLocations': JSON.stringify(this.auth.userDataItem('buildings'))
        }).subscribe((response) => {
            console.log(response.list);
            this.allWarden = response.list; 
            this.myBuildings = response.building;           
            for (let warden of response.list) {
                wardenInformation = [];                
                warden['jsonResponse'] = {};
                warden['additional_info'] = [];
                let queryResponse = {};
                if (warden['lastActionTaken'] != null) {                    
                    let actionTakenByTrpObj = JSON.parse(warden['lastActionTaken']);
                    warden['actionTakenByTrp'] = actionTakenByTrpObj['action'];                    
                }

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
                  this.myValidatedWardenList.push(warden);
                } else {
                  this.wardenList.push(warden);
                  this.myWardenList.push(warden);
                }
            }
            this.updateShowRecordDisplay();
            this.myBuildings = response.building;            
            this.preloader.hide(); 
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

    private searchMemberEvent(){
        this.searchMemberInput = Rx.Observable.fromEvent(document.querySelector('#searchMemberInput'), 'input');
        this.searchMemberInput.debounceTime(800)
            .map(event => event.target.value)
            .subscribe((value) => {
                this.validatedList = [];
                this.wardenList = [];                
                if (value.length == 0) {
                    this.validatedList = this.myValidatedWardenList;
                    this.wardenList = this.myWardenList; 
                } else {
                    let searchKey = value.toLowerCase();
                    for (let user of this.myWardenList) {
                        let name = `${user['first_name'].toLowerCase()} ${user['last_name'].toLowerCase()}`;
                        if (name.search(searchKey) !== -1) {
                            this.wardenList.push(user);
                        }
                    }
                    for (let user of this.myValidatedWardenList) {
                        let name = `${user['first_name'].toLowerCase()} ${user['last_name'].toLowerCase()}`;
                        if (name.search(searchKey) !== -1) {
                            this.validatedList.push(user);
                        }
                    }
                }
                this.updateShowRecordDisplay();
            });
    }

    filterByLocation(){
        let self = this;
        $('#filter-location').change(function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('#filter-location').val();
            self.validatedList = [];
            self.wardenList = [];
            if(parseInt(selected, 10) == 0) {
                self.validatedList = self.myValidatedWardenList;
                self.wardenList = self.myWardenList;
            } else {
                for (let warden of self.myWardenList) {
                    if (warden['building_id'] == (parseInt(selected, 10))) {
                        self.wardenList.push(warden);                        
                    }
                }
                for (let warden of self.myValidatedWardenList) {
                    if (warden['building_id'] == (parseInt(selected, 10))) {
                        self.validatedList.push(warden);                        
                    }
                }
            }
            self.updateShowRecordDisplay();
        });    
    }


    private updateShowRecordDisplay() {
        this.total_records = this.myValidatedWardenList.length + this.myWardenList.length;
        this.showing_records = this.wardenList.length + this.validatedList.length;
    }

    public csvExport() {
        let 
        csvData = {},
        columns = ["Location", "Name", "Status", "Response", "Mobile", "Sublocation", "ECO Role", "Training", "Last Activity", "Required Action"],
        getLength = () => {
            return Object.keys(csvData).length;
        },
        title = "Summary of Changes List";
        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        const logs = [...this.wardenList, ...this.validatedList];
        if (logs.length == 0) {
            csvData[ getLength() ] = [ "No record found" ];
        } else {
            for (let log of logs) {
                const data = [];
                data.push(log['parent']);
                data.push(`${log['first_name']} ${log['last_name']}`);
                data.push(log['statusText']);
                if (log['jsonResponse']) {
                    let dref = `${log['jsonResponse']['reason']} `;
                    for (let info of log['additional_info']) {
                        dref += `${info} `;
                    }
                    data.push(dref);
                } else {
                    data.push('---');
                }
                if (log['mobile']) {
                    data.push(log['mobile']);
                } else {
                    data.push(" ");
                }
                
                data.push(log['name']);
                data.push(log['roles'].join(" "));
                data.push(log.training);
                data.push(moment(log['last_login']).format('DD/MM/YYYY'));
                let action = '';
                if (log['strStatus'] == 'Pending') {
                    action = 'Resend Notification';
                } else if (log['strStatus'] == 'Resigned' && log['lastActionTaken'] == null) {
                    action = 'Accept | Reject';
                } else if (log['lastActionTaken'] != null) {
                    action = `${log['actionTakenByTrp']}`;
                }
                data.push(action);
                csvData[ getLength() ] = data;
            }
        }
        
        this.exportToCSV.setData(csvData, 'summary-of-changes-' +moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();

    }

    ngOnDestroy() {}

}
