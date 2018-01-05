
import { AuthService } from '../../services/auth.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { ElementRef, NgZone, ViewChild } from '@angular/core';
import { FormControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { } from 'googlemaps';
import { MapsAPILoader } from '@agm/core';
import { LocationsService } from '../../services/locations';
import { UserService } from './../../services/users';
import { Router } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;
@Component({
  selector: 'app-search-location',
  templateUrl: './search-location.component.html',
  styleUrls: ['./search-location.component.css'],
  providers: [EncryptDecryptService, UserService]
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
  public accountId;
  public userData;
  public readonlyCtrl = false;

  public numLevels: FormControl;
  public levels;
  public numbers;
  public levelGroup: FormGroup;
  public locationName: FormControl;
  public results = [];
  public showLoaderDiv = false;

  public skipVerification = false;

  showLoaderModalAddSublocation = false;
  errorMessageModalSublocation = '';

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

  @ViewChild('inpSublocationName') public inpSublocationName: ElementRef;


  public selectedLocation = {};
  public selectedLocationIds = [];
  public selectedLocationSubLocations = [];
  public arrFlatSelectedLocations = [];
  public arrSelectedLocationsCopy = [];
  public showLoaderModalSubLocation = false;
  public showModalAlreadyVerified = false;
  public emailVerified = false;

  private waitTyping = {};
  private typingLevelModal = false;
  public sameSublocation = [];
  public inpSublocationNameTwoWayData = "";
  public selectedSubLocationFromModal = {};

  constructor(private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private locationService: LocationsService,
    private router: Router,
    private authService: AuthService,
    public encryptDecrypt: EncryptDecryptService,
    public userService: UserService) {

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

    this.accountId = this.encryptDecrypt.encrypt(this.authService.userDataItem('accountId')).toString();
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

    this.userData = this.authService.getUserData();
    // check if user email is verified
    this.userService.checkUserVerified(this.userData['userId'] , (response) => {
      if (response.status === false && response.message === 'not verified') {
        this.emailVerified = false;
      } else {
        this.emailVerified = true;
      }
    });

    this.locationService.checkUserVerifiedInLocation().subscribe((data) => {
      if (data.count > 0) {
        this.skipVerification = true;
      } else {
        this.skipVerification = false;
      }
    }, (e) => {
      this.skipVerification = false;
    });

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
    this.searchElementRef.nativeElement.value = '';
    this.results = [];
  }

  ngAfterViewInit(){
    $('.modal').modal({
      dismissible : false
    });

    if (localStorage.getItem('nolocations') === 'true') {
      $('.location-navigation .view-location').hide();
    }

    $('.nav-list-locations').addClass('active');
    $('.location-navigation .active').removeClass('active');
    $('.location-navigation .add-location').addClass('active');
  }

  localLocationSearch(location: Object) {
    $('.search-container').addClass('active');
    this.locationService.searchForLocation(location).subscribe((data) => {
      if (data.count) {
        for (let i = 0; i < data.result.length; i++) {
          data.result[i]['location_id'] = this.encryptDecrypt.encrypt(data.result[i]['location_id']).toString();
          console.log(data.result[i]['location_id']);
        }
        this.results = data.result;
        // this.locationService.locationDataStore(data.result);
        // this.router.navigate(['/location', 'search-result']);
      } else {
        this.results = [];

      }
      console.log(data);
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
    console.log(this.levelGroup);
  }

  createLocation() {
    this.showLoaderDiv = true;
    const arr = <FormArray>this.levelGroup.controls.levels;
    const sublevels = [];
    console.log(arr);
    for (let i = 0; i < arr.controls.length; i++) {
      console.log(<FormControl>arr.controls[i]);
      sublevels.push(<FormControl>arr.controls[i].value);
    }

    let redirectToList = () => {
      $('#modalSetLevels').modal('close');
      setTimeout(() => {
        this.router.navigate(['/location', 'list']);
      }, 300);
    };


    if (this.searchResultLocation) {
      this.searchResultLocation['sublevels'] = sublevels;
      this.searchResultLocation['location_name'] = this.locationName.value;
      this.locationService.createSingleLocation(this.searchResultLocation).subscribe((data) => {
        redirectToList();
      });
    }
  }

  mergeToParent(locationsParam, parentId){
    let locations = JSON.parse( JSON.stringify(locationsParam) );
    for(let i in locations){
      locations[i]['sublocations'] = [];
    };

    for(let i in locations){
      for(let x in locations){
        if(locations[i]['parent_id'] == locations[x]['location_id']){
          locations[x]['sublocations'].push(locations[i]);
        }
      };
    };

    let result = [];
    for(let i in locations){
      if(locations[i]['parent_id'] == parentId){
        result.push(locations[i]);
      }
    }

    return result;
  }

  onClickSelectLocationFromModal(event, location){
    let index = this.selectedLocationIds.indexOf(location.location_id);
    if(event.currentTarget.checked){
      if(index == -1){
        this.selectedLocationIds.push(location.location_id);
      }
    }else{
      if(index > -1){
        this.selectedLocationIds.splice(index, 1);
      }
    }
    console.log(this.selectedLocationIds);
  }

  clickSelectLocation(location){
    let locId = this.encryptDecrypt.decrypt(location.location_id);
    this.showLoaderModalSubLocation = true;
    this.selectedLocation = location;
    console.log('skip verification = ' + this.skipVerification);
    this.locationService.getDeepLocationsById(locId, (response) => {
      if (response.data.length > 0) {
        $('#modalSublocations').modal('open');
        this.arrFlatSelectedLocations = response.data;
        for(let i in this.arrFlatSelectedLocations){
          this.arrFlatSelectedLocations[i]['sublocations'] = [];
        };
        this.selectedLocationSubLocations = this.mergeToParent(response.data, locId);
        this.arrSelectedLocationsCopy = JSON.parse( JSON.stringify(this.selectedLocationSubLocations) );
        this.showLoaderModalSubLocation = false;
      } else {
          this.router.navigate(['/location/verify-access',
          { 'location_id' : this.encryptDecrypt.encrypt(locId).toString(),
           'account_id' : this.accountId
          }]);
      }
    });
  }

  onChangeDropDown(event){
    if(event.currentTarget.checked){
      $( $(event.currentTarget).parents('.list-division')[0] ).addClass('show-drop-down');
    }else{
      $( $(event.currentTarget).parents('.list-division')[0] ).removeClass('show-drop-down');
    }
  }

  onKeyUpSearchLevelModal(value: String){
    let trimmed = value.trim(),
      trimmedLow = trimmed.toLowerCase(),
      results = [];
      if(trimmed.length == 0){
        this.selectedLocationSubLocations = JSON.parse( JSON.stringify( this.arrSelectedLocationsCopy ) );
      }else{
        let searchChild = (children) => {
          for(let i in children){
            if(children[i]['sublocations'].length > 0){
              searchChild(children[i]['sublocations']);
            }
            let name = children[i]['name'],
              low = name.toLowerCase();

            if(low.indexOf(trimmedLow) > -1){
              results.push( JSON.parse(JSON.stringify(children[i])) );
            }
          }
        };

        searchChild(this.arrSelectedLocationsCopy);
        this.selectedLocationSubLocations = results;
      }
  }

  submitSelectedLocations(){
    if (this.selectedLocationIds.length > 0) {
      this.showLoaderModalSubLocation = true;
      this.showModalAlreadyVerified = false;
      console.log( 'location id ' + this.encryptDecrypt.decrypt(this.selectedLocation['location_id']));
      console.log('parent id ' + this.selectedLocation['parent_id']);
      const parentId = this.encryptDecrypt.decrypt(this.selectedLocation['location_id']);
      if (this.skipVerification) {
        // save the locations under this user
        this.locationService.assignSublocations(this.selectedLocationIds).subscribe((data) => {
          console.log(data);
          $('#modalSublocations').modal('close');
          this.router.navigate(['/location', 'list']);
        });
      } else {
        $('#modalSublocations').modal('close');
        const enc = this.encryptDecrypt.encrypt( JSON.stringify(this.selectedLocationIds) );
        const queryParams = {
          'account_id' : this.accountId,
          'location_id' : enc
        };
        this.router.navigate(['/location/verify-access', queryParams]);
      }

      /*
      this.locationService.checkUserVerified({ parent_id : parentId }, (response) => {
        if (response.data.verified) {
          this.showLoaderModalSubLocation = false;
          this.showModalAlreadyVerified = true;
          setTimeout(() => {
            this.showModalAlreadyVerified = false;
          }, 3000);

        }else{
          $('#modalSublocations').modal('close');
          let enc = this.encryptDecrypt.encrypt( JSON.stringify(this.selectedLocationIds) );
          let queryParams = {
            'account_id' : this.accountId,
            'location_id' : enc
          };
          this.router.navigate(['/location/verify-access', queryParams]);
        }
      });
      */
    }
  }

  onNewLevel(e) {
    e.stopPropagation();
    e.preventDefault();
    $('#modalSublocations').modal('close');
    $('#modalAddSublocation').modal('open');

   // this.router.navigate(['/location', 'view', this.selectedLocation['location_id']]);
  }

  addNewSubLocationSubmit(form, e) {
    if (form.valid) {
      if(Object.keys(this.selectedSubLocationFromModal).length > 0){
        $('#modalAddSublocation').modal('close');
        this.selectedLocationIds = [];
        this.selectedLocationIds.push(this.selectedSubLocationFromModal['location_id']);
        this.submitSelectedLocations();
      }else{
        this.errorMessageModalSublocation = '';
        this.showLoaderModalAddSublocation = true;
        this.locationService.createSubLocation({
            name : form.controls.name.value,
            parent_id : this.encryptDecrypt.decrypt(this.selectedLocation['location_id'])
        }).subscribe(
            (response) => {
                this.showLoaderModalAddSublocation = false;
                this.errorMessageModalSublocation = '';
                $('#modalAddSublocation').modal('close');
                this.router.navigate(['/location', 'view', this.selectedLocation['location_id']]);
            },
            (msg) => {
                this.showLoaderModalAddSublocation = false;
                this.errorMessageModalSublocation = msg.error;
                setTimeout(() => {
                    this.errorMessageModalSublocation = '';
                }, 2000);
            }
        );
      }

    } else {
        form.controls.name.markAsDirty();
    }
  }

  onKeyUpTypeSublocation(value){
    let trimmed = value.trim(),
      trimmedLow = trimmed.toLowerCase(),
      results = [];
      if(trimmed.length == 0){
        this.sameSublocation = [];
      }else{
        let searchChild = (children) => {
          for(let i in children){
            if(children[i]['sublocations'].length > 0){
              searchChild(children[i]['sublocations']);
            }
            let name = children[i]['name'],
              low = name.toLowerCase();

            if(low.indexOf(trimmedLow) > -1){
              results.push( JSON.parse(JSON.stringify(children[i])) );
            }
          }
        };

        searchChild(this.arrSelectedLocationsCopy);
        this.sameSublocation = results;
      }
  }

  selectAddNewSubResult(sub, selectElement){
    $('.select-sub.red-text').removeClass('red-text').addClass('blue-text').html('select');
    if($(selectElement).hasClass('blue-text')){
      $(selectElement).removeClass('blue-text').addClass('red-text').html('selected');
    }else{
      $(selectElement).removeClass('red-text').addClass('blue-text').html('select');
    }
    this.inpSublocationNameTwoWayData = sub.name;
    this.selectedSubLocationFromModal = sub;
  }

  notHereCheckEvent(event){
    if(event.currentTarget.checked){
      this.sameSublocation = [];
      this.inpSublocationNameTwoWayData = "";
      this.selectedSubLocationFromModal = {};
    }
  }


}