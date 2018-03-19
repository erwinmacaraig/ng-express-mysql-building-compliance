import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LocationsService } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { AuthService } from '../../services/auth.service';
import { Observable, } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { isArray } from 'util';


declare var $: any;
@Component({
  selector: 'app-archived-location-list',
  templateUrl: './archived.list.component.html',
  styleUrls: ['./archived.list.component.css'],
  providers : [LocationsService, DashboardPreloaderService, AuthService, AccountsDataProviderService, EncryptDecryptService]
})
export class ArchivedLocationListComponent implements OnInit, OnDestroy {

	@ViewChild('inpSearchLoc') inpSearchLoc;
	@ViewChild('tbodyElem') tbodyElem;

	locations = [];
	locationsBackup = [];
	private baseUrl: String;
	private options;
	private headers;
	private accountData = { account_name : " " };
	public userData: Object;
	private mutationOversable;

	arraySelectedLocs = [];
	selectedRestore = {
		length : 0
	};

	modalArchiveBulk = {
		loader : false
	};

	modalArchive = {
		loader : false
	};

	constructor (
		private platformLocation: PlatformLocation,
		private http: HttpClient,
		private auth: AuthService,
		private preloaderService: DashboardPreloaderService,
		private locationService: LocationsService,
		private accntService: AccountsDataProviderService,
	    private encryptDecrypt: EncryptDecryptService,
	    private router: Router,
	    private elemRef : ElementRef
	) {
		this.baseUrl = (platformLocation as any).location.origin;
		this.options = { headers : this.headers };
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.userData = this.auth.getUserData();

    	this.accntService.getById(this.userData['accountId'], (response) => {
	      	this.accountData = response.data;
    	});

    	this.getLocationsForListing(() => {
    		this.preloaderService.hide();

	        if (localStorage.getItem('showemailverification') !== null) {
	          this.router.navigate(['/location', 'search']);
	        }
    	});

		this.mutationOversable = new MutationObserver((mutationsList) => {
			mutationsList.forEach((mutation) => {
				if(mutation.target.nodeName != '#text'){
					let target = $(mutation.target);
					if(target.find('select:not(.initialized)').length > 0){

						target.find('select:not(.initialized)').material_select();

					}
				}
			});
		});

		this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });
 
  	}

	ngOnInit(){
		this.preloaderService.show();
	}

	getLocationsForListing(callback){
		this.locationService.getArchivedParentLocationsForListing(this.userData['accountId'], (response) => {
    		
    		this.locations = response.locations;
    		if (this.locations.length > 0) {
    			for (let i = 0; i < this.locations.length; i++) {
    				this.locations[i]['location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id);
    			}
    		}
    		this.locationsBackup = JSON.parse(JSON.stringify(this.locations));

    		callback();
    	});
	}

	ngAfterViewInit(){
		$('.nav-list-locations').addClass('active');
		$('.location-navigation .active').removeClass('active');
		$('.location-navigation .view-location').addClass('active');

		$('.modal').modal({
			dismissible: false
		});


		this.selectRowEvent();
		this.selectFilteringEvent();
		this.selectBulkAction();
	}

	selectBulkAction(){
		$('body').off('change.selectbulk').on('change.selectbulk', 'select.bulk-manage', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val();

			if(val == 'restore'){
				$('select.bulk-manage').val("0").material_select("update");
				if(this.arraySelectedLocs.length > 0){
					$('#modalArchiveBulk').modal('open');
				}
			}
		});
	}

	bulkRestoreClick(){
		if(this.arraySelectedLocs.length > 0){
			this.modalArchiveBulk.loader = true;
			let locs = [];

			for(let i in this.arraySelectedLocs){
				locs.push({
					location_id : this.encryptDecrypt.decrypt(this.arraySelectedLocs[i]['location_id']),
					archived : 0
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

	restoreClick(){
		if(this.selectedRestore.length > 0){
			this.modalArchive.loader = true;
			let locs = [];

			locs.push({
				location_id : this.encryptDecrypt.decrypt(this.selectedRestore['location_id']),
				archived : 0
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

				this.router.navigate(["/teams/add-user/tenant", locIdEnc]);
			}else if(val.indexOf('addwardens-') > -1){
				let locIdEnc = val.replace('addwardens-', '');

				this.router.navigate(["/teams/add-wardens", locIdEnc]);
			}else if(val.indexOf("restore-") > -1){
				let locIdEnc = val.replace('restore-', '');

				for(let i in this.locationsBackup){
					if(this.locationsBackup[i]['location_id'] == locIdEnc){
						this.selectedRestore = this.locationsBackup[i];
						this.selectedRestore.length = 1;
						$('#modalArchive').modal('open');
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
		$('body').off('change.filterby').on('change.filterby', 'select.filter-by', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val(),
				filtered = [];

			if(val == 'compliance'){
				for(let i in this.locationsBackup){
					if( this.locationsBackup[i]['compliance'] == 100 ){
						filtered.push( this.locationsBackup[i] );
					}
				}
				this.locations = filtered;
			}else if(val == 'not-compliance'){
				for(let i in this.locationsBackup){
					if( this.locationsBackup[i]['compliance'] < 100 ){
						filtered.push( this.locationsBackup[i] );
					}
				}
				this.locations = filtered;
			}else if(val == 'mobility-impaired'){
				for(let i in this.locationsBackup){
					if( this.locationsBackup[i]['mobility_impaired'] > 0 ){
						filtered.push( this.locationsBackup[i] );
					}
				}
				this.locations = filtered;
			}else{
				this.locations = this.locationsBackup;
			}

		});


		$('body').off('change.sortby').on('change.sortby', 'select.sort-by', (e) => {
			e.preventDefault();
			let target = $(e.target),
				val = target.val(),
				filtered = [];

			if(val == 'name-asc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.name.toUpperCase(),
						name2 = b.name.toUpperCase();

					if(name1 < name2){
						return -1
					}
					if(name1 > name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'name-desc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.name.toUpperCase(),
						name2 = b.name.toUpperCase();

					if(name1 > name2){
						return -1
					}
					if(name1 < name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'mobility-asc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.mobility_impaired,
						name2 = b.mobility_impaired;

					if(name1 < name2){
						return -1
					}
					if(name1 > name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'mobility-desc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.mobility_impaired,
						name2 = b.mobility_impaired;

					if(name1 > name2){
						return -1
					}
					if(name1 < name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'sublocation-asc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.sublocations.length,
						name2 = b.sublocations.length;

					if(name1 < name2){
						return -1
					}
					if(name1 > name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'sublocation-desc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.sublocations.length,
						name2 = b.sublocations.length;

					if(name1 > name2){
						return -1
					}
					if(name1 < name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'wardens-asc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.num_wardens,
						name2 = b.num_wardens;

					if(name1 < name2){
						return -1
					}
					if(name1 > name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else if(val == 'wardens-desc'){
				let temp = JSON.parse(JSON.stringify(this.locationsBackup));
				temp.sort((a, b) => {
					let name1 = a.num_wardens,
						name2 = b.num_wardens;

					if(name1 > name2){
						return -1
					}
					if(name1 < name2){
						return 1
					}

					return 0;
				});
				this.locations = temp;
			}else{
				this.locations = this.locationsBackup;
			}

		});
	}

	searchLocationEvent(event){
		let elem = event.target,
			val = elem.value.toLowerCase(),
			filtered = [];

		if(val.trim().length == 0){
			this.locations = this.locationsBackup;
		}else{
			for(let i in this.locations){
				if(this.locations[i]['name'].toLowerCase().indexOf(val) > -1){
					filtered.push(this.locations[i]);
				}
			}

			this.locations = filtered;
		}
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

		

		console.log(this.arraySelectedLocs);
	}

	ngOnDestroy(){
		this.mutationOversable.disconnect();
	}

	getInitial(name:String){
		return name.split('')[0].toUpperCase();
	}

}
