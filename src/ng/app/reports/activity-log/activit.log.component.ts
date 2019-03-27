import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ViewChildren, ElementRef } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ExportToCSV } from '../../services/export.to.csv';
import html2canvas from 'html2canvas';
// import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import { PrintService } from '../../services/print.service';

declare var $ : any;
// declare var jsPDF: any;

@Component({
	selector : 'app-activity-log-compliance-component',
	templateUrl : './activit.log.component.html',
	styleUrls : [ './activit.log.component.css' ],
	providers : [ AuthService, MessageService, EncryptDecryptService, DashboardPreloaderService, ReportService, ExportToCSV ]
})

export class ReportsActivityLogComponent implements OnInit, OnDestroy {
    @ViewChild('printContainer') printContainer : ElementRef;
	userData:any = {};
    locationId = 0;
    accountId = 0;
    activityLogs = [];
    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 50,
        offset : 0,
        location_id : 0,
        account_id : 0
    };
    totalCountResult = 0;

    routerSubs;

    loadingTable = false;

    pdfLoader = false;
    csvLoader = false;
    exportFetchMarker = {};
    exportData = [];

    print:any;
    subscriptionType = 'free';

	constructor(
		private router : ActivatedRoute,
		private authService : AuthService,
		private messageService : MessageService,
        private encDecService : EncryptDecryptService,
        private dashboardService : DashboardPreloaderService,
        private reportService : ReportService,
        private exportToCSV : ExportToCSV
		) {

        this.userData = this.authService.getUserData();
        this.subscriptionType = this.userData['subscription']['subscriptionType'];
       
	}

	ngOnInit(){
        this.dashboardService.show();

        this.routerSubs = this.router.params.subscribe((params) => {
            this.locationId = this.encDecService.decrypt( params.location );

            console.log('params', params);

            if(params['accountId']){
                this.accountId = this.encDecService.decrypt( params.accountId );
                this.queries.account_id = this.accountId;
            }

            this.queries.location_id = this.locationId;
            this.getActivityReport((response:any) => {
                if(this.pagination.pages > 0){
                    this.pagination.currentPage = 1;
                    this.pagination.prevPage = 1;
                }
                this.activityLogs = response.data;
                this.dashboardService.hide();

                // this.generateReportDataForExport();
            });

        });
	}

	ngAfterViewInit(){
        $('.pagination select').material_select('destroy');

        this.print = new PrintService({
            content : this.printContainer.nativeElement.outerHTML
        });
    }

    generateReportDataForExport(){

        this.pdfLoader = true;
        this.csvLoader = true;


        let
        divider = 150,
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

            this.getActivityReport((response:any) => {


                this.exportFetchMarker[i] = response.data;
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

    getActivityReport(callBack, forExport?){
        this.reportService.getActivityReport(this.queries).subscribe((response:any) => {
            if(!forExport){
                for(let log of response.data){
                    log['location_id'] = this.encDecService.encrypt(log['building_id']);
                }
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;

                this.pagination.selection = [];
                for(let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }

                this.totalCountResult = this.pagination.total;
            }
            callBack(response);
        });
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
            this.pagination.prevPage = parseInt(type);
            let offset = (this.pagination.currentPage * this.queries.limit) - this.queries.limit;
            this.queries.offset = offset;
            this.queries.limit = 50;
            this.loadingTable = true;
            this.getActivityReport((response:any) => {
                this.activityLogs = response.data;
                this.loadingTable = false;
            });
        }
    }

    printResult(){
        /*
        let headerHtml = `<h5> Activity Log </h5>`;

        $('#printContainer').printThis({
            importCSS: true,
            importStyle: true,
            loadCSS: [ "/assets/css/materialize.css" ],
            header : headerHtml
        });
        */
       
        

        this.print.print(document.getElementById('printContainer').innerHTML);
    }

    pdfExport(aPdf, printContainer){

        let a = document.createElement("a"),
        accntId = (this.accountId) ? this.accountId : this.userData["accountId"],
        isAdmin = (this.userData.evac_role.toLowerCase() == 'admin') ? true : false;

        a.href = location.origin+"/reports/pdf-activity-report/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+isAdmin;
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();
    }

    csvExport(){
        let a = document.createElement("a"),
        accntId = (this.accountId) ? this.accountId : this.userData["accountId"],
        isAdmin = (this.userData.evac_role.toLowerCase() == 'admin') ? true : false;

        a.href = location.origin+"/reports/csv-activity-report/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+isAdmin;
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();

        /*let csvData = {},
            columns = [  "Locations", "File Name", "Date" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        let title =  "Activity Log ";
        */
        /*if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }*/
        /*
        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        if(this.exportData.length == 0){
            csvData[ getLength() ] = [ "No record found" ];
        }else{

            for(let log of this.exportData){
                let locName = (log.parent_name.length > 0) ? log.parent_name + ' - ' : '' ;

                locName += log.location_name;

                csvData[ getLength() ] = [ locName, log.file_name, log.timestamp_formatted ];
            }

        }

        this.exportToCSV.setData(csvData, 'activity-log-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();*/
    }

	ngOnDestroy(){

	}

}
