import { LocationsService } from './../services/locations';
import { AuthService } from './../services/auth.service';
import { AdminService } from './../services/admin.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router} from '@angular/router';
import { PersonDataProviderService } from './../services/person-data-provider.service';
import { UserService } from '../services/users';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ExportToCSV } from '../services/export.to.csv';
import { MessageService } from '../services/messaging.service';

declare var $: any;
@Component({
    selector: 'app-import-csv-button',
    templateUrl: './import-csv.html',
    styleUrls: ['./import-csv.css'],
    providers : [UserService, AdminService, ExportToCSV]
})

export class ImportCsvButtonComponent implements OnInit, OnDestroy {
    @ViewChild('inputFileCSV')inputFileCSV : ElementRef;
    private userRole;
    public ecoRoles;
    public locations = [];
    public buildings = [];
    public levels = [];
    public userData = {};

    public CSVFileToUpload = [];

    public routeSub;

    modalCSVMessage = '';
    titleText = <any> 'Add Users by CSV Upload';
    isMobilityImpaired = 0;

    constructor(
        private cdRef:ChangeDetectorRef,
        private authService: AuthService,
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService,
        private userService : UserService,
        private router : Router,
        private adminService : AdminService,
        private exportToCSV : ExportToCSV,
        private messageService: MessageService
        ) {

        this.userData = this.authService.getUserData();

        
    }

    ngOnInit(){
        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
            this.ecoRoles = roles;
        }, (err) => {
            console.log('Server Error. Unable to get the list');
        }
        );

        this.adminService.getAllLocationsOnAccount(this.userData['accountId']).subscribe((response:any) => {
            this.buildings = response.data.buildings;
            this.levels = response.data.levels;
        });

        this.messageService.getMessage().subscribe((data) => {
            if(data['csv-upload']){
                setTimeout(() => {
                    this.titleText = data['csv-upload']['title'];
                    if(data['csv-upload']['mobility_impaired']){
                        this.isMobilityImpaired = data['csv-upload']['mobility_impaired'];
                    }
                },1000);
            }
        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });

        this.dragDropFileEvent();
    }

    showModalCSV(){
        $('#modaCsvUpload').modal({
            dismissible: false,
            startingTop: '6%',
            endingTop: '5%'
        });
        $('#modaCsvUpload').modal('open');
    }

    canceModal(){
        $('#modaCsvUpload').modal('close');
    }

    selectCSVButtonClick(inputFileCSV){
        console.log(inputFileCSV);
        inputFileCSV.click();
    }

    fileChangeEvent(fileInput: any, btnSelectCSV) {
        this.CSVFileToUpload = <Array<File>> fileInput.target.files;
        console.log(this.CSVFileToUpload);
        if(this.CSVFileToUpload[0]){
            btnSelectCSV.innerHTML = this.CSVFileToUpload[0]['name'];
        }
    };

    onUploadCSVAction() {
        /*let override = $('#override')[0].checked;
        console.log(override);*/

        let emailMandatory = $('#emailMandatory').prop('checked');
        let formData: any = new FormData();

        formData.append('file', this.CSVFileToUpload[0], this.CSVFileToUpload[0].name);
        formData.append('is_email_required',  emailMandatory);
        if(this.isMobilityImpaired){
            formData.append('mobility_impaired',  this.isMobilityImpaired);
        }

        this.modalCSVMessage = 'Sending...';

        this.dataProvider.uploadCSV(formData).subscribe((data:any) => {
            let invalidMsgs = [];
            for(let i in data.invalid){
                invalidMsgs.push(data.invalid[i][0]+' '+data.invalid[i][1]);
            }

            this.inputFileCSV.nativeElement.value = "";

            if(invalidMsgs.length > 0){
                if(data.valid.length > 0){
                    this.modalCSVMessage = 'Success, ';
                }else{
                    this.modalCSVMessage = 'Sorry, ';
                }
                this.modalCSVMessage += 'but unable to save these following: <br/>';
                this.modalCSVMessage += '<ul>';
                for(let i in invalidMsgs){
                    this.modalCSVMessage += '<li style="font-size:16px;">'+invalidMsgs[i]+'</li>';
                }
                this.modalCSVMessage += '</ul>';
            }else{
                this.modalCSVMessage = 'Success!';
                this.CSVFileToUpload = [];
                $('.btn-select-csv').html('Select CSV File');
                setTimeout(() => {
                    
                    this.modalCSVMessage = '';
                }, 2000);
            }

            console.log(data);
            $('#modaCsvUpload').modal('close');
        }, (e) => {
            this.modalCSVMessage = e.error.message;
            setTimeout(() => {
                this.modalCSVMessage = '';
            }, 1500);
        });
    }

    closeModalCSVmessage(){
        this.modalCSVMessage = '';
        this.CSVFileToUpload = [];
        $('.btn-select-csv').html('Select CSV File');
        this.inputFileCSV.nativeElement.value = "";
    }

    isAdvancedUpload() {
        var div = document.createElement('div');
        return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
    };

    dragDropFileEvent(){
        let modal = $('#modaCsvUpload'),
        uploadContainer = modal.find('.upload-container'),
        inputFile = uploadContainer.find('input[name="file"]');

        if(this.isAdvancedUpload()){
            uploadContainer.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            })
            .on('dragover dragenter', () =>  {
                uploadContainer.css({ 'border' : '2px dotted #fc4148' });
            })
            .on('dragleave dragend drop', () => {
                uploadContainer.css({ 'border' : '' });
            })
            .on('drop', (e) => {
                uploadContainer.find('input[type="file"]')[0].files = e.originalEvent.dataTransfer.files;
            });
        }
    }

    clickDownloadTemplate(){
        let 
        csvData = {},
        getLength = () => {
            return Object.keys(csvData).length;
        };

        csvData[ getLength() ] = ["First Name", "Last Name", "Email", "Username", "Phone", "Mobile", "Location Id", "ER Id"];
        csvData[ getLength() ] = [ "Joe", "Doe", "joedoe@example.com", "joedoe", "132456", "63917864112", "123", "8;9;12" ];

        this.exportToCSV.setData(csvData, 'upload-users-template');
        this.exportToCSV.export();
    }

    downloadLocationReference(){
        let 
        csvData = {},
        getLength = () => {
            return Object.keys(csvData).length;
        };

        csvData[ getLength() ] = ["Location Id", "Location Name"];

        for(let level of this.levels){
            let 
            sublocations = (level.sublocations) ? level.sublocations : [],
            sublocationColums = [],
            parentName = level.parent_location_name;

            csvData[ getLength() ] = [ level.parent_location_id, parentName ];

            for(let sub of sublocations){
                csvData[ getLength() ] = [ sub.id, parentName+' >> '+sub.name ];
            }
        }


        this.exportToCSV.setData(csvData, 'locations-reference');
        this.exportToCSV.export();
    }

    downloadEcoReference(){
        let 
        csvData = {},
        getLength = () => {
            return Object.keys(csvData).length;
        };

        csvData[ getLength() ] = ["Role Id", "Role Name", "Warden"];

        for(let eco of this.ecoRoles){
            csvData[ getLength() ] = [eco.em_roles_id, eco.role_name, eco.is_warden_role];
        }

        this.exportToCSV.setData(csvData, 'eco-reference');
        this.exportToCSV.export();
    }

    ngOnDestroy(){
    }


}
