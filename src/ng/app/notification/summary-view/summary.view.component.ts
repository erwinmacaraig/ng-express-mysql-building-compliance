import { Component, OnInit, OnDestroy, AfterViewInit } from "@angular/core";

declare var $: any;
@Component({
    selector: 'app-notification-summary-view',
    templateUrl: './summary.view.component.html',
    styleUrls: ['./summary.view.component.css'],
    providers: []
})
export class SummaryViewComponent implements OnInit, OnDestroy, AfterViewInit {

    ngOnInit() {}

    ngAfterViewInit() {}

    ngOnDestroy() {}
}