import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../../services/admin.service';

declare var $:any;
@Component({
    selector: 'app-list-reward-config',
    templateUrl: './list-reward-config.component.html',
    styleUrls: ['./list-reward-config.component.css'],
    providers: [AdminService]
})

export class ListRewardConfigComponent implements OnInit, AfterViewInit, OnDestroy {

    public configurations = [];
    public users = [];
    constructor(private adminService: AdminService) {

    }

    ngOnInit() {
        this.adminService.listRewardConfig().subscribe((response) => {
            this.configurations = response['data'];
        });

    }

    ngAfterViewInit() {
        this.jquery_code();

    }

    ngOnDestroy() {

    }

    public listRewardCandidate(id = 0) {
       this.adminService.listProgramRewardees(id).subscribe((response) => {
           this.users = response['data'];
           console.log(this.users);
           $('.modal').modal('open');
       }); 
    }

    private jquery_code() {
        $(document).ready(function(){           
            $('.modal').modal({ dismissible: true });
            
        });
    }
}
