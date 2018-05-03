import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
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
    complianceChart: Chart;
    ctx;

    KPIS = [];
    KPISnames = [];
    selectedComplianceName = '';
    selectedComplianceOver = '';
    selectedComplianceOverExt = '';
    selectedIndex = 0;

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };

    queries = {
        offset :  0,
        limit : 7,
        search : '',
        sort : ''
    };

	constructor(
		private authService : AuthService,
		private donut : DonutService,
		private courseService : CourseService,
		private dashboardService : DashboardPreloaderService,
		private locationService : LocationsService,
		private encryptDecrypt : EncryptDecryptService,
        private complianceService : ComplianceService
		){

		this.userData = this.authService.getUserData();

		this.courseService.myCourses(this.userData['userId'], (response) => {
			this.courses = response.data;
		});
       
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

                    this.loadDoneKpisAndCompliance();
                });
            }

            if(this.locations.length > 0){
                this.pagination.currentPage = 1;
            }

            this.showPlansLoader = false;
        });

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

	}

	ngOnInit(){
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
	}

    loadDoneKpisAndCompliance(){
        if( this.KPISnames.length > 0 && this.locations.length > 0 ){
            let isAllLoaded = true;
            for(let l of this.locations){
                if(l.fetchingCompliance){
                    isAllLoaded = false;
                }
            }

            if(isAllLoaded){
                
                let selectedKpi = this.KPIS[this.selectedIndex],
                    validCompliace = 0,
                    totalLocations = this.locations.length,
                    totalPercentage = 0;

                for(let loc of this.locations){
                    let compliance = loc.compliance;
                    for(let com of compliance){
                        if(com.compliance_kpis_id == selectedKpi.compliance_kpis_id){
                            this.selectedComplianceName = selectedKpi.name;
                            if(com.valid == 1){
                                validCompliace++;
                            }
                        }
                    }

                    totalPercentage = totalPercentage + loc.compliance_percentage;
                }

                this.selectedComplianceOver = validCompliace + '/' + totalLocations;
                this.selectedComplianceOverExt = ' compliant location';

                if(totalPercentage > 0){
                    this.complianceChart.options.elements.center.text = Math.floor(totalPercentage / (totalLocations * 100) * 100) + '%';
                }else{
                    this.complianceChart.options.elements.center.text = '00%';
                }

                this.complianceChart.update();

            }
        }

        if(this.locations.length == 0){
            this.complianceChart.options.elements.center.text = '00%';
            this.complianceChart.update();
        }
    }

    clickComplianceChart(event){
        let elem = this.complianceChart.getElementAtEvent(event);
        if(elem.length > 0){
            this.selectedIndex = elem[0]._index;
            this.loadDoneKpisAndCompliance();
        }
    }

	ngAfterViewInit(){
		// this.dashboardService.show();

		$('.workspace.container').css('padding', '2% 5%');
		

		// DONUT update
        // Donut Service
		// this.donut.updateDonutChart('#specificChart', 30, true);
        
        let 
        colors = ['#835cb7', '#f0932b', '#eb4d4b', '#6ab04c', '#30336b', '#22a6b3', '#be2edd', '#95afc0', '#badc58', '#01a3a4', '#10ac84', '#8395a7'],
        thisInstance = this,
        config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [],
                    backgroundColor: colors
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
                onClick : this.clickComplianceChart.bind(this),
                tooltips : {
                    callbacks : {
                        label : function(tooltipItems, data) {
                            return thisInstance.KPISnames[tooltipItems.index];
                        }
                    }
                }
            }
        };

        this.complianceService.getKPIS((response) => {
            this.KPIS = response.data;
            for(let k of this.KPIS){
                config.data.labels.push(k.name);
                this.KPISnames.push(k.name);
                config.data.datasets[0].data.push(11.11);
            }

            this.ctx = this.compliancePieChart.nativeElement.getContext('2d');
            this.complianceChart = new Chart(this.ctx, config);

            this.loadDoneKpisAndCompliance();
        }); 
	}

    getLocationsForListing(callback){
        this.locationService.getParentLocationsForListingPaginated(this.queries, (response) => {

            this.locations = response.locations;
            
            if (this.locations.length > 0) {
                for (let i = 0; i < this.locations.length; i++) {
                    this.locations[i]['enc_location_id'] = this.encryptDecrypt.encrypt(this.locations[i].location_id);
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

                        this.loadDoneKpisAndCompliance();
                    });
                }
                this.showPlansLoader = false;
            });
        }
    }

	ngOnDestroy(){

	}
}