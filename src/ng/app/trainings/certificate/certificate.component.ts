import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { Subscription } from 'rxjs/Subscription';
import { CourseService } from '../../services/course';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    templateUrl: './certificate.component.html',
    styleUrls: ['./certificate.component.css'],
    providers: [EncryptDecryptService, CourseService]
})
export class TrainingCertificate implements OnInit, AfterViewInit, OnDestroy {

    public encryptedCertId = null;
    public decryptedCertId = null;
    public name:string = '';
    public training:string = '';
    public certificate_no: string = '';
    public training_date: string = '';

    private paramSub:Subscription;
    private serviceSub:Subscription;

    constructor(private route:ActivatedRoute,
        private encryptor: EncryptDecryptService,
        private courseService: CourseService    
    ) {

    }

    ngOnInit() {
        this.paramSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
            if (paramMap.has('certId')) {
                this.decryptedCertId = this.encryptor.decrypt(paramMap.get('certId'));
                this.loadCertificationDetails();
            }
        }, error => {
            console.log(error);
        })

    }

    ngAfterViewInit() {

    }

    ngOnDestroy() {
        this.paramSub.unsubscribe();
        this.serviceSub.unsubscribe();
    }

    private loadCertificationDetails() {
        this.serviceSub = this.courseService.getCertificationDetailsForPrinting(this.decryptedCertId).subscribe((response) => {
            this.name = response.name;
            this.training = response.training;
            this.certificate_no = response.certificate_no;
            this.training_date = response.training_date;

        }, (error: HttpErrorResponse) => {
            console.log(error.error.message);
        });
    }

}