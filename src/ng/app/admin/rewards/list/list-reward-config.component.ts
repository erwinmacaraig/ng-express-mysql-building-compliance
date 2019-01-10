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
    private toDeleteConfig = 0;
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
           $('#users').modal('open');
       }); 
    }

    private jquery_code() {
        $(document).ready(function(){           
            $('#users').modal({ dismissible: true });
            $('#delete-confirm').modal({dismissible: false});            
        });
    }

    public showConfirmation(toDeleteConfigId=0) {
        this.toDeleteConfig = toDeleteConfigId;
        console.log(this.toDeleteConfig);
        $('#delete-confirm').modal('open');
    }

    public cancelDelete() {
        this.toDeleteConfig = 0;
    }

    public confirmDelete() {
        this.adminService.deleteRewardProgramConfig(this.toDeleteConfig).subscribe((response) => {
            this.toDeleteConfig = 0;
            alert('Configuration Deleted.');

            this.ngOnInit();
        });
    }


}
