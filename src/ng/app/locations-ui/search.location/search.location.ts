import { Component, OnInit, OnDestroy } from '@angular/core';

import { ElementRef, NgZone, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { } from 'googlemaps';
import { MapsAPILoader } from '@agm/core';
import { LocationsService } from '../../services/locations';
import { Router } from '@angular/router';
declare var $: any;
@Component({
  selector: 'app-search.location',
  templateUrl: './search.location.html',
  styleUrls: ['./search.location.css']
})
export class SearchLocationComponent implements OnInit, OnDestroy {
  public latitude: number;
  public longitude: number;
  public searchControl: FormControl;
  public street_number: FormControl;
  public street_name: FormControl;
  public city: FormControl;
  public state: FormControl;
  public postal_code: FormControl;
  public country: FormControl;
  public photoUrl;
  public searchResultLocation = {};
  public formattedAddress: string;

  public readonlyCtrl = false;

  componentForm = {
   street_number: 'short_name',
   route: 'long_name',
   locality: 'long_name',
   administrative_area_level_1: 'short_name',
   administrative_area_level_2: 'short_name',
   country: 'short_name',
   postal_code: 'short_name',

   };

  public zoom: number;
  @ViewChild('search')
  public searchElementRef: ElementRef;

  constructor(private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private locationService: LocationsService,
    private router: Router) {
 }

  ngOnInit() {
    $('select').material_select();
    this.street_number = new FormControl();
    this.street_name = new FormControl();
    this.city = new FormControl();
    this.state = new FormControl();
    this.postal_code = new FormControl();
    this.country = new FormControl();
    // create search FormControl
    this.searchControl = new FormControl();
    // load places autocomplete
    this.mapsAPILoader.load().then(() => {
      const autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement, {
        types: []
      });
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();
          if (place.geometry === undefined || place.geometry === null) {
            this.readonlyCtrl = false;
            return;
          }
          this.readonlyCtrl = true;
          console.log(place);
          if (place.photos) {
            this.photoUrl = place.photos[0].getUrl({maxHeight: 250, maxWidth: 200});
            this.searchResultLocation['photoUrl'] = this.photoUrl;
          }
          this.searchResultLocation['latitude'] = place.geometry.location.lat();
          this.searchResultLocation['longitude'] = place.geometry.location.lng();
          this.searchResultLocation['formatted_address'] = place.formatted_address;
          this.searchResultLocation['google_place_id'] = place.place_id;

          for (let i = 0; i < place.address_components.length; i++) {
            const addressType = place.address_components[i].types[0];
            if (this.componentForm[addressType]) {
              const val = place.address_components[i][this.componentForm[addressType]];
             // document.getElementById(addressType).value = val;
              switch (addressType) {
                case 'street_number':
                  this.street_number.setValue(val);
                  this.searchResultLocation['street_number'] = val;
                break;
                case 'route':
                  this.street_name.setValue(val);
                  this.searchResultLocation['street'] = val;
                break;
                case 'locality':
                  this.city.setValue(val);
                  this.searchResultLocation['city'] = val;
                break;
                case 'administrative_area_level_1':
                  this.state.setValue(val);
                  this.searchResultLocation['state'] = val;
                break;
                case 'postal_code':
                  this.postal_code.setValue(val);
                  this.searchResultLocation['postal_code'] = val;
                break;
                case 'country':
                  this.country.setValue(val);
                  this.searchResultLocation['country'] = val;
                break;
              }
            }
          }
          console.log(this.searchResultLocation);
          this.localLocationSearch(this.searchResultLocation);
        });
      });
    });
  }

  ngOnDestroy() {}

  localLocationSearch(location: Object) {
    this.locationService.searchForLocation(location).subscribe((data) => {
      console.log(data);
      this.locationService.locationDataStore(location);
      this.router.navigate(['/locations-ui/add-single-location']);
    });
  }
}
