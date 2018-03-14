import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { ViewChild } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


declare var $: any;
@Component({
    selector: 'app-teams-add-warden',
    templateUrl: './add-wardens.component.html',
    styleUrls: ['./add-wardens.component.css'],
    providers : [EncryptDecryptService]
})
export class TeamsAddWardenComponent implements OnInit, OnDestroy {
    @ViewChild('f') addWardenForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public addedUsers = [];
    public userProperty = {
        first_name : '',
        last_name : '',
        email : '',
        role_id : 3,
        account_location_id : 0,
        eco_role_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        contact_number : '',
        errors : {}
    };

    public csvValidRecords = [];
    public csvInvalidRecords = [];
    private userRole;
    public accountRoles;
    public ecoRoles;
    public ecoDisplayRoles = [];
    public locations = [];
    public locationsCopy = [];
    public userData = {};
    public selectedUser = {};
    public bulkEmailInvite;
    public CSVFileToUpload;
    public csvHeaderNames;
    public recordOverride;
    droppedFile;

    public routeSub;
    public paramLocIdEnc = '';
    public paramLocId = '';

    searchModalLocationSubs;

    constructor(
        private authService: AuthService,
        private dataProvider: PersonDataProviderService,
        private actRoute : ActivatedRoute,
        private locationService: LocationsService,
        private encdecrypt : EncryptDecryptService,
        private router : Router
        ) {

        this.userData = this.authService.getUserData();

        this.routeSub = this.actRoute.params.subscribe((params) => {
            if('location_id' in params){
                this.paramLocIdEnc = params.location_id;
                this.paramLocId = this.encdecrypt.decrypt(params.location_id);
            }
        });
    }

    ngOnInit() {
        this.accountRoles = [{
            role_id: 3,
            role_name: 'User'
        },
        {
            role_id: 2,
            role_name: 'Tenant'
        }
        ];
        this.userRole = this.authService.getHighestRankRole();
        if (this.userRole == 1) {
            this.accountRoles.push({
                role_id: 1,
                role_name: 'Building Manager'
            });
        }

        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
                this.ecoRoles = roles;
                this.addMoreRow();
            }, (err) => {
                console.log('Server Error. Unable to get the list');
            }
        );

        this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response) => {
            this.locations = response.locations;

            if(this.paramLocIdEnc.length > 0){
                this.locations = this.filterLocationForSelectedValue();
            }

            this.locationsCopy = JSON.parse( JSON.stringify(this.locations) );
        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });

        this.dragDropFileEvent();
        this.onKeyUpSearchModalLocationEvent();
    }

    filterLocationForSelectedValue(){
        let selected = {};
        let loopAddKey = (data, mainParent?) => {
            for(let i in data){
                if(typeof mainParent === 'undefined'){
                    mainParent = JSON.parse(JSON.stringify(data[i]));
                }else if(mainParent.location_id != data[i]['location_id'] && data[i]['parent_id'] == -1){
                    mainParent = JSON.parse(JSON.stringify(data[i]));
                }

                if(this.paramLocIdEnc.length > 0){
                    if(this.paramLocId == data[i]['location_id']){
                        if('location_id' in mainParent){
                            selected = mainParent;
                        }else{
                            selected = data[i];
                        }
                    }
                }

                if(mainParent){
                    data[i]['main_parent'] = (mainParent.location_id != data[i]['location_id']) ? mainParent : {};
                }else{
                    data[i]['main_parent'] = {};
                }

                if(data[i]['sublocations'].length > 0){
                    loopAddKey(data[i]['sublocations'], mainParent);
                }
            }
        };

        loopAddKey(this.locations);

        return [selected];
    }

    showModalCSV(){
        $('#modaCsvUpload').modal('open');
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
                this.droppedFile = e.originalEvent.dataTransfer.files;
                uploadContainer.find('input[type="file"]')[0].files = e.originalEvent.dataTransfer.files;
            });
        }
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
    }

    addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );

        for ( let r of this.ecoRoles ) {
            if (r.is_warden_role == 1) {
                if(!this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ]){
                    this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ] =  [];
                }
                (this.ecoDisplayRoles[  Object.keys(this.addedUsers).length - 1 ]).push(r);
            }
        }

        setTimeout(() => {
            $('form table tbody tr:last-child').find('input.first-name').focus();
        },300);
    }

    onSelectedAccountRole(srcId: number) {
        let r = this.addWardenForm.controls['accountRole' + srcId].value * 1;
        this.ecoDisplayRoles[srcId] = [];
        switch(r) {
            case 1:
            case 2:
            this.ecoDisplayRoles[srcId] = this.ecoRoles;
            break;
            case 3:
            for ( let r of this.ecoRoles ) {
                if (r.is_warden_role == 1) {
                    (this.ecoDisplayRoles[srcId]).push(r);
                }
            }
            break;

        }
        console.log(this.ecoDisplayRoles);
    }

    onChangeDropDown(event){
        if(event.currentTarget.checked){
            $( $(event.currentTarget).parents('.list-division')[0] ).addClass('show-drop-down');
        }else{
            $( $(event.currentTarget).parents('.list-division')[0] ).removeClass('show-drop-down');
        }
    }

    removeAddedUser(index){
        let newList = [];
        for(let i=0; i<=this.addedUsers.length; i++){
            if(i !== index && this.addedUsers[i] !== undefined){
                newList.push(this.addedUsers[i]);
            }
        }
        this.addedUsers = newList;
    }

    showLocationSelection(user){
        $('#modalLocations').modal('open');
        this.selectedUser = user;
    }

    searchChildLocation(data, locationId){
        for(let i in data){
            if(data[i]['location_id'] == locationId){
                return data[i];
            }

            let tmp = this.searchChildLocation(data[i].sublocations, locationId);
            if(tmp){
                if(Object.keys(tmp).length > 0){
                    return tmp;
                }
            }
        }
    }

    findParent(data, parentId){
        for(let i in data){
            if(data[i]['location_id'] == parentId){
                return data[i];
            }

            let tmp = this.findParent(data[i].sublocations, parentId);
            if(tmp){
                if(Object.keys(tmp).length > 0){
                    return tmp;
                }
            }
        }
    }

    getLastParent(locationId){
        let selected = this.searchChildLocation(this.locations, locationId);
        let parent = this.findParent(this.locations, selected.location_id);
        if(Object.keys(parent).length > 0){
            if(parent.parent_id > -1){
                return this.getLastParent(parent.parent_id);
            }else{
                return parent;
            }
        }else{
            return parent;
        }
    }

    submitSelectLocationModal(form, event){
        event.preventDefault();
        if(form.valid){
            let selectedLocationId = form.controls.selectLocation.value,
                selected = this.searchChildLocation(this.locations, selectedLocationId),
                parent = this.findParent(this.locations, selected['parent_id']),
                lastParent = this.getLastParent(selectedLocationId);

            if(typeof parent == undefined){
                parent = selected;
            }

            switch (parseInt(this.selectedUser['role_id']) ) {
                case 1:
                    this.selectedUser['account_location_id'] = lastParent.location_id;
                    break;

                case 2:
                    if(parent.parent_id == -1){
                        this.selectedUser['account_location_id'] = selectedLocationId;
                    }else{
                        this.selectedUser['account_location_id'] = parent.location_id;
                    }

                    break;

                default:
                    this.selectedUser['account_location_id'] = selectedLocationId;
                    break;
            }

            if( parseInt(this.selectedUser['eco_role_id']) > 0){
                this.selectedUser['location_id'] = selectedLocationId;
            }

            this.selectedUser['location_name'] = '';
            if(Object.keys(parent).length > 0){
                this.selectedUser['location_name'] = parent.name+', ';
            }
            this.selectedUser['location_name'] += selected['name'];

            console.log(this.addedUsers);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
        this.modalSearchLocation.nativeElement.value = "";
        this.locations = this.locationsCopy;
    }

    addBulkWarden() {
        const strWardens = JSON.stringify(this.addedUsers);
        this.dataProvider.addBulkWarden(strWardens).subscribe((data) => {
          this.addedUsers = data;
          if(Object.keys(this.addedUsers).length == 0){
              // this.addMoreRow();
              this.router.navigate(["/teams/list-wardens"]);
          }
        },
      (data) => {
        console.log('there was an error');
      });
    }

    selectCSVButtonClick(inputFileCSV) {
        inputFileCSV.click();
    }

    sendInviteOnClick() {
        this.bulkEmailInvite = (this.emailInviteForm.controls.inviteTxtArea.value).split(',');
        const validEmails = [];
        const email_regex =
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
        for (let x = 0; x < this.bulkEmailInvite.length; x++) {
          if (email_regex.test(this.bulkEmailInvite[x].trim())) {
            validEmails.push(this.bulkEmailInvite[x].trim());
          }
        }
        this.dataProvider.sendWardenInvitation(validEmails).subscribe((data) => {
          this.addedUsers = data;
          console.log(data);
          $('#modalInvite').modal('close');
        }, (e) => {
          console.log(e);
        }
        );
        this.emailInviteForm.controls.inviteTxtArea.reset();
    }

    public fileChangeEvent(fileInput: any, btnSelectCSV) {
        this.CSVFileToUpload = <Array<File>> fileInput.target.files;
        btnSelectCSV.innerHTML = this.CSVFileToUpload[0]['name'];
    }

    public onUploadCSVAction() {
        let override = $('#override')[0].checked;
        let formData: any = new FormData();

        formData.append('file', this.CSVFileToUpload[0], this.CSVFileToUpload[0].name);
        formData.append('override',  override);
        this.dataProvider.uploadCSVWardenList(formData).subscribe((data) => {
          console.log(data);
          this.csvInvalidRecords = data.invalid;
          this.csvValidRecords = data.valid;
          this.recordOverride = data['data-override'];
          this.csvHeaderNames = Object.keys(data.valid[0]);
          $('#modaCsvUpload').modal('close');
          setTimeout(() => {
            $('#modalUploadConfirmation').modal('open');
        }, 300);
        }, (e) => {
          console.log(e);
        });
    }

    public onConfirmCSVUpload() {
      const csvRecord = JSON.stringify(this.csvValidRecords);
      this.dataProvider.finalizeCSVRecord(csvRecord, this.recordOverride).subscribe((data) => {
        $('#modalUploadConfirmation').modal('close');
      }, (error: HttpErrorResponse) => {
        alert('There was an error.');
      });
    }

    onKeyUpSearchModalLocationEvent(){
        this.searchModalLocationSubs = Observable.fromEvent(this.modalSearchLocation.nativeElement, 'keyup')
            .debounceTime(500)
            .subscribe((event) => {
            
            let value = event['target'].value,
                result = [];

            let findRelatedName = (data, mainParent?) => {
                for(let i in data){
                    if(data[i]['sublocations'].length > 0){
                        if(data[i]['parent_id'] == -1){
                            findRelatedName(data[i]['sublocations'], data[i]);
                        }else{
                            if(mainParent){
                                findRelatedName(data[i]['sublocations'], mainParent);
                            }else{
                                findRelatedName(data[i]['sublocations']);
                            }
                        }
                    }

                    if(data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1){
                        let isIn = false,
                            compareId = (mainParent) ? mainParent['location_id'] : data[i]['location_id'];
                        for(let x in result){
                            if(result[x]['location_id'] == compareId){
                                isIn = true;
                            }
                        }
                        if(mainParent && !isIn){
                            result.push(mainParent);
                        }else if(!isIn){
                            result.push(data[i]);
                        }
                    }

                    data[i]['showDropDown'] = true;
                }

                return result;
            };

            if(value.length > 0){
                result = [];
                findRelatedName( JSON.parse(JSON.stringify(this.locationsCopy)) );
                this.locations = result;
            }else{
                this.locations = this.locationsCopy;
            }

        });
    }

    ngOnDestroy(){
        this.searchModalLocationSubs.unsubscribe();
    }

}
