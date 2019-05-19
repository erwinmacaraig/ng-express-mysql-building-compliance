import { Component, OnInit, AfterViewInit, OnDestroy  } from "@angular/core";
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/users';
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
    constructor(private auth: AuthService,
        private userService: UserService,
        private preloader: DashboardPreloaderService,
        private accountService: AccountsDataProviderService
        ) {}

    ngOnInit() {
        // need to know what building I am building the list
        const roles: object[] = this.auth.userDataItem('roles');
        const checker = [];
        for (let r of roles) {
            if (r['role_id'] <= 2) {
                this.myLocations.push(r['location_id']);
            }
        }
        this.generateList();
    }

    ngAfterViewInit() {}

    ngOnDestroy() {}

    private generateList() {
        this.preloader.show();
        this.responders = 0;
        this.wardenList = [];
        this.validatedList = [];
        this.myBuildings = [];
        //build the team here
        this.userService.generateConfirmationWardenList({
            'assignedLocations': JSON.stringify(this.myLocations)
        }).subscribe((response) => {
            this.receivers = response.list.length;
            for (let warden of response.list) {
                if (warden['lastActionTaken'] != null) {
                    continue;
                }

                let queryResponse = {};
                if (warden['strStatus'] != 'Pending') {
                    this.responders+= 1;
                }
                if (warden['strResponse'].length > 1) {
                    queryResponse = JSON.parse(warden['strResponse']);

                    console.log(JSON.parse(warden['strResponse']));
                    console.log(queryResponse);
                    warden['jsonResponse'] = queryResponse;
                    if (queryResponse['nominated_person']) {
                      if (queryResponse['nominated_person'].length > 0) {
                        warden['showNominatedReviewButton'] = 1;
                      }

                    }

                } else {
                    warden['showNominatedReviewButton'] = 0;
                }

                if (warden['strStatus'] == 'Validated'){
                  this.validatedList.push(warden);
                } else {
                  this.wardenList.push(warden);
                }
            }
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

}
