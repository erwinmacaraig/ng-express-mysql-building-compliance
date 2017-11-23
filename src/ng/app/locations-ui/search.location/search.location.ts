import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { ElementRef, NgZone, ViewChild } from '@angular/core';
import { FormControl, FormArray, FormGroup, Validators } from '@angular/forms';
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

  public numLevels: FormControl;
  public levels;
  public numbers;
  public levelGroup: FormGroup;
  public locationName: FormControl;

  public showLoaderDiv = false;

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

    this.street_number = new FormControl();
    this.street_name = new FormControl();
    this.city = new FormControl();
    this.state = new FormControl();
    this.postal_code = new FormControl();
    this.country = new FormControl();
    this.numLevels = new FormControl();
    this.locationName = new FormControl(null, Validators.required);
    this.numLevels.setValue(1);
    this.numbers = Array(1).fill(0).map((x, i) => i);
    this.levels = new FormArray([]);
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
          if (place.photos) {
            this.photoUrl = place.photos[0].getUrl({maxHeight: 250, maxWidth: 200});
            this.searchResultLocation['photoUrl'] = this.photoUrl;
          }
          this.searchResultLocation['latitude'] = place.geometry.location.lat();
          this.searchResultLocation['longitude'] = place.geometry.location.lng();
          this.searchResultLocation['formatted_address'] = place.formatted_address;
          this.formattedAddress = place.formatted_address;
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
          this.localLocationSearch(this.searchResultLocation);
        });
      });
    });

    this.levelGroup = new FormGroup({
      'levels': new FormArray([])
    });
  }

  ngOnDestroy() {}

  clearSearch(){
    $('.search-container').removeClass('active');
    this.searchElementRef.nativeElement.value = "";
  }

  ngAfterViewInit(){
    $('.modal').modal({
      dismissible : false
    });
  }

  localLocationSearch(location: Object) {
    $('.search-container').addClass('active');
    this.locationService.searchForLocation(location).subscribe((data) => {
      this.locationService.locationDataStore(location);
    });
  }

  updateLevels() {
    const arr = <FormArray>this.levelGroup.controls.levels;
    arr.controls = [];

    this.numbers = Array(this.numLevels.value).fill(0).map((x, i) => i);
    for (let i = 0; i < this.numbers.length; i++) {
      const control = new FormControl(null, Validators.required);
      (<FormArray>this.levelGroup.get('levels')).push(control);
    }

  }

  createLocation() {
    this.showLoaderDiv = true;
    const arr = <FormArray>this.levelGroup.controls.levels;
    const sublevels = [];

    for (let i = 0; i < arr.controls.length; i++) {
      console.log(<FormControl>arr.controls[i]);
      sublevels.push(<FormControl>arr.controls[i].value);
    }

    let redirectToList = () => {
      $('#modalSetLevels').modal('close');
      setTimeout(() => {
        this.router.navigate(['list-locations']);
      },300);
    };

    console.log('test: ', this.searchResultLocation);
    if (this.searchResultLocation) {
      this.searchResultLocation['sublevels'] = sublevels;
      this.searchResultLocation['location_name'] = this.locationName.value;
      this.locationService.createSingleLocation(this.searchResultLocation).subscribe((data) => {
        redirectToList();
      });
    } else {
      this.locationService.createSingleLocation({
        'street_number': this.locationService.getDataStore('street_number'),
        'street': this.locationService.getDataStore('street'),
        'city': this.locationService.getDataStore('city'),
        'state': this.locationService.getDataStore('state'),
        'country': this.locationService.getDataStore('country'),
        'postal_code': this.locationService.getDataStore('postal_code'),
        'formatted_address': this.locationService.getDataStore('formatted_address'),
        'latitude': this.locationService.getDataStore('latitude'),
        'longitude': this.locationService.getDataStore('longitude'),
        'photoUrl': this.locationService.getDataStore('photoUrl'),
        'google_place_id': this.locationService.getDataStore('google_place_id'),
        'location_name': this.locationName.value,
        'sublevels': sublevels
      }).subscribe((data) => {
        redirectToList();
      });
    }

  }

}
