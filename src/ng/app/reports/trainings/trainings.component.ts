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

declare var $: any;
// declare var jsPDF: any;

@Component({
	selector : 'app-trainings-compliance-component',
	templateUrl : './trainings.component.html',
	styleUrls : [ './trainings.component.css' ],
	providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, CourseService, ExportToCSV ]
})

export class ReportsTrainingsComponent implements OnInit, OnDestroy {

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

    loadingTable = false;

    trainingRequirements = [];

    searchSub: Subscription;
    @ViewChild('searchMember') searchMember: ElementRef;

    pdfLoader = false;
    csvLoader = false;
    exportData = [];
    exportFetchMarker = {};

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

            if(params.accountId){
                this.accountId = this.encryptDecrypt.decrypt( params.accountId );
                this.queries.account_id = this.accountId;
            }

            this.arrLocationIds = this.locationId.toString().split('-');

        	this.getLocationReport((response) => {
                this.dashboardPreloader.hide();
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }

                this.generateReportDataForExport();
            });
        });

        this.reportService.getParentLocationsForReporting().subscribe((response) => {
            this.rootLocationsFromDb = response['data'];

            setTimeout(() => {

                if(this.locationId == 0){
                    $('#selectLocation option[value="0"]').prop('selected', true);
                }else{
                    $('#selectLocation option[value="0"]').prop('selected', false);
                    for(let i in this.arrLocationIds){
                        $('#selectLocation option[value="'+this.arrLocationIds[i]+'"]').prop('selected', true);
                    }
                }

                $('#selectLocation').material_select(() => {
                    let values = $('#selectLocation').val(),
                        urlparam = '';

                    urlparam = values.join('-');


                });
            },100);
        });

        this.courseService.getTrainingRequirements((response) => {
            this.trainingRequirements = response.data;

            let selectFilter = $('#selectFilter');
            for(let training of this.trainingRequirements){
                selectFilter.append(' <option value="training-'+training.training_requirement_id+'">'+training.training_requirement_name+'</option> ');
            }

            selectFilter.material_select();
        });
	}

	ngOnInit() {
	}

	ngAfterViewInit(){
        this.searchUser();
		$('#selectFilter').off('change.filter').on('change.filter', () => {

			let selVal = $('#selectFilter').val();
            if(selVal == 'offline'){
                this.queries.course_method = 'offline';
            }else if(selVal == 'online'){
                this.queries.course_method = 'online';
            }else if(selVal.indexOf('training-') > -1){
                let trainingId = selVal.replace('training-', '');
                this.queries.training_id = trainingId;
            }else{
                this.queries.course_method = '';
                this.queries.training_id = 0;
            }


            this.queries.offset = 0;
            this.loadingTable = true;

            this.getLocationReport((response:any) => {
                this.loadingTable = false;
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }else{
                    this.pagination.currentPage = 0;
                }
            });

        });

        $('body').off('close.location').on('close.location', '.select-wrapper.select-location input.select-dropdown', (e) => {
            e.preventDefault();
            let values = $('#selectLocation').val(),
                urlparam = '';

            urlparam = values.join('-');

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
                this.router.navigate(['/reports/trainings/' + this.encryptDecrypt.encrypt(urlparam)]);
            }

        });

        $('#compliantToggle').off('change.compliant').on('change.compliant', () => {
            let checked = $('#compliantToggle').prop('checked');
            if(checked){
                this.queries.compliant = 1;
            }else{
                this.queries.compliant = 0;
            }

            this.queries.offset = 0;
            this.loadingTable = true;

            this.reportService.getLocationTrainingReport(this.queries).subscribe((response:any) => {
              this.results = response['data'];
              this.backupResults = JSON.parse( JSON.stringify(this.results) );
              this.pagination.pages = response.pagination.pages;
              this.pagination.total = response.pagination.total;

              this.pagination.selection = [];
              for(let i = 1; i<=this.pagination.pages; i++){
                  this.pagination.selection.push({ 'number' : i });
              }
              this.loadingTable = false;
            });
        });

        this.dashboardPreloader.show();
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

            this.getLocationReport((response:any) => {
                this.loadingTable = false;
            });
        }
    }

	getLocationReport(callBack?, forExport?){
        this.queries.location_id = this.locationId;
		this.reportService.getLocationTrainingReport(this.queries).subscribe((response:any) => {
            if(!forExport){
    			this.results = response['data'];
                this.backupResults = JSON.parse( JSON.stringify(this.results) );
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;

                this.pagination.selection = [];
                for (let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }

                this.loadingTable = false;
            }
            callBack(response);
        });
	}

	printResult(){
    /*
		let headerHtml = `<h5> Training Report </h5>`;

		$('#printContainer').printThis({
			importCSS: true,
			importStyle: true,
			loadCSS: [ "/assets/css/materialize.css" ],
			header : headerHtml
    });
    */
	}

    pdfExport(aPdf, printContainer){
      /*
        let
        pdf = new jsPDF("p", "pt"),
        columns = [
            {
                title : 'User', dataKey : 'user'
            },
            {
                title : 'Training Name', dataKey : 'name'
            },
            {
                title : 'Training Date', dataKey : 'date'
            },
            {
                title : 'Status', dataKey : 'status'
            }
        ],
        rows = [];

        pdf.text('Training Report', 20, 40);

        for(let re of this.exportData){
            let statusTxt = (re.status == 'valid' && re.pass == 1) ? 'Compliant' : 'Not Compliant';

            rows.push({
                user : re.first_name+' '+re.last_name,
                name : re.training_requirement_name,
                date : re.certification_date_formatted,
                status : statusTxt
            });
        }

        pdf.autoTable(columns, rows, {
            theme : 'grid',
            margin: 20,
            startY: 60,
            styles : {
                fontSize: 8,
                overflow: 'linebreak'
            },
            headerStyles : {
                fillColor: [50, 50, 50], textColor: 255
            },
            columnStyles : { status : { columnWidth : 70 }, date : { columnWidth : 70 } }
        });

        let pages = pdf.internal.getNumberOfPages();
        for(let i=1; i<=pages; i++){
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.text('Downloaded from EvacServices : '+moment().format('DD/MM/YYYY hh:mmA'), (pdf.internal.pageSize.width / 2) + 80, pdf.internal.pageSize.height - 10 );
        }

        pdf.save('training-report-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');
        */
    }

    csvExport(){
        let csvData = {},
            columns = [  "User", "Training Name", "Training Date", "Status" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        let title =  "Training Report ";
        if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }

        csvData[ getLength() ] = [title];

        if(this.results.length == 0){
            csvData[ getLength() ] = " No record found ";
        }else{

            for(let re of this.exportData){
                let d = [];
                d.push( re.first_name+' '+re.last_name );
                d.push( re.training_requirement_name );
                d.push( re.certification_date_formatted );
                if(re.status == 'valid' && re.pass == 1){
                    d.push( 'Compliant' );
                }else{
                    let desc = '(Not Taken)';
                    if(re.pass == 0){
                        desc = '(Failed)';
                    }else if(re.status == 'expired'){
                        desc = '(Expired)';
                    }
                    d.push( 'Not Compliant '+desc );
                }
                csvData[ getLength() ] = d;
            }

        }


        this.exportToCSV.setData(csvData, 'trainings-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

    ngOnDestroy(){
        this.routeSubs.unsubscribe();
        this.searchSub.unsubscribe();
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
