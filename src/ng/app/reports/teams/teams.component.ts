import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ReportService } from '../../services/report.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ExportToCSV } from '../../services/export.to.csv';
import html2canvas from 'html2canvas';
// import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import { PrintService } from '../../services/print.service';

declare var $: any;
declare var jsPDF: any;

@Component({
    selector : 'app-teams-compliance-component',
    templateUrl : './teams.component.html',
    styleUrls : [ './teams.component.css' ],
    providers : [ ReportService, EncryptDecryptService, DashboardPreloaderService, ExportToCSV ]
})

export class ReportsTeamsComponent implements OnInit, OnDestroy {
    @ViewChild('printContainer') printContainer : ElementRef;
    userData = {};
    reportData = [];
    private sub: any;
    public locationIdDecrypted;
    rootLocationsFromDb = [];

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 10,
        offset : 0,
        location_id : 0,
        account_id : 0
    };
    totalCountResult = 0;

    pdfLoader = false;
    csvLoader = false;
    exportData = [];
    exportFetchMarker = {};

    accountId = 0;

    constructor (
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private encryptDecrypt: EncryptDecryptService,
        private reportService: ReportService,
        private dashboardPreloader : DashboardPreloaderService,
        private exportToCSV : ExportToCSV
        ) {

        this.userData = this.authService.getUserData();

    }

    getTeamReport(callBack, forExport?) {

        this.queries.location_id = this.locationIdDecrypted;
        this.reportService.generateTeamReportingOnLocation(this.queries)
        .subscribe((response:any) => {
            if(!forExport){
                this.reportData = response['data'];

                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;

                this.pagination.selection = [];
                for(let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }
            }

            callBack(response);
        }, (e) => {
            this.dashboardPreloader.hide();
            console.log(e);
        });
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.dashboardPreloader.show();
            this.locationIdDecrypted = this.encryptDecrypt.decrypt(params['location']);
            console.log(`Decrypted location id ${this.locationIdDecrypted}`);

            if(params['accountId']){
                this.accountId = this.encryptDecrypt.decrypt( params.accountId );
                this.queries.account_id = this.accountId;
            }

            this.reportData = [];
            this.getTeamReport((response:any) => {
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }

                this.totalCountResult = response.pagination.total;

                this.dashboardPreloader.hide();

                this.generateReportDataForExport();
            });
        });

        this.reportService.getParentLocationsForReporting().subscribe((response) => {
            console.log(response);
            this.rootLocationsFromDb = response['data'];
        }, (e) => {
            console.log(e);
        });
    }

    generateReportDataForExport(){

        this.pdfLoader = true;
        this.csvLoader = true;


        let
        divider = 50,
        divRes = this.pagination.total / divider,
        divResString = divRes.toString(),
        remainderSplit = divResString.split('.'),
        remainder = (remainderSplit[1]) ? parseInt(remainderSplit[1]) : 0;

        divRes = (remainder > 0) ? divRes + 1 : divRes;

        for(let i = 1; i<=divRes; i++){
            let offset = (i * divider) - divider;
            this.queries.offset = (offset > 0) ? offset - 1 : 0;
            this.queries.limit = divider;

            this.exportFetchMarker[i] = false;

            this.getTeamReport((response:any) => {

                this.exportFetchMarker[i] = response['data'];
                let allLoaded = true;
                for(let x in this.exportFetchMarker){
                    if(!this.exportFetchMarker[x]){
                        allLoaded = false;
                    }
                }

                if(allLoaded){

                    for(let x in this.exportFetchMarker){
                        this.exportData = this.exportData.concat( this.exportFetchMarker[x] );
                    }

                    this.pdfLoader = false;
                    this.csvLoader = false;
                }

            }, true);

            this.queries.offset = 0;
            this.queries.limit = 10;

        }
    }

    ngAfterViewInit(){
        // this.dashboardPreloader.show();
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

    printResult(printContainer){
      /*
        let headerHtml = `<h5> Team Report </h5>`;

        $(printContainer).printThis({
            importCSS: true,
            importStyle: true,
            loadCSS: [ "/assets/css/materialize.css" ],
            header : headerHtml
        });
        */
       
       let print = new PrintService({
            content : this.printContainer.nativeElement.outerHTML
        });

        print.print();
    }

    pdfExport(printContainer){
        let a = document.createElement("a");
        a.href = location.origin+"/reports/pdf-team/"+this.locationIdDecrypted+"/"+this.totalCountResult+"/"+this.userData["accountId"]+"/"+this.userData["userId"];
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();
    }

    csvExport(){
        let csvData = {},
            columns = [  "Company", "Sub Location", "Contact Person", "Email", "Warden", "P.E.E.P" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        let title =  "Teams Report ";
        if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }

        csvData[ getLength() ] = [title];

        for(let report of this.exportData){

            let locName = (report.location.parent.name.length > 0) ? report.location.parent.name+' - ' : '';
            locName += report.location.name + ' Current Team Information ';
            csvData[ getLength() ] = [locName];
            csvData[ getLength() ] = columns;

            if( report.data.length == 0 ){
                csvData[ getLength() ] = ["No record found"];
            }else{

                for(let field of report.data){
                    let d = [],
                        comp = '',
                        trps = '',
                        emails = '';

                    for(let i in field['trp']){
                        let accname = field['trp'][i]['account_name'];
                        if(parseInt(i) != field['trp'].length - 1){
                            accname += ' | ';
                        }
                        comp += accname;
                    }

                    d.push(comp);
                    d.push( field['name'] );

                    for(let i in field['trp']){
                        let names = field['trp'][i]['first_name']+' '+field['trp'][i]['last_name'];
                        if(field['trp'][i]['mobile_number'].length > 0){
                            names += ' ('+field['trp'][i]['mobile_number']+') ';
                        }
                        if(parseInt(i) != field['trp'].length - 1){
                            names += ' | ';
                        }
                        trps += names;
                    }
                    d.push(trps);

                    for(let i in field['trp']){
                        let e = field['trp'][i]['email'];
                        if(parseInt(i) != field['trp'].length - 1){
                            e += ' | ';
                        }
                        emails += e;
                    }
                    d.push(emails);
                    d.push( field['total_wardens'] );
                    d.push( field['peep_total'] );

                    csvData[ getLength() ] = d;
                }

                let lastRow = [];
                for(let i in columns){
                    if( parseInt(i) == (columns.length - 1) ){
                        lastRow.push('Total no. of wardens : '+report.total_warden);
                    }else{
                        lastRow.push('');
                    }
                }

                csvData[ getLength() ] = lastRow;
            }
            csvData[ getLength() ] = [];
            csvData[ getLength() ] = [];
        }

        this.exportToCSV.setData(csvData, 'teams-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

    ngOnDestroy(){

    }

}
