import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { AdminService } from './../../services/admin.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { ExportToCSV } from '../../services/export.to.csv';

declare var $: any;
@Component({
    selector: 'app-add-user',
    templateUrl: './add.user.component.html',
    styleUrls: ['./add.user.component.css'],
    providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService, ExportToCSV]
})
export class AddUserComponent implements OnInit, OnDestroy {
	@ViewChild('f') addWardenForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public userProperty = {
        first_name : '',
        last_name : '',
        email : '',
        account_role_id : 0,
        account_location_id : 0,
        eco_role_id : 0,
        eco_location_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        mobile_number : '',
        errors : {
        }
    };
    private userRole;
    public accountRoles;
    public ecoRoles;
    public ecoDisplayRoles = [];
    public locations = [];
    public buildings = [];
    public levels = [];
    public locationsCopy = [];
    public userData = {};
    public selectedUser = {};
    public addedUsers = [];
    showLoadingButton = false;

    public bulkEmailInvite;
    public CSVFileToUpload;

    public routeSub;
    private paramRole = '';
    private paramLocIdEnc = '';
    private paramLocId = '';

    searchModalLocationSubs;
    formLocValid = false;

    constructor(
        private authService: AuthService,
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService,
        private dashboardPreloaderService : DashboardPreloaderService,
        private userService : UserService,
        private router : Router,
        private actRoute : ActivatedRoute,
        private encdecrypt : EncryptDecryptService,
        private adminService : AdminService,
        private exportToCSV : ExportToCSV
        ) {

        this.userData = this.authService.getUserData();

        this.routeSub = this.actRoute.params.subscribe((params) => {
            if('location_id' in params){
                this.paramLocIdEnc = params.location_id;
                this.paramLocId = this.encdecrypt.decrypt(params.location_id);
                this.paramRole = params.role;
            }
        });
    }

    ngOnInit(){
        this.accountRoles = [
        {
            role_id: 2,
            role_name: 'Tenancy Responsible Personnel',
            selected : (this.paramRole == 'tenant') ? true : false
        }
        ];

        this.userRole = this.authService.getHighestRankRole();
        if (this.userRole == 1) {
            this.accountRoles.push({
                role_id: 1,
                role_name: 'Building Manager',
                selected : (this.paramRole == 'building manager') ? true : false
            });
        }

        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
            this.ecoRoles = roles;
            for(let i in roles){
                this.accountRoles.push({
                    role_id : roles[i]['em_roles_id'],
                    role_name : roles[i]['role_name']
                });
            }

            if(this.paramRole.length > 0){
                let newAccRole = [];
                for(let i in this.accountRoles){
                    if(this.accountRoles[i]['selected']){
                        newAccRole.push(this.accountRoles[i]);
                    }
                }

                this.accountRoles = newAccRole;
            }
        }, (err) => {
            console.log('Server Error. Unable to get the list');
        }
        );

        this.dashboardPreloaderService.show();

        this.adminService.getAllLocationsOnAccount(this.userData['accountId']).subscribe((response:any) => {
            this.buildings = response.data.buildings;
            this.levels = response.data.levels;

            this.dashboardPreloaderService.hide();
            this.addMoreRow();
        });
    }

    addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));

        if(this.paramRole.length > 0){
            for(let i in this.accountRoles){
                if(this.accountRoles[i]['selected']){
                    prop.account_role_id = this.accountRoles[i]['role_id']
                }
            }
        }

        this.addedUsers.push( prop );

        setTimeout(() => {
            $("form table tbody tr:last-child").find('input.first-name').focus();
        },300);
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

    filterLocationsToDisplayByUserRole(user, data){
        let resp = [],
            copy = JSON.parse(JSON.stringify(data));
        if(user.account_role_id == 1 || user.account_role_id == 11 || user.account_role_id == 15 || user.account_role_id == 16 || user.account_role_id == 18){
            resp = JSON.parse( JSON.stringify( this.buildings ) );
        } else {
            resp = JSON.parse( JSON.stringify( this.levels ) );
        }
        this.locationsCopy = JSON.parse( JSON.stringify( resp ) );
        return resp;
    }

    buildLocationsListInModal(){
        const ulModal = $('#modalLocations ul.locations');
        ulModal.html('');
        $('body').off('click.radio').on('click.radio', 'input[type="radio"][name="selectLocation"]', () => {
            $('#modalLocations')[0].scrollTop = 0;
            this.formLocValid = true;
        });

        let maxDisplay = 25,
            count = 1;

        if (parseInt(this.selectedUser['account_role_id'], 10) === 1 ||
            parseInt(this.selectedUser['account_role_id'], 10) === 11 ||
            parseInt(this.selectedUser['account_role_id'], 10) === 15 ||
            parseInt(this.selectedUser['account_role_id'], 10) === 16 ||
            parseInt(this.selectedUser['account_role_id'], 10) === 18
           ) {
          for (let loc of this.locations) {
            if (count <= maxDisplay) {
                let $li = $(`
                    <li class="list-division" id="${loc.location_id}">
                        <div class="name-radio-plus">
                            <div class="input">
                                <input required type="radio" name="selectLocation" value="${loc.location_id}" id="check-${loc.location_id}">
                                <label for="check-${loc.location_id}">${loc.name}</label>
                            </div>
                        </div>
                    </li>`);

                ulModal.append($li);
                count++;
            }
          }
        } else {
          for (const loc of this.locations) {
            if (count <= maxDisplay) {
              const $lh = $(`<lh><h6>${loc['parent_location_name']}</h6></lh>`);
              ulModal.append($lh);
              if ('sublocations' in loc) {
                for (const subloc of loc.sublocations) {
                  const $li = $(`
                      <li class="list-division" id="${subloc.id}">
                          <div class="name-radio-plus">
                              <div class="input">
                                  <input required type="radio"
                                  name="selectLocation"
                                  value="${subloc.id}" id="check-${subloc.id}">
                                  <label for="check-${subloc.id}">${subloc.name}</label>
                              </div>
                          </div>
                      </li>`);
                  ulModal.append($li);
                }
              }
              count++;
            }
          }
        }
    }

    changeRoleEvent(user) {
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
    }

    showLocationSelection(user) {
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
        $('#modalLocations').modal('open');
        this.formLocValid = false;
    }

    submitSelectLocationModal(form, event){
        event.preventDefault();
        let locationFound = false;
        if(this.formLocValid){
            let
            selectedLocationId = $(form).find('input[type="radio"]:checked').val();

            this.selectedUser['account_location_id'] = selectedLocationId;
            if( parseInt(this.selectedUser['eco_role_id']) > 0){
                this.selectedUser['eco_location_id'] = selectedLocationId;
            }

            this.selectedUser['location_name'] = '';
            for(let loc of this.locationsCopy){
                if(loc.location_id == selectedLocationId){
                    this.selectedUser['location_name'] = loc.name;
                    locationFound = true;
                    break;
                }
            }
            if (!locationFound) {
              for (const loc of this.locationsCopy) {
                if ('sublocations' in loc) {
                  for (const sublocs of loc['sublocations']) {
                    if (sublocs['id'] == selectedLocationId) {
                      this.selectedUser['location_name'] = `${loc['parent_location_name']}, ${sublocs['name']}`;
                      if (/^[_-\s]$/.test(loc['parent_location_name'])) {
                        this.selectedUser['location_name'] = `${sublocs['name']}`;
                      }
                      locationFound = true;
                      break;
                    }
                  }
                }
              }
            }

            for (const u of this.addedUsers) {
              if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
                u.errors['invalid'] = `${u['email']} is invalid`;
              }
            }

            // console.log(this.addedUsers);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
        this.modalSearchLocation.nativeElement.value = "";
        // this.locations = JSON.parse(JSON.stringify(this.locationsCopy));
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });


        this.dragDropFileEvent();

        this.onKeyUpSearchModalLocationEvent();
    }

    submitUsers(f) {
      // console.log(f);
      let allInputValid = true;
      if (this.addedUsers.length > 0 && f.valid) {
        for (const u of this.addedUsers) {
          if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
            u.errors['invalid'] = `${u['email']} is invalid`;
            allInputValid = false;
          }
        }
      }

      if (allInputValid) {
          this.showLoadingButton = true;
          this.userService.createBulkUsers(this.addedUsers, (response) => {
              this.addedUsers = response.data;
              if(this.addedUsers.length == 0){
                  // let prop = JSON.parse(JSON.stringify(this.userProperty));
                  // this.addedUsers.push( prop );

                  this.router.navigate(['/teams', 'all-users']);
              }
              this.showLoadingButton = false;
          });
      }
    }

    showModalCSV(){
        $('#modaCsvUpload').modal({
            dismissible: false,
            startingTop: '6%',
            endingTop: '5%'
        });
        $('#modaCsvUpload').modal('open');
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
    }

    selectCSVButtonClick(inputFileCSV){
        console.log(inputFileCSV);
        inputFileCSV.click();
    }

    sendInviteOnClick() {
        this.bulkEmailInvite = (this.emailInviteForm.controls.inviteTxtArea.value).split(',');
        const validEmails = [];
        const email_regex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
        for (let x = 0; x < this.bulkEmailInvite.length; x++) {
            if (email_regex.test(this.bulkEmailInvite[x].trim())) {
                validEmails.push(this.bulkEmailInvite[x].trim());
            }
        }
        this.dataProvider.sendWardenInvitation(validEmails).subscribe((data) => {
            console.log(data);
            $('#modalInvite').modal('close');
        }, (e) => {
            console.log(e);
        }
        );
        this.emailInviteForm.controls.inviteTxtArea.reset();
    }

    fileChangeEvent(fileInput: any, btnSelectCSV) {
        this.CSVFileToUpload = <Array<File>> fileInput.target.files;
        console.log(this.CSVFileToUpload);
        btnSelectCSV.innerHTML = this.CSVFileToUpload[0]['name'];
    };

    onUploadCSVAction() {
        let override = $('#override')[0].checked;
        console.log(override);
        let formData: any = new FormData();

        formData.append('file', this.CSVFileToUpload[0], this.CSVFileToUpload[0].name);
        formData.append('override',  override);
        this.dataProvider.uploadCSVWardenList(formData).subscribe((data) => {
            console.log(data);
        }, (e) => {
            console.log(e);
        });
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

    onKeyUpSearchModalLocationEvent(){
        this.searchModalLocationSubs = Observable.fromEvent(this.modalSearchLocation.nativeElement, 'keyup')
            .debounceTime(500)
            .subscribe((event) => {
            this.formLocValid = false;
            let value = event['target'].value,
                result = [];
            let seenSubLocIndex = [];
            const seenIndex = [];
            let findRelatedName;

            if (parseInt(this.selectedUser['account_role_id'], 10) === 1 ||
                parseInt(this.selectedUser['account_role_id'], 10) === 11 ||
                parseInt(this.selectedUser['account_role_id'], 10) === 15 ||
                parseInt(this.selectedUser['account_role_id'], 10) === 16 ||
                parseInt(this.selectedUser['account_role_id'], 10) === 18
            ) {
              findRelatedName = (data, mainParent?) => {
                for(let i in data) {
                    if(data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1){
                        result.push(data[i]);
                    }
                }
                return result;
              };
            } else {

              findRelatedName = (data, mainParent?) => {
                for ( let i = 0; i < data.length; i++) {
                  if (data[i]['parent_location_name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                    result.push(data[i]);
                  }
                }
                for ( let i = 0; i < data.length; i++) {
                    seenSubLocIndex = [];
                    for (let s = 0; s < data[i]['sublocations'].length; s++) {
                      if (data[i]['sublocations'][s]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                        if (seenIndex.indexOf(i)) {
                          seenIndex.push(i);
                        }
                        seenSubLocIndex.push(data[i]['sublocations'][s]);
                        data[i]['sublocations'] = seenSubLocIndex;
                      }
                    }
                  }
                  for (let si = 0; si < seenIndex.length; si++) {
                    result.push(data[seenIndex[si]]);
                  }
                return result;
              };
            }

            if(value.length > 0){
                result = [];
                findRelatedName( JSON.parse(JSON.stringify(this.locationsCopy)) );
                this.locations = result;
            }else{
                this.locations = JSON.parse(JSON.stringify(this.locationsCopy));
            }

            this.buildLocationsListInModal();
        });
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
        this.routeSub.unsubscribe();
        this.searchModalLocationSubs.unsubscribe();
    }


}
