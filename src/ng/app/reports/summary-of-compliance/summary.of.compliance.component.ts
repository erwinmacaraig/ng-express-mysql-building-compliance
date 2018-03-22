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
		totalComplianceRating : '0/0'
	};

	routeSubs;

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
			this.getComplianceSummaryReport();
		});

	}

	ngOnInit(){	}

	ngAfterViewInit(){ }

	getComplianceSummaryReport(){

		this.dashboardPreloader.show();
		this.reportService.getComplianceSummary({
			location_id : this.locationId
		}).subscribe((response) => {

			this.reportData.locations = response['data']['locations'];
			this.reportData.totalComplianceRating = response['data']['compliance_rating'];
			 
			for(let loc of this.reportData.locations){
				loc['locIdEnc'] = this.encryptDecrypt.encrypt( loc.location_id );
			}

			this.dashboardPreloader.hide();
		});
	}

	printResult(){

		let headerHtml = `<h5> Summary of Compliance </h5>`;

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