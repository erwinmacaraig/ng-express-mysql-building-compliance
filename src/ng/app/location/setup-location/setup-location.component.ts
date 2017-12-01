import { Component, OnInit } from '@angular/core';

import { ElementRef, NgZone, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { } from 'googlemaps';
import { MapsAPILoader } from '@agm/core';
// import { Location, LocationModel } from '../../models/location.model';
// import { LocationDataProviderService } from '../../services/location.service';

declare var $: any;
@Component({
  selector: 'app-setup-location',
  templateUrl: './setup-location.component.html',
  styleUrls: ['./setup-location.component.css']
})
export class SetupLocationComponent implements OnInit {
  public searchControl: FormControl;
  public street_number: FormControl;
  public street_name: FormControl;
  public city: FormControl;
  public state: FormControl;
  public postal_code: FormControl;
  public country: FormControl;
  public lat: number;
  public lng: number;
  public formattedAddress: string;
  public photoUrl: string;
  // public location: LocationModel;
  public street: string;
  public readonlyCtrl = false;

  private subscription;
  componentForm = {
            street_number: 'short_name',
            route: 'long_name',
            locality: 'long_name',
            administrative_area_level_1: 'short_name',
            administrative_area_level_2: 'short_name',
            country: 'long_name',
            postal_code: 'short_name'
          };

  public zoom: number;
  @ViewChild('search')
  public searchElementRef: ElementRef;

  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone // ,private locationService: LocationDataProviderService
  ) { }

  ngOnInit() {
    this.zoom = 4;
    this.lat = 39.8282;
    this.lng = -98.5795;

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
          this.lat = place.geometry.location.lat();
          this.lng = place.geometry.location.lng();

          if (place.photos) {
            this.photoUrl = place.photos[0].getUrl({maxWidth: 200, maxHeight: 200});
            console.log(this.photoUrl);
            // this.location.google_photo_url = this.photoUrl;
          }

          for (let i = 0; i < place.address_components.length; i++) {
            const addressType = place.address_components[i].types[0];
            if (this.componentForm[addressType]) {
              const val = place.address_components[i][this.componentForm[addressType]];
              // document.getElementById(addressType).value = val;
              switch (addressType) {
                case 'street_number':
                  this.street_number.setValue(val);
                  this.street = val;
                break;
                case 'route':
                  this.street_name.setValue(val);
                  this.street = this.street + ' ' + val;
                  // this.location.street = this.street;
                break;
                case 'locality':
                  this.city.setValue(val);
                  // this.location.city = val;
                break;
                case 'administrative_area_level_1':
                  this.state.setValue(val);
                  // this.location.state = val;
                break;
                case 'postal_code':
                  this.postal_code.setValue(val);
                  // this.location.postal_code = val;
                break;
                case 'country':
                  this.country.setValue(val);
                  // this.location.country = val;
                break;
              }
            }
          }
        });
      });
    });
  }

  public onSystemSearch() {

    // console.log(this.location);
    /*
    // make a call to the EvacConnect
    this.subscription = this.locationService.searchLocationOnSystem(<Location> {
      street: this.street,
      city: this.city,
      country: 'AU',
      formatted_address: 'dsfsdfdsf dsfdsf',

      lat: this.lat,
      google_photo_url: this.photoUrl}).subscribe(
      (data) => {
        console.log(data);
      });
*/
  }
}
