
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $ : any;

@Component({
    selector : 'app-choose-report-component',
    templateUrl : './choose.report.component.html',
    styleUrls : [ './choose.report.component.css' ],
    providers : [ ReportService, EncryptDecryptService, LocationsService ]
})

export class ChooseReportComponent implements OnInit, OnDestroy {

    userData = {};
    // 0 means all locations
    public selectedLocationForTrainingReport = 0;
    public selectedLocationForTeamReport = 0;
    public selectedLocationForActivityLogReport = 0;
    public selectedLocationForPortfolioReport = 0;
    public selectedLocationForSummaryComplianceReport = 0;
    public rootLocationsFromDb = [];

    isFrp = false;
    isTrp = false;

    queries = {
        offset :  0,
        limit : 5,
        search : '',
        sort : ''
    };

    collection = {
        'soc' : {
            name : 'statement of compliance', locations : [], active : false, searches : [], searching : false, code : 'soc', allloc: false
        },
        'sop' : {
            name : 'summary of portfolio compliance', locations : [], active : false, searches : [], searching : false, code : 'sop', allloc: false
        },
        'acl' : {
            name : 'activity log', locations : [], active : false, searches : [], searching : false, code : 'acl', allloc: false
        },
        'tm' : {
            name : 'team', locations : [], active : false, searches : [], searching : false, code : 'tm', allloc: false
        },
        'tr' : {
            name : 'training', locations : [], active : false, searches : [], searching : false, code : 'tr', allloc: false
        }
    };

    selectedReport = {
        name : '',
        locations : [],
        active : false,
        searches : [],
        searching : false,
        code : '',
        allloc: false
    };

    subsSearches = {};

    constructor(
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private reportService: ReportService,
        private encryptDecrypt: EncryptDecryptService,
        private locationService: LocationsService
        ) {

        this.userData = this.authService.getUserData();
        let roles = this.userData['roles'];
        for(let ro of roles){
            if(ro.role_id == 1){
                this.isFrp = true;
            }else if(ro.role_id == 2){
                this.isTrp = true;
            }
        }

        /*this.reportService.getParentLocationsForReporting().subscribe((response) => {
            console.log(response);
            this.rootLocationsFromDb = response['data'];
            setTimeout(() => {
                $('select').material_select();
            }, 200);
        }, (e) => {
            console.log(e);
        });*/

    }

    ngOnInit(){
    }

    getLocationsForListing(callback){
        this.locationService.getParentLocationsForListingPaginated(this.queries, (response) => {

            callback(response);
        });
    }

    ngAfterViewInit(){
        $('select').material_select();
        this.searchLocationEvent();

        $('body').off('click').on('click', (event) => {
            let elem = $(event.target);
            if(elem.hasClass('.workspace') || elem[0].nodeName == 'BODY' || elem.hasClass('box-wrapper') || elem.hasClass('col s12')){
                if($('.search-result.active').length > 0){
                    $('.search-result.active').removeClass('active');
                }else{
                    $('.box-wrapper').removeClass('active').removeClass('inactive');
                    $('.box-wrapper .search-result').removeClass('active').addClass('inactive');
                    this.selectedReport.active = false;
                }
            }
        });

        $('body').css('height', '99vh');
    }

    clickAllLocation(code, checkbox){
        if(checkbox.checked){
            this.collection[code].locations = [0];
            this.collection[code].allloc = true;
            this.selectedReport.allloc = true;
        }else{
            this.collection[code].locations = [];
            this.collection[code].allloc = false;
            this.selectedReport.allloc = false;
        }
        
    }

    clickBox(box, event){
        if($(event.target).parents('.search-result').length > 0){
            return false;
        }

        $('.box-wrapper').removeClass('active').removeClass('inactive').addClass('inactive');
        $(box).parent().removeClass('inactive').addClass('active');
        $(box).find('.search-result').removeClass('active').addClass('inactive');

        for(let c in this.collection){
            if(c == this.selectedReport.code){
                this.collection[c] = this.selectedReport;
            }
            this.collection[c]['active'] = false;
            this.collection[c]['searching'] = false;
            this.collection[c]['searches'] = [];
        }

        let 
            classNames = $(box).parent().attr('class'),
            indexSelected = '';

        if(classNames.indexOf('box-statement-of-compliance') > -1){
            indexSelected = 'soc';
        }else if(classNames.indexOf('box-summary-of-portfolio') > -1){
            indexSelected = 'sop';
        }else if(classNames.indexOf('box-activity-log') > -1){
            indexSelected = 'acl';
        }else if(classNames.indexOf('box-team') > -1){
            indexSelected = 'tm';
        }else if(classNames.indexOf('box-training') > -1){
            indexSelected = 'tr';
        }

        this.selectedReport = this.collection[indexSelected];
        this.selectedReport.active = true;
        this.selectedReport.searching = false;
        this.collection[indexSelected].active = true;

        console.log(this.collection);
    }

    clickSelectLocation(loc, thisCheckbox){

        thisCheckbox.checked = (thisCheckbox.checked) ? false : true;
        if(thisCheckbox.checked){
            this.selectedReport.locations.push(loc);

            this.collection[ this.selectedReport.code ]['allloc'] = false;
            $(thisCheckbox).parents('.box').find('.select-all input[type="checkbox"]').prop('checked', false);
        }else{
            this.removeFromSelected(loc);
        }
    }

    isLocationSelected(loc){
        for(let i in this.selectedReport.locations){
            if(this.selectedReport.locations[i]['location_id'] == loc.location_id){
                return true;
            }
        }
        return false;
    }

    removeFromSelected(loc){
        let newlocs = [];
        for(let i in this.selectedReport.locations){
            if(this.selectedReport.locations[i]['location_id'] != loc.location_id){
                newlocs.push(this.selectedReport.locations[i]);
            }
        }
        this.selectedReport.locations = newlocs;
        this.collection[ this.selectedReport.code ] = this.selectedReport;
    }

    searchLocationEvent(){
        let inpSearch = $('input.search-location'),
            thisClass = this;

        inpSearch.each((i,elem) => {
            
            let 
                parentClass = $(elem).parents('.box-wrapper').attr('class'),
                indexSelected = '';

            if(parentClass.indexOf('box-statement-of-compliance') > -1){
                indexSelected = 'soc';
            }else if(parentClass.indexOf('box-summary-of-portfolio') > -1){
                indexSelected = 'sop';
            }else if(parentClass.indexOf('box-activity-log') > -1){
                indexSelected = 'acl';
            }else if(parentClass.indexOf('box-team') > -1){
                indexSelected = 'tm';
            }else if(parentClass.indexOf('box-training') > -1){
                indexSelected = 'tr';
            }
            $(elem).attr('code', indexSelected);

            thisClass.subsSearches[ indexSelected ] = 
                Observable.fromEvent(elem, 'keyup').debounceTime(800).subscribe((event:KeyboardEvent) => {
                    let elem = $(event.srcElement),
                        searchContainer = elem.parents('.box-wrapper').find('.search-result'),
                        val = elem.val(),
                        code = elem.attr('code'),
                        ul = searchContainer.find('ul');

                    if(val.trim().length == 0){
                        searchContainer.removeClass('active');
                        return false;
                    }

                    this.selectedReport.searching = true;
                    searchContainer.addClass('active');
                    this.queries.search = val;
                    this.getLocationsForListing((response) => {
                        this.selectedReport.searching = false;
                        this.selectedReport.searches = response.locations;
                    });
                });

        });
    }

    clickGenerate(){
        if(this.selectedReport.allloc || this.selectedReport.locations.length > 0){
            let ids = [],
                encrypt = '',
                url = '';

            if(this.selectedReport.allloc){
                ids = [0];
            }else{
                for(let i in this.selectedReport.locations){
                    ids.push(this.selectedReport.locations[i]['location_id']);
                }
            }

            encrypt = this.encryptDecrypt.encrypt( ids.join('-') );

            if( this.selectedReport.code == 'soc' ){
                url = '/reports/statement-compliance/';
            }else if( this.selectedReport.code == 'sop' ){
                url = '/reports/summary-of-compliance/';
            }else if( this.selectedReport.code == 'acl' ){
                url = '/reports/activity-log/';
            }else if( this.selectedReport.code == 'tm' ){
                url = '/reports/teams/';
            }else if( this.selectedReport.code == 'tr' ){
                url = '/reports/trainings/';
            }


            this.router.navigate([url+encrypt]);
        }
    }

    ngOnDestroy(){
        for(let i in this.subsSearches){
            this.subsSearches[i].unsubscribe();
        }
    }

}
