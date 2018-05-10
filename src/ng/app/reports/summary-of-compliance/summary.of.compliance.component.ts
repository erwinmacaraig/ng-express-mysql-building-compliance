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
	selector : 'app-reports-locations-summary-compliance-component',
	templateUrl : './summary.of.compliance.component.html',
	styleUrls : [ './summary.of.compliance.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, ExportToCSV ]
})

export class ReportsLocationsSummaryOfComplianceComponent implements OnInit, OnDestroy {
	
	userData = {};
	locationId = 0;

	reportData = {
		locations : [],
		totalComplianceRating : '0/0',
        kpis : [],
        date : ''
	};

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 10,
        offset : 0,
        location_id : 0
    };

    loadingTable = false;

	routeSubs;

    sundryId = 13;

	constructor(
		private router : Router,
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
			this.getComplianceSummaryReport((response) => {
                this.dashboardPreloader.hide();

                if(response['data']['locations'].length > 0){
                    this.pagination.currentPage = 1;
                }
            });
		});

	}

	ngOnInit(){	}

	ngAfterViewInit(){
        this.dashboardPreloader.show();
    }

	getComplianceSummaryReport(callBack){

        this.queries.location_id = this.locationId;
		
		this.reportService.getComplianceSummary(this.queries).subscribe((response:any) => {

			this.reportData.locations = response['data']['locations'];
            this.reportData.totalComplianceRating = response['data']['compliance_rating'];
            
            let kpis = [];
            for(let kp of response['data']['kpis']){
                if(this.sundryId !== kp.compliance_kpis_id){
                    kpis.push(kp);
                }
            }
            this.reportData.kpis = kpis;

			this.reportData.date = response['data']['date'];

            for(let loc of this.reportData.locations){
                loc['kpis'] = JSON.parse( JSON.stringify( this.reportData.kpis ) );
                let kpis = loc.kpis,
                    compliances = loc.compliances;
                for(let k of kpis){
                   if(!k['compliance'] && this.sundryId !== k.compliance_kpis_id){ k['compliance'] = {}; }
                    for(let c of compliances){
                        if(c.compliance_kpis_id == k.compliance_kpis_id){
                            k['compliance'] = c;
                        }
                    } 
                }
            }

			 
			for(let loc of this.reportData.locations){
				loc['locIdEnc'] = this.encryptDecrypt.encrypt( loc.location_id );
			}

            this.pagination.pages = response.pagination.pages;
            this.pagination.total = response.pagination.total;

            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            console.log( this.reportData.locations );

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
            this.getComplianceSummaryReport((response:any) => {
                this.loadingTable = false;
            });
        }
    }

	printResult(){

		let headerHtml = `<h5> Summary of Compliance (`+this.reportData.date+`)</h5>`;

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
            $titleClone = $('.summary-of-compliance-title').clone(),
            aPdfHTML = aPdf.innerHTML;

        $titleClone.append(' pg. '+this.pagination.currentPage);
        $printContainer.find('.row.no-print').remove();

        $printContainer.prepend($titleClone);

        let trLen = $printContainer.find('tr').length,
            trHeight = 100;

        for(let i = 1; i<=(10-trLen); i++){
            $('<div style="height:'+trHeight+'px; width:100%;"> </div>').insertAfter( $printContainer.find('.btn-compliance-rating') );
        }

        $('#cloneContainer').html($printContainer);

        html2canvas($('#cloneContainer')[0]).then(function(canvas) {
            let 
            pdf = new jsPDF("l", "mm", "a4"),
            imgData = canvas.toDataURL('image/jpeg', 1.0);

            $('#canvasContainer').html(canvas);
            pdf.addImage(imgData, 'JPG', 7, 5, 280, 190 );
            pdf.save('summary-of-compliance-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');

            $('#cloneContainer').html('');

        });
    }

    csvExport(){
        let csvData = {},
            columns = [  "Locations" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        for(let kpi of this.reportData.kpis){
            columns.push(kpi.name);
        }

        columns.push( "Total ECO", "% Trained Wardens", "Compliance Rating" )

        let title = "Summary of Compliance ("+moment().format("DD/MM/YYYY")+")";

        if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }

        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        for(let loc of this.reportData.locations){

            let locName = (loc.parent.name.length > 0) ? loc.parent.name + ' - ' : '' ;
            locName += loc.name;

            let row = [ locName ];

            for(let kpi of loc.kpis){
                if(kpi.compliance.valid == 1){
                    row.push( 'Compliant' );
                }else{
                    row.push( 'Not Compliant' );
                }
            }

            if(!loc.eco_users){
                row.push( '0' );
            }else{
                row.push( loc.eco_users.length );
            }

            row.push( loc.wardens_trained_percent+'%' );
            row.push( ' '+loc.compliance_rating );

            csvData[ getLength() ] = row;
        }

        let compRatingRow = []; 
        for(let i in columns){
            if( parseInt(i) == (columns.length - 1) ){
                compRatingRow.push('Compliance Rating : '+this.reportData.totalComplianceRating);
            }else{
                compRatingRow.push('');
            }
        }
        csvData[ getLength() ] = compRatingRow;

        this.exportToCSV.setData(csvData, 'summary-of-compliance-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}