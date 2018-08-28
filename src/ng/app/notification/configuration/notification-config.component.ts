import { AccountsDataProviderService } from './../../services/accounts';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare var $: any;
@Component({
    selector: 'app-notification-config',
    templateUrl: './notification-config.component.html',
    styleUrls: ['./notification-config.component.css'],
    providers: [ AccountsDataProviderService ]
})
export class NotificationConfigurationComponent implements OnInit, AfterViewInit, OnDestroy {
    public hasAccountRole = false;
    public notConfigFormGrp: FormGroup;
    public buildingId = 0;
    public searchBldgField: FormControl;
    public trp_user: FormControl;
    public all_users: FormControl;
    public messageField: FormControl;
    public frequency_field: FormControl;
    public eco_user: FormControl;
    private sub: Subscription;
    public defaultMessage = `

        Thank you again for your active participation and commitment to promote proactive safety within your building.

        Sincerely,
        The EvacConnect Engagement team
        Email: systems@evacgroup.com.au
        Phone: 1300 922 437

        * The TRP for a tenancy is the person responsible for ensuring that emergency planning is
        being managed in your tenancy. You receive these confirmation emails every 3 months to
        help us ensure that tenant and warden lists remain up to date.
    `;
    public buildingArray = [];
    isAdmin = false;
    userData = <any> {};

    constructor(private accountService: AccountsDataProviderService,
        private auth: AuthService,
        private router: Router) {}

    ngOnInit() {
        const role = this.auth.getHighestRankRole();
        this.userData = this.auth.getUserData();
        if(this.userData.evac_role == 'admin'){
            this.isAdmin = true;
        }else if (role <= 2) {
            this.hasAccountRole = true;
        } else {
            this.router.navigate(['']);
        }

        this.notConfigFormGrp = new FormGroup({
            all_users: new FormControl(false, null),
            eco_user: new FormControl(false, null),
            frequency_field: new FormControl(null, Validators.required),
            trp_user: new FormControl(false, null),
            messageField: new FormControl(this.defaultMessage, Validators.required)
        });
        this.searchBldgField = new FormControl();
        this.sub = this.buildingSearches();
        setTimeout(() => {
            $('.materialize-textarea').trigger('autoresize');
        }, 600);

    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    public buildingSearches(): Subscription {
        return this.searchBldgField.valueChanges.debounceTime(350).subscribe((val) => {
            if (val.length > 0) {
                this.buildingArray = [];
                this.accountService.searchForBuildings(val).subscribe((response) => {
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

        // console.log(JSON.stringify(values));
        this.accountService.createConfig(JSON.stringify(values)).subscribe((response) => {
            this.router.navigate(['/dashboard', 'notification-list']);
        });
    }

}
