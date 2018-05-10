import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';

declare var $ : any;

@Component({
	selector : 'app-statement-compliance-component',
	templateUrl : './statement.compliance.component.html',
	styleUrls : [ './statement.compliance.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService ]
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
		private dashboardPreloader : DashboardPreloaderService
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

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}