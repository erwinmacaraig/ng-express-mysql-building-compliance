import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { UserService } from '../../services/users';
import { ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
  selector: 'app-add-mobility-impaired',
  templateUrl: './add.mobility.impaired.component.html',
  styleUrls: ['./add.mobility.impaired.component.css'],
  providers : [UserService]
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
    public locationsCopy = [];
    public userData = {};
    public selectedUser = {};

    public bulkEmailInvite;
    public CSVFileToUpload;

    searchModalLocationSubs;

    constructor(
        private authService: AuthService,
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService,
        private userService : UserService,
        private router : Router
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
                this.addMoreRow();
            }, (err) => {
                console.log('Server Error. Unable to get the list');
            }
        );
        this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response) => {
            this.locations = response.locations;

            this.locationsCopy = JSON.parse( JSON.stringify(this.locations) );
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
            let temp = [];
            for(let i in data){
                let innerTemp = JSON.parse(JSON.stringify(data[i]));
                innerTemp.sublocations = [];
                temp.push(innerTemp);
            }
            resp = temp;
        }else{
            resp = copy;
        }

        return resp;
    }

    showLocationSelection(user){
        this.locations = this.filterLocationsToDisplayByUserRole(user, JSON.parse(JSON.stringify(this.locationsCopy)));
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
            parent;

            if(selected.parent){
                parent = selected.parent;
            }

            this.selectedUser['account_location_id'] = selectedLocationId;

            if( parseInt(this.selectedUser['eco_role_id']) > 0){
                this.selectedUser['eco_location_id'] = selectedLocationId;
            }

            this.selectedUser['location_name'] = '';
            try{
                let parent = this.searchChildLocation(this.locations, selected.parent_id);
                this.selectedUser['location_name'] += parent.name +', ';
            }catch(e){}
            this.selectedUser['location_name'] += selected['name'];

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

    public submitPEEP() {

        for(let i in this.addedUsers){
            this.addedUsers[i]['role_id'] = (this.addedUsers[i]['account_role_id'] == 1 || this.addedUsers[i]['account_role_id'] == 2) ? this.addedUsers[i]['account_role_id'] : 0;
            this.addedUsers[i]['eco_role_id'] = (this.addedUsers[i]['account_role_id'] != 1 || this.addedUsers[i]['account_role_id'] != 2) ? this.addedUsers[i]['account_role_id'] : 0;
        }

        this.userService.createBulkUsers(this.addedUsers, (response) => {
            this.addedUsers = response.data;
            if(this.addedUsers.length == 0){
                this.router.navigate(["/teams/mobility-impaired"]);
            }
        });

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
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
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
                this.locations = JSON.parse(JSON.stringify(this.locationsCopy));
            }

            this.locations = this.filterLocationsToDisplayByUserRole(this.selectedUser, this.locations);

        });
    }

    ngOnDestroy(){
        this.searchModalLocationSubs.unsubscribe();
    }
}
