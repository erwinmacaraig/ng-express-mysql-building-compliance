import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

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

	reportData = {
		location : { name : '', parent : { name : '' } },
		docs : [],
		compliances : [],
		kpis : [],
		totalComplianceRating : '0/0'
	};

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

			this.reportData.location = response.data.location;
			this.reportData.docs = response.data.docs;
			this.reportData.compliances = response.data.compliances;
            this.reportData.kpis = response.data.kpis;
			this.reportData.totalComplianceRating = response['data']['compliance_rating'];

            for(let k of this.reportData.kpis){
                if(!k['compliance']){ k['compliance'] = {}; }
                for(let c of this.reportData.compliances){
                    if(c.compliance_kpis_id == k.compliance_kpis_id){
                        k['compliance'] = c;
                    }
                }
            }

			this.dashboardPreloader.hide();
		});
	}

	printResult(){

		let headerHtml = `<h5> `+this.reportData.location.name+` Statement of Compliance </h5>`;

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