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
import html2canvas from 'html2canvas';
// import * as jsPDF from 'jspdf';
import * as moment from 'moment';
import { PrintService } from '../../services/print.service';

declare var $: any;
// declare var jsPDF: any;

@Component({
    selector : 'app-warden-report-component',
    templateUrl : './warden.component.html',
    styleUrls : [ './warden.component.css' ],
    providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, CourseService, ExportToCSV ]
})

export class WardenReportsComponent implements OnInit, OnDestroy {
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
        compliant: 1,
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

        this.routeSubs = this.activatedRoute.params.subscribe((params) => {
            this.locationId = this.encryptDecrypt.decrypt( params.locationId );
            this.arrLocationIds = this.locationId.toString().split('-');
        });
    }

    ngOnInit() {
    }

    ngAfterViewInit(){

        $('body').off('close.location').on('close.location', '.select-wrapper.select-location input.select-dropdown', (e) => {
            e.preventDefault();
            let values = $('#selectLocation').val(),
                urlparam = '';

            urlparam = values.join('-');

            console.log('urlparam', urlparam);

            if( this.arrLocationIds.join('-') != urlparam ){
                if(values.indexOf('0') > -1){
                    $('#selectLocation option').prop('selected', false);
                    $('#selectLocation option[value="0"]').prop('selected', true);
                    $('#selectLocation').material_select();
                    urlparam = '0';
                }

                this.queries.offset = 0;
                this.loadingTable = true;
                this.dashboardPreloader.show();

                if(this.userData['evac_role'] == 'admin'){
                    this.router.navigate(['/admin/warden-report/' + this.encryptDecrypt.encrypt(urlparam) + "/" + this.encryptDecrypt.encrypt(this.accountId) ]);
                }else{
                    this.router.navigate(['/reports/warden/' + this.encryptDecrypt.encrypt(urlparam) ]);
                }
            }

        });

        this.print = new PrintService({
            content : this.printContainer.nativeElement.outerHTML
        });

        // this.dashboardPreloader.show();

        this.searchUser();
    }

    getWardenListReport(callBack?){
        this.reportService.getWardenListReport((response) => {


            if(callBack){
                callBack(response);
            }
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

            this.getWardenListReport((response:any) => {
                this.loadingTable = false;
            });
        }
    }

    printResult(){
        this.print.print(this.printContainer.nativeElement.outerHTML);
    }

    pdfExport(aPdf, printContainer){
        let a = document.createElement("a"),
        accntId = (this.accountId) ? this.accountId : this.userData["accountId"];
        a.href = location.origin+"/reports/pdf-location-trainings/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"];
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();
    }

    csvExport(){
        let a = document.createElement("a"),
        accntId = (this.accountId) ? this.accountId : this.userData["accountId"];
        a.href = location.origin+"/reports/csv-location-trainings/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"];
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();

        a.remove();
    }

    ngOnDestroy(){
        this.routeSubs.unsubscribe();
        this.searchSub.unsubscribe();
    }

    searchUser() {

        this.searchSub =  Observable.fromEvent(this.searchMember.nativeElement, 'keyup').debounceTime(800).subscribe((event: KeyboardEvent) => {
            const searchKey = (<HTMLInputElement>event.target).value;
            console.log(searchKey);
        });
    }

}
