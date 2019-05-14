import { Component } from "@angular/core";
import { OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/users';
import { Subscription } from 'rxjs/Subscription';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;

@Component({
    selector: 'app-stay-go',
    templateUrl: './stay_go.component.html',
    styleUrls: ['./stay_go.component.css'],
    providers: [UserService, DashboardPreloaderService]
})
export class StayAndGoComponent implements OnInit, AfterViewInit, OnDestroy {

    private mySub:Subscription;
    public emailSentHeading = 'Success!';
    public emailSendingStat = 'Email sent successfully';
    constructor(private route: ActivatedRoute, private userService: UserService, private preloader: DashboardPreloaderService) {

    }
    
    ngOnInit() {
        $('.modal').modal({
            dismissible: false,
            endingTop: '25%',
            opacity: 0.7
        });

    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {
        if (this.mySub) {
            this.mySub.unsubscribe();
        }
    }

    emailInfoGraphic() {
        this.preloader.show();
        this.mySub = this.userService.sendInfoGraphic().subscribe((response) => {
            this.preloader.hide();
            setTimeout(() => {
                $('#modal-email-confirmation').modal('open');
            }, 300);
            
        }, (error) => {
            this.emailSentHeading = 'Fail!';
            this.emailSendingStat = 'Error sending email. Try again later.';
            this.preloader.hide();
            setTimeout(() => {
                $('#modal-email-confirmation').modal('open');
            }, 300);
        });
    }

}