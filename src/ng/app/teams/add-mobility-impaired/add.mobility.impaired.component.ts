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

declare var $: any;
@Component({
  selector: 'app-add-mobility-impaired',
  templateUrl: './add.mobility.impaired.component.html',
  styleUrls: ['./add.mobility.impaired.component.css'],
  providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService]
})
export class AddMobilityImpairedComponent implements OnInit, OnDestroy {
	@ViewChild('addMobilityImpairedForm') addMobilityImpairedForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    public addedUsers = [];
    public userProperty = {
        first_name : '',
        last_name : '',
        email: '',
        role_id : 3,
        account_location_id : 0,
        account_role_id : 0,
        eco_role_id : 0,
        eco_location_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        contact_number : '',
        mobile_number : '',
        mobility_impaired: 1,
        errors : {}
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

    public bulkEmailInvite;
    public CSVFileToUpload;

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
        private adminService : AdminService
        ) {

        this.userData = this.authService.getUserData();
    }

	ngOnInit() {
        this.accountRoles = [
        {
            role_id: 2,
            role_name: 'Tenancy Responsible Personnel'
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
                for(let i in roles){
                    this.accountRoles.push({
                        role_id : roles[i]['em_roles_id'],
                        role_name : roles[i]['role_name']
                    });
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

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

        this.dragDropFileEvent();
        this.onKeyUpSearchModalLocationEvent();
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
        let r = this.addMobilityImpairedForm.controls['accountRole' + srcId].value * 1;
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
        }else{
            resp = JSON.parse( JSON.stringify( this.levels ) );
        }

        this.locationsCopy = JSON.parse( JSON.stringify( resp ) );
        return resp;
    }

    buildLocationsListInModal(){
        let
        ulModal = $('#modalLocations ul.locations');

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

    changeRoleEvent(user){
        user.location_name = 'Select Location';
        user.location_id = 0;
        user.account_location_id = 0;
        this.selectedUser = user;
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
        this.buildLocationsListInModal();
    }

    showLocationSelection(user){
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
          console.log(this.addedUsers);
          this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
        this.modalSearchLocation.nativeElement.value = "";
        // this.locations = this.locationsCopy;
    }

    public submitPEEP(f) {
      let allInputValid = false;
      if (f.valid) {
        for(let i in this.addedUsers){
          this.addedUsers[i]['role_id'] = (this.addedUsers[i]['account_role_id'] == 1 ||
          this.addedUsers[i]['account_role_id'] == 2) ? this.addedUsers[i]['account_role_id'] : 0;
          this.addedUsers[i]['eco_role_id'] = (this.addedUsers[i]['account_role_id'] != 1 || this.addedUsers[i]['account_role_id'] != 2) ? this.addedUsers[i]['account_role_id'] : 0;
        }
        for (const u of this.addedUsers) {
          if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(u['email'])) {
            u.errors['invalid'] = `${u['email']} is invalid`;
            allInputValid = false;
          }
        }
        if (allInputValid) {
          this.userService.createBulkUsers(this.addedUsers, (response) => {
            this.addedUsers = response.data;
            if(this.addedUsers.length == 0){
                this.router.navigate(["/teams/mobility-impaired"]);
            }
          });
        }

      }



        /*const strPEEP = JSON.stringify(this.addedUsers);
        this.dataProvider.addPEEP(strPEEP).subscribe((data) => {

            this.addedUsers = data;
            if(Object.keys(this.addedUsers).length == 0){
                // this.addMoreRow();

                this.router.navigate(["/teams/mobility-impaired"]);
            }
        }, (error: HttpErrorResponse) => {
            console.log(error);
        });*/
    }

    showModalCSV(){
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

    public fileChangeEvent(fileInput: any, btnSelectCSV) {
        this.CSVFileToUpload = <Array<File>> fileInput.target.files;
        console.log(this.CSVFileToUpload);
        btnSelectCSV.innerHTML = this.CSVFileToUpload[0]['name'];
    };

    public onUploadCSVAction() {
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

            let findRelatedName = (data, mainParent?) => {
                for(let i in data){
                    if(data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1){
                        result.push(data[i]);
                    }
                }

                return result;
            };

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

    ngOnDestroy(){
        this.searchModalLocationSubs.unsubscribe();
    }
}
