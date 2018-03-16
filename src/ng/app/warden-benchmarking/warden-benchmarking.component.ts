import { Component, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Location } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { MessageService } from '../services/messaging.service';

declare var $: any;
@Component({
  selector: 'app-warden-benchmarking',
  templateUrl: '/warden-benchmarking.component.html',
  styleUrls: ['./warden-benchmarking.component.css']
})
export class WardenBenchMarkingComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('locationType') layoutType: ElementRef;
  @ViewChild('facility') facilityElement: ElementRef;
  showFloorsToggle = false;
  showPolicyToggle = false;
  showAdditionalWardensToggle = true;
  occupantStaff = 0;
  numFloors = 0;
  occupants = 0;
  private baseUrl: string;
  public processing_calculations = false;
  @Input() location_id: number;

  constructor(private location: Location, private http: HttpClient,
              private platformLocation: PlatformLocation,
              private messageService: MessageService) {
    this.baseUrl = (platformLocation as any).location.origin;
  }

  ngOnInit() {
    $('select').material_select();
    setTimeout(() => {
      $('#location_type').change((e) => {
        this.showNumOfFloors(e);
      });
    }, 200);

    $('div > #assembly_area_wardens_percentage').material_select();
    $('#assembly_area_wardens_percentage').material_select();
  }

  ngOnDestroy() {}

  ngAfterViewInit() {

  }
  increaseNumOccupants() {
    this.occupants = $('#number_of_occupants')[0].value * 1;
    this.occupants = this.occupants + 1;
  }
  subrtractNumOccupants() {
    this.occupants = $('#number_of_occupants')[0].value * 1;
    if (this.occupants > 0) {
      this.occupants = this.occupants - 1;
    }
  }

  subtractOccupantStaff() {
    this.occupantStaff = $('#staff_percentage')[0].value * 1;
    if (this.occupantStaff > 0 && this.occupantStaff < 101) {
      this.occupantStaff = this.occupantStaff - 1;
    } else if (this.occupantStaff < 0) {
      this.occupantStaff = 0;
    } else if (this.occupantStaff > 100) {
      this.occupantStaff = 99;
    }
  }
  increaseOccupantStaff() {
    this.occupantStaff = $('#staff_percentage')[0].value * 1;
    if (this.occupantStaff < 100) {
      this.occupantStaff = this.occupantStaff + 1;
    } else if (this.occupantStaff >= 101) {
      this.occupantStaff = 100;
    }
  }
  subrtractNumFloors() {
    this.numFloors = $('#floors')[0].value * 1;
    if (this.numFloors > 0) {
      this.numFloors = this.numFloors - 1;
    }
  }
  increaseNumFloors() {
    this.numFloors = <number>$('#floors')[0].value * 1;
    this.numFloors = this.numFloors + 1;
  }

  showNumOfFloors(e) {
    this.showFloorsToggle =  (this.layoutType.nativeElement.value === 'Floor') ? false : true;
  }

  showPolicy() {
    this.showPolicyToggle = $('#facility')[0].checked;
  }
  showAdditionalWardens() {
    this.showAdditionalWardensToggle = !$('#additional_wardens')[0].checked;
  }

  onClickSubmit() {
    this.processing_calculations = true;
    const submittedLocationType =  $('#location_type')[0].value;
    const submittedNumOfFloors = ($('#floors')[0]) ? $('#floors')[0].value : '0';
    const submittedNumOfOccupants = $('#number_of_occupants')[0].value;
    const submittedPercentOccupants = this.occupantStaff = $('#staff_percentage')[0].value * 1;
    const submittedOccupantsAreWardens = ($('#all_occupants_are_wardens')[0]) ?
    ($('#all_occupants_are_wardens')[0].checked) ? 'yes' : 'no' : 'no';

    const submittedLayoutType = $('#layout_type')[0].value;
    const submittedFullTimeWardensPercent = $('#full_time_wardens_percentage')[0].value;
    const submittedMobilityImpaired = $('#mobility_impaired_percentage')[0].value;

    const submittedCrossingOfRoads = ($('#crossing_road_required')[0].checked) ? 1 : 0;
    const submittedAdditionalWardens = ($('#assembly_area_wardens_percentage')[0]) ? $('#assembly_area_wardens_percentage')[0].value : '0';


    const body = {
      'location_id': this.location_id,
      'type': submittedLocationType,
      'number_of_floors': submittedNumOfFloors,
      'number_of_occupants': submittedNumOfOccupants,
      'staff_percentage': this.occupantStaff,
      'all_occupants_are_wardens': submittedOccupantsAreWardens,
      'layout_type': submittedLayoutType,
      'full_time_wardens_percentage': submittedFullTimeWardensPercent,
      'mobility_impaired_percentage': submittedMobilityImpaired,
      'crossing_road_required': submittedCrossingOfRoads,
      'assembly_area_wardens_percentage': ($('#additional_wardens')[0].checked) ? submittedAdditionalWardens : '0'
    };

    this.http.post<any>(this.baseUrl + '/compliance/warden-calculations/', body)
    .subscribe((data) => {
      console.log(data);
      this.processing_calculations = false;
      this.messageService.sendMessage({
        'id': 'warden-benchmarking-calculator',
        'status': 'Success',
        'warden-benchmarking-calculation-result': data
      });

    }, (e) => {
      console.log(e);
      this.processing_calculations = false;
      this.messageService.sendMessage({
        'id': 'warden-benchmarking-calculator',
        'status': 'Fail',
        'warden-benchmarking-calculation-error': e
      });
    });
    console.log(body);


  }

}

