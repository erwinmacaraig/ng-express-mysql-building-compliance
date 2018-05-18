import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ComplianceService } from '../../services/compliance.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { isArray } from 'util';
import { Countries } from '../../models/country.model';
import { Timezone } from '../../models/timezone';
import { UserService } from '../../services/users';

declare var $: any;
@Component({
  selector: 'app-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService, ComplianceService, AccountsDataProviderService, EncryptDecryptService]
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
	private accountData = { account_name : " " };
	public userData: Object;
	private mutationOversable;
  	locationToApplyActionTo: number;
	arraySelectedLocs = [];
	selectedArchive = {
		length : 0
	};

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
        sort : ''
    };

    searchSubs;

  constructor (
      private platformLocation: PlatformLocation,
      private http: HttpClient,
      private auth: AuthService,
      private preloaderService: DashboardPreloaderService,
      private locationService: LocationsService,
      private accntService: AccountsDataProviderService,
      private encryptDecrypt: EncryptDecryptService,
      private complianceService : ComplianceService,
      private router: Router,
      private elemRef : ElementRef,
      private userService : UserService
  ) {
      this.baseUrl = (platformLocation as any).location.origin;
      this.options = { headers : this.headers };
      this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
      this.userData = this.auth.getUserData();

    	this.accntService.getById(this.userData['accountId'], (response) => {
	      	this.accountData = response.data;
    	});

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

	}

	getLocationsForListing(callback){
		this.locationService.getParentLocationsForListingPaginated(this.queries, (response) => {

            this.pagination.total = response.pagination.total;
            this.pagination.pages = response.pagination.pages;
            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            this.locations = response.locations;

            for(let loc of this.locations){
                loc['fetchingCompliance'] = true;
                loc['compliance_percentage'] = 0;
                this.complianceService.getLocationsLatestCompliance(loc.location_id, (compRes) => {
                    loc['fetchingCompliance'] = false;
                    loc['compliance_percentage'] = compRes.percent ;
                });
            }

    		if (this.locations.length > 0) {
    			for (let i = 0; i < this.locations.length; i++) {
    				this.locations[i]['location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id);
    			}
    		}
    		this.locationsBackup = JSON.parse(JSON.stringify(this.locations));

    		callback(response);
    	});
	}

	ngAfterViewInit(){
		this.preloaderService.show();
		this.getLocationsForListing((response) => {

            if(this.pagination.pages > 0){
                this.pagination.currentPage = 1;
                this.pagination.prevPage = 1;
            }

    		this.preloaderService.hide();

	        if (localStorage.getItem('showemailverification') !== null) {
	          this.router.navigate(['/location', 'search']);
	        }
    	});
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .active').removeClass('active');
		$('.location-navigation .view-location').addClass('active');

		$('.modal').modal({
			dismissible: false
		});


		this.selectRowEvent();
		this.selectFilteringEvent();
		this.selectBulkAction();

		let formAddTenant = this.formAddTenant;
       /*
        $('body').off('change.countrychange').on('change.countrychange', 'select.billing-country', (event) => {
            formAddTenant.controls.billing_country.setValue( event.currentTarget.value );
        });

        $('body').off('change.timechange').on('change.timechange', 'select.time-zone', (event) => {
            formAddTenant.controls.time_zone.setValue( event.currentTarget.value );
        });
        */

        $('body').off('change.locationchange').on('change.locationchange', 'select.location-id', (event) => {
            formAddTenant.controls.location_id.setValue( event.currentTarget.value );
        });

        this.searchLocationEvent();

        $('.pagination select').material_select('destroy');
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
            this.getLocationsForListing(() => {
                this.loadingTable = false;
            });
        }
    }

	selectBulkAction(){
		$('body').off('change.selectbulk').on('change.selectbulk', 'select.bulk-manage', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();

			if(val == 'archive'){
				$('select.bulk-manage').val("0").material_select("update");
				if(this.arraySelectedLocs.length > 0){
					$('#modalArchiveBulk').modal('open');
				}
			}
		});
	}

	bulkArchiveClick(){
		if(this.arraySelectedLocs.length > 0){
			this.modalArchiveBulk.loader = true;
			let locs = [];

			for(let i in this.arraySelectedLocs){
				locs.push({
					location_id : this.encryptDecrypt.decrypt(this.arraySelectedLocs[i]['location_id']),
					archived : 1
				});
			}

			this.arraySelectedLocs = [];

			$('select.bulk-manage').val("0").material_select("update");
			$('#allSelect').prop('checked', false);

			this.locationService.archiveMultipleLocation({
				locations : locs
			}).subscribe(() => {
				this.getLocationsForListing(() => {
					this.modalArchiveBulk.loader = false;
					$('#modalArchiveBulk').modal('close');
		    	});
			});
		}
	}

	archiveClick(){
		if(this.selectedArchive.length > 0){
			this.modalArchive.loader = true;
			let locs = [];

			locs.push({
				location_id : this.encryptDecrypt.decrypt(this.selectedArchive['location_id']),
				archived : 1
			});

			this.locationService.archiveMultipleLocation({
				locations : locs
			}).subscribe(() => {
				this.getLocationsForListing(() => {
					this.modalArchive.loader = false;
					$('#modalArchive').modal('close');

		    	});
			});
		}
	}

	showNewTenant(){
        /*
        this.formAddTenant.reset();
        this.formAddTenant.controls.billing_country.setValue( this.defaultCountry );
        this.formAddTenant.controls.time_zone.setValue( this.defaultTimeZone );
        */
        $('#modalAddNewTenant').modal('open');

        $('#modalAddNewTenant select').material_select('destroy');
	}

	submitNewTenant(formAddTenant:NgForm){
        if(formAddTenant.valid){
            this.showModalNewTenantLoader = true;
            /*
            console.log(formAddTenant.value);
            console.log(formAddTenant.value.location_id);
            */
            this.userService.sendTRPInvitation(formAddTenant.value).subscribe(() => {
              this.getLocationsForListing(() => {
                this.showModalNewTenantLoader = false;
                $('#modalAddNewTenant').modal('close');
                this.formAddTenant.reset();
              });
            }, (e) => {
              this.showModalNewTenantLoader = false;
              $('#modalAddNewTenant').modal('close');
              console.log(e);
              const errorObject = JSON.parse(e.error);
              alert(errorObject.message);
            });

            /*
            this.accntService.update(formAddTenant.value).subscribe((response) => {
                this.getLocationsForListing(() => {
		    	    	  this.showModalNewTenantLoader = false;
		    	    	  $('#modalAddNewTenant').modal('close');
		        	});
            });
          */
        }
    }

	selectRowEvent(){

		$('body').off('change.selectchangeevent').on('change.selectchangeevent', 'select.select-from-row', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();

			if(val.indexOf('view-') > -1){
				let locIdEnc = val.replace('view-', '');

				this.router.navigate(["/location/view/", locIdEnc]);
			}else if(val.indexOf('addtenants-') > -1){
				let locIdEnc = val.replace('addtenants-', '');
            	for(let i in this.locationsBackup){
					if(this.locationsBackup[i]['location_id'] == locIdEnc){
						this.selectedLocation = this.locationsBackup[i];
					}
				}
				this.showNewTenant();
			}else if(val.indexOf('addwardens-') > -1){
				let locIdEnc = val.replace('addwardens-', '');

				this.router.navigate(["/teams/add-wardens", locIdEnc]);
			}else if(val.indexOf("archive-") > -1){
				let locIdEnc = val.replace('archive-', '');

				for(let i in this.locationsBackup){
					if(this.locationsBackup[i]['location_id'] == locIdEnc){
						this.selectedArchive = this.locationsBackup[i];
						this.selectedArchive.length = 1;
						$('#modalArchive').modal('open');
					}
				}

			}else if(val.indexOf('benchmark-') > -1){
                let locIdEnc = val.replace('benchmark-', '');

                console.log(' Benchmark location id ' + locIdEnc);
                this.locationToApplyActionTo = this.encryptDecrypt.decrypt(val.replace('benchmark-', ''));
                $('#modalWardenBenchmarkCalc').modal('open');
                console.log(' Benchmark location id ' + this.locationToApplyActionTo);
            }else if(val.indexOf('compliance-') > -1){
            	let locIdEnc = val.replace('compliance-', '');

            	for(let i in this.locationsBackup){
					if(this.locationsBackup[i]['location_id'] == locIdEnc){
						this.router.navigate(['/location/compliance/view/', this.locationsBackup[i]['location_id']]);
					}
				}

            }

		});
	}

	showOnlyNotCompliantEvent(event){
		let elem = event.target,
			checked = elem.checked,
			filtered = [];

		if(checked){
			for(let i in this.locationsBackup){
				if( this.locationsBackup[i]['compliance'] < 100 ){
					filtered.push( this.locationsBackup[i] );
				}
			}
			this.locations = filtered;
		}else{
			this.locations = this.locationsBackup;
		}
	}

	selectFilteringEvent(){
		$('body').off('change.sortby').on('change.sortby', 'select.sort-by', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();
            this.queries.sort = val;
            this.queries.offset = 0;
            this.loadingTable = true;
            this.getLocationsForListing((response) => {
                this.pagination.total = response.pagination.total;
                this.pagination.pages = response.pagination.pages;
                this.pagination.currentPage = 1;
                this.loadingTable = false;
            });
		});
	}

	searchLocationEvent(){
        let thisClass = this;

		this.searchSubs = Observable.fromEvent(this.inputSearch.nativeElement, 'keyup')
        .debounceTime(800).subscribe((event:KeyboardEvent) => {
            thisClass.queries.limit = 10;
            thisClass.queries.offset = 0;
            thisClass.queries.search = event.srcElement['value'];
            thisClass.queries.sort = $('.sort-by select').val();
            thisClass.loadingTable = true;
            thisClass.getLocationsForListing((response) => {

                thisClass.pagination.total = response.pagination.total;
                thisClass.pagination.pages = response.pagination.pages;
                thisClass.pagination.currentPage = 1;

                thisClass.loadingTable = false;
            });
            console.log(thisClass.queries);
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

	ngOnDestroy(){
		this.mutationOversable.disconnect();
        this.searchSubs.unsubscribe();
	}

	getInitial(name:String){
		return name.split('')[0].toUpperCase();
	}

}
