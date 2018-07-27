import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LocationsService } from './../../services/locations';
import { Observable } from 'rxjs';
declare var $: any;

@Component({
  selector: 'app-location-signup',
  templateUrl: './location.signup.html',
  styleUrls: ['./location.signup.css'],
  providers: [LocationsService]
})
export class LocationSignupComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('inpLocation') inpLocation : ElementRef;
    roleId = 0;
    searchedLocations = <any> [];
    searchSubs;
    isSearching = false;
    showLoader = false;

    constructor(
        private router: Router,
        private activatedRoute : ActivatedRoute,
        private locService: LocationsService
        ) {

        this.searchedLocations.push({
            name : 'Adasda sdas',
            sublocations : []
        });

        this.searchedLocations.push({
            name : 'Xasf dsaf',
            sublocations : []
        });

        /*this.activatedRoute.url.subscribe(url =>{
            console.log(url);
        });*/
    }

    ngOnInit() {
        this.roleId = this.activatedRoute.snapshot.queryParams['role_id'];
    }

    ngAfterViewInit(){
        $('#modalLocationSignup').modal({ dismissible: false });
        $('#modalLocationSignup').modal('open');

        this.searchSubs = Observable.fromEvent(this.inpLocation.nativeElement, 'keyup')
        .debounceTime(400)
        .distinctUntilChanged()
        .subscribe((event) => {
            let key = this.inpLocation.nativeElement.value.trim();
            if(key.length > 0){
                this.showLoader = true;
                this.isSearching = true;
                this.locService.searchLocationHierarchy(key).subscribe((response) => {
                    
                    this.isSearching = false;
                    this.showLoader = false;
                });
            }else{
                this.isSearching = false;
                this.showLoader = false;
                this.searchedLocations = [];
            }
        });
    }

    clickCancel(){
        $('#modalLocationSignup').modal('close');
        this.searchSubs.unsubscribe(); 
        setTimeout(() => {
            this.router.navigate(['/signup']);
        }, 300);
    }

    ngOnDestroy(){
        $('#modalLocationSignup').modal('close');
        this.searchSubs.unsubscribe();
    }
}