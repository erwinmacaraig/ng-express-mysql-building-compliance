import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { LocationsService } from '../../services/locations';

declare var $: any;
@Component({
  selector: 'app-view-locations-sub',
  templateUrl: './sublocation.component.html',
  styleUrls: ['./sublocation.component.css'],
  providers: [EncryptDecryptService]
})
export class SublocationComponent implements OnInit, OnDestroy {
  public encryptedID;
  public locationID;
  public parentLocation;
  constructor(private locationService: LocationsService,
    private encryptDecrypt: EncryptDecryptService,
    private route: ActivatedRoute) {}

  ngOnInit() {
    $('select').material_select();
    this.route.params.subscribe((params) => {
      this.encryptedID = params['encrypted'];
      this.locationID = this.encryptDecrypt.decrypt(this.encryptedID);
      this.locationService.getById(this.locationID, (response) => {
        console.log(response);
        if (response.locationType === 'sublocation') {
          this.parentLocation = response.parent;

        }

      });
    });
  }

  ngOnDestroy() {}

}
