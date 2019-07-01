import { Subscription } from 'rxjs/Subscription';
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { CourseService } from '../../services/course';
import { ExportToCSV } from '../../services/export.to.csv';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../../environments/environment';
import { PrintService } from '../../services/print.service';

declare var $: any;
// declare var jsPDF: any;
import * as FileSaver from 'file-saver';

@Component({
	selector : 'app-trainings-compliance-component',
	templateUrl : './trainings.component.html',
	styleUrls : [ './trainings.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, CourseService, ExportToCSV ]
})

export class ReportsTrainingsComponent implements OnInit, OnDestroy {
    @ViewChild('printContainer') printContainer : ElementRef;
	userData = {};
	rootLocationsFromDb = [];
    results = [];
    private reportsData = [];
	backupResults = [];
	routeSubs;
    locationId = 0;
    accountId = 0;
	arrLocationIds = [];
    public total_records = 0;
    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 25,
        offset : 0,
        location_id: null,
        account_id: null,
        course_method : 'none',
        training_id : 0,
        searchKey: '',
        compliant: -1,
        getall : false,
        nofilter_except_location : false
    };
    totalCountResult = 0;

    loadingTable = false;

    trainingRequirements = [];

    searchSub: Subscription;
    @ViewChild('searchMember') searchMember: ElementRef;

    pdfLoader = false;
    csvLoader = false;
    exportData = [];
    exportFetchMarker = {};
    print:any;

    subscriptionType = 'free';
	constructor(
		private router : Router,
		private activatedRoute : ActivatedRoute,
		private authService : AuthService,
		private messageService : MessageService,
		private reportService : ReportService,
		private encryptDecrypt : EncryptDecryptService,
		private dashboardPreloader : DashboardPreloaderService,
        private courseService : CourseService,
        private exportToCSV : ExportToCSV
		) {
		this.userData = this.authService.getUserData();
	}

	ngOnInit() {
        this.dashboardPreloader.show();       
        this.subscriptionType = this.userData['subscription']['subscriptionType'];
        

        this.routeSubs = this.activatedRoute.params.subscribe((params) => {
            this.locationId = this.encryptDecrypt.decrypt( params.locationId );

            if(params.accountId){
                this.accountId = this.encryptDecrypt.decrypt( params.accountId );
                this.queries.account_id = this.accountId;
            }

            this.arrLocationIds = this.locationId.toString().split('-');            
        	this.getLocationReport();
        });

	}

	ngAfterViewInit(){
        this.print = new PrintService({
            content : this.printContainer.nativeElement.outerHTML
        });
        $('#selectCompliant').material_select();
        this.filterByCompliance();
        this.searchUser();
    }
    
    filterByCompliance() {

        let self = this;
        $('#selectCompliant').on('change', (e) => {
            
            self.dashboardPreloader.show();
            self.loadingTable =  true;
            let compliant = parseInt($('#selectCompliant').val());
            let copy = [];            
            if (self.results.length == 0) {
                self.results = self.reportsData;
            }            
            
            self.results = [];
            if (compliant == -1) {
                self.results = self.reportsData;
            } else {
                
                for (let user of self.reportsData) {                    
                    if (parseInt(user['training'],10) == compliant) {
                        self.results.push(user);
                    }
                }
            }
            setTimeout(() => {
                self.dashboardPreloader.hide();
                this.loadingTable = false;
            }, 500);
        }).material_select();
    }

    generateReportDataForExport(){
        this.pdfLoader = true;
        this.csvLoader = true;

        let backUpQueries = this.queries;

        this.queries.nofilter_except_location = true;

        this.getLocationReport((response:any) => {
            this.exportData = response.data;
            this.pdfLoader = false;
            this.csvLoader = false;
        }, true);

        this.queries.nofilter_except_location = false;
    }

    

	getLocationReport(callBack?, forExport?){        
        this.queries.location_id = this.locationId;
        this.reportService.generateWardenTrainingReport({
            location_id: this.arrLocationIds.join('-')
        }).subscribe((response) => {            
            this.results = response['list'];
            this.reportsData = response['list'];
            this.total_records = this.reportsData.length;
            this.loadingTable = false;
            this.dashboardPreloader.hide();
        }, (error) => {
            console.log(error);
            this.loadingTable = false;
            this.dashboardPreloader.hide();
        });

		
	}

	printResult(){
        this.print.print(this.printContainer.nativeElement.outerHTML);
	}

    pdfExport(aPdf, printContainer) {
       this.reportService.generateWardenTrainingReport({
        location_id: this.arrLocationIds.join('-'),
        convert: 'pdf'
        }, true).subscribe((data) => {
            const blob = new Blob([data['body']], {type: 'application/pdf'}); 
            let timestamp = new Date().getTime();
            FileSaver.saveAs(blob, `training_report_${timestamp}.pdf`);
        }, (error) => {
            console.log(error);
        });
    }

    csvExport(){
        
       let a = document.createElement("a");
       this.reportService.generateWardenTrainingReport({
        location_id: this.arrLocationIds.join('-'),
        convert: 'csv'
        }).subscribe((response) => {
            const blob = new Blob([response['csv_data']], {type: 'application/octet-stream'});
            let timestamp = new Date().getTime();
            FileSaver.saveAs(blob, `training_report_${timestamp}.csv`);
        }, (error) => {
            console.log(error);
        });
    }

    ngOnDestroy(){
        this.routeSubs.unsubscribe();
        this.searchSub.unsubscribe();
    }

    searchUser() {
        this.searchSub =  Observable.fromEvent(this.searchMember.nativeElement, 'keyup').debounceTime(800).subscribe((event: KeyboardEvent) => {
            this.loadingTable = true;
            $('#selectCompliant').val('-1').material_select();

            const searchKey = (<HTMLInputElement>event.target).value;
            this.results = [];
            console.log(searchKey);
            if (searchKey.length == 0) {
                this.results = this.reportsData;
                this.loadingTable = false;
                
            } else {
                let key = searchKey.toLocaleLowerCase();
                for (let user of this.reportsData) {
                    if(user['name'].toLowerCase().search(key) !== -1) {
                        this.results.push(user);
                    }
                } 
                this.loadingTable = false;
            }
            
        });
    }

}
