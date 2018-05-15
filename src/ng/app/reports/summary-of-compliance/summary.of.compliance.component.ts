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

    pdfLoader = false;
    csvLoader = false;
    exportData = [];
    exportDataRatings = [];
    exportDataComplianceRating = '';
    exportFetchMarker = {};

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


                this.generateReportDataForExport();


            });
		});

	}

	ngOnInit(){	}

	ngAfterViewInit(){
        this.dashboardPreloader.show();
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

            this.getComplianceSummaryReport((response:any) => {

                
                this.exportDataRatings.push(response['data']['compliance_rating']);

                for(let loc of response['data']['locations']){
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

                this.exportFetchMarker[i] = response['data']['locations'];
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
                    
                    let numerators = [],
                        denaminator = 0;
                    for(let ratings of this.exportDataRatings){
                        let splitted = ratings.split('/');
                        numerators.push( parseInt(splitted[0]) );
                        denaminator = parseInt( splitted[1] );
                    }
                    let totalNum = 0,
                        average = 0;
                    for(let num of numerators){
                        totalNum = totalNum + num;
                    }

                    average = Math.round( divRes / totalNum  );

                    this.exportDataComplianceRating = <any> average+'/'+denaminator;

                    this.pdfLoader = false;
                    this.csvLoader = false;

                    console.log( this.exportData );
                }

            }, true);

            this.queries.offset = 0;
            this.queries.limit = 10;

        }
    }

	getComplianceSummaryReport(callBack, forExport?){

        this.queries.location_id = this.locationId;
		
		this.reportService.getComplianceSummary(this.queries).subscribe((response:any) => {

            if(!forExport){
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
            this.queries.offset = offset - 1;
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
        columns = [],
        rows = [],
        pdf = new jsPDF("l", "pt"),
        $printContainer = $(printContainer).clone(),
        titleText = $('.summary-of-compliance-title').text(),
        th = $printContainer.find('thead tr th');


        th.each((index, elem) => {
            let k = $(elem).attr('key'),
                keywidth = $(elem).attr('keywidth');

            columns.push({
                title : $(elem).text(),
                dataKey : k
            });
        });

        for(let data of this.exportData){
            let locName = (data.parent.name.length > 0) ? data.parent.name+', '+data.name : data.name,
                ecoLen = (!data.eco_users) ? 0 : data.eco_users.length,
                rowData = {};

            rowData['location'] = locName;
            for(let kpi of data.kpis){
                let compliantText = (kpi.compliance.valid == 1) ? 'Compliant' : 'Not Compliant',
                compliantClass = (kpi.compliance.valid == 1) ? 'blue-text' : 'grey-text';
                rowData[kpi.compliance_kpis_id] = compliantText;
            }
            rowData['eco'] = ecoLen;
            rowData['wardens'] = data.wardens_trained_percent+'%';
            rowData['ratings'] = data.compliance_rating;

            rows.push(rowData);
        }

        pdf.text(titleText, 20, 40);

        pdf.autoTable(columns, rows, {
            theme : 'grid',
            margin: 20,
            startY: 50,
            styles : {
                fontSize: 8,
                overflow: 'linebreak'
            },
            headerStyles : {
                fillColor: [50, 50, 50], textColor: 255
            },
            columnStyles : { location : { columnWidth : 140 } }
        });

        pdf.text("Compliance Rating : "+this.exportDataComplianceRating, 20, pdf.autoTable.previous.finalY  + 20);

        pdf.save('summary-of-compliance-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');
    }

    csvExport(){
        let thisClass = this,
            csvData = {},
            columns = [  "Locations" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        thisClass.csvLoader = true;

        for(let kpi of this.reportData.kpis){
            columns.push(kpi.name);
        }

        columns.push( "Total ECO", "% Trained Wardens", "Compliance Rating" )

        let title = "Summary of Compliance ("+moment().format("DD/MM/YYYY")+")";

        /*if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }*/

        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        for(let loc of this.exportData){

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
                compRatingRow.push('Compliance Rating : '+this.exportDataComplianceRating);
            }else{
                compRatingRow.push('');
            }
        }
        csvData[ getLength() ] = compRatingRow;

        this.exportToCSV.setData(csvData, 'summary-of-compliance-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();

        thisClass.csvLoader = false;
    }

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}