import { UserService } from './../../services/users';
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm, NgModel } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { DatepickerOptions } from 'ng2-datepicker';
import { Router, NavigationEnd  } from '@angular/router';
import * as moment from 'moment';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Component({
    selector: 'app-security-privacy',
    templateUrl: './security.privacy.html',
    styleUrls: ['./security.privacy.css'],
    providers: [AccountsDataProviderService, AuthService, DashboardPreloaderService, UserService ]
})

export class SecurityPrivacyComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('formPasswords') formPasswords : NgForm;

    disableForm = true;

    userData = <any> {};

    errorMessage = '';

    constructor(
        private userService: UserService,
        private dashboardPreloader: DashboardPreloaderService,
        private authService: AuthService
    ){
        this.userData = this.authService.getUserData();
    }

    ngOnInit(){
        
    }

    ngAfterViewInit(){
        this.scrollEvent();
    }

    scrollEvent(){
        let container = <any> document.querySelector('.content-container');
        if(container){
            container.addEventListener('scroll', (e) => {
                e.stopPropagation();
                let 
                scrollTop = container.scrollTop,
                scrollHeight = container.scrollHeight,
                offsetHeight = container.offsetHeight,
                scrollToHeight = scrollTop + offsetHeight;

                if( scrollToHeight > (scrollHeight - 200) && this.disableForm == true){
                    this.disableForm = false;
                }else if(!this.disableForm && scrollToHeight < (scrollHeight - 200)){
                    this.disableForm = true;
                }
            });
        }
    }

    submitForm(form){
        if(form.valid){
            this.dashboardPreloader.show();
            let formData = form.value;
            formData['user_id'] = this.userData.userId;
            this.errorMessage = '';
            this.userService.changePassword(formData).subscribe((response:any)=>{
                this.dashboardPreloader.hide();
                if(response.status){
                    this.formPasswords.reset();
                }else{
                    this.errorMessage = response.message;
                }
            });
        }
    }

    ngOnDestroy(){
        
    }

};