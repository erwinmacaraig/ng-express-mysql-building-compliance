import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef, Input, TemplateRef, ViewEncapsulation  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService } from './../../../services/admin.service';
import { AccountsDataProviderService } from './../../../services/accounts';
import { LocationsService } from './../../../services/locations';
import { DashboardPreloaderService } from '../../../services/dashboard.preloader';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';

import 'formBuilder/dist/form-render.min.js';

declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-form-render',
  templateUrl: './form.render.html',
  styleUrls: ['./form.render.css'],
  providers: [AdminService, DashboardPreloaderService, AccountsDataProviderService]
})

export class FormRenderComponent implements OnInit, AfterViewInit, OnDestroy {

    renderData = <any> {};
    userData = <any> {};
    locationData = <any> {};
    accountData = <any> {};
    smartFormId = 0;
    userId = 0;
    isFormInvalid = false;
    success = false;
    submitHasError = false;
    errorMessageSubmit = '';

    constructor(
        private auth: AuthService,
        private accountsService: AccountsDataProviderService,
        private adminService: AdminService,
        private locationsService: LocationsService,
        private dashboardService: DashboardPreloaderService,
        private router: Router,
        private activatedRoute: ActivatedRoute
        ){

        this.userData = this.auth.getUserData();
        this.userId = this.userData['userId'];
    }

    ngOnInit(){
        this.activatedRoute.queryParams.subscribe((queryParams) => {
            console.log(queryParams);
            this.dashboardService.show();
            this.adminService.getSmartForm({
                type : 'consultant',
                compliance_kpis_id : queryParams.kpi,
                is_deleted : 0
            }).subscribe((res:any) => {
                if(res.length > 0){
                    this.renderData = res[0];
                    this.smartFormId = this.renderData['smart_form_id'];
                    let data = JSON.parse(this.renderData['data']);
                    $('#previewContainer').formRender({
                        formData : data
                    });
                }else{
                    this.renderData = {};
                }
                this.dashboardService.hide();
                this.formRenderOnSaveEvent();
            });

            this.adminService.getLocationAndAccountByIds(queryParams.locid, queryParams.accountid).subscribe((response:any) => {
                this.locationData = response.location;
                this.accountData = response.account;
            });
        });
    }

    ngAfterViewInit(){
        console.log(this.userData);
        console.log(this.userId);
    }

    formRenderOnSaveEvent(){
        let __this = this;
        $('#smartForm').off('submit').on('submit', function(e){
            e.preventDefault();
            let 
            arrayData = <any> $('#smartForm').serializeArray(),
            requiredLabels = $('#smartForm .fb-required'),
            requiredFormGroups = $('#smartForm .fb-required').parents('.form-group'),
            error = 0,
            hasRequireCheckbox = false,
            hasOneCheckedBox = false;

            requiredFormGroups.each(function(){
                console.log($(this));
                __this.isFormInvalid = false;
                if($(this).hasClass('fb-checkbox-group')){
                    let 
                    hasRequireCheckbox = true;
                    $(this).find('input[type="checkbox"]').each(function(i, checkbox){
                        if($(checkbox).prop('checked')){
                            hasOneCheckedBox = true;
                        }
                    });

                    if(!hasOneCheckedBox){
                        error++;
                    }
                }else{
                    let requiredElem = $(this).find('[required]');
                    for(let data of arrayData){
                        if(data.name == requiredElem.prop('name')){
                            if(data.value.trim().length == 0){
                                error++;
                            }
                        }
                    }
                }
            });

            if(error > 0){
                __this.isFormInvalid = true;
            }else{
                __this.dashboardService.show();
                __this.adminService.submitSmartForm({
                    'smart_form_id' : __this.renderData.smart_form_id,
                    'answers' : JSON.stringify(arrayData),
                    'location_id' : __this.locationData.location_id,
                    'account_id' : __this.accountData.account_id,
                }).subscribe((response:any) => {
                    __this.dashboardService.hide();
                    if(response.status){
                        __this.success = true;
                        setTimeout(() => {
                            __this.router.navigate(['/admin/smart-form']);
                        }, 2500);
                    }else{
                        __this.submitHasError = true;
                        __this.errorMessageSubmit = response.message;

                        setTimeout(() => {
                            __this.submitHasError = false;
                            __this.errorMessageSubmit = '';
                        }, 2500);
                    }
                });
            }


            console.log( 'arrayData', arrayData );
        });
    }


    ngOnDestroy(){
    }
}