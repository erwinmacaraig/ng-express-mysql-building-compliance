import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef, Input, TemplateRef  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ExportToCSV } from '../../services/export.to.csv';
import { Observable } from 'rxjs';
declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [AdminService, DashboardPreloaderService, ExportToCSV]
})

export class AdminReportsComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('searchAccountContainer') searchAccountContainer : ElementRef;
    @ViewChild('searchLocationContainer') searchLocationContainer : ElementRef;
    @ViewChild('inpAllLocs') inpAllLocs : ElementRef;
    @ViewChild('selectReportType') selectReportType : ElementRef

    searchAccountSubs;
    searchLocationsSubs;

    searchedAccounts = [];
    searchedLocations = [];

    selectedAccount = <any> {};
    selectedLocation = <any> {};

    hideFormField = false;
    hideTrainingReport = true;
    hidePagination = true;
    hideLocationReport = true;
    hideAccountReport = true;

    trainingReportData = [];
    locationReportData = [];
    accountReportData = [];

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : [], limit : 25, offset : 0
    };

    reportType = '';
    exportData = <any> [];
    csvLoader = true;

    constructor(
        private adminService: AdminService,
        private dashboardPreloader: DashboardPreloaderService,
        private exportToCSV: ExportToCSV
    ){

    }

    ngOnInit(){
        
    }

    ngAfterViewInit(){
        this.searchAccountEvent();
        this.searchLocationEvent();
        this.dismissSearchEvent();

        this.inpAllLocs.nativeElement.addEventListener('change', (event:any) => {
            let elemsLocs = this.getInputSearchLoaderElems(this.searchLocationContainer.nativeElement);
            if(event.target.checked){
                this.selectedLocation = {};
                elemsLocs.input.value = '';
            }
        });
    }

    clickSelectFromSearch(type, data, event, parent?){
        event.stopPropagation();
        let 
        elemsAccnts = this.getInputSearchLoaderElems(this.searchAccountContainer.nativeElement),
        elemsLocs = this.getInputSearchLoaderElems(this.searchLocationContainer.nativeElement);
        if(type == 'account'){
            this.selectedAccount = data;
            elemsAccnts.input.value = data.account_name;
            this.selectedLocation = {};
            elemsLocs.input.value = '';
        }else{
            this.selectedLocation = data;
            elemsLocs.input.value = (parent)? parent.name+' - '+data.name : data.name;
            this.inpAllLocs.nativeElement.checked = false;
        }

        elemsAccnts.searchResult.style.display = 'none';
        elemsLocs.searchResult.style.display = 'none';
    }

    clickBodyEvent(event:any){
        let 
        elemsAccnts = this.getInputSearchLoaderElems(this.searchAccountContainer.nativeElement),
        elemsLocs = this.getInputSearchLoaderElems(this.searchLocationContainer.nativeElement);

        elemsAccnts.searchResult.style.display = 'none';
        elemsLocs.searchResult.style.display = 'none';
    }

    dismissSearchEvent(){
        document.querySelector('body').addEventListener('click', this.clickBodyEvent.bind(this));
    }

    getInputSearchLoaderElems(container){
        let 
        input = container.querySelector('.round-input'),
        searchResult = container.querySelector('.search-result'),
        loader = container.querySelector('.loading');

        return {
            'input' : input, 'searchResult' : searchResult, 'loader' : loader
        };
    }

    searchEvent(container, callable){
        let  elems = this.getInputSearchLoaderElems(container);

        return Observable.fromEvent(elems.input, 'keyup')
        .debounceTime(400)
        .distinctUntilChanged()
        .subscribe((event) => {
            let key = elems.input.value.trim();
            if(key.length > 0){
                elems.searchResult.style.display = 'none';
                elems.loader.style.display = 'block';
                callable(key, () => {
                    elems.searchResult.style.display = 'block';
                    elems.loader.style.display = 'none';
                });
            }else{
                elems.searchResult.style.display = 'none';
                elems.loader.style.display = 'none';
                callable(false);
            }
        });

    }

    searchAccountEvent(){
        this.searchAccountSubs = this.searchEvent(
            this.searchAccountContainer.nativeElement,
            (key, callback?) => {
                if(key){
                    this.adminService.getAccountListingForAdmin(0, key).subscribe((response) => {
                        this.searchedAccounts = Object.keys(response['data']['list']).map((key) => {
                            return response['data']['list'][key];
                        });
                        if(callback){
                            callback();
                        }
                    });
                }else{
                    this.selectedAccount = {};
                }
            }
        );
    }

    searchLocationEvent(){
        this.searchLocationsSubs = this.searchEvent(
            this.searchLocationContainer.nativeElement,
            (key, callback?) => {
                if(key){
                    let param = { 'sublocations' : true, 'limit' : 5, 'account_id' : (this.selectedAccount['account_id']) ? this.selectedAccount.account_id : 0 };
                    this.adminService.searchLocationByName(key, param).subscribe((response:any) => {
                        this.searchedLocations = response.data;
                        if(callback){
                            callback();
                        }
                    });
                }else{
                    this.selectedLocation = {};
                    this.inpAllLocs.nativeElement.checked = true;
                }
            }
        );
    }

    generateExportData(){
        this.callGenerateReport((response:any) => {
            this.exportData = response.data;
            this.csvLoader = false;
        }, {
            type : this.reportType,
            location_id : (!this.inpAllLocs.nativeElement.checked) ? this.selectedLocation.location_id : 0,
            account_id : (Object.keys(this.selectedAccount).length > 0) ? this.selectedAccount.account_id : 0,
            offset : 0,
            limit : this.pagination.total
        });
    }

    generateReport(){
        this.reportType = this.selectReportType.nativeElement.value;
        if( (this.reportType != '0') && (Object.keys(this.selectedLocation).length > 0  || this.inpAllLocs.nativeElement.checked == true) ){
            this.hideFormField = true;
            this.hideTrainingReport = true;
            this.hideLocationReport = true;
            this.hideAccountReport = true;

            this.dashboardPreloader.show();
            this.callGenerateReport((response:any) => {
                if(this.reportType == 'training'){
                    this.hideTrainingReport = false;
                    this.trainingReportData = response.data;
                }else if(this.reportType == 'location'){
                    this.hideLocationReport = false;
                    this.locationReportData = response.data;
                }else if(this.reportType == 'account'){
                    this.hideAccountReport = false;
                    this.accountReportData = response.data;
                }

                this.pagination.currentPage = 1;
                this.hidePagination = false;
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;
                this.pagination.selection = [];
                for(let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }
                setTimeout(() => {
                    this.dashboardPreloader.hide();
                }, 500);

                this.generateExportData();
            });
        }
    }

    callGenerateReport(callBack, paramForm?){
        let form = {
            type : this.reportType,
            location_id : (!this.inpAllLocs.nativeElement.checked) ? this.selectedLocation.location_id : 0,
            account_id : (Object.keys(this.selectedAccount).length > 0) ? this.selectedAccount.account_id : 0,
            offset : this.pagination.offset,
            limit : this.pagination.limit
        };

        if(paramForm){
            form = paramForm;
        }
        
        this.adminService.generateAdminReport(form).subscribe((response:any) => {
            callBack(response);
        });
    }

    goBackClickEvent(){
        this.hideFormField = false;
        this.hideTrainingReport = true;
        this.hidePagination = true;
        this.hideLocationReport = true;
        this.hideAccountReport = true;
        this.csvLoader = true;
        this.pagination.offset = 0;
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
            let offset = (this.pagination.currentPage * this.pagination.limit) - this.pagination.limit;
            this.pagination.offset = offset;
            this.pagination.limit = 25;
            this.dashboardPreloader.show();
            this.callGenerateReport((response:any) => {
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;
                this.pagination.selection = [];
                for(let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }
                if(this.reportType == 'training'){
                    this.trainingReportData = response.data;
                }else if(this.reportType == 'location'){
                    this.locationReportData = response.data;
                }else if(this.reportType == 'account'){
                    this.accountReportData = response.data;
                }
                setTimeout(() => {
                    this.dashboardPreloader.hide();
                }, 500);
            });
            window.scroll(0, 0);
        }
    }

    csvExport(){
        let 
        csvData = {},
        columns = [],
        getLength = () => {
            return Object.keys(csvData).length;
        },
        title =  "";

        if(this.reportType == 'training'){
            title = 'Training Report';
            columns = ["Locations", "Account", "Name", "Email", "Training Status", "Emergency Role", "Expiration Date"];
        }else if(this.reportType == 'location'){
            title = 'Location Report';
            columns = ["Locations", "Account", "Name", "Email", "Phone/Mobile", "Emergency Role", "Mobility Impaired"];
        }else if(this.reportType == 'account'){
            title = 'Account Report';
            columns = ["Locations", "Account", "Name", "Account Role", "Email", "Last Logged In"];
        }

        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        if(this.exportData.length == 0){
            csvData[ getLength() ] = [ "No record found" ];
        }else{

            for(let log of this.exportData){
                if(this.reportType == 'training'){
                    let 
                    locNames = log.locations.join(', '),
                    roles = log.em_roles.join(', ');

                    csvData[ getLength() ] = [ locNames, log.account_name, log.full_name, log.email, log.status, roles, log.expiry_date_formatted ];
                }else if(this.reportType == 'location'){
                    let 
                    impaired = (log.mobility_impaired == 1) ? 'yes' : 'no',
                    phoneMobile = log.phone_number;
                    phoneMobile += (log.phone_number.trim().length > 0 && log.mobile_number.trim().length > 0) ? ' / ' : ' ';
                    phoneMobile += log.mobile_number;

                    csvData[ getLength() ] = [ log.location_name, log.account_name, log.first_name+' '+log.last_name, log.email, phoneMobile, log.role_name, impaired ];
                }else if(this.reportType == 'account'){
                    let 
                    locNames = log.locations.join(' | '),
                    roles = log.roles.join(', ');
                    
                    csvData[ getLength() ] = [ locNames, log.account_name, log.first_name+' '+log.last_name, roles, log.email, log.last_login_formatted ];
                }
            }

        }

        this.exportToCSV.setData(csvData, this.reportType+'-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

    ngOnDestroy(){
        this.searchAccountSubs.unsubscribe();
        this.searchLocationsSubs.unsubscribe();

        document.querySelector('body').removeEventListener('click', this.clickBodyEvent);
    }
}