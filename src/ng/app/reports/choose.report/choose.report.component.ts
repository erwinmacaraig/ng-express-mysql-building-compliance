import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $ : any;

@Component({
    selector : 'app-choose-report-component',
    templateUrl : './choose.report.component.html',
    styleUrls : [ './choose.report.component.css' ],
    providers : [ ReportService, EncryptDecryptService ]
})

export class ChooseReportComponent implements OnInit, OnDestroy {

    userData = {};
    public rootLocationsFromDb = [];
    constructor(
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private reportService: ReportService,
        private encryptDecrypt: EncryptDecryptService
        ) {

        this.userData = this.authService.getUserData();

    }

    ngOnInit(){
        this.reportService.getParentLocationsForReporting().subscribe((response) => {
            console.log(response);
            this.rootLocationsFromDb = response['data'];
            setTimeout(() => {
                $('select').material_select();
            }, 200);
        }, (e) => {
            console.log(e);
        });

    }

    ngAfterViewInit(){
        $('select').material_select();
    }

    clickTrainingReport(){
        let val = $('#summaryTraining').val();
        if(val != null){
            let locId = this.encryptDecrypt.encrypt(val);
            this.router.navigate(['/reports/trainings', locId]);
        }
    }

    ngOnDestroy(){

    }

}
