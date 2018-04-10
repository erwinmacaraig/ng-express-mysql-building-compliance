import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { SignupService } from './../../services/signup.service';
import { AuthService } from './../../services/auth.service';

declare var $: any;
@Component({
    selector: 'app-profile-completion',
    templateUrl: './profile-completion.component.html',
    styleUrls: ['./profile-completion.component.css']
})
export class ProfileCompletionComponent implements OnInit, OnDestroy, AfterViewInit {
    modalSignUp;
    firstname = '';
    lastname = '';
    accountName = '';
    locationName  = '';
    roleName = '';
    token = '';
    password = '';
    confirmPassword = '';
    tokenData = <any> {};
    tokenReponse = <any> {};
    userId = null;
    showMessage = false;
    message = '';

    @ViewChild('formProfile') formProfile: NgForm;

    constructor(
        private router: Router, 
        private signupService: SignupService,
        private route: ActivatedRoute,
        private auth: AuthService,
        private http: HttpClient) {
        this.route.params.subscribe( params => {
            this.token = params['token'];

            this.signupService.getProfileByToken(this.token, (response) => {
                this.tokenData = <any> response.data;
                this.tokenReponse = response;

                if(response.status){
                    this.firstname = this.tokenData.user.first_name;
                    this.lastname = this.tokenData.user.last_name;
                    this.roleName = this.tokenData.role.role_name;
                    this.userId = this.tokenData.user.user_id;

                    if(this.tokenData.location.name.trim().length == 0){
                        this.tokenData.location.name = this.tokenData.location.formatted_address;
                    }

                    if( this.tokenData.location.parent_name.trim().length > 0 ){
                        this.locationName = this.tokenData.location.parent_name + ', ';
                    }

                    this.locationName += this.tokenData.location.name;

                    this.accountName = this.tokenData.account.account_name;
                }else{
                    this.showMessage = true;
                    this.message = '<h4 class="center">'+response.message+'</h4>';
                }

            });

        });
    }
    
    ngOnInit() {
        
    }


    ngAfterViewInit() {

        this.modalSignUp = $('#modalSignup');

        const  modalOpts = {
            dismissible: false,
            startingTop: '0%', // Starting top style attribute
            endingTop: '5%'
        };

        this.modalSignUp.modal(modalOpts);
        this.modalSignUp.modal('open');

    }

    ngOnDestroy() {}

    onCloseProfileCompletion() {
        this.modalSignUp.modal('close');
        this.router.navigate(['/login']);
    }

    passwordTyping(inpModel){
        let values = this.formProfile.value;
        if( values.password !== values.confirmPassword ){
            this.formProfile.controls.password.setErrors({ 'mismatch' : true });
            this.formProfile.controls.confirmPassword.setErrors({ 'mismatch' : true });
        }else{
            this.formProfile.controls.password.setErrors({});
            this.formProfile.controls.password.setValue( this.formProfile.controls.password.value );
            this.formProfile.controls.confirmPassword.setErrors({});
            this.formProfile.controls.confirmPassword.setValue( this.formProfile.controls.confirmPassword.value );
        }
    }

    completeProfile(f: NgForm) {
        let values = f.value;
        if( values.password === values.confirmPassword ){
            let formData = {
                user_id : f.controls.user_id.value,
                password : f.controls.password.value,
                confirm_password : f.controls.confirmPassword.value,
                token : this.token
            };

            this.signupService.submitUsersSetupProfile(formData, (response) => {
                if(response.status){
                    this.modalSignUp.modal('close');
                    this.auth.setToken(response.token);
                    this.auth.setUserData(response.data);
                    
                    setTimeout(() => {
                        this.router.navigate(['']);
                    }, 500);

                }else{
                    this.showMessage = true;
                    this.message = '<h4 class="center">'+response.message+'</h4>';

                    setTimeout(() => {  this.showMessage = false; }, 2000);
                }
            });
        }
    }

}

