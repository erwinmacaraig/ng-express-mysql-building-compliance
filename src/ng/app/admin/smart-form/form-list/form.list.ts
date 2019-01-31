import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ElementRef, Input, TemplateRef, ViewEncapsulation  } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AdminService } from './../../../services/admin.service';
import { ComplianceService } from './../../../services/compliance.service';
import { EncryptDecryptService } from './../../../services/encrypt.decrypt';
import { DashboardPreloaderService } from '../../../services/dashboard.preloader';
import { Observable } from 'rxjs';

declare var moment: any;
declare var $: any;

@Component({
  selector: 'app-admin-smart-form-list',
  templateUrl: './form.list.html',
  styleUrls: ['./form.list.css'],
  providers: [AdminService, DashboardPreloaderService, ComplianceService, EncryptDecryptService]
})

export class FormListComponent implements OnInit, AfterViewInit, OnDestroy {

    items = <any> [];
    kpis = <any> [];

    constructor(
        private adminService: AdminService,
        private dashboardPreloaderService: DashboardPreloaderService,
        private complianceService: ComplianceService
        ){

        this.complianceService.getKPIS((response)=>{
            this.kpis = response.data;
        });

    }

    ngOnInit(){
        this.adminService.getSmartFormList().subscribe((response) => {
            this.items = response;
            for(let item of this.items){
                item['compliance_activity'] = '';
                switch (item['compliance_kpis_id']) {
                    case 2:
                        item['compliance_activity'] = 'EPC Meeting';
                        break;
                    
                    case 3:
                        item['compliance_activity'] = 'Fire Safety Advisor';
                        break;

                    case 9:
                        item['compliance_activity'] = 'Evacuation Exercise';
                        break;

                    case 4:
                        item['compliance_activity'] = 'Emergency Procedure Manual';
                        break;
                }
            }
            this.dashboardPreloaderService.hide();
        });

        console.log(this.kpis);
        console.log(this.items);
    }

    ngAfterViewInit(){
        this.dashboardPreloaderService.show();
    }


    ngOnDestroy(){

    }
}