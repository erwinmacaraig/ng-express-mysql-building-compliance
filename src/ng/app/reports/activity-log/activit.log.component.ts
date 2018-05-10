import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ExportToCSV } from '../../services/export.to.csv';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';

declare var $ : any;

@Component({
	selector : 'app-activity-log-compliance-component',
	templateUrl : './activit.log.component.html',
	styleUrls : [ './activit.log.component.css' ],
	providers : [ AuthService, MessageService, EncryptDecryptService, DashboardPreloaderService, ReportService, ExportToCSV ]
})

export class ReportsActivityLogComponent implements OnInit, OnDestroy {
	
	userData = {};
    locationId = 0;
    activityLogs = [];
    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 50,
        offset : 0,
        location_id : 0
    };

    routerSubs;

    loadingTable = false;

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

	}

	ngOnInit(){
        this.dashboardService.show();

        this.routerSubs = this.router.params.subscribe((params) => {
            this.locationId = this.encDecService.decrypt( params.location );

            
            this.queries.location_id = this.locationId;
            this.getActivityReport((response:any) => {
                if(this.pagination.pages > 0){
                    this.pagination.currentPage = 1;
                    this.pagination.prevPage = 1;
                }
                this.activityLogs = response.data;
                this.dashboardService.hide();
            });

        });
	}

	ngAfterViewInit(){
        $('.pagination select').material_select('destroy');
    }

    getActivityReport(callBack){
        this.reportService.getActivityReport(this.queries).subscribe((response:any) => {
            for(let log of response.data){
                log['location_id'] = this.encDecService.encrypt(log['building_id']);
            }
            this.pagination.pages = response.pagination.pages;
            this.pagination.total = response.pagination.total;

            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
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
            this.loadingTable = true;
            this.getActivityReport((response:any) => {
                this.activityLogs = response.data;
                this.loadingTable = false;
            });
        }
    }

    printResult(){

        let headerHtml = `<h5> Activity Log </h5>`;

        $('#printContainer').printThis({
            importCSS: true,
            importStyle: true,
            loadCSS: [ "/assets/css/materialize.css" ],
            header : headerHtml
        });
    }

    pdfExport(aPdf, printContainer){
        let 
            $printContainer = $(printContainer).clone(),
            $titleClone = $('<h5>Activity Log</h5>'),
            aPdfHTML = aPdf.innerHTML;

        $titleClone.append(' (pg. '+this.pagination.currentPage+')');
        $titleClone.insertBefore($printContainer.find('table'));

        let trLen = $printContainer.find('tr').length,
            trHeight = 100;

        for(let i = 1; i<=(this.queries.limit - trLen); i++){
            $('<div style="height:'+trHeight+'px; width:100%;"> </div>').insertAfter( $printContainer.find('table') );
        }

        $('#cloneContainer').html($printContainer);

        html2canvas($('#cloneContainer')[0]).then(function(canvas) {
            let 
            pdf = new jsPDF("p", "mm", "a4"),
            imgData = canvas.toDataURL('image/jpeg', 1.0);

            $('#canvasContainer').html(canvas);
            pdf.addImage(imgData, 'JPG', 10, 5, 150, 285 );
            pdf.save('activity-log-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');

            $('#cloneContainer').html('');

        });
    }

    csvExport(){
        let csvData = {},
            columns = [  "Locations", "File Name", "Date" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        let title =  "Activity Log ";
        if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }

        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        if(this.activityLogs.length == 0){
            csvData[ getLength() ] = [ "No record found" ];
        }else{

            for(let log of this.activityLogs){
                let locName = (log.parent_name.length > 0) ? log.parent_name + ' - ' : '' ;
                
                locName += log.location_name;

                csvData[ getLength() ] = [ locName, log.file_name, log.timestamp_formatted ];
            }

        }

        this.exportToCSV.setData(csvData, 'activity-log-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

	ngOnDestroy(){

	}

}