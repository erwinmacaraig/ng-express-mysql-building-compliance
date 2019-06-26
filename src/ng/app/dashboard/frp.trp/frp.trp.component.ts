import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm, FormControl } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { UserService } from '../../services/users';
import { LocationsService } from '../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { CourseService } from '../../services/course';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Router, NavigationEnd  } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { DonutService } from '../../services/donut';
import { ComplianceService } from '../../services/compliance.service';
import { Chart } from 'chart.js';

declare var $: any;

@Component({
	selector: 'app-frptrp-dashboard',
	templateUrl: './frp.trp.component.html',
	styleUrls: ['./frp.trp.component.css'],
	providers: [AccountsDataProviderService, AuthService, ComplianceService, LocationsService, DashboardPreloaderService, UserService, DonutService, CourseService, EncryptDecryptService]
})

export class FrpTrpDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

    userData = {};
    public search = new FormControl();
    public filteredList = [];
    items: any;

	courses = [];
	locations = [];
	accountTrainings = <any> {
		total_users : 0,
		total_users_trained : 0,
		em_roles : {},
		em_roles_array : []
	};

	showBuildingTrainingLoader = true;
	showPlansLoader = true;

    @ViewChild('compliancePieChart') compliancePieChart : ElementRef;
    @ViewChild('inpSearchLocation') inpSearchLocation : ElementRef;
    @ViewChild('divSearchLocationResult') divSearchLocationResult : ElementRef;
    searchingLocation = false;
    searchedLocations = [];

    complianceChart: Chart;
    ctx;

    KPIS = [];
    KPISdefault = [];
    KPISnames = [];
    selectedComplianceName = '';

    selectedIndex = -1;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        offset :  0,
        limit : 7,
        search : '',
        sort : '',
        showparentonly : true
    };

    countOfBuildings = 0;

    colors = [];
    complianceTextOne = 'Total number of buildings';
    complianceTextTwo = <any>'Loading...';
    complianceTextOneDefault = this.complianceTextOne;
    complianceTextTwoDefault = <any>'';

    paginatedLocationCompliances = <any> {};
    locationsCompliances = <any> {};
    locationsCompliancesBackup = <any> {};
    isAllComplianceLoaded = false;
    KPIStexts = <any>{};
    selectedLocsFromSearch = {};

	constructor(
		private authService : AuthService,
		private donut : DonutService,
		private courseService : CourseService,
		private dashboardService : DashboardPreloaderService,
		private locationService: LocationsService,
		private encryptDecrypt : EncryptDecryptService,
        private complianceService : ComplianceService,
        private userService: UserService
		){

		this.userData = this.authService.getUserData();

        this.courseService.myCourses(this.userData['userId'])
        .subscribe((response) => {
			this.courses = response['data'];
		});;

        let complianceColors = this.complianceService.getColors();
        for(let i in complianceColors){
            this.colors.push(complianceColors[i]);
        }

        this.userService.listUserAccountLocations().subscribe((response) => {
            let bldgCtr = [];
            
            for(let loc of response.locations) {
                if (bldgCtr.indexOf(loc['building_id']) == -1) {
                    bldgCtr.push(loc['building_id']);
                    loc['fetchingCompliance'] = true;
                    loc['compliance_percentage'] = 0;
                    loc['enc_parent_id'] =  this.encryptDecrypt.encrypt(loc['building_id']);
                    this.locations.push(loc);
                }
            }
            for (let loc of this.locations) {
                this.complianceService.getLocationsLatestCompliance(loc['building_id'], (compRes) => {
                    loc['fetchingCompliance'] = false;
                    loc['compliance_percentage'] = compRes.percent;
                    loc['compliance'] = compRes.data;
                });
            }
            if(this.locations.length > 0){
                this.pagination.currentPage = 1;
            }

            this.showPlansLoader = false;
            

        });
        /*
        this.getLocationsForListing((response:any) => {
            this.locations = response.locations;
            for(let loc of this.locations) {
                if (loc['is_building'] == 1) {
                    loc['fetchingCompliance'] = true;
                    loc['compliance_percentage'] = 0;
                } else {
                    loc['fetchingCompliance'] = false;
                }

                
            }

            for(let loc of this.locations){
                if (loc['is_building'] == 1) {
                    console.log(`requesting ${loc.location_id}`);
                    this.complianceService.getLocationsLatestCompliance(loc.location_id, (compRes) => {
                        loc['fetchingCompliance'] = false;
                        loc['compliance_percentage'] = compRes.percent;
                        loc['compliance'] = compRes.data;
                    });
                } else {
                    console.log(`Skipping ${loc.location_id}`);
                }

            }

            if(this.locations.length > 0){
                this.pagination.currentPage = 1;
            }

            this.showPlansLoader = false;
        });
        */
		this.courseService.getCountsBuildingTrainings((response) => {
			this.accountTrainings.total_users = response.data.total_users;
			this.accountTrainings.total_users_trained = response.data.total_users_trained;
			this.accountTrainings.em_roles = response.data.em_roles;
			this.showBuildingTrainingLoader = false;

			for(let i in this.accountTrainings.em_roles){
				this.accountTrainings.em_roles_array.push( this.accountTrainings.em_roles[i] );
			}

			setTimeout(() => {
				let piePercent = <any> ( (this.accountTrainings.total_users_trained / this.accountTrainings.total_users) * 100 ).toFixed(2);
				if(!isNaN(piePercent)){
					this.donut.updateDonutChart('#specificChart', parseFloat(piePercent), true);
				}
			},300);
		});

        this.getTotalComplianceRating();
        
	}

    updateMyComplianceRate(){
        let keys = Object.keys(this.locationsCompliances),
            locationsCount = keys.length,
            pointsCount = 0,
            percent = <any> 0;

        if(locationsCount == 1){
            percent = this.locationsCompliances[keys[0]]['percent'];
        }else if(Object.keys(this.locationsCompliances).length > 1){
            for(let c in this.locationsCompliances){
                pointsCount += parseInt(this.locationsCompliances[c]['percent']);
            }

            percent = (pointsCount / locationsCount).toFixed(0);
        }

        this.complianceChart.options.elements.center.text = percent+'%';
        this.complianceChart.update();
    }

    getTotalComplianceRating(){
        this.complianceService.paginateAllLocationIds().subscribe((response:any) => {
            if(response.data.length > 0){
                for(let i in response.data){
                    this.paginatedLocationCompliances[i] = {
                        loaded : false, ids : response.data[i]
                    };
                    this.complianceService.totalComplianceRatingByLocationIds(response.data[i]).subscribe((compResponse:any) => {
                        this.paginatedLocationCompliances[i]['loaded'] = true;
                        for(let comp of compResponse.data){
                            this.locationsCompliances[ comp.location_id ] = comp;
                        }

                        let isAllLoaded = true;
                        for(let i in this.paginatedLocationCompliances){
                            if(this.paginatedLocationCompliances[i]['loaded'] == false){
                                isAllLoaded = false;
                            }
                        }

                        if(isAllLoaded){
                            this.locationsCompliancesBackup = JSON.parse(JSON.stringify(this.locationsCompliances));
                            this.updateMyComplianceRate();
                            this.isAllComplianceLoaded = true;
                            this.buildComplianceKpisLegends();
                            this.KPISdefault = JSON.parse(JSON.stringify(this.KPIS));
                        }
                    });
                }

                this.complianceTextTwo = response.locationIds.length;
                this.complianceTextTwoDefault = this.complianceTextTwo;
            }else{
                this.complianceChart.options.elements.center.text = '00%';
                this.complianceChart.update();
                this.isAllComplianceLoaded = true;

                for(let k of this.KPIS){
                    k['ratings'] = '0/0';
                }

                this.KPISdefault = JSON.parse(JSON.stringify(this.KPIS));
            }
        });
    }

    isAllFetchingComplianceDone(){
        let countDone = 0;
        for(let loc of this.locations){
            if(loc['fetchingCompliance'] == false){
                countDone++;
            }
        }

        return (countDone == this.locations.length);
    }

    buildComplianceKpisLegends(){
        let kpisIdWhereOverIsLocationsCount = [2, 3, 4, 5, 9],
            kpisTrainings = [6, 8, 12];

        for(let k of this.KPIS){
            let numerator = 0,
                denaminator = 0;



            if( kpisIdWhereOverIsLocationsCount.indexOf(k.compliance_kpis_id) > -1  ){

                denaminator = Object.keys(this.locationsCompliances).length;
                let totalValid = 0;
                for(let c in this.locationsCompliances){
                    for(let d of this.locationsCompliances[c]['data']){
                        if( d.compliance_kpis_id == k.compliance_kpis_id && d.valid > 0 ){
                            totalValid += 1;
                        }
                    }
                }
                numerator = totalValid;
            }else if( kpisTrainings.indexOf(k.compliance_kpis_id) > -1 ){
                for(let c in this.locationsCompliances){
                    for(let d of this.locationsCompliances[c]['data']){
                        if(d.compliance_kpis_id == k.compliance_kpis_id){
                            denaminator += d.total_personnel_trained.failed.length + d.total_personnel_trained.passed.length;
                            numerator += d.total_personnel_trained.passed.length;
                        }
                    }
                }
            }

            k['ratings'] = numerator+'/'+denaminator;

            if( Object.keys(this.selectedLocsFromSearch).length > 0 ){
                this.KPIStexts[k.compliance_kpis_id] = {
                    textOne : this.selectedLocsFromSearch['name']+' ( '+k.name+' ) ', textTwo : numerator+'/'+denaminator
                };
                
            }else{
                this.KPIStexts[k.compliance_kpis_id] = {
                    textOne : 'Total number of '+k.name, textTwo : numerator+'/'+denaminator
                };
            }
        }

        if( Object.keys(this.selectedLocsFromSearch).length > 0 ){
            let totalNumerator = 0,
                denaminator = 0;
            for(let k of this.KPIS){
                let 
                ratingsArr = k['ratings'].split('/'),
                numerator = ratingsArr[0];

                totalNumerator += parseInt(numerator);
                if(k.compliance_kpis_id != 13){
                    denaminator++;
                }
            }

            this.complianceTextOne = this.selectedLocsFromSearch['name'];
            this.complianceTextTwo = totalNumerator+'/'+denaminator;
        }else{
            this.complianceTextOne = 'Total number of buildings';
            this.complianceTextTwo = this.complianceTextTwoDefault;
        }
    }

	ngOnInit(){
        this.search.valueChanges
        .debounceTime(400)
        .distinctUntilChanged()
        .subscribe((term) => {
            if (term.length == 0) {
                this.filteredList = [];
            } else {
                this.locationService.getParentLocationsForListingPaginated({
                    'limit': 10,
                    'offset': 0,
                    'sort': '',
                    'search': term
                }, (data) => {
                    this.filteredList = data.locations;
                    console.log(this.filteredList);
                });
            }
        });

        Chart.pluginService.register({
            beforeDraw: function (chart) {
                if (chart.config.options.elements.center) {
                    var
                    ctx = chart.chart.ctx,
                    centerConfig = chart.config.options.elements.center,
                    fontStyle = centerConfig.fontStyle || 'Arial',
                    txt = centerConfig.text,
                    color = '#444',
                    sidePadding = centerConfig.sidePadding || 20,
                    sidePaddingCalculated = (sidePadding/100) * (chart.innerRadius * 2)

                    ctx.font = "40px " + fontStyle;

                    var
                    stringWidth = ctx.measureText(txt).width,
                    elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

                    var
                    widthRatio = elementWidth / stringWidth,
                    newFontSize = Math.floor(30 * widthRatio),
                    elementHeight = (chart.innerRadius * 2),
                    fontSizeToUse = Math.min(newFontSize, elementHeight);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    var
                    centerX = ((chart.chartArea.left + chart.chartArea.right) / 2),
                    centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);

                    ctx.font = fontSizeToUse+"px " + fontStyle;
                    ctx.fillStyle = color;

                    ctx.fillText(txt, centerX, centerY);
                }
            }
        });

        this.searchLocationEvent();
	}

    searchLocationEvent(){
        Observable.fromEvent(this.inpSearchLocation.nativeElement, 'keyup').debounceTime(800).distinctUntilChanged().subscribe((event:KeyboardEvent) => {
            let elem = $(event.target),
                val = elem.val().trim();

            $(this.divSearchLocationResult.nativeElement).addClass('active');
            this.searchingLocation = true;
            this.selectedLocsFromSearch = {};

            if (val.length == 0) {
                this.searchedLocations = [];
                this.searchingLocation = false;
                $(this.divSearchLocationResult.nativeElement).removeClass('active');
                this.KPIS = JSON.parse(JSON.stringify(this.KPISdefault));
                this.locationsCompliances = JSON.parse(JSON.stringify(this.locationsCompliancesBackup));
                this.buildComplianceKpisLegends();
                this.updateMyComplianceRate();
            } else {
                this.locationService.getParentLocationsForListingPaginated({
                    'limit': 5,
                    'offset': 0,
                    'sort': '',
                    'search': val
                }, (data) => {
                    this.searchedLocations = data.locations;
                    this.searchingLocation = false;
                });
            }
        });
    }

    clickSelectSearchedLocation(location){
        this.searchedLocations = [];
        this.searchingLocation = false;
        $(this.divSearchLocationResult.nativeElement).removeClass('active');

        let selected = JSON.parse( JSON.stringify( this.locationsCompliancesBackup[location.location_id] ) );
        this.locationsCompliances = {};
        this.locationsCompliances[ location.location_id ] = selected;
        this.selectedLocsFromSearch = location;

        this.buildComplianceKpisLegends();
        this.updateMyComplianceRate();

    }

	ngAfterViewInit(){
		// this.dashboardService.show();

		$('.workspace.container').css('padding', '1% 3%');


		// DONUT update
        // Donut Service
		// this.donut.updateDonutChart('#specificChart', 30, true);

        let
        thisInstance = this,
        config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [],
                    backgroundColor: this.colors
                }],
                labels : []
            },
            options: {
                responsive: true,
                legend: {
                    display : false
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                cutoutPercentage: 70,
                elements: {
                    center: {
                        text: 'loading',
                        color: '#FF6384',
                        fontStyle: 'Arial',
                        sidePadding: 20
                    }
                },
                tooltips : {
                    callbacks : {
                        label : function(tooltipItems, data) {
                            return thisInstance.KPISnames[tooltipItems.index];
                        }
                    }
                },
                onHover : function(events, arr){
                    if(events.type == "mouseout"){
                        thisInstance.selectedIndex = -1;
                        thisInstance.buildComplianceKpisLegends();

                        return false;
                    }
                    if(arr.length == 0){ return false; }
                    if( thisInstance.selectedIndex == arr[0]['_index'] ){ return false; }

                    thisInstance.selectedIndex = arr[0]['_index'];
                    let kpi = thisInstance.KPIS[thisInstance.selectedIndex],
                        kpiTxt = thisInstance.KPIStexts[ kpi.compliance_kpis_id ];
                    if (kpiTxt) {
                        thisInstance.complianceTextOne = kpiTxt.textOne;
                        thisInstance.complianceTextTwo = kpiTxt.textTwo;
                    }
                    
                }
            }
        };

        this.complianceService.getKPIS((response) => {
            this.KPIS = response.data;
            for(let k of this.KPIS){
                k['ratings'] = '-/-';
                if(k.compliance_kpis_id != 13){
                    config.data.labels.push(k.name);
                    this.KPISnames.push(k.name);
                    config.data.datasets[0].data.push(11.11);
                }
            }

            this.KPISdefault = JSON.parse(JSON.stringify(this.KPIS));

            this.ctx = this.compliancePieChart.nativeElement.getContext('2d');
            this.complianceChart = new Chart(this.ctx, config);

            this.complianceChart.options.elements.center.text = 'loading';
            this.complianceChart.update();
        });
	}

    getLocationsForListing(callback){
        this.locationService.getParentLocationsForListingPaginated(this.queries, (response) => {

            this.locations = response.locations;

            if (this.locations.length > 0) {
                for (let i = 0; i < this.locations.length; i++) {
                    this.locations[i]['enc_location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id);
                    this.locations[i]['enc_parent_id'] = this.encryptDecrypt.encrypt(this.locations[i].parent_id);
                }
            }

            this.pagination.total = response.pagination.total;
            this.pagination.pages = response.pagination.pages;
            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            callback(response);
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
            this.showPlansLoader = true;
            this.getLocationsForListing((response:any) => {
                this.locations = response.locations;
                for(let loc of this.locations){
                    loc['fetchingCompliance'] = true;
                    loc['compliance_percentage'] = 0;
                }

                for(let loc of this.locations){
                    this.complianceService.getLocationsLatestCompliance(loc.location_id, (compRes) => {
                        loc['fetchingCompliance'] = false;
                        loc['compliance_percentage'] = compRes.percent;
                        loc['compliance'] = compRes.data;
                    });
                }
                this.showPlansLoader = false;
            });
        }
    }

	ngOnDestroy(){

	}
}
