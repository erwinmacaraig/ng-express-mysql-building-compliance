import { LocationsService } from './../../services/locations';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PersonDataProviderService } from './../../services/person-data-provider.service';
import { ViewChild } from '@angular/core';


declare var $: any;
@Component({
    selector: 'app-teams-add-warden',
    templateUrl: './add-wardens.component.html',
    styleUrls: ['./add-wardens.component.css']
})
export class TeamsAddWardenComponent implements OnInit, OnDestroy {
    @ViewChild('f') addWardenForm: NgForm;
    public addedUsers = [];
    public userProperty = {
        first_name : '',
        last_name : '',
        email_or_username : '',
        account_role_id : 0,
        account_location_id : 0,
        eco_role_id : 0,
        eco_location_id : 0,
        location_name : 'Select Location',
        location_id : 0,
        mobile_number : ''
    };
    private userRole;
    public accountRoles;
    public ecoRoles;
    public ecoDisplayRoles = [];
    public locations = [];
    public userData = {};
    public selectedUser = {};
    constructor(
        private authService: AuthService, 
        private dataProvider: PersonDataProviderService,
        private locationService : LocationsService
        ) {

        this.userData = this.authService.getUserData();
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
                console.log(this.ecoRoles);
            }, (err) => {
                console.log('Server Error. Unable to get the list');
            }
        );

        this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response) => {
            this.locations = response.locations;
        });
    }

    ngAfterViewInit(){
        $('.modal').modal({
            dismissible: false
        });
    }

    showModalCSV(){
        $('#modaCsvUpload').modal('open');
    }

    showModalInvite(){
        $('#modalInvite').modal('open');
    }

    addMoreRow(){
		//a copy
		let prop = JSON.parse(JSON.stringify(this.userProperty));
		this.addedUsers.push( prop );
    }

    onSelectedAccountRole(srcId: number) {
        console.log(this.addWardenForm.controls['accountRole' + srcId].value);
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

            this.selectedUser['location_name'] = selected['name'];

            console.log(this.addedUsers);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        $('#modalLocations').modal('close');
        this.selectedUser = {};
    }

    ngOnDestroy(){}

    addBulkWarden() {
        console.log(this.addedUsers);
    }

}
