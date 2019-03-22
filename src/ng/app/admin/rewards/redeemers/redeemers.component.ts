import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { Subscription } from 'rxjs/Rx';
var $: any;

@Component({
    selector: 'app-admin-redeemers',
    templateUrl: './redeemers.component.html',
    styleUrls: ['./redeemers.component.css'],
    providers: [AdminService]
})

export class RedeemersComponent implements OnInit, AfterViewInit, OnDestroy {
    public rewardConfigId;
    public users = [];
    public configName = '';
    private paramSub: Subscription;
    constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router) {}

    ngOnInit() {
        this.paramSub =  this.route.paramMap.subscribe((paramMap: ParamMap) => {
            if (paramMap.has('programConfig')) {
                this.rewardConfigId = paramMap.get('programConfig');                
                this.adminService.listProgramRewardees(this.rewardConfigId).subscribe((response) => {
                    this.users = response['data'];
                    this.configName = response['configName'];
                }); 
            } else {
                this.router.navigate(['/admin', 'list-reward-configuration']);
            }
        });
    }

    ngAfterViewInit() {}

    ngOnDestroy() {
        this.paramSub.unsubscribe();
    }
}