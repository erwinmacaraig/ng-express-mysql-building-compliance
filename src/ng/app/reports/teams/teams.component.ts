import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ReportService } from '../../services/report.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { ExportToCSV } from '../../services/export.to.csv';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
import * as moment from 'moment';


declare var $: any;

@Component({
    selector : 'app-teams-compliance-component',
    templateUrl : './teams.component.html',
    styleUrls : [ './teams.component.css' ],
    providers : [ ReportService, EncryptDecryptService, DashboardPreloaderService, ExportToCSV ]
})

export class ReportsTeamsComponent implements OnInit, OnDestroy {

    userData = {};
    reportData = [];
    private sub: any;
    public locationIdDecrypted;
    rootLocationsFromDb = [];

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 2,
        offset : 0,
        location_id : 0
    };

    constructor (
        private router: Router,
        private authService: AuthService,
        private messageService: MessageService,
        private route: ActivatedRoute,
        private encryptDecrypt: EncryptDecryptService,
        private reportService: ReportService,
        private dashboardPreloader : DashboardPreloaderService,
        private exportToCSV : ExportToCSV
        ) {

        this.userData = this.authService.getUserData();

    }

    getTeamReport(callBack) {

        this.queries.location_id = this.locationIdDecrypted;
        this.reportService.generateTeamReportingOnLocation(this.queries)
        .subscribe((response:any) => {
            this.reportData = response['data'];

            this.pagination.pages = response.pagination.pages;
            this.pagination.total = response.pagination.total;

            this.pagination.selection = [];
            for(let i = 1; i<=this.pagination.pages; i++){
                this.pagination.selection.push({ 'number' : i });
            }

            callBack(response);
        }, (e) => {
            this.dashboardPreloader.hide();
            console.log(e);
        });
    }

    ngOnInit() {
        this.sub = this.route.params.subscribe(params => {
            this.locationIdDecrypted = this.encryptDecrypt.decrypt(params['location']);
            console.log(`Decrypted location id ${this.locationIdDecrypted}`);

            this.reportData = [];
            this.getTeamReport((response:any) => {
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }

                this.dashboardPreloader.hide();
            });
        });

        this.reportService.getParentLocationsForReporting().subscribe((response) => {
            console.log(response);
            this.rootLocationsFromDb = response['data'];
        }, (e) => {
            console.log(e);
        });
    }

    ngAfterViewInit(){
        this.dashboardPreloader.show();
        /*$('select').material_select();
        $('#selectLocation').val(this.locationIdDecrypted).material_select('update');
        $('#selectLocation').off('change.selectlocation').on('change.selectlocation', () => {

            let selVal = $('#selectLocation').val(),
            encId = this.encryptDecrypt.encrypt( selVal );
            this.dashboardPreloader.show();
            this.router.navigate([ '/reports/teams/', encId]);
        });*/
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
            this.dashboardPreloader.show();
            this.pagination.prevPage = parseInt(type);
            let offset = (this.pagination.currentPage * this.queries.limit) - this.queries.limit;
            this.queries.offset = offset - 1;
            this.getTeamReport((response:any) => {
                this.dashboardPreloader.hide();
            });
        }
    }

    printResult(printContainer){
        let headerHtml = `<h5> Team Report </h5>`;

        $(printContainer).printThis({
            importCSS: true,
            importStyle: true,
            loadCSS: [ "/assets/css/materialize.css" ],
            header : headerHtml
        });
    }

    pdfExport(printContainer){
        let $printContainer = $(printContainer).clone();

        $printContainer.removeClass('container').css({
            'margin-left' : '50px', 'margin-right' : '50px'
        });
        $printContainer.prepend('<h5>Team Report</h5>');
        $printContainer.find('.no-print').remove();
        $('#cloneContainer').html($printContainer);

        html2canvas($('#cloneContainer')[0]).then(function(canvas) {
            let 
            pdf = new jsPDF("p", "mm", "a4"),
            pageHeight = 297, // 1122.52px
            imgWidth = 210, //793.70px
            imgData = canvas.toDataURL('image/jpeg', 1.0),
            imgHeight = canvas.height * imgWidth / canvas.width,
            heightLeft = imgHeight,
            position = 5;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              position += 5;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            $('#canvasContainer').html(canvas);
            pdf.save('teams-report-'+moment().format('YYYY-MM-DD-HH-mm-ss')+'.pdf');
            $('#cloneContainer').html('');

        });
    }

    csvExport(){
        let csvData = {},
            columns = [  "Company", "Sub Location", "Contact Person", "Email", "Warden", "P.E.E.P" ],
            getLength = () => {
                return Object.keys(csvData).length;
            };

        let title =  "Teams Report ";
        if(this.pagination.total > this.queries.limit){
            title += " pg."+this.pagination.currentPage;
        }

        csvData[ getLength() ] = [title];

        for(let report of this.reportData){

            let locName = (report.location.parent.name.length > 0) ? report.location.parent.name+' - ' : '';
            locName += report.location.name + ' Current Team Information ';
            csvData[ getLength() ] = [locName];
            csvData[ getLength() ] = columns;

            if( report.data.length == 0 ){
                csvData[ getLength() ] = ["No record found"];
            }else{

                for(let field of report.data){
                    let d = [],
                        comp = '',
                        trps = '',
                        emails = '';

                    for(let i in field['trp']){
                        let accname = field['trp'][i]['account_name'];
                        if(parseInt(i) != field['trp'].length - 1){
                            accname += ' | ';
                        }
                        comp += accname;
                    }

                    d.push(comp);
                    d.push( field['name'] );

                    for(let i of field['trp']){
                        let names = field['trp'][i]['first_name']+' '+field['trp'][i]['last_name'];
                        if(field['trp'][i]['mobile_number'].length > 0){
                            names += ' ('+field['trp'][i]['mobile_number']+') ';
                        }
                        if(parseInt(i) != field['trp'].length - 1){
                            names += ' | ';
                        }
                        trps += names;
                    }
                    d.push(trps);

                    for(let i of field['trp']){
                        let e = field['trp'][i]['email'];
                        if(parseInt(i) != field['trp'].length - 1){
                            e += ' | ';
                        }
                        emails += e;
                    }
                    d.push(emails);
                    d.push( field['total_wardens'] );
                    d.push( field['peep_total'] );

                    csvData[ getLength() ] = d;
                }

                let lastRow = [];
                for(let i in columns){
                    if( parseInt(i) == (columns.length - 1) ){
                        lastRow.push('Total no. of wardens : '+report.total_warden);
                    }else{
                        lastRow.push('');
                    }
                }

                csvData[ getLength() ] = lastRow;
            }
            csvData[ getLength() ] = [];
            csvData[ getLength() ] = [];
        }

        this.exportToCSV.setData(csvData, 'teams-report-'+moment().format('YYYY-MM-DD-HH-mm-ss'));
        this.exportToCSV.export();
    }

    ngOnDestroy(){

    }

}
