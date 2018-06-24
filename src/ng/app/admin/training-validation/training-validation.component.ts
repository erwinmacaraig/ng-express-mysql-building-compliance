import { Observable } from 'rxjs/Observable';
import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { HttpClient, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { DatepickerOptions } from 'ng2-datepicker';
import { Router, ActivatedRoute } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';


import { AdminService } from './../../services/admin.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-training-validation',
  templateUrl: './training-validation.component.html',
  styleUrls: ['./training-validation.component.css'],
  providers: [AdminService, DashboardPreloaderService]
})

export class TrainingValidationComponent implements OnInit, AfterViewInit, OnDestroy {

  searchLocationField: FormControl = new FormControl(null, Validators.required);

  filteredList = [];
  locationId: number;
  genericSub: Subscription;
  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.genericSub = this.getLocationChanges();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  public getLocationChanges(): Subscription {
    return this.searchLocationField.valueChanges.debounceTime(350)
      .subscribe((searchValue) => {
        if (searchValue != null && searchValue.length > 0) {
          this.adminService.searchLocationByName(searchValue).subscribe((response) => {
            this.filteredList = response['data'];
          });
        } else {
          this.filteredList = [];
        }
      });
  }

  public getLocationSelection(selectedId, locationName) {
    this.genericSub.unsubscribe();
    this.locationId = selectedId;
    this.searchLocationField.setValue(locationName);
    this.filteredList = [];


    this.genericSub = this.getLocationChanges();
  }

}
