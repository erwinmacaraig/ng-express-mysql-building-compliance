import { AuthService } from './../../services/auth.service';
import { EncryptDecryptService } from './../../services/encrypt.decrypt';

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { PlatformLocation } from '@angular/common';
import { LocationsService } from '../../services/locations';


declare var $: any;
@Component({
  selector: 'app-verify-identity',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css'],
  providers: [EncryptDecryptService]
})
export class VerificationComponent implements OnInit, OnDestroy {
  public frpListSubscription;
  public trpListSubscription;
  public frpList;
  public trpList;
  public location;
  public account;
  public emailDomain;
  public toggleFRP = false;
  public toggleTRP = false;
  public initialFRP = true;
  public initialTRP = true;
  private baseUrl: String;
  public isSubmitting = false;
  public submitSuccess = false;
  public locationList = [];

  verificationForm: FormGroup;

  constructor(private router: Router,
              private dataProvider: PersonDataProviderService,
              private route: ActivatedRoute,
              private encryptDecrypt: EncryptDecryptService,
              private authService:  AuthService,
              private http: HttpClient,
              private platformLocation: PlatformLocation,
              private locService : LocationsService) {

    this.baseUrl = (platformLocation as any).location.origin;
    this.emailDomain = this.authService.getUserData()['email'];
    this.emailDomain =  this.emailDomain.substr(this.emailDomain.indexOf('@') + 1, this.emailDomain.length);

    this.location = this.route.snapshot['params']['location_id'] || [];
    this.account = this.route.snapshot['params']['account_id'] || 0;


     this.location = JSON.parse(this.encryptDecrypt.decrypt(this.location).toString());
     console.log(this.location);
     this.account = this.encryptDecrypt.decrypt(this.account).toString();
  }

  ngOnInit() {
    $('select').material_select();

    this.verificationForm = new FormGroup({
      frp: new FormControl(),
      trp: new FormControl(),
      domain: new FormControl(this.emailDomain),
      criteria: new FormControl(null, Validators.required)
    });



    this.trpListSubscription = this.dataProvider.listAllTRP(this.location, this.account).subscribe((data) => {
      this.trpList = data['data'];

      this.locService.getByInIds(this.location, (response) => {
        this.locationList = response.data;
        this.locationList.forEach((loc) => {
          this.verificationForm.addControl('trp-'+loc.location_id, new FormControl());

          for(let i in this.trpList){
            if(this.trpList[i]['location_id'] == loc.location_id){
              if('trps' in loc === false){
                loc['trps'] = [];
              }
              loc.trps.push(this.trpList[i]);
            }
          }
        });
      });

    }, (err: HttpErrorResponse) => {
      this.initialTRP = false;
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
    this.frpListSubscription = this.dataProvider.listAllFRP(this.location, this.account).subscribe((data) => {
      this.frpList = data['data'];
    }, (err: HttpErrorResponse) => {
      this.initialFRP = false;
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }

  ngOnDestroy() {
    this.frpListSubscription.unsubscribe();
    this.trpListSubscription.unsubscribe();
  }

  toggleCriteria() {

    if (this.verificationForm.get('criteria').value === 'trp_enable') {
      $('.select-trp').material_select('destroy');
      $('.select-trp').material_select();
      this.toggleTRP = true;
      this.toggleFRP = false;
    }
    if (this.verificationForm.get('criteria').value === 'frp_enable') {
      $('#frp').material_select();
      this.toggleTRP = false;
      this.toggleFRP = true;
    }
  }

  onSubmit() {
    let approvalFrom,
      lastLocationId = 0;

    if ( this.verificationForm.get('criteria').value === 'frp_enable') {
      approvalFrom = $('#frp').val();
    } else if (this.verificationForm.get('criteria').value === 'trp_enable') {
      let listTRPapprovers = {};
      for(let i in this.locationList){
        listTRPapprovers[ Object.keys(listTRPapprovers).length ] = {
          approver : $('select.select-trp.'+this.locationList[i]['location_id'])[0].value,
          location : this.locationList[i]['location_id']
        };
      }
      approvalFrom = listTRPapprovers;
    }
    const body = {
      location_id: this.location,
      account_id: this.account,
      userDomain: this.verificationForm.get('domain').value,
      approver:  approvalFrom,
      criteria: this.verificationForm.get('criteria').value
    };


    console.log(body);
    this.isSubmitting = true;
    this.http.post<any>(this.baseUrl + '/verify-location-user', body).subscribe((data) => {
      this.submitSuccess = true;
      this.router.navigate(['/location', 'search']);
    },
    (err: HttpErrorResponse) => {
      if (err.error instanceof Error) {
        console.log('An error occurred:', err.error.message);
      } else {
        const errJSON = JSON.parse(err.error);
        console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
      }
    });
  }

}

