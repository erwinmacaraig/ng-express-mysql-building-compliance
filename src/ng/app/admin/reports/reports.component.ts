import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Observable } from 'rxjs';
declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  providers: [AdminService, DashboardPreloaderService]
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

    constructor(
        private adminService: AdminService
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
                }
            }
        );
    }

    generateReport(){
        let reportType = this.selectReportType.nativeElement.value;
        if( (reportType != 0) && (Object.keys(this.selectedLocation).length > 0  || this.inpAllLocs.nativeElement.checked == true) ){
            let form = {
                type : reportType,
                location_id : (!this.inpAllLocs.nativeElement.checked) ? this.selectedLocation.location_id : 0,
                account_id : (Object.keys(this.selectedAccount).length > 0) ? this.selectedAccount.account_id : 0,
                page : 0,
                limit : 25
            };

            this.adminService.generateAdminReport(form).subscribe((reponse:any) => {

            });
        }
    }

    ngOnDestroy(){
        this.searchAccountSubs.unsubscribe();
        this.searchLocationsSubs.unsubscribe();

        document.querySelector('body').removeEventListener('click', this.clickBodyEvent);
    }
}