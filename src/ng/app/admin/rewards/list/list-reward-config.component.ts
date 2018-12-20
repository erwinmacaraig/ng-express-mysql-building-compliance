import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../../services/admin.service';

@Component({
    selector: 'app-list-reward-config',
    templateUrl: './list-reward-config.component.html',
    styleUrls: ['./list-reward-config.component.css'],
    providers: [AdminService]
})

export class ListRewardConfigComponent implements OnInit, AfterViewInit, OnDestroy {

    public configurations = [];
    constructor(private adminService: AdminService) {

    }

    ngOnInit() {
        this.adminService.listRewardConfig().subscribe((response) => {
            this.configurations = response['data'];
        });

    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {

    }
}
