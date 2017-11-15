import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { HttpClient,  HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { BlacklistedEmails } from '../../models/blacklisted-emails';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
declare var $: any;
import { SignupService } from '../../services/signup.service';
import { AccountTypes } from '../../models/account.types';
import { InvitationCode } from '../../models/invitation-code';

@Component({
    selector: 'app-signup-user-info',
    templateUrl: './user.info.component.html',
    styleUrls: ['./user.info.component.css']
})
export class SignupUserInfoComponent implements OnInit, AfterViewInit, OnDestroy {

    // private UserType = new AccountTypes().getTypes();
    private UserType = new AccountTypes();
    private headers: Object;
    private options: Object;
    private baseUrl: String;
    emailTaken = false;
    public invitationCodePresent = false;
    public inviCode;
    private subscription;
    arrUserType = Object.keys(this.UserType.getTypes()).map((key) => { return this.UserType.getTypes()[key]; });

    modalLoader = {
        showLoader : true,
        loadingMessage : "Signing up...",
        showMessage : false,
        iconColor: 'green',
        icon: 'check',
        message: 'Sign up successful! Please open your email and click the verification link.'
    };

    elems = {};

    roleId = 0;
    selectAccountType = 0;
    securityQuestions = [];
    selectedSecurityQuestion = 0;

    emailInvalidMessage = 'Invalid email';

    constructor(private router: Router, private activatedRoute: ActivatedRoute, private http: HttpClient, platformLocation: PlatformLocation, private signupService: SignupService) {
        this.headers = new Headers({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
        this.baseUrl = (platformLocation as any).location.origin;

        this.roleId = this.activatedRoute.snapshot.queryParams['role_id'];
        this.selectAccountType = this.roleId;
    }

    ngOnInit() {
        this.elems['modalSignup'] = $('#modalSignup');
        this.elems['modalLoader'] = $('#modalLoader');
        if (this.signupService.getInvitationCode()) {
            this.inviCode = this.signupService.getInvitationCode();
            this.invitationCodePresent = true;
            this.inviCode.role_text = this.UserType.getTypeName()[this.signupService.getInvitationCode().role_id];
        } else {
            this.inviCode = new InvitationCode();
        }

        if(this.roleId == 3){
            this.signupService.getSecurityQuestions((securityQuestionsResponse) => {
                this.securityQuestions = securityQuestionsResponse.data;
                setTimeout(() => { $('#securityQuestion').material_select(); }, 100);
            });
        }

    }

    ngAfterViewInit() {
        if (!this.invitationCodePresent) {
            $('select').material_select();
        }

        let  modalOpts = {
            dismissible: false,
            startingTop: '0%', // Starting top style attribute
            endingTop: '5%'
        };

        // init modal
        this.elems['modalSignup'].modal(modalOpts);
        modalOpts.endingTop = '25%';
        this.elems['modalLoader'].modal(modalOpts);

        this.elems['modalSignup'].modal('open');
        $('#accountType').val(this.selectAccountType).material_select();
    }

    resetFormElement(form){
        form.reset();
        $('.invalid').removeClass('invalid');
        $('label.active').removeClass('active');
        $('#accountType').val("-1").material_select();
    }

    signupResponse(res, f) {
        this.modalLoader.showLoader = false;
        this.modalLoader.showMessage = true;
        if (res.status) {
            this.modalLoader.message = 'Sign up successful! Please open your email and click the verification link.';
            if (res.data.code) {
                this.modalLoader.message = 'Sign up successful!';
            }

            this.modalLoader.iconColor = 'green';
            this.modalLoader.icon = 'check';
            this.resetFormElement(f);
            this.elems['modalLoader'].modal('open');
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
        } else {
            this.modalLoader.iconColor = 'red';
            this.modalLoader.icon = 'clear';
            for (let i in res.data) {
                if(i == 'email_taken') {
                    this.emailTaken = true;
                    this.modalLoader.message = 'The email that you used is already taken.';
                }else if(i == 'black_listed') {
                    f.controls.email.setErrors({ blacklisted : true });
                    this.emailInvalidMessage = '*Domain must not be personal';
                    this.modalLoader.message = "The email must be company's email otherwise it is not valid";
                }else{
                    f.controls[i].markAsDirty();
                }
            }
            this.modalLoader.message = res.message;
            setTimeout(() => {
                this.elems['modalLoader'].modal('close');
                this.elems['modalSignup'].modal('open');
            }, 2000);
        }
    }

    signUpFormSubmit(f: NgForm, event) {
        event.preventDefault();
        let
        controls = f.controls,
        accountType = $('#accountType'),
        userData = {
            'first_name' : controls.first_name.value,
            'last_name' : controls.last_name.value,
            'email' : controls.email.value,
            'password' : controls.password.value,
            'confirm_password' : controls.confirm_password.value,
            'role_id' : parseInt(accountType.val()) || this.inviCode.role_id
        };

        if(userData['role_id'] == 3){
            userData['question_id'] = $('#securityQuestion').val();
            userData['security_answer'] = controls.security_answer.value;
        }

        if (this.invitationCodePresent) {
            userData['invi_code_id'] = this.inviCode.invitation_code_id;
            userData['account_id'] = this.inviCode.account_id;
        }
        if ( isNaN(userData.role_id) ){
            if (f.valid) {
                accountType.siblings('input.select-dropdown').css('border-bottom', '1px solid #F44336');
            } else {
                for (let x in f.controls) {
                    f.controls[x].markAsDirty();
                }
            }
        } else {
            accountType.siblings('input.select-dropdown').css('border-bottom', '1px solid #9e9e9e');
            if(f.valid){
                let blackEmails = new BlacklistedEmails(),
                    isBlackListed = false;
                if(userData['role_id'] < 3){
                    if( blackEmails.isEmailBlacklisted(controls.email.value) ){
                        isBlackListed = true;
                    };
                }

                if( !isBlackListed ){

                    this.modalLoader.showLoader = true;
                    this.modalLoader.showMessage = false;

                    this.elems['modalSignup'].modal('close');
                    this.elems['modalLoader'].modal('open');

                    this.emailTaken = false;

                    this.signupService.sendUserData(userData, (res) => {
                        this.signupResponse(res, f);
                    });
                }else{
                    controls.email.setErrors({ blacklisted : true });
                    this.emailInvalidMessage = '*Domain must not be personal';
                }

            }else{
                for(let x in f.controls){
                    f.controls[x].markAsDirty();
                }
            }
        }
    }

    onCloseSelfSignUp() {
        this.signupService.invalidateInvitationCode();
        this.inviCode = new InvitationCode();
        this.invitationCodePresent = false;
        this.elems['modalSignup'].modal('close');
        this.router.navigate(['/signup']);
    }

    ngOnDestroy() {
        this.signupService.invalidateInvitationCode();
        this.invitationCodePresent = false;

        this.elems['modalSignup'].modal('close');
        this.elems['modalLoader'].modal('close');
    }

}
