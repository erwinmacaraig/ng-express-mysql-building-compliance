import {Component, OnInit, AfterViewInit,  OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs/Rx';

declare var $: any;

@Component({
    selector: 'app-notified-users',
    templateUrl: './notified-users-list.component.html',
    styleUrls: ['./notified-users-list.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService]
})
export class NotifiedUsersListComponent implements OnInit, AfterViewInit,  OnDestroy {
    public configId;
    userData = <any> {};
    public notifiedUsers: Array<object> = [];
    public hasAccountRole = false;
    isAdmin = false;
    public responseInfo = [];
    private paramSub: Subscription;

    constructor(private route: ActivatedRoute,
        private auth: AuthService,
        private router: Router,
        private cryptor: EncryptDecryptService,
        private accountService: AccountsDataProviderService,
        public dashboard: DashboardPreloaderService
        ) {
    }

    ngOnInit() {        
        const role = this.auth.getHighestRankRole();
        this.userData = this.auth.getUserData();
        if(this.userData.evac_role != 'admin'){
            this.router.navigate(['/signout']);
        }        
        this.paramSub =  this.route.params.subscribe((params) => {
            this.configId = this.cryptor.decrypt(params['config']);
            this.generateList();
        });
    }

    ngAfterViewInit() {
        $('select:not(.no-materialize)').material_select();
    }

    performNotificationAction(token) {
        console.log(`token_${token}`);
        console.log($(`#token_${token}`).val());

        const action = $(`#token_${token}`).val();
        this.accountService.execNotificationAction(action, token).subscribe((response) => {
            console.log(response);
            this.generateList();
        });



    }


    ngOnDestroy() {
        this.paramSub.unsubscribe();
    }

    private generateList() {
        this.dashboard.show();

        this.accountService.generateNotifiedUsersList(this.configId).subscribe((response) => {
            this.notifiedUsers = response['data'];
            for(let user of this.notifiedUsers) {
                user['additional_info'] = [];
                user['statusText'] = 'No Response';
                try {
                    let queryResponse = JSON.parse(user['strResponse']);
                    Object.keys(queryResponse).forEach((key) => {
                        switch(key) {
                            case 'reason':
                                user['additional_info'].push(`Main reason: ${queryResponse['reason']}`);
                            break;
                            case 'new_building_location_name':
                                if (queryResponse['new_building_location_name'].length) {
                                    user['additional_info'].push(`New building location: ${queryResponse['new_building_location_name']}`);                            
                                }                                    
                            break;
                            case 'new_level_location_name':
                                if (queryResponse['new_level_location_name'].length) {
                                    user['additional_info'].push(`New level location: ${queryResponse['new_level_location_name']}`);
                                }         
                            break;
                            case 'nominated_person':
                                if (queryResponse['nominated_person'].length) {
                                    user['additional_info'].push(`Nominated person: ${queryResponse['nominated_person']}`);
                                }                            
                            break;
                            case 'nominated_person_email':
                                if(queryResponse['nominated_person_email'].length) {
                                    user['additional_info'].push(`Nominated person email: ${queryResponse['nominated_person_email']}`);
                                }
                            break;
                            case 'info':
                                if (queryResponse['info'].length) {
                                    user['additional_info'].push(`Additional info: ${queryResponse['info']}`);
                                }
                            break;  
                        }
                      });

                } catch(e) {

                }
                switch(user['strStatus']) {
                    case 'Pending':
                        user['statusText'] = 'No Response';
                    break;
                    case 'Validated':
                        user['statusText'] = 'Confirmed';
                    break;
                    default:
                        user['statusText'] = user['strStatus'];
                }
            }
            this.dashboard.hide();
        }, (error) => {
            this.dashboard.hide();
        });
    }
}
