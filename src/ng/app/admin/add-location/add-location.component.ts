import { Component } from '@angular/core';
import { OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ElementRef, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { AdminService } from './../../services/admin.service';
import { Observable } from 'rxjs/Rx';

@Component({
    selector: 'app-admin-add-location',
    templateUrl: './add-location.component.html',
    styleUrls: ['./add-location.component.css']
})
export class AddAccountLocationComponent implements OnInit, AfterViewInit, OnDestroy {
    accountId:number = 0;
    paramSub:Subscription;
    accountInfo = {};
    searchLocsSubs;

    @ViewChild('search')
    public searchElementRef: ElementRef;

    constructor(
        private activatedRoute: ActivatedRoute,
        private adminService: AdminService
    ) {}

    ngOnInit() {
        this.paramSub = this.activatedRoute.params.subscribe((params) => {
            this.accountId = params.accountId;
            this.adminService.getAccountInfo(this.accountId).subscribe((response) => {
                this.accountInfo = response['data'];
            });
        });

    }

    ngAfterViewInit() {
        this.searchLocsSubs = Observable.fromEvent(this.searchElementRef.nativeElement, 'keyup')
        .debounceTime(500).distinctUntilChanged().subscribe((event:KeyboardEvent) => {
            
        });
    }

    ngOnDestroy() {
        this.paramSub.unsubscribe();
    }
    
}