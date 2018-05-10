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
            $printContainer = $(printContainer).clone(),
            $containers = $printContainer.find('.container'),
            $toCanvas = $('<div class="pdf-separator"></div>'),
            aPdfHTML = aPdf.innerHTML;

        $toCanvas.append('<div style="margin-left:30px;margin-right:30px;"> <h3>Statement of Compliance Report</h3> </div>');
        $('#cloneContainer > .clones').html('');
        $containers.each((i, elem) => {

            if( i % 3 == 0  && i > 0){
                $toCanvas = $('<div class="pdf-separator"></div>');
            }

            elem.classList = "report-content";
            elem.style = "margin-left:30px;margin-right:30px;";
            $(elem).find('.row:first-child').removeAttr('style');
            $toCanvas.append(elem);

            $('#cloneContainer > .clones').append($toCanvas);
        });


        $('#canvasContainer').html('');
        $('#cloneContainer .pdf-separator').each((i, elem) => {

            let repsConts = $(elem).find('.report-content');
            if( repsConts.length == 1 || repsConts.length == 2 ){
                for( let i = 1; i <= (3 - repsConts.length); i++ ){
                    let clone = $(repsConts[0]).clone();
                    clone.css('visibility', 'hidden');
                    $(elem).append( clone );
                }
            }

            html2canvas(elem).then(function(canvas) {
                $('#canvasContainer').append(canvas);

                if( i ==  $('#cloneContainer .pdf-separator').length - 1 ){

                    if($('#canvasContainer > canvas').length > 0){
                        let 
                        pdf = new jsPDF("p", "mm", "a4"),
                        imgWidth = 210,
                        canvasFirst = $('#canvasContainer > canvas')[0],
                        imgHeight = canvasFirst.height * imgWidth / canvasFirst.width,
                        imgData = canvasFirst.toDataURL('image/jpeg', 1.0);
                        pdf.addImage(imgData, 'JPG', 0, 5, imgWidth, imgHeight );
                        $('#canvasContainer > canvas').each((canIndex, canElem) => {
                            if( canIndex > 0 ){
                                imgData = canElem.toDataURL('image/jpeg', 1.0);
                                pdf.addPage();
                                pdf.addImage(imgData, 'JPG', 0, 5, imgWidth, imgHeight );
                            }
                        });

                        pdf.save('statement-of-compliance-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');

                        $('#cloneContainer > .clones').html('');
                    }
                }

            });
        });
    }

    csvExport(){
        let csvData = {},
            columns = [  "Compliance Requirement", "Legislative Reference", "Activity Date", "Status"  ],
            getLength = () => {
                return Object.keys(csvData).length;
            },
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
                    d.push( references[kpi.compliance_kpis_id] );

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