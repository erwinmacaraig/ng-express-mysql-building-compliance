import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { ViewChild } from '@angular/core';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';

declare var $: any;
@Component({
  selector: 'app-add-user',
  templateUrl: './add.user.component.html',
  styleUrls: ['./add.user.component.css'],
  providers : [DashboardPreloaderService, UserService]
})
export class AddUserComponent implements OnInit, OnDestroy {
	@ViewChild('f') addWardenForm: NgForm;
    @ViewChild('invitefrm') emailInviteForm: NgForm;
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
    public locationsCopy = [];
    public userData = {};
    public selectedUser = {};
	public addedUsers = [];
    showLoadingButton = false;

    public bulkEmailInvite;
    public CSVFileToUpload;




	constructor(
        private authService: AuthService, 
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService,
        private dashboardPreloaderService : DashboardPreloaderService,
        private userService : UserService
        ) {

        this.userData = this.authService.getUserData();
        
    }

	ngOnInit(){
		this.accountRoles = [
        {
            role_id: 2,
            role_name: 'Tenant'
        }
        ];
        console.log('Highest rank role is ' + this.authService.getHighestRankRole());
        this.userRole = this.authService.getHighestRankRole();
        if (this.userRole == 1) {
            this.accountRoles.push({
                role_id: 1,
                role_name: 'Building Manager'
            });
        }
        console.log(this.accountRoles);

        // get ECO Roles from db
        this.dataProvider.buildECORole().subscribe((roles) => {
                this.ecoRoles = roles;
                for(let i in roles){
                    this.accountRoles.push({
                        role_id : roles[i]['em_roles_id'],
                        role_name : roles[i]['role_name']
                    });
                }
                console.log(this.ecoRoles);
            }, (err) => {
                console.log('Server Error. Unable to get the list');
            }
        );

        this.dashboardPreloaderService.show();
        this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response) => {
            this.locations = response.locations;
            this.locationsCopy = JSON.parse( JSON.stringify(this.locations) );
            this.dashboardPreloaderService.hide();
        });
	}

	addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );

        setTimeout(() => {
            $('form table tbody tr:last-child').find('input.first-name').focus();
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

    showLocationSelection(user){
        if(user.account_role_id == 1 || user.account_role_id == 11 || user.account_role_id == 15 || user.account_role_id == 16 || user.account_role_id == 18){
            let temp = [];
            for(let i in this.locations){
                let innerTemp = JSON.parse(JSON.stringify(this.locations[i]));
                innerTemp.sublocations = [];
                temp.push(innerTemp);
            }
            this.locations = temp;
        }else{
            this.locations = this.locationsCopy;
        }

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

            if(typeof parent == 'undefined'){
                parent = selected;
            }

            switch (parseInt(this.selectedUser['account_role_id']) ) {
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
                this.selectedUser['eco_location_id'] = selectedLocationId;
            }

            this.selectedUser['location_name'] = '';
            if(typeof parent != 'undefined' && selectedLocationId != parent.location_id){
                this.selectedUser['location_name'] += parent.name+', ';
            }
            this.selectedUser['location_name'] += selected['name'];

            console.log(this.addedUsers);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
    }

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

        this.addMoreRow();
        this.dragDropFileEvent();
	}

	ngOnDestroy(){}

    submitUsers(f){
        if(this.addedUsers.length > 0 && f.valid){
            this.showLoadingButton = true;
            this.userService.createBulkUsers(this.addedUsers, (response) => {
                this.addedUsers = response.data;
                if(this.addedUsers.length == 0){
                    let prop = JSON.parse(JSON.stringify(this.userProperty));
                    this.addedUsers.push( prop );
                }
                this.showLoadingButton = false;
            });
        }
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
}