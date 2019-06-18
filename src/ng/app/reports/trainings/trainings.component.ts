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
	backupResults = [];
	routeSubs;
    locationId = 0;
    accountId = 0;
	arrLocationIds = [];

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
        /*
        let a = document.createElement("a"),
        accntId = (this.accountId) ? this.accountId : this.userData["accountId"],
        compliant = this.queries.compliant,
        trainingId = this.queries.training_id,
        method = this.queries.course_method,
        search = (this.searchMember.nativeElement.value.trim().length == 0) ? ' ' : this.searchMember.nativeElement.value;
        
        a.href = environment.backendUrl + "/reports/pdf-location-trainings/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+search+"/"+trainingId+"/"+method+"/"+compliant;
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();
        */
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
        //this.searchSub.unsubscribe();
    }

    searchUser() {

        this.searchSub =  Observable.fromEvent(this.searchMember.nativeElement, 'keyup').debounceTime(800).subscribe((event: KeyboardEvent) => {
            const searchKey = (<HTMLInputElement>event.target).value;
            // console.log(searchKey);
            this.loadingTable = true;

            this.queries.searchKey = searchKey;
            this.reportService.getLocationTrainingReport(this.queries).subscribe((response: any) => {
                this.results = response['data'];
                this.backupResults = JSON.parse( JSON.stringify(this.results) );
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;
                this.pagination.selection = [];
                for (let i = 1; i <= this.pagination.pages; i++) {
                  this.pagination.selection.push({ 'number' : i });
                }
                this.loadingTable = false;
            });

        });
    }

}
