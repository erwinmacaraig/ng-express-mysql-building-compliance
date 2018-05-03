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

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 2,
        offset : 0,
        location_id : 0
    };

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

    getTeamReport(callBack) {

        this.queries.location_id = this.locationIdDecrypted;
        this.reportService.generateTeamReportingOnLocation(this.queries)
        .subscribe((response:any) => {
            this.reportData = response['data'];

            this.pagination.pages = response.pagination.pages;
            this.pagination.total = response.pagination.total;

            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            callBack(response);
        }, (e) => {
            this.dashboardPreloader.hide();
            console.log(e);
        });
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.locationIdDecrypted = this.encryptDecrypt.decrypt(params['location']);
            console.log(`Decrypted location id ${this.locationIdDecrypted}`);

            this.reportData = [];
            this.getTeamReport((response:any) => {
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }

                this.dashboardPreloader.hide();
            });
        });

        this.reportService.getParentLocationsForReporting().subscribe((response) => {
            console.log(response);
            this.rootLocationsFromDb = response['data'];
        }, (e) => {
            console.log(e);
        });
    }

    ngAfterViewInit(){
        this.dashboardPreloader.show();
        /*$('select').material_select();
        $('#selectLocation').val(this.locationIdDecrypted).material_select('update');
        $('#selectLocation').off('change.selectlocation').on('change.selectlocation', () => {

            let selVal = $('#selectLocation').val(),
            encId = this.encryptDecrypt.encrypt( selVal );
            this.dashboardPreloader.show();
            this.router.navigate([ '/reports/teams/', encId]);
        });*/
    }

    pageChange(type){

        let changeDone = false;
        switch (type) {
            case "prev":
                if(this.pagination.currentPage > 1){
                    this.pagination.currentPage = this.pagination.currentPage - 1;
                    changeDone = true;
                }
                break;

            case "next":
                if(this.pagination.currentPage < this.pagination.pages){
                    this.pagination.currentPage = this.pagination.currentPage + 1;
                    changeDone = true;
                }
                break;
            
            default:
                if(this.pagination.prevPage != parseInt(type)){
                    this.pagination.currentPage = parseInt(type);
                    changeDone = true;
                }
                break;
        }

        if(changeDone){
            this.dashboardPreloader.show();
            this.pagination.prevPage = parseInt(type);
            let offset = (this.pagination.currentPage * this.queries.limit) - this.queries.limit;
            this.queries.offset = offset;
            this.getTeamReport((response:any) => {
                this.dashboardPreloader.hide();
            });
        }
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
