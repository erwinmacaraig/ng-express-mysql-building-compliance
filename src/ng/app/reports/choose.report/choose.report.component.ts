
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
    // 0 means all locations
    public selectedLocationForTrainingReport = 0;
    public selectedLocationForTeamReport = 0;
    public selectedLocationForActivityLogReport = 0;
    public selectedLocationForPortfolioReport = 0;
    public selectedLocationForSummaryComplianceReport = 0;
    public rootLocationsFromDb = [];

    isFrp = false;
    isTrp = false;

    constructor(
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private reportService: ReportService,
        private encryptDecrypt: EncryptDecryptService
        ) {

        this.userData = this.authService.getUserData();
        let roles = this.userData['roles'];
        for(let ro of roles){
            if(ro.role_id == 1){
                this.isFrp = true;
            }else if(ro.role_id == 2){
                this.isTrp = true;
            }
        }

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

    ngOnInit(){
        

    }

    ngAfterViewInit(){
      $('select').material_select();
    }

    clickStatementOfComplianceReport(){
        let val = $('#statementOfCompliance').val();
        if(val == null){
            val = 0;
        }
        let locId = this.encryptDecrypt.encrypt(val);
        this.router.navigate(['/reports/statement-compliance', locId]);
    }

    clickSummaryOfComplianceReport(){
        let val = $('#summaryCompliance').val();
        if(val == null){
            val = 0;
        }

        let locId = this.encryptDecrypt.encrypt(val);
        this.router.navigate(['/reports/summary-of-compliance', locId]);
    }

    clickTrainingReport(){
        let val = $('#summaryTraining').val();
        if(val == null){
            val = 0;
        }
        let locId = this.encryptDecrypt.encrypt(val);
        this.router.navigate(['/reports/trainings', locId]);
    }

    activityLogReport(){
        let val = $('#summaryActivityLog').val();
        if(val == null){
            val = 0;
        }
        let locId = this.encryptDecrypt.encrypt(val);
        this.router.navigate(['/reports/activity-log/'+locId]);
    }

    public generateTeamReport() {
        this.selectedLocationForTeamReport = $('#summaryTeam')[0].value;
        console.log(`selected location is ${this.selectedLocationForTeamReport}`);
        const locIdEncrypted = this.encryptDecrypt.encrypt(this.selectedLocationForTeamReport);
        this.router.navigate(['/reports/teams', locIdEncrypted]);
    }

    ngOnDestroy(){
    }

}
