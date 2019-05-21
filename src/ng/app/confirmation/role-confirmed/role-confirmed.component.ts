import { Component, OnInit, OnDestroy, AfterViewInit, Input } from "@angular/core";
import { Subscription } from 'rxjs/Subscription';
import { Router } from '@angular/router';
import { MessageService } from '../../services/messaging.service';
import { AuthService } from '../../services/auth.service';

declare var $: any;

@Component({
    selector: 'app-role-confirmation',
    templateUrl: './role-confirmed.component.html',
    styleUrls: ['./role-confirmed.component.css'],
    
})
export class RoleConfirmComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() step:number = 0;
    @Input() role: string = 'Warden';
    public locationUpdateSub: Subscription;
    public showLocationCtrlButton = true;
    public myName = '';
    constructor(
        private messageService: MessageService,
        private router: Router,
        private authService: AuthService
        ) {

    }

    ngOnInit() {

        this.myName = this.authService.userDataItem('name');

        this.locationUpdateSub = this.messageService.getMessage().subscribe(message => {
            if (message.location_updated) {
                this.showLocationCtrlButton = true;
            }
        });

        $('.modal').modal({
            dismissible: false,
            endingTop: '25%',
            opacity: 0.7
        });
        
        if (this.step == 0) {
            setTimeout(() => {
                $('#modal-welcome-confirmation').modal('open');
            }, 300);            
        }
           
        
    }

    ngAfterViewInit() {
        
    }

    ngOnDestroy() {
        if (this.locationUpdateSub) {
            this.locationUpdateSub.unsubscribe();
        }
        this.step = -1;

    }

    sendEditMessage() {        
        this.messageService.sendMessage({'edit_person_info': true});
    }
    
    sendShowWardenActionSummaryList() {        
        try {
            this.messageService.sendMessage({'showWardenSummary': true});
            this.step = 4;            
        } catch(e) {
            console.log(e);
        }
        
    }
    sendShowPeepSummaryList() {
        try {
            this.messageService.sendMessage({'showPEEPSummary': true});
            this.step = 5;                       
        } catch(e) {
            console.log(e);
        }
    }

    gotoTeamWardenList() {        
        this.router.navigate(['/teams', 'list-wardens']);
    }

}