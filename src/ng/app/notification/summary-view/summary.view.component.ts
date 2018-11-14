import { Component, OnInit, OnDestroy, AfterViewInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Subscription } from 'rxjs/Subscription';
declare var $: any;
@Component({
    selector: 'app-notification-summary-view',
    templateUrl: './summary.view.component.html',
    styleUrls: ['./summary.view.component.css'],
    providers: [EncryptDecryptService]
})
export class SummaryViewComponent implements OnInit, OnDestroy, AfterViewInit {

    public buildingId = 0;
    public roleId = 0;
    public accountId = 0;
    private decryptedToken = '';
    private paramSub:Subscription;
    constructor(private route:ActivatedRoute, private cryptor:EncryptDecryptService) {}
    
    ngOnInit() {
        this.route.params.subscribe((urlParams) => {
            this.decryptedToken = this.cryptor.decryptUrlParam(urlParams['token']);
            // split string
            const parts: Array<string> = this.decryptedToken.split('_');
            console.log(parts);
            this.buildingId = +parts[2];
            this.roleId = +parts[3];


            // generate the list
            
        });
    }

    ngAfterViewInit() {}

    ngOnDestroy() {}
}