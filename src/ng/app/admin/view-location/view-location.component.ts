import { Component, OnInit, OnDestroy, AfterViewInit, Input, ElementRef, ViewChild} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NgForm } from '@angular/forms';

import { AdminService } from './../../services/admin.service';
import { LocationsService } from './../../services/locations';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Subscription } from 'rxjs/Rx';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
declare var moment: any;

@Component({
  selector: 'app-admin-view-location',
  templateUrl: './view-location.component.html',
  styleUrls: ['./view-location.component.css'],
  providers: [ AdminService, DashboardPreloaderService, LocationsService ]
})

export class AdminViewLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('roleSelector') roleSelectorDrp: ElementRef;
  @ViewChild('searchMemberInput') searchMember: ElementRef;
  locationId: number;
  tab: any;
  message = '';
  people: Object[] = [];
  private users = [];
  accounts: Object[] = [];
  searchMemberInput;
  private isArchived = 0;
  location_details = <any> {
    location_id: 0,
    parent_id: 0,
    name: '',
    unit: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    formatted_address: '',
    lat: '',
    lng: '',
    time_zone: '',
    order: '',
    is_building: 0,
    location_directory_name: '',
    archived: 0,
    google_place_id: '',
    google_photo_url: '',
    admin_verified: '',
    admin_verified_date: '',
    admin_id: 0,
    online_training: 0
  };
  sublocations: Object[] = [];
  traversal: Object = {};
  complianceLocation = 0;
  accountIdParam = 0;

  activeLink = '';
  subRouter: Subscription;
  paramSub:Subscription;
  tempUsersCopy = [];
  constructor(
    private route: ActivatedRoute,
    public adminService: AdminService,
    public dashboard: DashboardPreloaderService,
    private router: Router,
    private locationService: LocationsService
    ) {
  }

  ngOnInit() {
    
    this.paramSub =  this.route.params.subscribe((params: Params) => {
      this.locationId = +params['locationId'];
      this.location_details = {
        parent_id: 0,
        location_id: 0,
        name: '',
        unit: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        formatted_address: '',
        lat: '',
        lng: '',
        time_zone: '',
        order: '',
        is_building: 0,
        location_directory_name: '',
        archived: 0,
        google_place_id: '',
        google_photo_url: '',
        admin_verified: '',
        admin_verified_date: '',
        admin_id: 0,
        online_training: 0
      }; 
      this.sublocations = [];
      this.accounts = [];
      this.traversal = {};
      this.people = [];
     

      this.subRouter = this.route.queryParams.subscribe((observer) => {
        this.activeLink = (observer['active']) ? observer['active'] : '';
        if(this.activeLink.length == 0){
          const queryParams: Params = Object.assign({}, this.route.snapshot.queryParams);
          queryParams['active'] = 'locations';
          this.router.navigate(['/admin/view-location/'+this.locationId], { queryParams: queryParams });
        }

        if(observer['accntId']){
          this.accountIdParam = observer['accntId'];
        }
        this.adminService.getLocationDetails(this.locationId).subscribe((response) => {
          this.people = [];
          this.users = [];
          let peopleCtr = [];
          this.location_details = response['data']['details'];
          this.isArchived = response['data']['details']['archived'];
          this.sublocations = response['data']['children'];
          this.accounts = response['data']['account'];
          this.traversal = response['data']['traversal'][0];
          // check where compliance takes place
          if (this.traversal['is_building']) {
            this.complianceLocation = this.traversal['location_id'];
          } else if (this.traversal['p1_is_building']) {
            this.complianceLocation = this.traversal['p1_location_id'];
          } else if (this.traversal['p2_is_building']) {
            this.complianceLocation = this.traversal['p2_location_id'];
          } else if (this.traversal['p3_is_building']) {
            this.complianceLocation = this.traversal['p3_location_id'];
          } else if (this.traversal['p4_is_building']) {
            this.complianceLocation = this.traversal['p4_location_id'];
          } else if (this.traversal['p5_is_building']) {
            this.complianceLocation = this.traversal['p5_location_id'];
          } else {
            this.complianceLocation = this.traversal['location_id'];
          }
          Object.keys(response['data']['people']).forEach((key) => {
            if (peopleCtr.indexOf(key) == -1) {
              peopleCtr.push(key);
              this.people.push(response['data']['people'][key]);
              this.users.push(response['data']['people'][key]);
            }
            
          });
    
          if(this.sublocations.length == 0 && this.location_details.is_building == 1) {
            const queryParams: Params = Object.assign({}, this.route.snapshot.queryParams);
            queryParams['active'] = 'people';
            this.router.navigate(['/admin/view-location/'+this.locationId], { queryParams: queryParams });
          }
    
          this.dashboard.hide();
          // console.log(this.people);
        }, (error) => {
          this.dashboard.hide();
          console.log(error);
        });
      });

      
    });
  }

  
  public toggleOnlineTrainingAccess(e): void {
    let toggleOnlineAccess = 0;
    if (e.target.checked) {
      toggleOnlineAccess = 1;
    }
    this.adminService.toggleOnlineTrainingAccess({
      location: this.locationId,
      online_access: toggleOnlineAccess
    }).subscribe((response) => {
        console.log(response);
    });
  }

  ngAfterViewInit() {
    $('.tabs').tabs();

    $('.modal').modal({
      dismissible: false
    });
    this.searchMemberEvent();

  }

  ngOnDestroy() {
    this.paramSub.unsubscribe();
    this.subRouter.unsubscribe();
    
    
  }

  archiveLocation(e) {
    let control = 1;
    this.dashboard.show();
    if (e.target.checked) { 
      control = 1;
    } else {
      control = 0;      
    }
    this.locationService.archiveLocation({
      location_id: this.location_details.location_id,
      archived: control
    }).subscribe((response) => {
      
      this.message = 'Archive operation successful.';
      $('#modalConfirm').modal('open');
          
    }, (error) => {
      this.message = 'There was a problem performing the operation. Try again later.';
      $('#modalConfirm').modal('open');
      this.location_details.archived = this.isArchived;
      console.log(error);
      
    });

  }

  public updateInfo(f: NgForm) {    
    this.locationService.updateLocationDetails(f.value).subscribe((response) => {
      this.message = 'Location details updated.';
      $('#modalConfirm').modal('open');
    }, (err) => {
      this.message = 'There was a problem updating location information.';
      $('#modalConfirm').modal('open');
    });

  }

  filterByRole(e) {
    this.people = [];
    let searchRoleId = parseInt(e.target.value, 10);
    this.searchMember.nativeElement.value = '';
    if (searchRoleId == 0) {
      this.people = this.users;
    } else {
      for (let u of this.users) {
        if ( (u['role_ids'] as number[]).indexOf(searchRoleId) != -1) {
          this.people.push(u);
        }
      }
    }
  }

  searchMemberEvent(){
    this.searchMemberInput = Rx.Observable.fromEvent(document.querySelector('#searchMemberInput'), 'input');
    this.searchMemberInput.debounceTime(800)
        .map(event => event.target.value)
        .subscribe((value) => {          
            this.tempUsersCopy = this.people;
            this.people = [];
            if (value.length == 0) {
             this.people = this.users;
             this.roleSelectorDrp.nativeElement.value = '0';
            } else {
                let searchKey = value.toLowerCase();                
                for (let user of this.tempUsersCopy) {
                    if (user['name'].toLowerCase().search(searchKey) !== -1) {                        
                        this.people.push(user);
                    }                    
                }                
            }
        });
}


}
