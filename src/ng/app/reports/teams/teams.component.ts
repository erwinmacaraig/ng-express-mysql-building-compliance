import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ReportService } from '../../services/report.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $: any;

@Component({
    selector : 'app-teams-compliance-component',
    templateUrl : './teams.component.html',
    styleUrls : [ './teams.component.css' ],
    providers : [ ReportService, EncryptDecryptService, DashboardPreloaderService ]
})

export class ReportsTeamsComponent implements OnInit, OnDestroy {

    userData = {};
    reportData = [];
    private sub: any;
    public locationIdDecrypted;
    rootLocationsFromDb = [];

    constructor (
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private encryptDecrypt: EncryptDecryptService,
        private reportService: ReportService,
        private dashboardPreloader : DashboardPreloaderService
        ) {

        this.userData = this.authService.getUserData();

    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.locationIdDecrypted = this.encryptDecrypt.decrypt(params['location']);
            console.log(`Decrypted location id ${this.locationIdDecrypted}`);

            this.reportData = [];
            this.reportService.generateTeamReportingOnLocation(this.locationIdDecrypted)
            .subscribe((response) => {
                console.log(response);
                this.reportData = response['data'];

                this.dashboardPreloader.hide();
            }, (e) => {
                this.dashboardPreloader.hide();
                console.log(e);
            });
        });

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
        this.dashboardPreloader.show();
        $('select').material_select();
        $('#selectLocation').val(this.locationIdDecrypted).material_select('update');
        $('#selectLocation').off('change.selectlocation').on('change.selectlocation', () => {

            let selVal = $('#selectLocation').val(),
            encId = this.encryptDecrypt.encrypt( selVal );
            this.dashboardPreloader.show();
            this.router.navigate([ '/reports/teams/', encId]);
        });
    }

    printResult(report, printContainer){
        let locName = 'All Location';
        for(let loc of this.rootLocationsFromDb){
            if(loc['location_id'] == report.location.location_id){
                locName = loc.name;
            }
        }

        let headerHtml = `<h5> Team Report For `+locName+` </h5>`;

        $(printContainer).printThis({
            importCSS: true,
            importStyle: true,
            loadCSS: [ "/assets/css/materialize.css" ],
            header : headerHtml
        });
    }

    ngOnDestroy(){

    }

}
