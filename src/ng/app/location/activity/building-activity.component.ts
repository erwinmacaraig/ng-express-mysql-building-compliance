import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';

import { ReportService } from '../../services/report.service';
import { AuthService } from '../../services/auth.service';
import { ExportToCSV } from '../../services/export.to.csv';
import * as moment from 'moment';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
    templateUrl: './building-activity.component.html',
    styleUrls: ['./building-activity.component.css'],
    providers: [ReportService, ExportToCSV]
})
export class BuildingActivityComponent implements OnInit, AfterViewInit, OnDestroy {
    public userData: object;
    public documents: object[];
    public buildings: object[];
    private myDocs: object[];
    public total_records = 0;
    public searchFileInput;
    constructor(
                private reportService: ReportService,
                private auth: AuthService,
                private exportToCSV: ExportToCSV
                ) {
                    this.documents = [];
                    this.myDocs = [];
                }

    ngOnInit() {
        this.userData = this.auth.getUserData();
        
        this.reportService.listBuildingActivities(this.userData['buildings']).subscribe((response) => {
            this.documents = response.activity;
            this.buildings = response.buildings;
            this.myDocs = response.activity; 
            this.total_records = this.myDocs.length;          
        });
        setTimeout(() => {
            $('.row.filter-container select.location').material_select('update');                
            $('.row.filter-container select').material_select();
        }, 500);
    }

    ngAfterViewInit() {
        
        this.filterByLocation();
        this.searchFilenameEvent();
    }

    filterByLocation(){
        let self = this;
        $('#filter-location').change(function(){
            //e.preventDefault();
            //e.stopPropagation();
            let selected = parseInt($('#filter-location').val(), 10);
            
            self.documents = [];           
            
            if(selected == 0) {
               self.documents = self.myDocs;
            } else {
                for (let d of self.myDocs) {
                    if (d['building_id'] == selected) {
                        self.documents.push(d);                                
                    }
                }
            }
        });    
    }

    csvExport() {
        let 
        csvData = {},
        columns = ["Location", "Filename", "Event Date", "Date Uploaded"],
        getLength = () => {
            return Object.keys(csvData).length;
        },
        title = "Activity Log";
        csvData[ getLength() ] = [title];
        csvData[ getLength() ] = columns;
        if (this.documents.length == 0) {
            csvData[ getLength() ] = [ "No record found" ];
        } else {
            for (let doc of this.documents) {
                csvData[ getLength() ] = [doc['location_name'], doc['file_name'], doc['date_of_activity_formatted'], doc['timestamp_formatted']];
            }
        }
        this.exportToCSV.setData(csvData, 'location-activity-logs-' +moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

    searchFilenameEvent() {
        this.searchFileInput = Rx.Observable.fromEvent(document.querySelector('#searchFileInput'), 'input');
        this.searchFileInput.debounceTime(800)
        .map(event => event.target.value)
        .subscribe((value) => {
            this.documents = [];
            if (value.length == 0) {
                this.documents = this.myDocs;
            } else {
                
                let searchKey = value.toLowerCase();
                for (let doc of this.myDocs) {
                    if (doc['file_name'].toLowerCase().search(searchKey) !== -1) {
                        this.documents.push(doc);
                    }
                }
                if (this.documents.length > 0) {
                    $('#filter-location').val(0);
                    setTimeout(() => {
                        $('.row.filter-container select.location').material_select('update');
                        $('.row.filter-container select').material_select();
                    }, 100);
                }
            }

        });
    }


    ngOnDestroy() {}
}