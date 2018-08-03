import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';

declare var $: any;
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    $('select').material_select();
  }

  ngOnDestroy() {}

}
