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
import { MessageService } from '../../services/messaging.service';

declare var $: any;
@Component({
    selector: 'app-teams-add-warden',
    templateUrl: './add-wardens.component.html',
    styleUrls: ['./add-wardens.component.css'],
    providers : [DashboardPreloaderService, UserService, EncryptDecryptService, AdminService, ExportToCSV, MessageService]
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
        role_id : 0,
        account_role_id : 0,
        account_location_id : 0,
        eco_role_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        contact_number : '',
        mobile_number : '',
        errors : {}
    };

    public csvValidRecords = [];
    public csvInvalidRecords = [];
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
    public csvHeaderNames;
    public recordOverride;
    droppedFile;

    public routeSub;
    public paramLocIdEnc = '';
    public paramLocId = '';

    searchModalLocationSubs;
    showLocationsRecursive = false;
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
        private exportToCSV : ExportToCSV,
        private messageService: MessageService
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

        this.onKeyUpSearchModalLocationEvent();
        this.messageService.sendMessage({ 'csv-upload' : {  'title' : 'Nominate Wardens by CSV Upload'  } });
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

    filterLocationsToDisplayByUserRole(user, data){
        let resp = [],
            copy = JSON.parse(JSON.stringify(data));
        /*if (user.eco_role_id == 11 || user.eco_role_id == 15 || user.eco_role_id == 16 || user.eco_role_id == 18){
            resp = JSON.parse( JSON.stringify( this.buildings ) );
        }else{
            resp = JSON.parse( JSON.stringify( this.levels ) );
        }*/

        for(let loc of this.buildings){
            loc['sublocations'] = [];
            for(let level of this.levels){
                if(loc.location_id == level.parent_location_id){
                    for(let sub of level.sublocations){
                        sub['location_id'] = sub.id;
                    }
                    loc['sublocations'] = level.sublocations;
                }
            }
            resp.push(loc);
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

        /*
        if (parseInt(this.selectedUser['eco_role_id'], 10) === 11 ||
            parseInt(this.selectedUser['eco_role_id'], 10) === 15 ||
            parseInt(this.selectedUser['eco_role_id'], 10) === 16 ||
            parseInt(this.selectedUser['eco_role_id'], 10) === 18
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
        */

        for (const loc of this.locations) {
            if (count <= maxDisplay) {
                let ul = ``;
                if(loc.sublocations.length > 0){
                    ul += '<ul style="padding-left: 20px; max-height: 153px; overflow: auto;">';
                        for(let sub of loc.sublocations){
                            ul += `<li class="list-division" id="${sub.location_id}">
                                    <div class="name-radio-plus">
                                        <div class="input">
                                            <input required type="radio" name="selectLocation" value="${sub.location_id}" id="check-${sub.location_id}">
                                            <label for="check-${sub.location_id}">${sub.name}</label>
                                        </div>
                                    </div>
                                </li>`;
                        }
                    ul += '</ul>';
                }
                let $li = $(`
                <li class="list-division" id="${loc.location_id}">
                    <div class="name-radio-plus">
                        <div class="input">
                            <input required type="radio" name="selectLocation" value="${loc.location_id}" id="check-${loc.location_id}">
                            <label for="check-${loc.location_id}">${loc.name}</label>
                        </div>
                    </div>
                    ${ul}
                </li>`);

                ulModal.append($li);
                count++;
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

    submitSelectLocationModal(form, event) {
        event.preventDefault();
        let locationFound = false;
        if(this.formLocValid) {
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
                      this.selectedUser['location_name'] = `${loc['name']}, ${sublocs['name']}`;
                      if (/^[_-\s]$/.test(loc['name'])) {
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
        // this.locations = this.locationsCopy;
    }

    addBulkWarden(f) {
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
        this.userService.createBulkUsers(this.addedUsers, (response) => {
          this.addedUsers = response.data;
          if(this.addedUsers.length == 0){
              this.router.navigate(["/teams/list-wardens"]);
          }
        });
      }
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
          this.addedUsers = data;
          console.log(data);
          $('#modalInvite').modal('close');
        }, (e) => {
          console.log(e);
        }
        );
        this.emailInviteForm.controls.inviteTxtArea.reset();
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

            /*if (parseInt(this.selectedUser['eco_role_id'], 10) === 11 ||
                parseInt(this.selectedUser['eco_role_id'], 10) === 15 ||
                parseInt(this.selectedUser['eco_role_id'], 10) === 16 ||
                parseInt(this.selectedUser['eco_role_id'], 10) === 18
            ) {
            findRelatedName = (data, mainParent?) => {
              for(let i in data){
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
            }*/

            findRelatedName = (data, mainParent?) => {
                for ( let i = 0; i < data.length; i++) {
                    if (data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
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
