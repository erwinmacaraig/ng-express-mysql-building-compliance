import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { ComplianceService } from '../../services/compliance.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Observable } from 'rxjs/Rx';

import * as FileSaver from 'file-saver';

declare var $: any;
declare var moment: any;

@Component({
	selector : 'app-view-compliance',
	templateUrl : './view.compliance.component.html',
	styleUrls : [ './view.compliance.component.css' ],
  providers : [AuthService, UserService, SignupService, DashboardPreloaderService, ComplianceService, EncryptDecryptService, LocationsService]
})
export class ViewComplianceComponent implements OnInit, OnDestroy{
	@ViewChild("notesTemplate") notesTemplate : ElementRef;
	@ViewChild("noneTemplate") noneTemplate : ElementRef;
	@ViewChild("epmTemplate") epmTemplate : ElementRef;
	@ViewChild("epcTemplate") epcTemplate : ElementRef;
	@ViewChild("evacution_exerciseTemplate") evacution_exerciseTemplate : ElementRef;
	@ViewChild("evac_diagramTemplate") evac_diagramTemplate : ElementRef;
	@ViewChild("chief_warden_trainingTemplate") chief_warden_trainingTemplate : ElementRef;
	@ViewChild("warden_trainingTemplate") warden_trainingTemplate : ElementRef;
	@ViewChild("fire_safety_advisorTemplate") fire_safety_advisorTemplate : ElementRef;
	@ViewChild("general_occupant_trainingTemplate") general_occupant_trainingTemplate : ElementRef;
	@ViewChild("warden_listTemplate") warden_listTemplate : ElementRef;

	@ViewChild("epmTableTemplate") epmTableTemplate : ElementRef;
	@ViewChild("epcTableTemplate") epcTableTemplate : ElementRef;
	@ViewChild("evacution_exerciseTableTemplate") evacution_exerciseTableTemplate : ElementRef;
	@ViewChild("evac_diagramTableTemplate") evac_diagramTableTemplate : ElementRef;
	@ViewChild("chief_warden_trainingTableTemplate") chief_warden_trainingTableTemplate : ElementRef;
	@ViewChild("warden_trainingTableTemplate") warden_trainingTableTemplate : ElementRef;
	@ViewChild("fire_safety_advisorTableTemplate") fire_safety_advisorTableTemplate : ElementRef;
	@ViewChild("general_occupant_trainingTableTemplate") general_occupant_trainingTableTemplate : ElementRef;
	@ViewChild("warden_listTableTemplate") warden_listTableTemplate : ElementRef;


	userData = {};

	selectedComplianceTitle = '';
	selectedComplianceDescription = '';
	selectedComplianceClasses = 'green darken-1 epm-icon';

	previewTemplate = 1;

	selectedCompliance = {
		compliance : {
			note : null,
			docs : []
		},
		short_code : '',
		template : this.noneTemplate,
		tableTemplate : this.noneTemplate
	};

	timer = Observable.interval(10);
	subscribeTime;

	KPIS = <any>[];
	dataLoadDone = false;

	encryptedID;
	locationID = 0;
	locationData = {
		'name' : '',
		'parentData' : <any>{ location_id : 0 }
	};

	latestComplianceData = <any>[];
  public totalPercentage;
	constructor(
  		private router : Router,
  		private route: ActivatedRoute,
  		private authService : AuthService,
  		private userService: UserService,
      private signupServices: SignupService,
      private dashboard : DashboardPreloaderService,
      private complianceService : ComplianceService,
      private locationService : LocationsService,
      private encryptDecrypt : EncryptDecryptService
		){

		this.userData = this.authService.getUserData();

		this.route.params.subscribe((params) => {
			this.encryptedID = decodeURIComponent(params['encrypted']);
			this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
		});
	}

	setKPISdataForDisplay() {
    let counter = 0;
		for(let kpi of this.KPIS) {
			for(let comp of this.latestComplianceData){
				if( comp.compliance_kpis_id == kpi.compliance_kpis_id ){
					kpi['compliance'] = comp;
				}

				if(comp.docs.length > 0) {
					for(let doc of comp.docs){
            doc['timestamp_formatted'] = moment(doc["timestamp"]).format("MMM. DD, YYYY");
            doc['display_format'] = moment(doc['timestamp']).format('DD/MM/YYYY');
					}
				}
			}
		}

		for(let kpis of this.KPIS) {
      if (kpis.compliance.docs.length > 0) {
        counter = counter + 1;
      }
			let mes = kpis.measurement.toLowerCase();
			if(mes == 'traffic' || mes == 'evac'){
				kpis['type'] = 'date';
			}else{
				kpis['type'] = 'percent';
			}

			if(kpis.compliance_kpis_id == 4){
				kpis['icon_class'] = 'light-green epm-icon';
				kpis['short_code'] = 'epm';
			}else if(kpis.compliance_kpis_id == 2){
				kpis['icon_class'] = 'light-blue meeting-icon';
				kpis['short_code'] = 'epc';
			}else if(kpis.compliance_kpis_id == 9){
				kpis['icon_class'] = 'teal evacuation-icon';
				kpis['short_code'] = 'evacution_exercise';
			}else if(kpis.compliance_kpis_id == 5){
				kpis['icon_class'] = 'light-blue lighten-2 diagram-icon';
				kpis['short_code'] = 'evac_diagram';
			}else if(kpis.compliance_kpis_id == 12){
				kpis['icon_class'] = 'orange training-icon';
				kpis['short_code'] = 'chief_warden_training';
			}else if(kpis.compliance_kpis_id == 6){
				kpis['icon_class'] = 'teal accent-3 training-icon';
				kpis['short_code'] = 'warden_training';
			}else if(kpis.compliance_kpis_id == 3){
				kpis['icon_class'] = 'indigo training-icon';
				kpis['short_code'] = 'fire_safety_advisor';
			}else if(kpis.compliance_kpis_id == 8){
				kpis['icon_class'] = 'deep-purple training-icon';
				kpis['short_code'] = 'general_occupant_training';
			}else if(kpis.compliance_kpis_id == 13){
				kpis['icon_class'] = 'green training-icon';
				kpis['short_code'] = 'warden_list';
			}
			let templateName = kpis['short_code']+'Template',
				tableTemplateName = kpis['short_code']+'TableTemplate';
			kpis['template'] = this[templateName];
			kpis['tableTemplate'] = this[tableTemplateName];
		}
    this.totalPercentage = (counter / this.KPIS.length) * 100;
    this.totalPercentage = this.totalPercentage.toString() + '%';
    console.log(this.KPIS);
    console.log('counter = ' + counter);

	}

	ngOnInit() {

		this.locationService.getById(this.locationID, (response) => {
			this.locationData = response.location;
			this.locationData['parentData'] = response.parent;
			this.locationData.parentData['sublocations'] = response.siblings;
			this.locationData.parentData.location_id = this.encryptDecrypt.encrypt(this.locationData.parentData.location_id).toString();
			if (response.siblings.length) {
				for (let i = 0; i < response.siblings.length; i++) {
					this.locationData.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(response.siblings[i].location_id).toString();
				}
			}
			for(let i in this.locationData['sublocations']){
				this.locationData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id).toString();
			}

			this.complianceService.getKPIS((response) => {
				this.KPIS = response.data;

				this.complianceService.getLocationsLatestCompliance(this.locationID, (responseCompl) => {
					this.latestComplianceData = responseCompl.data;
					this.setKPISdataForDisplay();

          console.log(this.selectedCompliance);
					setTimeout(() => {
						$('.row-diagram-details').css('left', ( $('.row-table-content').width() ) + 'px' );
						this.dashboard.hide();
						this.clickSelectComplianceFromList(this.KPIS[0]);
					}, 100);
				});
			});
		});


	}

	ngAfterViewInit(){
		$('.workspace.container').css('position', 'relative');
		this.dashboard.show();
	}

	clickSelectComplianceFromList(compliance){
		this.selectedCompliance = compliance;
		let attr = compliance.short_code,
			allTr = $("tr[compliance]"),
			tr = $("tr[compliance='"+attr+"']");

		allTr.removeClass('active');
		tr.addClass('active');

		/*$('.row-diagram-details .content').html('');
		if(targetPreview.length > 0){
			$('.row-diagram-details .content').html( targetPreview.html() );
		}*/
		$('select').material_select();

		this.selectedComplianceTitle = compliance.name;
		this.selectedComplianceDescription = compliance.description;
		this.selectedComplianceClasses = compliance.icon_class;

	}

	showDiagramDetails(){

		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '-'+( tableW + 200 )+'px' );
		$('.row-diagram-details').css('left', '0px' );
		setTimeout(() => { $('.row-diagram-details').show(); }, 200);
	}

	hideDiagramDetails(){
		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '0px' );
		$('.row-diagram-details').css('left', (tableW + diagramLeft) + 'px' );
		setTimeout(() => { $('.row-diagram-details').hide(); }, 400);
	}

	ngOnDestroy() {

  }

  downloadAllPack() {
    this.dashboard.show();
    //
    this.complianceService.downloadAllComplianceDocumentPack(this.locationID).subscribe((data) => {
      this.dashboard.hide();
      const blob = new Blob([data.body], {type: 'application/zip'});
      const filename = 'compliance-docs.zip';
      FileSaver.saveAs(blob, filename);
    }, (err) => {
      this.dashboard.hide();
      console.log(err);
      console.log('There was an error');
    });
  }


  downloadKPIFile(kpi_file, filename) {
    console.log(kpi_file);
    console.log(filename);
    this.complianceService.downloadComplianceFile(kpi_file, filename).subscribe((data) => {
      const blob = new Blob([data.body], {type: data.headers.get('Content-Type')});
      FileSaver.saveAs(blob, filename);
      console.log(data);
    },
    (error) => {
      console.log('There was an error', error);
    });
  }

}
