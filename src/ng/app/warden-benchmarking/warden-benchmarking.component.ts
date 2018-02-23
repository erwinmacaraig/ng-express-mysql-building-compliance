import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformLocation } from '@angular/common';

declare var $: any;
@Component({
  selector: 'app-warden-benchmarking',
  templateUrl: '/warden-benchmarking.component.html',
  styleUrls: ['./warden-benchmarking.component.css']
})
export class WardenBenchMarkingComponent implements OnInit, OnDestroy, AfterViewInit {
  occupantStaff = 0;
  numFloors = 0;
  constructor() {}

  ngOnInit() {
    $('select').material_select();
  }

  ngOnDestroy() {}

  ngAfterViewInit() {
    $('#full_time_wardens_percentage').material_select();
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

}

