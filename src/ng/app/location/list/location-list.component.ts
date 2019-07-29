import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../../environments/environment';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute, NavigationStart, NavigationEnd } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ComplianceService } from '../../services/compliance.service';
import { AuthService } from '../../services/auth.service';
import { Observable, Subject } from 'rxjs/Rx';
import { ExportToCSV } from '../../services/export.to.csv';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/takeUntil';

import { Countries } from '../../models/country.model';
import { Timezone } from '../../models/timezone';
import { UserService } from '../../services/users';
import { MessageService } from '../../services/messaging.service';
import { Subscription } from 'rxjs/Subscription';
declare var moment: any;
declare var $: any;
@Component({
  selector: 'app-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService, ComplianceService, AccountsDataProviderService, EncryptDecryptService, ExportToCSV]
})
export class LocationListComponent implements OnInit, OnDestroy {

	@ViewChild('inpSearchLoc') inpSearchLoc;
	@ViewChild('tbodyElem') tbodyElem;
	@ViewChild('formAddTenant') formAddTenant : NgForm;
    @ViewChild('inputSearch') inputSearch : ElementRef;

	locations = [];
	locationsBackup = [];
	private baseUrl: String;
	private options;
	private headers;
	// private accountData = { account_name : " " };
	public userData: Object;
	private mutationOversable;
  	locationToApplyActionTo: number;
	arraySelectedLocs = [];
	selectedArchive = {
		length : 0
	};

    private myLocations = [];

	modalArchiveBulk = {
		loader : false
	};

	modalArchive = {
		loader : false
	};

	showModalNewTenantLoader = false;
	selectedLocation = {
		name : '',
		location_id : '',
		sublocations : []
	};

	countries = new Countries().getCountries();
    timezones = new Timezone().get();
    defaultCountry = 'AU';
    defaultTimeZone = 'AEST';
    public account_name;
    public key_contact_name;
    public key_contact_lastname;
    public emailTaken = false;

    isFRP = false;
    isTRP = false;

    loadingTable = false;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        offset :  0,
        limit : 10,
        search : '',
        sort : '',
        archived : 0,
        showparentonly: true,
        parent_id : 0
    };

    searchSubs;

    paramArchived = <any> false;
    routerSubs;

    showLoadingSublocations = false;
    viewWardens = [];

    underLocationData = {
        location_id : 0
    };

    miscDetails = {};
    complianceSubs:Subscription[] = [];
    protected ngUnsubscribe: Subject<void> = new Subject<void>();
    constructor (      
      private auth: AuthService,
      private preloaderService: DashboardPreloaderService,
      private locationService: LocationsService,      
      private encryptDecrypt: EncryptDecryptService,
      private complianceService : ComplianceService,
      private router: Router,
      private actRouter: ActivatedRoute,
      private elemRef : ElementRef,
      private userService : UserService,
      private messageService : MessageService,
      private exportToCSV: ExportToCSV
    ) {

        this.baseUrl = environment.backendUrl;        
        this.options = { headers : this.headers };
        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.userData = this.auth.getUserData();
        /*
    	this.accntService.getById(this.userData['accountId'], (response) => {
	      	this.accountData = response.data;
        });
        */

		this.mutationOversable = new MutationObserver((mutationsList) => {
			mutationsList.forEach((mutation) => {
				if(mutation.target.nodeName != '#text'){
					let target = $(mutation.target);
					if(target.find('select.select-from-row:not(.initialized)').length > 0){

						target.find('select.select-from-row:not(.initialized)').material_select();

					}
				}
			});
		});

		this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });

        for(let rol of this.userData['roles']){
            if(rol.role_id == 1){
                this.isFRP = true;
            }
            if(rol.role_id == 2){
                this.isTRP = true;
            }
        }
  	}

	ngOnInit(){
        this.routerSubs = this.actRouter.queryParams.subscribe((params) => {
            if(params.undrlocid){
                this.queries.parent_id = this.encryptDecrypt.decrypt(params.undrlocid);
            }else{
                this.queries.parent_id = 0;
            }

            if(params.archived){
                this.queries.offset = 0;
                if(params.archived == 'true'){
                    this.paramArchived = true;
                    this.queries.archived = 1;
                }else{
                    this.paramArchived = false;
                    this.queries.archived = 0;
                }
            }
            
        });
        
	}

	getLocationsForListing(callback?){
        this.locations = [];
        
        this.userService.listUserAccountLocations().subscribe((response) => {
            let bldgCtr = [];
            for(let loc of response.locations) {                
                if (bldgCtr.indexOf(loc['building_id']) == -1) {                    
                    bldgCtr.push(loc['building_id']);
                    loc['fetchingCompliance'] = true;                    
                    loc['compliance_percentage'] = 0;                    
                    loc['parent_id'] =  this.encryptDecrypt.encrypt(loc['building_id']);
                    this.locations.push(loc);                    
                }
                this.complianceService.locationComplianceSupportDetails(loc['location_id']).subscribe((resp) => {
                    let oldWardens = [];
                    let oldImpaired = [];
                    
                    if (loc['building_id'] in this.miscDetails) {
                        let  combiWardens = [];
                        let combiImpaired = [];
                        oldWardens = (this.miscDetails[loc['building_id']]['wardenUserIds'] as Array<number>).concat(resp.wardenUserIds);
                        for (let warden of oldWardens) {
                            if (combiWardens.indexOf(warden) == -1) {
                                combiWardens.push(warden);
                            }
                        }

                        oldImpaired = (this.miscDetails[loc['building_id']]['mobilityImpairedIds'] as Array<number>).concat(resp.mobilityImpairedIds)
                        for (let impaired of oldImpaired) {
                            if (combiImpaired.indexOf(impaired) == -1) {
                                combiImpaired.push(impaired);
                            }
                        }
                        for(let warden of (resp.warden as Array<object>)) {
                            (this.miscDetails[loc['building_id']]['warden'] as Array<object>).push(warden);
                        }
                        
                        this.miscDetails[loc['building_id']]['mobility_impaired'] = combiImpaired.length;
                        this.miscDetails[loc['building_id']]['mobilityImpairedIds'] = combiImpaired;

                        this.miscDetails[loc['building_id']]['num_wardens'] = combiWardens.length;
                        this.miscDetails[loc['building_id']]['wardenUserIds'] = combiWardens;                        
                        this.miscDetails[loc['building_id']]['sublocation_count'] += 1;
                        

                    } else {                        
                        this.miscDetails[loc['building_id']] = {
                            sublocation_count: resp.sublocation_count,
                            num_tenants: resp.num_tenants,
                            warden:  resp.warden,
                            num_wardens:  resp.wardenUserIds.length,
                            wardenUserIds: resp.wardenUserIds,
                            mobility_impaired: resp.mobilityImpairedIds.length,
                            mobilityImpairedIds: resp.mobilityImpairedIds
                        }
                    }    

                    
                }, (error) => {
                    this.miscDetails[loc['building_id']] = {
                        sublocation_count: 0,
                        num_tenants: 0,
                        warden: [],
                        num_wardens:  0,
                        wardenUserIds: [],
                        mobility_impaired: 0,
                        mobilityImpairedIds: []
                    }
                    console.log(error);
                });
                
            }
            let complianceSubCtr = 0;
            for (let loc of this.locations) {
                this.complianceService.getBuildingLocationCompliance(loc['building_id'])
                .takeUntil(this.ngUnsubscribe)
                .subscribe((compRes) => {
                    loc['fetchingCompliance'] = false;
                    loc['compliance_percentage'] = compRes['percent'];
                    loc['compliance'] = compRes['data'];
                    this.myLocations.push(loc);
                    setTimeout(() => {
                        $('select.select-from-row option').prop('disabled', false);
                        $('select.select-from-row').material_select();
                    }, 200);
                });
                
            }            
            this.messageService.sendMessage({ 'breadcrumbs' : [] });
            
            callback();
        }, (error) => {
            console.log(error);
            this.preloaderService.hide();
        }); 
	}

	ngAfterViewInit(){
		this.preloaderService.show();
		
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .active').removeClass('active');
		$('.location-navigation .view-location').addClass('active');

		$('.modal').modal({
			dismissible: false
        });
        
        this.getLocationsForListing(() => {
            this.preloaderService.hide();
            $('.filter-container select').material_select();

            if (localStorage.getItem('showemailverification') !== null) {
              this.router.navigate(['/location', 'search']);
            }
        });
        


		this.selectRowEvent();
		this.selectFilteringEvent();
		

		let formAddTenant = this.formAddTenant;      

        $('body').off('change.locationchange').on('change.locationchange', 'select.location-id', (event) => {
            formAddTenant.controls.location_id.setValue( event.currentTarget.value );
        });

        this.searchLocationEvent();

        $('.pagination select').material_select('destroy');
	}



	selectRowEvent(){

		$('body').off('change.selectchangeevent').on('change.selectchangeevent', 'select.select-from-row', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();
			if(val.indexOf('view-') > -1){
				let locIdEnc = val.replace('view-', '');
				this.router.navigate(["/location/view/", locIdEnc]);
			} else if(val.indexOf('compliance-') > -1){
            	let locIdEnc = val.replace('compliance-', '');
                this.router.navigate(['/location/compliance/view/', locIdEnc]);            	

            }

            target.val(0).material_select();

		});
	}
	selectFilteringEvent(){
		$('body').off('change.sortby').on('change.sortby', 'select.sort-by', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();
            this.queries.sort = val;
            this.queries.offset = 0;
            this.loadingTable = true;            
            if (val == 'name-asc') {
                this.locations.sort((a, b) => {
                    if(a.name < b.name) return -1;
                    if(a.name > b.name) return 1;
                    return 0;
                }); 
            } else if (val == 'name-desc') {
                this.locations.sort((a, b) => {
                    if(a.name > b.name) return -1;
                    if(a.name < b.name) return 1;
                    return 0;
                });
            } else {
                this.locations = this.myLocations;
            }
            this.loadingTable = false;
            
		});
	}

	searchLocationEvent(){
        let thisClass = this;

		this.searchSubs = Observable.fromEvent(this.inputSearch.nativeElement, 'keyup')
        .debounceTime(800).distinctUntilChanged().subscribe((event:KeyboardEvent) => {
            thisClass.queries.limit = 10;
            thisClass.queries.offset = 0;
            thisClass.queries.search = this.inputSearch.nativeElement['value'];
            thisClass.queries.sort = $('.sort-by select').val();
            thisClass.loadingTable = true;
            thisClass.queries.showparentonly = false;            
            this.locations = [];
            let searchKey = (this.inputSearch.nativeElement['value'] as string).toLowerCase() ;
            if (searchKey.length == 0) {
                this.locations = this.myLocations;
            } else {
                for (let loc of this.myLocations) {
                    if (loc['name'].toLowerCase().search(searchKey) !== -1) {
                        this.locations.push(loc);
                    }
                }
            }
            thisClass.loadingTable = false;
            
           
        });
	}

	selectAllChangeEvent(event){
		let target = event.target,
			checked = target.checked;

		let checkboxes = <any> document.querySelectorAll("table tbody input[type='checkbox']");
		checkboxes.forEach((elem) => {
			let loc = {},
				locId = elem.attributes.location_id.value;
			for(let i in this.locationsBackup){
				if(this.locationsBackup[i]['location_id'] == locId){
					loc = this.locationsBackup[i];
				}
			}

			if(checked){
				elem.checked = true;
			}else{
				elem.checked = false;
			}

			this.onChangeTableCheckboxEvent(loc, elem);
		});
	}

	onChangeTableCheckboxEvent(location, checkbox){
		let checked = checkbox.checked;

		switch (checked) {
			case true:
				this.arraySelectedLocs.push(location);
				break;

			default:
				let newArr = [];
				for(let i in this.arraySelectedLocs){
					if(location.location_id != this.arraySelectedLocs[i]['location_id']){
						newArr.push(this.arraySelectedLocs[i]);
					}
				}
				this.arraySelectedLocs = newArr;
				break;
		}
	}

    viewWardenList(location){        
        let ctr = [];
        this.viewWardens = [];        
        let tempWardens = (this.miscDetails[location]['warden'] as object[]);
        for (let warden of tempWardens) {
            if (ctr.indexOf(warden['user_id']) == -1) {
                ctr.push(warden['user_id']);
                this.viewWardens.push(warden);
            }
        }
        $('#modalWardenList').modal({ dismissible : false });
        $('#modalWardenList').modal('open');
        
    }

	ngOnDestroy(){
		this.mutationOversable.disconnect();
        this.searchSubs.unsubscribe();
        this.routerSubs.unsubscribe();

        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
	}

	getInitial(name:String){
		return name.split('')[0].toUpperCase();
    }
    
    csvExport() {
        let 
        csvData = {},
        columns = ["Location", "No of Wardens", "Mobility Impaired", "Engagement"],
        getLength = () => {
            return Object.keys(csvData).length;
        },
        title =  "Location List";

        if (this.isFRP) {
            columns = ["Location", "Sub-Location", "No of Tenants", "No of Wardens", "Mobility Impaired", "Engagement"];
        }
        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;

        if (this.locations.length == 0){
            csvData[ getLength() ] = [ "No record found" ];
        } else{ 
            for (let location of this.locations) {
                const data = [];
                data.push(location.name);
                if (this.isFRP) {
                    data.push(this.miscDetails[location.building_id]['sublocation_count']);
                    data.push(this.miscDetails[location.building_id]['num_tenants']);
                }
                data.push(this.miscDetails[location.building_id]['num_wardens']);
                data.push(this.miscDetails[location.building_id]['mobility_impaired']);
                data.push(`${location.compliance_percentage}%`);
                csvData[ getLength() ] = data;
            }
        }
        this.exportToCSV.setData(csvData, 'location-listing-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();

    }

}
