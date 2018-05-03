import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $ : any;

@Component({
	selector : 'app-reports-locations-summary-compliance-component',
	templateUrl : './summary.of.compliance.component.html',
	styleUrls : [ './summary.of.compliance.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService ]
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
		private dashboardPreloader : DashboardPreloaderService
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

	ngOnDestroy(){
		this.routeSubs.unsubscribe();
	}

}