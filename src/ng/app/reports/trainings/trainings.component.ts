import { Subscription } from 'rxjs/Subscription';
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Observable } from 'rxjs/Rx';

declare var $: any;

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

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 25,
        offset : 0,
        location_id : 0,
        course_method : 'none',
        searchKey: ''
    };

    loadingTable = false;

    searchSub: Subscription;
  @ViewChild('searchMember') searchMember: ElementRef;
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

			this.getLocationReport((response) => {
                this.dashboardPreloader.hide();
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }
            });
		});

	}

	ngOnInit(){
		this.reportService.getParentLocationsForReporting().subscribe((response) => {
			this.rootLocationsFromDb = response['data'];
		}, (e) => {
			console.log(e);
		});
	}

	ngAfterViewInit(){
		$('.left.filter-container select').material_select();
    this.searchUser();
		/*$('#selectLocation').val(this.locationId).material_select('update');
		$('#selectLocation').off('change.selectlocation').on('change.selectlocation', () => {

			let selVal = $('#selectLocation').val(),
			encId = this.encryptDecrypt.encrypt( selVal );

			this.router.navigate([ '/reports/trainings/', encId]);
		});*/

		$('#selectFilter').off('change.filter').on('change.filter', () => {

			let selVal = $('#selectFilter').val();
            if(selVal == 'offline'){
                this.queries.course_method = 'offline';
            }else if(selVal == 'online'){
                this.queries.course_method = 'online';
            }else{
                this.queries.course_method = '';
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

        this.dashboardPreloader.show();
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

	getLocationReport(callBack?){
		this.queries.location_id = this.locationId;

		this.reportService.getLocationTrainingReport(this.queries).subscribe((response:any) => {
			this.results = response['data'];
			this.backupResults = JSON.parse( JSON.stringify(this.results) );

            this.pagination.pages = response.pagination.pages;
            this.pagination.total = response.pagination.total;

            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            callBack(response);
		});
	}

	printResult(){
		let locName = 'All Locations';
		for(let loc of this.rootLocationsFromDb){
			if(loc['location_id'] == this.locationId){
				locName = loc.name;
			}
		}

		let headerHtml = `<h5> Training Report </h5>`;

		$('#printContainer').printThis({
			importCSS: true,
			importStyle: true,
			loadCSS: [ "/assets/css/materialize.css" ],
			header : headerHtml
		});
	}

	ngOnDestroy(){
    this.routeSubs.unsubscribe();
    this.searchSub.unsubscribe();
  }

  searchUser() {
    this.searchSub =  Observable.fromEvent(this.searchMember.nativeElement, 'keyup')
    .debounceTime(800).subscribe((event: KeyboardEvent) => {
      const searchKey = (<HTMLInputElement>event.target).value;
      console.log(searchKey);

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
      });

    });
  }

}
