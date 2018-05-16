import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
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
declare var jsPDF: any;

@Component({
	selector : 'app-statement-compliance-component',
	templateUrl : './statement.compliance.component.html',
	styleUrls : [ './statement.compliance.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, ExportToCSV ]
})

export class ReportsLocationsStatementComplianceComponent implements OnInit, OnDestroy {
	
	userData = {};
	locationId = 0;

	reportData = <any>[];

	routeSubs;

    references = {

        '2' : 'AS 3745:2010 s.2.4',
        '3' : 'Qld Building Fire Safety Regulations & Best Practice',
        '4' : 'AS 3745:2010 s.3, s.4 & s.8',
        '5' : 'AS 3745:2010 s.3.5',
        '6' : 'AS 3745:2010 s.6.3 & s.6.5',
        '8' : 'AS 3745:2010 s.6.3 & s.6.5',
        '9' : 'AS 3745:2010 s.7',
        '12' : 'AS 3745:2010 s.6.3 & s.6.5'

    };

	constructor(
		private activatedRoute : ActivatedRoute,
		private authService : AuthService,
		private messageService : MessageService,
		private reportService : ReportService,
		private encryptDecrypt : EncryptDecryptService,
		private dashboardPreloader : DashboardPreloaderService,
        private exportToCSV : ExportToCSV
		) {

		this.userData = this.authService.getUserData();

		this.routeSubs = this.activatedRoute.params.subscribe((params) => {
			this.locationId = this.encryptDecrypt.decrypt( params.locationId );
			this.getStatementOfComplianceReport();
		});

	}

	ngOnInit(){ }

	ngAfterViewInit(){ }

	getStatementOfComplianceReport(){

		this.dashboardPreloader.show();
		this.reportService.getStatementOfCompliance(this.locationId).subscribe((response:any) => {

			this.reportData = response.data;

            for(let rp of this.reportData){
                let newkpis = [];
                for(let k of rp.kpis){
                    if(k.compliance_kpis_id != 13){
                        newkpis.push(k);
                    }
                }
                rp.kpis = newkpis;
            }

            for(let rp of this.reportData){
                for(let k of rp.kpis){
                    if(!k['compliance']){ k['compliance'] = {}; }
                    for(let c of rp.compliances){
                        if(c.compliance_kpis_id == k.compliance_kpis_id){
                            k['compliance'] = c;
                        }
                    }
                }
            }

			this.dashboardPreloader.hide();
		});
	}

	printResult(report, printContainer){

		let headerHtml = `<h5> Statement of Compliance Report </h5>`;

		$(printContainer).printThis({
			importCSS: true,
			importStyle: true,
			loadCSS: [ "/assets/css/materialize.css" ],
			header : headerHtml
		});
	}

    pdfExport(aPdf, printContainer){
        let
        columns = [
            {
                title : 'Compliance Requirement', dataKey : 'compreq'
            },
            {
                title : 'Legislative Reference', dataKey : 'legis'
            },
            {
                title : 'Activity Date', dataKey : 'activity'
            },
            {
                title : 'Status', dataKey : 'status'
            }
        ],
        pdf = new jsPDF("p", "pt"),
        topMargin = 40,
        count = 0;

        for(let report of this.reportData){
            let
            rows = [],
            locName = (report.location.parent.name.length > 0) ? report.location.parent.name + ' - ' : '' ;
            locName += report.location.name;

            pdf.setFontSize(12);
            if(count == 0){
                pdf.text(locName, 20, topMargin);
            }else{
                pdf.text(locName, 20, pdf.autoTable.previous.finalY + 60 );
            }

            for(let kpi of report.kpis){
                let actTxt = 'n/a',
                    statusTxt = 'Not Compliant';
                if(kpi.compliance.docs[0]){
                    actTxt = kpi.compliance.docs[0]['date_of_activity_formatted'];
                }

                if(kpi.compliance.valid == 1){
                    statusTxt = 'Compliant';
                }

                rows.push({
                    compreq : kpi.name,
                    legis : this.references[kpi.compliance_kpis_id],
                    activity : actTxt,
                    status : statusTxt
                });
            }

            let startYvalue = pdf.autoTable.previous.finalY + 70;
            if(count == 0){
                startYvalue = 50;
            }

            pdf.autoTable(columns, rows, {
                theme : 'grid',
                margin: 20,
                startY: startYvalue,
                styles : {
                    fontSize: 8,
                    overflow: 'linebreak'
                },
                headerStyles : {
                    fillColor: [50, 50, 50], textColor: 255
                },
                columnStyles : { location : { columnWidth : 140 } }
            });

            pdf.text( "Compliance Rating : "+report.compliance_rating , 20, pdf.autoTable.previous.finalY + 20);

            count++; 
        }

        let pages = pdf.internal.getNumberOfPages();
        for(let i=1; i<=pages; i++){
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.text('Downloaded from EvacServices : '+moment().format('DD/MM/YYYY hh:mmA'), (pdf.internal.pageSize.width / 2) + 80, pdf.internal.pageSize.height - 10 );
        }

        pdf.save('statement-of-compliance-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');
    }

    csvExport(){
        let csvData = {},
            columns = [  "Compliance Requirement", "Legislative Reference", "Activity Date", "Status"  ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        for(let report of this.reportData){

            let locName = (report.location.parent.name.length > 0) ? report.location.parent.name + ' - ' : '' ;
            locName += report.location.name;

            csvData[ getLength() ] = [  locName  ];
            csvData[ getLength() ] = columns;

            if(report.kpis.length == 0){
                csvData[ getLength() ] = [  'No record found'  ];
            }else{

                for(let kpi of report.kpis){
                    let d = [];

                    d.push( kpi.name );
                    d.push( this.references[kpi.compliance_kpis_id] );

                    if(!kpi.compliance.docs){
                        d.push( 'n/a' );
                    }else{
                        if(kpi.compliance.docs[0]){
                            d.push( kpi.compliance.docs[0]['date_of_activity_formatted'] );
                        }else{
                            d.push( 'n/a' );
                        }
                    }

                    if(kpi.compliance.valid == 0){
                        d.push( 'Not Compliant' );
                    }else{
                        d.push( 'Compliant' );
                    }
                    

                    csvData[ getLength() ] = d;
                }

            }

            let compRatingRow = [];
            for(let i in columns){
                if( parseInt(i) == (columns.length - 1) ){
                    compRatingRow.push('Compliance Rating : '+report.compliance_rating);
                }else{
                    compRatingRow.push('');
                }
            }

            csvData[  getLength() ] = compRatingRow;
            csvData[  getLength() ] = [];
            csvData[  getLength() ] = [];

        }

        this.exportToCSV.setData(csvData, 'statement-of-compliance-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}