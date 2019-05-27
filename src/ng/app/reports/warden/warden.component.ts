import { Subscription } from 'rxjs/Subscription';
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { ReportService } from '../../services/report.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { CourseService } from '../../services/course';
import { UserService } from '../../services/users';
import { ExportToCSV } from '../../services/export.to.csv';
import { Observable } from 'rxjs/Rx';
import { environment } from '../../../environments/environment';
import { PrintService } from '../../services/print.service';

declare var $: any;
// declare var jsPDF: any;

@Component({
    selector : 'app-warden-report-component',
    templateUrl : './warden.component.html',
    styleUrls : [ './warden.component.css' ],
    providers : [ AuthService, MessageService, ReportService, EncryptDecryptService, DashboardPreloaderService, CourseService, ExportToCSV, UserService ]
})

export class WardenReportsComponent implements OnInit, OnDestroy {
    @ViewChild('printContainer') printContainer : ElementRef;
    userData = {};
    rootLocationsFromDb = [];
    results = [];
    backupResults = [];
    routeSubs;
    locationId = 0;
    accountId = 0;
    arrLocationIds = [];

    pagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    queries =  {
        limit : 25,
        offset : 0,
        location_id: null,
        account_id: null,
        searchKey: '',
        getall : false,
        eco_role_ids : [11,15,16,18,9,10],
        eco_order : [11,15,13,16,18,9,10]
    };
    totalCountResult = 0;

    loadingTable = false;

    trainingRequirements = [];

    searchSub: Subscription;
    @ViewChild('searchMember') searchMember: ElementRef;

    pdfLoader = false;
    csvLoader = false;
    exportData = [];
    exportFetchMarker = {};
    print:any;
    isFRP = false;
    emRoles:any = [];
    subscriptionType = 'free';
    constructor(
        private router : Router,
        private activatedRoute : ActivatedRoute,
        private authService : AuthService,
        private messageService : MessageService,
        private reportService : ReportService,
        private encryptDecrypt : EncryptDecryptService,
        private dashboardPreloader : DashboardPreloaderService,
        private courseService : CourseService,
        private exportToCSV : ExportToCSV,
        private userService : UserService
        ) {

        this.userData = this.authService.getUserData();
        this.routeSubs = this.activatedRoute.params.subscribe((params) => {
            this.locationId = this.encryptDecrypt.decrypt( params.locationId );
            this.arrLocationIds = this.locationId.toString().split('-');

            this.getWardenListReport((response) => {
                this.dashboardPreloader.hide();
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                }
            });
        });

        for(let role of this.userData['roles']){
            if(role.role_id == 1){
                this.isFRP = true;
            }
        }

        let qParams = undefined;
        if(this.userData['evac_role'] == 'admin'){
            qParams = {
                'account_id' : this.accountId
            };
        }

        this.reportService.getParentLocationsForReporting(qParams).subscribe((response) => {
            this.rootLocationsFromDb = response['data'];

            setTimeout(() => {

                if(this.locationId == 0){
                    $('#selectLocation option[value="0"]').prop('selected', true);
                }else{
                    $('#selectLocation option[value="0"]').prop('selected', false);
                    for(let i in this.arrLocationIds){
                        $('#selectLocation option[value="'+this.arrLocationIds[i]+'"]').prop('selected', true);
                    }
                }

                $('#selectLocation').material_select(() => {
                    let values = $('#selectLocation').val(),
                        urlparam = '';

                    urlparam = values.join('-');
                });
            },100);
        });

        this.userService.getEmRoles().subscribe((response) => {
            this.emRoles = response;
            /*let selectFilter = $('#selectFilter');
            let roleIds = [9,10,11,15,16,18];
            for(let role of this.emRoles){
                if(roleIds.indexOf(role.em_roles_id) > -1){
                    selectFilter.append(' <option value="'+role.em_roles_id+'">'+role.role_name+'</option> ');
                }
            }

            selectFilter.material_select();*/
        });

        /*this.courseService.getTrainingRequirements((response) => {
            this.trainingRequirements = response.data;

            let selectFilter = $('#selectFilter');
            for(let training of this.trainingRequirements){
                selectFilter.append(' <option value="training-'+training.training_requirement_id+'">'+training.training_requirement_name+'</option> ');
            }

            selectFilter.material_select();
        });*/
    }

    ngOnInit() {
        this.subscriptionType = this.userData['subscription']['subscriptionType'];
    }

    onFilterEvent(returnRole?){
        let 
        epcMembersCheckbox = $('#epcMembersCheckbox'),
        chiefwardenCheckbox = $('#chiefwardenCheckbox'),
        roleIds = [9,10,16,18];

        if(chiefwardenCheckbox.prop('checked')){
            roleIds.push(11,15);
        }

        if(epcMembersCheckbox.prop('checked')){
            roleIds.push(13);
        }

        if(returnRole){
            return roleIds;
        }else{
            this.queries.eco_role_ids = roleIds;

            this.queries.offset = 0;
            this.loadingTable = true;

            this.getWardenListReport((response:any) => {
                this.loadingTable = false;
                if(response.data.length > 0){
                    this.pagination.currentPage = 1;
                    this.totalCountResult = response.pagination.total;
                }else{
                    this.pagination.currentPage = 0;
                }
            });
        }

    }

    ngAfterViewInit(){
        let 
        __this = this,
        selectFilter = $('#selectFilter');

        selectFilter.material_select();
        selectFilter.off('change.filter').on('change.filter', () => {
            this.onFilterEvent();
        });

        $('body').off('close.location').on('close.location', '.select-wrapper.select-location input.select-dropdown', (e) => {
            e.preventDefault();
            let values = $('#selectLocation').val(),
                urlparam = '';

            urlparam = values.join('-');

            console.log('urlparam', urlparam);

            if( this.arrLocationIds.join('-') != urlparam ){
                if(values.indexOf('0') > -1){
                    $('#selectLocation option').prop('selected', false);
                    $('#selectLocation option[value="0"]').prop('selected', true);
                    $('#selectLocation').material_select();
                    urlparam = '0';
                }

                this.queries.offset = 0;
                this.loadingTable = true;
                this.dashboardPreloader.show();

                if(this.userData['evac_role'] == 'admin'){
                    this.router.navigate(['/admin/warden-report/' + this.encryptDecrypt.encrypt(urlparam) + "/" + this.encryptDecrypt.encrypt(this.accountId) ]);
                }else{
                    this.router.navigate(['/reports/warden/' + this.encryptDecrypt.encrypt(urlparam) ]);
                }
            }

        });

        $('body').off('change.epccheckbox').on('change.epccheckbox', '#epcMembersCheckbox', (e) => {
            this.onFilterEvent();
        });

        $('body').off('change.chiefwardencheck').on('change.chiefwardencheck', '#chiefwardenCheckbox', (e) => {
            this.onFilterEvent();
        });

        /*$('#compliantToggle').off('change.compliant').on('change.compliant', () => {
            let checked = $('#compliantToggle').prop('checked');
            if(checked){
                this.queries.compliant = 1;
            }else{
                this.queries.compliant = 0;
            }

            this.queries.offset = 0;
            this.loadingTable = true;

            this.reportService.getWardenListReport(this.queries).subscribe((response:any) => {
              this.results = response['data'];
              this.backupResults = JSON.parse( JSON.stringify(this.results) );
              this.pagination.pages = response.pagination.pages;
              this.pagination.total = response.pagination.total;

              this.pagination.selection = [];
              for(let i = 1; i<=this.pagination.pages; i++){
                  this.pagination.selection.push({ 'number' : i });
              }
              this.loadingTable = false;
            });
        });*/

        this.print = new PrintService({
            content : this.printContainer.nativeElement.outerHTML
        });

        this.dashboardPreloader.show();

        this.searchUser();
    }

    getWardenListReport(callBack?, forExport?){
        this.queries.location_id = this.locationId;
        this.reportService.getWardenListReport(this.queries).subscribe((response:any) => {
            if(!forExport){
                this.results = response['data'];
                this.backupResults = JSON.parse( JSON.stringify(this.results) );
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;

                this.pagination.selection = [];
                for (let i = 1; i<=this.pagination.pages; i++){
                    this.pagination.selection.push({ 'number' : i });
                }

                this.loadingTable = false;
            }
            callBack(response);
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
            this.loadingTable = true;

            this.getWardenListReport((response:any) => {
                this.loadingTable = false;
            });
        }
    }

    printResult(){
        this.print.print(this.printContainer.nativeElement.outerHTML);
    }

    pdfExport(aPdf, printContainer){
        let 
        a = document.createElement("a"),
        searchedName = this.searchMember.nativeElement.value.trim(),
        accntId = (this.accountId != 0) ? this.accountId : this.userData["accountId"],
        roles = this.onFilterEvent(true);

        if(this.userData['evac_role'] == 'admin'){
            accntId = null;
        }

        searchedName = (searchedName.length == 0) ? ' ' : searchedName;

        //a.href = location.origin+"/reports/pdf-warden-list/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+searchedName+"/"+roles.join(",");
        a.href = environment.backendUrl + "/reports/pdf-warden-list/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+searchedName+"/"+roles.join(",");
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();
        a.remove();
    }

    csvExport(){
        let 
        a = document.createElement("a"),
        searchedName = this.searchMember.nativeElement.value.trim(),
        accntId = (this.accountId != 0) ? this.accountId : this.userData["accountId"],
        roles = this.onFilterEvent(true);

        if(this.userData['evac_role'] == 'admin'){
            accntId = null;
        }

        searchedName = (searchedName.length == 0) ? ' ' : searchedName;

        a.href = environment.backendUrl + "/reports/csv-warden-list/"+this.locationId+"/"+this.totalCountResult+"/"+accntId+"/"+this.userData["userId"]+"/"+searchedName+"/"+roles.join(",");
        a.target = "_blank";
        document.body.appendChild(a);

        a.click();
        a.remove();
    }

    ngOnDestroy(){
        this.routeSubs.unsubscribe();
        this.searchSub.unsubscribe();
    }

    searchUser() {

        this.searchSub =  Observable.fromEvent(this.searchMember.nativeElement, 'keyup').debounceTime(800).subscribe((event: KeyboardEvent) => {
            const searchKey = (<HTMLInputElement>event.target).value;
            
            this.loadingTable = true;

            this.queries.searchKey = searchKey;
            this.reportService.getWardenListReport(this.queries).subscribe((response: any) => {
                this.results = response['data'];
                this.backupResults = JSON.parse( JSON.stringify(this.results) );
                this.pagination.pages = response.pagination.pages;
                this.pagination.total = response.pagination.total;
                this.pagination.selection = [];
                for (let i = 1; i <= this.pagination.pages; i++) {
                  this.pagination.selection.push({ 'number' : i });
                }
                this.loadingTable = false;
            });

        });
    }

}
