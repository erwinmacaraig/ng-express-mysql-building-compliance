import { Component, OnInit, OnDestroy, AfterViewInit, Input} from '@angular/core';
import { ActivatedRoute, Params, Router, NavigationEnd } from '@angular/router';

import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var $: any;
declare var moment: any;

@Component({
  selector: 'app-admin-view-location',
  templateUrl: './view-location.component.html',
  styleUrls: ['./view-location.component.css'],
  providers: [ AdminService, DashboardPreloaderService ]
})

export class AdminViewLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  locationId: number;
  tab: any;
  people: Object[] = [];
  accounts: Object[] = [];
  location_details = <any> {
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

  accountIdParam = 0;

  activeLink = '';
  subRouter;

  constructor(
    private route: ActivatedRoute,
    public adminService: AdminService,
    public dashboard: DashboardPreloaderService,
    private router: Router
    ) {
  }

  ngOnInit() {
    this.dashboard.show();
    this.route.params.subscribe((params: Params) => {
      this.locationId = +params['locationId'];
      this.location_details = {
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

      });

      this.adminService.getLocationDetails(this.locationId).subscribe((response) => {
        this.location_details = response['data']['details'];
        this.sublocations = response['data']['children'];
        this.accounts = response['data']['account'];
        this.traversal = response['data']['traversal'][0];
        Object.keys(response['data']['people']).forEach((key) => {
          this.people.push(response['data']['people'][key]);
        });

        if(this.sublocations.length == 0){
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
  }

  ngOnDestroy() {}


}
