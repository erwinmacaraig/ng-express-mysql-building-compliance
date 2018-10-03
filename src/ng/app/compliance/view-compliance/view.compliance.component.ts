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
import { AdminService } from '../../services/admin.service';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { MessageService } from '../../services/messaging.service';
import { AlertService } from '../../services/alert.service';
import { AlertComponent } from '../../alert/alert.component';
import { Observable } from 'rxjs/Rx';
import { DatepickerOptions } from 'ng2-datepicker';
import * as FileSaver from 'file-saver';
import { PaperAttendanceDocument } from '../../models/paper_attendance_document';
declare var $: any;
declare var moment: any;

@Component({
	selector : 'app-view-compliance',
	templateUrl : './view.compliance.component.html',
	styleUrls : [ './view.compliance.component.css' ],
    providers : [AuthService, UserService, SignupService, DashboardPreloaderService, ComplianceService, EncryptDecryptService, LocationsService, AdminService]
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
	@ViewChild("sundryTemplate") sundryTemplate : ElementRef;

	@ViewChild("epmTableTemplate") epmTableTemplate : ElementRef;
	@ViewChild("epcTableTemplate") epcTableTemplate : ElementRef;
	@ViewChild("evacution_exerciseTableTemplate") evacution_exerciseTableTemplate : ElementRef;
	@ViewChild("evac_diagramTableTemplate") evac_diagramTableTemplate : ElementRef;
	@ViewChild("chief_warden_trainingTableTemplate") chief_warden_trainingTableTemplate : ElementRef;
	@ViewChild("warden_trainingTableTemplate") warden_trainingTableTemplate : ElementRef;
	@ViewChild("fire_safety_advisorTableTemplate") fire_safety_advisorTableTemplate : ElementRef;
	@ViewChild("general_occupant_trainingTableTemplate") general_occupant_trainingTableTemplate : ElementRef;
	@ViewChild("sundryTableTemplate") sundryTableTemplate : ElementRef;

    paperAttendanceRecord: Array<PaperAttendanceDocument> = [];
    gofr_attendance_record: Array<PaperAttendanceDocument> = [];
    sundry_attendance_record: Array<PaperAttendanceDocument> = [];
    eco_attendance_record: Array<PaperAttendanceDocument> = [];
    chief_warden_attendance_record: Array<PaperAttendanceDocument> = [];
	userData = <any> {};
    isFRP = false;
    isTRP = false;
    complianceSublocations = [];
	selectedComplianceTitle = '';
	selectedComplianceDescription = '';
	selectedComplianceClasses = 'green darken-1 epm-icon';
    showLoadingForSignedURL:boolean = true;
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

    nameDisplay = '';

	public tenants;
	latestComplianceData = <any>[];
	public totalPercentage;

    evacDiagramSublocations = <any>[];

    options: DatepickerOptions = {
        displayFormat: 'YYYY-MM-DD',
        minDate: moment().toDate()
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    validTillDate = '';
    selectedKPIS = {
        name : '',
        short_code : ''
    };
    @ViewChild('inpFileUploadDocs') inpFileUploadDocs : ElementRef;
    showModalUploadDocsLoader = false;
    docsFileSizeIsMax = false;

    showEPCform = false;

    dateOfEvacServicesObj = {
        model : <Date> {},
        showPicker : false,
        formatted : '',
        options : {
            displayFormat: 'DD/MM/YYYY',
            minDate: moment().toDate()
        },
        onChangeEvent : (event) => {
            if(!moment(this.dateOfEvacServicesObj.model).isValid()){
                this.dateOfEvacServicesObj.model = new Date();
                this.dateOfEvacServicesObj.formatted = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
            }else{
                this.dateOfEvacServicesObj.formatted  = moment(this.dateOfEvacServicesObj.model).format('DD/MM/YYYY');
            }

            this.dateOfEvacServicesObj.showPicker = false;
        },
        showDatePicker : () => {
            this.dateOfEvacServicesObj.showPicker = true;
        }
    };

    lastEpcMeetingObj = {
        model : <Date> {},
        showPicker : false,
        formatted : '',
        options : {
            displayFormat: 'DD/MM/YYYY',
            minDate: moment().toDate()
        },
        onChangeEvent : (event) => {
            if(!moment(this.lastEpcMeetingObj.model).isValid()){
                this.lastEpcMeetingObj.model = new Date();
                this.lastEpcMeetingObj.formatted = moment(this.lastEpcMeetingObj.model).format('DD/MM/YYYY');
            }else{
                this.lastEpcMeetingObj.formatted  = moment(this.lastEpcMeetingObj.model).format('DD/MM/YYYY');
            }

            this.lastEpcMeetingObj.showPicker = false;
        },
        showDatePicker : () => {
            this.lastEpcMeetingObj.showPicker = true;
        }
    };

    attendies = [];

    msgSubs;

    evacExerciseComplianceId = 0;
    downloadAllPackLabel = '';
    downloadAllPackControler = false;
    downloadPackName = '';
    constructor(
        private router : Router,
        private route: ActivatedRoute,
        private authService : AuthService,
        private userService: UserService,
        private signupServices: SignupService,
        private dashboard : DashboardPreloaderService,
        private complianceService : ComplianceService,
        private locationService : LocationsService,
        private encryptDecrypt : EncryptDecryptService,
        private adminService : AdminService,
        private messageService : MessageService,
        private alertService: AlertService
        ) {

        this.userData = this.authService.getUserData(); 

        for(let role of this.userData.roles){
            if(role.role_id == 1){
                this.isFRP = true;
            }
            if(role.role_id == 2){
                this.isTRP = true;
            }
        }

        this.setDatePickerDefaultDate();

        this.route.params.subscribe((params) => {
            this.encryptedID = decodeURIComponent(params['encrypted']);
            this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
        });

        this.msgSubs = this.messageService.getMessage().subscribe((message) => {
            if(message.epcform){
                if(message.epcform == 'hide') {
                    this.showEPCform = false;
                }
            } else if(message.getLocationId) {
                this.messageService.sendMessage({
                    'locationId' : this.locationID
                });
            }
        });
    }

    setDatePickerDefaultDate(){
        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        this.validTillDate = moment(this.datepickerModel).add(1, 'years').format('YYYY-MM-DD');
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
                        doc['timestamp_formatted'] = moment(doc["timestamp"]).format("DD/MM/YYYY");
                        doc['display_format'] = moment(doc['timestamp']).format('DD/MM/YYYY');
					}
				}
			}
		}

        let colors = this.complianceService.getColors();
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

            kpis['background_color'] = colors[kpis.compliance_kpis_id];
			if(kpis.compliance_kpis_id == 4){
				kpis['icon_class'] = 'epm-icon';
				kpis['short_code'] = 'epm';
			}else if(kpis.compliance_kpis_id == 2){
				kpis['icon_class'] = 'epc-icon';
				kpis['short_code'] = 'epc';
			}else if(kpis.compliance_kpis_id == 9){
				kpis['icon_class'] = 'evacuation-icon';
				kpis['short_code'] = 'evacution_exercise';
			}else if(kpis.compliance_kpis_id == 5){
				kpis['icon_class'] = 'diagram-icon';
				kpis['short_code'] = 'evac_diagram';
			}else if(kpis.compliance_kpis_id == 12){
				kpis['icon_class'] = 'chief-icon';
				kpis['short_code'] = 'chief_warden_training';
			}else if(kpis.compliance_kpis_id == 6){
				kpis['icon_class'] = 'warden-icon';
				kpis['short_code'] = 'warden_training';
			}else if(kpis.compliance_kpis_id == 3){
				kpis['icon_class'] = 'fsa-icon';
				kpis['short_code'] = 'fire_safety_advisor';
			}else if(kpis.compliance_kpis_id == 8){
				kpis['icon_class'] = 'gen-occ-icon';
				kpis['short_code'] = 'general_occupant_training';
			}else if(kpis.compliance_kpis_id == 13){
				kpis['icon_class'] = 'sundry-icon';
				kpis['short_code'] = 'sundry';
			}
			let templateName = kpis['short_code']+'Template',
				tableTemplateName = kpis['short_code']+'TableTemplate';
			kpis['template'] = this[templateName];
			kpis['tableTemplate'] = this[tableTemplateName];
		}
	}

	ngOnInit(cb?) {
        this.downloadAllPackLabel = 'Download all Pack';
        
        this.locationService.getByIdWithQueries({
            location_id : this.locationID,
            account_id : this.userData.accountId,
            get_related_only : (this.isFRP) ? false : (this.isTRP) ? true : false
        }, (response) => {
            console.log(response);
            if (response.sublocations.length > 0) {
              this.complianceSublocations = response.sublocations;
            } else {
              this.complianceSublocations.push(response.location);
            }
            this.locationData = response.location;
            this.locationData['parentData'] = response.parent;
            this.locationData.parentData['sublocations'] = response.siblings;
            this.locationData.parentData.location_id = this.encryptDecrypt.encrypt(this.locationData.parentData.location_id);
            if (response.siblings.length) {
                for (let i = 0; i < response.siblings.length; i++) {
                    this.locationData.parentData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(response.siblings[i].location_id);
                }
            }
            for(let i in this.locationData['sublocations']){
                this.locationData['sublocations'][i]['location_id'] = this.encryptDecrypt.encrypt(this.locationData['sublocations'][i].location_id);
            }

            this.complianceService.getKPIS((response) => {
                this.KPIS = response.data;

                this.complianceService.getLocationsLatestCompliance(this.locationID, (responseCompl) => {
                    this.latestComplianceData = responseCompl.data;
                    if(responseCompl['building_based']){
                        this.nameDisplay = responseCompl.building.name;
                    }else{
                        this.nameDisplay = (this.locationData.parentData.name) ? this.locationData.parentData.name+', '+this.locationData.name : this.locationData.name; 
                    }

		            this.downloadPackName = this.locationData['location_directory_name'];
	
                    this.setKPISdataForDisplay();

                    this.totalPercentage = responseCompl.percent;

                    this.messageService.sendMessage({
                        'epcData' : responseCompl.epcData
                    });

                    for(let comp of responseCompl.data){
                        if(comp.compliance_kpis_id == 9){
                            this.evacExerciseComplianceId = comp.compliance_id;
                        }
                        if (comp.docs.length > 0) {
                            this.downloadAllPackControler = false;

                        }
                    }

                    if(cb){
                        cb();
                    }else{
                        setTimeout(() => {
                            $('.row-diagram-details').css('left', ( $('.row-table-content').width() ) + 'px' );
                            this.dashboard.hide();
                            this.clickSelectComplianceFromList(this.KPIS[0]);
                        }, 100);
                    }
                });
            });

            this.complianceService.getSublocationsEvacDiagrams({
                location_id : this.locationID,
                get_related_location : (this.isFRP == true) ? false : (this.isTRP == true) ? true : false 
            }, (responseSubs) => {
                this.evacDiagramSublocations = responseSubs.data.sublocations;
            });

            this.complianceService.getPaperAttendanceFileUpload(this.locationID).subscribe((response) => {
                this.paperAttendanceRecord = response['attendance_record'];
                for (let attendance of this.paperAttendanceRecord) {
                    switch(attendance.compliance_kpis_id.toString()) {
                        case '8':
                            this.gofr_attendance_record.push(attendance);
                        break;
                        case '6':
                            this.eco_attendance_record.push(attendance);
                        break;
                        case '12':
                            this.chief_warden_attendance_record.push(attendance);
                        break;
                        case '13':
                            this.sundry_attendance_record.push(attendance);
                        break;
                    } 
                }
                this.showLoadingForSignedURL = false;                
            });

        });
    }

	ngAfterViewInit(){
        
		$('.workspace.container').css('position', 'relative');
        this.dashboard.show();

        $('.modal').modal({
          dismissible: false
        });

        this.messageService.sendMessage({
            'epcFormCallBackSuccess' : () => {
                this.ngOnInit(() => {
                    this.complianceService.getLocationsLatestCompliance(this.locationID, (responseCompl) => {
                        this.latestComplianceData = responseCompl.data;
                        this.setKPISdataForDisplay();

                        this.totalPercentage = responseCompl.percent;

                        this.messageService.sendMessage({
                            'epcData' : responseCompl.epcData
                        });
                    });
                });
            }
        });
	}

	clickSelectComplianceFromList(compliance) {
        this.selectedCompliance = compliance;
            console.log(this.selectedCompliance);
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

            $('.compliance-title-container .image').css('background-color', this.selectedCompliance['background_color']);

	}

	showDiagramDetails(){

		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '-'+( tableW + 200 )+'px' );
		$('.row-diagram-details').css('left', '0px' );
		setTimeout(() => { 
            $('.row-diagram-details').show();
            $('.hide-diagram').show();
            $('.recently-uploaded').show();
        }, 300);
	}

	hideDiagramDetails(){
		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '0px' );
		$('.row-diagram-details').css('left', (tableW + diagramLeft) + 'px' );
        $('.hide-diagram').hide();
        $('.recently-uploaded').hide();
		setTimeout(() => { 
            $('.row-diagram-details').hide();
        }, 400);
	}

	ngOnDestroy() {
        this.msgSubs.unsubscribe();
    }

    downloadAllPack() {
        //
        this.downloadAllPackLabel = 'Downloading files as zip';
        this.downloadAllPackControler = true;
        this.complianceService.downloadAllComplianceDocumentPack(this.locationID).subscribe((data) => {
          const blob = new Blob([data.body], {type: 'application/zip'});
          const filename = `${this.downloadPackName}.zip`;
          FileSaver.saveAs(blob, filename);
          this.alertService.info('File download successful!');
          this.downloadAllPackLabel = 'Download all Pack';
          this.downloadAllPackControler = false;
        }, (err: HttpErrorResponse) => {
          this.dashboard.hide();          
          if (err.error instanceof Error) {
            console.log(err.error.message);
            this.downloadAllPackControler = false;
          }          
          this.alertService.error('There was a problem in your download.');
          this.downloadAllPackControler = false;
        });
    }

    downloadKPIFile(kpi_file, filename) {
        this.complianceService.downloadComplianceFile(kpi_file, filename).subscribe((data) => {
          const blob = new Blob([data.body], {type: data.headers.get('Content-Type')});
          FileSaver.saveAs(blob, filename);
        },
        (error) => {
          // this.alertService.error('No file(s) available for download');
          $('#modalfilenotfound').modal('open');
          console.log('There was an error', error);
        });
    }

    assignAccessToTRP(e, compliance) {
        this.selectedCompliance = compliance;
        const temp = this.selectedCompliance.compliance.docs[0].viewable_by_trp;
        this.selectedCompliance.compliance.docs[0].viewable_by_trp =
           !this.selectedCompliance.compliance.docs[0].viewable_by_trp;

        this.complianceService.toggleTRPViewAccess(
        this.selectedCompliance.compliance.docs[0].compliance_documents_id,
        this.selectedCompliance.compliance.docs[0].viewable_by_trp).subscribe((data) => {
        console.log('Toggled View TRP to ' + this.selectedCompliance.compliance.docs[0].viewable_by_trp);
        }, (error) => {
        this.selectedCompliance.compliance.docs[0].viewable_by_trp = temp;
        console.log(error);
        });
    }

    public viewWardenList(location_id:number = 0) {
        this.userService.getTenantsInLocation(location_id, (tenantsResponse) => {
          this.tenants = tenantsResponse.data;
          // this.showModalNewTenantLoader = false;
          $('#modalWardenList').modal('open');
          console.log(this.tenants);
        });
    }

    showModalUploadDocs(shortCode){
        for(let kpi of this.KPIS){
            if(kpi.short_code == shortCode){
                this.selectedKPIS = kpi;
                this.validTillDate = moment(this.datepickerModel).add(this.selectedKPIS['validity_in_months'], 'months').format('YYYY-MM-DD');
            }
        }

        if(Object.keys(this.selectedKPIS).length > 0){
            $('#modalManageUpload').modal('open');
            this.docsFileSizeIsMax = false;
        }

        console.log(this.KPIS);
    }

    showEPCformEvent(){
        this.showEPCform = true;
    }

    onChangeDatePicker(event){
        if(!moment(this.datepickerModel).isValid()){
            this.datepickerModel = new Date();
            this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        }else{
            this.datepickerModelFormatted = moment(this.datepickerModel).format('YYYY-MM-DD');
        }
        this.validTillDate = moment(this.datepickerModel).add(this.selectedKPIS['validity_in_months'], 'months').format('YYYY-MM-DD');
        this.isShowDatepicker = false;
    }

    showDatePicker(){
        this.isShowDatepicker = true;
    }

    onFileSelected(event, form){
        event.preventDefault();
        let filsizeValid = false;
        if(event.target.files[0]){
            if(event.target.files[0].size < 20000000){
                filsizeValid = true;
            }
        }

        if(!filsizeValid){
            form.controls.file.reset();
            this.docsFileSizeIsMax = true;
        }else{
            this.docsFileSizeIsMax = false;
        }
    }

    selectFile(inpFile){
        inpFile.click();
    }

    submitUploadDocs(form:NgForm){
        let formData = new FormData();
        formData.append('account_id', this.userData['accountId']);
        formData.append('building_id', this.locationID.toString());
        formData.append('compliance_kpis_id', this.selectedKPIS['compliance_kpis_id']);
        formData.append('viewable_by_trp', form.value.viewable_by_trp);
        formData.append('file', this.inpFileUploadDocs.nativeElement.files[0], this.inpFileUploadDocs.nativeElement.files[0].name);
        formData.append('date_of_activity', form.value.date_of_activity);
        formData.append('description', form.value.description);

        this.showModalUploadDocsLoader = true;
        $('#modalManageUpload').css('width', 'fit-content');

        this.adminService.uploadComplianceDocs(formData).subscribe((response) => {
            this.complianceService.getLocationsLatestCompliance(this.locationID, (responseCompl) => {
                this.latestComplianceData = responseCompl.data;
                this.setKPISdataForDisplay();

                this.totalPercentage = responseCompl.percent;

                this.messageService.sendMessage({
                    'epcData' : responseCompl.epcData
                });

                setTimeout(() => {
                    this.showModalUploadDocsLoader = false;
                    $('#modalManageUpload').css('width');
                }, 100);
            });
        });
    }

    cancelUploadDocs(form){
        form.controls.file.reset();
        form.controls.description.reset();
        $('#modalManageUpload form input[name="description"]').trigger('autoresize');
        this.setDatePickerDefaultDate();
    }

    completedEvacExerEvent(event){
        this.complianceService.evacExerciseCompleted({
            location_id : this.locationID,
            compliance_id : this.evacExerciseComplianceId,
            status : event.target.checked
        }).subscribe((response) => {
            this.ngOnInit(() => {
                setTimeout(() => {
                    this.clickSelectComplianceFromList(this.KPIS[6]);
                },500);
            });
        });
    }

    completedFASEvent(event){
        this.complianceService.fsaCompleted({
            location_id : this.locationID,
            compliance_id : this.selectedCompliance['compliance']['compliance_id'],
            status : event.target.checked
        }).subscribe((response) => {
            this.ngOnInit(() => {
                setTimeout(() => {
                    this.clickSelectComplianceFromList(this.KPIS[1]);
                },500);
            });
        });
    }

}
