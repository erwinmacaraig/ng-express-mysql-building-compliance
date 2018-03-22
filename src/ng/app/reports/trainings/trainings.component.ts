import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';

declare var $ : any;

@Component({
	selector : 'app-trainings-compliance-component',
	templateUrl : './trainings.component.html',
	styleUrls : [ './trainings.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService ]
})

export class ReportsTrainingsComponent implements OnInit, OnDestroy {
	
	userData = {};
	rootLocationsFromDb = [];
	results = [];
	backupResults = [];
	routeSubs;
	locationId = 0;

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

			this.getLocationReport();
		});

	}

	ngOnInit(){
		this.reportService.getParentLocationsForReporting().subscribe((response) => {
			console.log(response);
			this.rootLocationsFromDb = response['data'];
			setTimeout(() => {
				$('select').material_select();
			}, 200);
		}, (e) => {
			console.log(e);
		});
	}

	ngAfterViewInit(){
		$('select').material_select();
		
		$('#selectLocation').val(this.locationId).material_select('update');
		$('#selectLocation').off('change.selectlocation').on('change.selectlocation', () => {

			let selVal = $('#selectLocation').val(),
			encId = this.encryptDecrypt.encrypt( selVal );

			this.router.navigate([ '/reports/trainings/', encId]);
		});


		$('#selectFilter').off('change.filter').on('change.filter', () => {

			let selVal = $('#selectFilter').val();
			if(this.results.length > 0){
				
				let filtered = [];
				for(let re of this.backupResults){
					if(selVal == 'offline' && re.course_method == 'offline_by_evac'){
						filtered.push(re);
					}else if(selVal == 'online' && re.course_method == 'online_by_evac'){
						filtered.push(re);
					}else if(selVal == 'null'){
						filtered.push(re);
					}
				}
				this.results = filtered;
				
			}else{
				$('#selectFilter').val(null).material_select('update');
			}

		});
	}

	getLocationReport(){
		let 
		locId = this.locationId,
		formData = {
			location_id : locId
		};

		this.dashboardPreloader.show();
		this.reportService.getLocationTrainingReport(formData).subscribe((response) => {
			this.results = response['data'];
			this.backupResults = JSON.parse( JSON.stringify(this.results) );
			this.dashboardPreloader.hide();
		});
	}

	printResult(){
		let locName = '';
		for(let loc of this.rootLocationsFromDb){
			if(loc['location_id'] == this.locationId){
				locName = loc.name;
			}
		}

		let headerHtml = `<h5> Training Report For `+locName+` </h5>`;

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