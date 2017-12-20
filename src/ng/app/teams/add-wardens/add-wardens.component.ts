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
		eco_role_id : 0,
		location_name : 'Select Location',
		location_id : 0,
		mobile_number : ''
	};
  private userRole;
  public accountRoles;
  public ecoRoles;
  public ecoDisplayRoles = [];
	constructor(private authService: AuthService, private dataProvider: PersonDataProviderService) {

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
    if (this.userRole == 3) {
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

  removeAddedUser(index){
    let newList = [];
    for(let i=0; i<=this.addedUsers.length; i++){
      if(i !== index && this.addedUsers[i] !== undefined){
        newList.push(this.addedUsers[i]);
      }
    }
    this.addedUsers = newList;
  }

  ngOnDestroy(){}

  addBulkWarden() {
    console.log(this.addedUsers);
  }

}
