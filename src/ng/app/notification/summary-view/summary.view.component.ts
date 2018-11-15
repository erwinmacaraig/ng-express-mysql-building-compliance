import { Component, OnInit, OnDestroy, AfterViewInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AccountsDataProviderService } from '../../services/accounts';
import { Subscription } from 'rxjs/Subscription';
declare var $: any;
@Component({
    selector: 'app-notification-summary-view',
    templateUrl: './summary.view.component.html',
    styleUrls: ['./summary.view.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService]
})
export class SummaryViewComponent implements OnInit, OnDestroy, AfterViewInit {

    public buildingId = 0;
    public roleId = 0;
    public accountId = 0;
    private decryptedToken = '';
    public hasNotSent = [];
    public hasResigend = [];
    public isPending = [];
    public isValidated = [];

    private paramSub:Subscription;
    public list = [];
    constructor(private route:ActivatedRoute, private cryptor:EncryptDecryptService,
        private accountService: AccountsDataProviderService) {}
    
    ngOnInit() {
        this.route.params.subscribe((urlParams) => {
            this.decryptedToken = this.cryptor.decryptUrlParam(urlParams['token']);
            // split string
            const parts: Array<string> = this.decryptedToken.split('_');
            console.log(parts);
            this.buildingId = +parts[2];
            this.roleId = +parts[3];            

            // generate the list of sublocations
            this.accountService.generateSummaryListItem(this.buildingId,this.roleId).subscribe(
                (response) => {
                    this.list = response['list'];
                    console.log(this.list);
                    for (let u of this.list) {
                        if (u['strStatus'] == null) {
                            this.hasNotSent.push(u);
                        } else if (u['strStatus'] == 'In Progress') {
                            this.isPending.push(u);
                        } else if (u['strStatus'] == 'Pending') {
                            this.isPending.push(u);
                        } else if (u['strStatus'] == 'Resigned') {
                            this.hasResigend.push(u);
                        } else if (u['strStatus'] == 'Validated') {
                            this.isValidated.push(u);
                        }
                    }
                }
            );
        });
    }

    ngAfterViewInit() {}

    ngOnDestroy() {}
}