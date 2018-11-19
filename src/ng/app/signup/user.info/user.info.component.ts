import { Component, OnInit, AfterViewInit, ViewEncapsulation, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
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
import { AuthService } from '../../services/auth.service';
import { LocationsService  } from '../../services/locations';
import { AccountsDataProviderService } from '../../services/accounts';

@Component({
    selector: 'app-signup-user-info',
    templateUrl: './user.info.component.html',
    styleUrls: ['./user.info.component.css'],
    providers : [AccountsDataProviderService]
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

    versionTwo = false;
    signUpV2data = {
        first_name : '',
        last_name : '',
        email : '',
        account_id : 0,
        account_name : '',
        building_id : 0,
        building_name : '',
        level_id : 0,
        level_name : '',
        role_id : 0
    };
    signUpV2Submitted = false;
    @ViewChild('inputBuilding') inputBuilding : ElementRef;
    @ViewChild('inpBldgModel') inpBldgModel;
    searchBuildingSubs;
    searchedBuildings = <any> [];
    @ViewChild('inputOrg') inputOrg : ElementRef;
    searchAccountSubs;
    searchedAccounts = <any> [];
    searchBuildingLevels = <any> [];
    @ViewChild('formSignInV2') formSignInV2 : NgForm;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private http: HttpClient,
        platformLocation: PlatformLocation,
        private signupService: SignupService,
        private auth: AuthService,
        private locationsService: LocationsService,
        private accountService: AccountsDataProviderService
    ) {
        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
        this.baseUrl = (platformLocation as any).location.origin;

        this.roleId = this.activatedRoute.snapshot.queryParams['role_id'];
        this.selectAccountType = this.roleId;
        if(this.activatedRoute.routeConfig.data.versionTwo){
            this.versionTwo = true;
            console.log('version two');
        }
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
            /*this.signupService.getSecurityQuestions((securityQuestionsResponse) => {
                this.securityQuestions = securityQuestionsResponse.data;
                setTimeout(() => { $('#securityQuestion').material_select(); }, 100);
            });*/
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
        if(this.versionTwo){
            $('#roleId').val(this.selectAccountType).material_select();
        }

        if(this.versionTwo){
            this.searchBuildingEvent();
            this.searchAccountEvent();
            $('#selectLevel').prop('disabled', true).material_select();
        }
    }

    searchBuildingEvent(){
        this.searchBuildingSubs = Observable.fromEvent(this.inputBuilding.nativeElement, 'keyup')
        .debounceTime(500).distinctUntilChanged().subscribe((event) => {
            let val = this.inputBuilding.nativeElement.value.trim();
            if(val.length > 0){
                this.locationsService.searchBuildings(val, { get_sublocation : true, account_id : this.signUpV2data.account_id }).subscribe((response) => {
                    this.searchedBuildings = response;
                });
            }else{
                this.searchedBuildings = [];
                this.searchBuildingLevels = [];
                $('#selectLevel').material_select('destroy');
                setTimeout(() => {
                    $('#selectLevel').material_select();
                }, 500);
            }
        });
    }

    searchAccountEvent(){
        this.searchAccountSubs = Observable.fromEvent(this.inputOrg.nativeElement, 'keyup')
        .debounceTime(500).distinctUntilChanged().subscribe((event) => {
            let val = this.inputOrg.nativeElement.value.trim();
            if(val.length > 0){
                this.accountService.searhByName(val, (response) => {
                    this.searchedAccounts = response.data;
                }, {
                    limit : 10
                });
            }else{
                this.searchedAccounts = [];
                this.searchedBuildings = [];
                this.searchBuildingLevels = [];
                this.inputBuilding.nativeElement.value = '';
                this.signUpV2data.account_id = 0;
                this.signUpV2data.building_id = 0;
                this.inputBuilding.nativeElement.disabled = true;

                this.formSignInV2.controls.building_name.reset();
                $('label[for="building_name"]').removeClass('active');
                $('#selectLevel').material_select('destroy');
                setTimeout(() => {
                    $('#selectLevel').prop('disabled', true).material_select();
                }, 500);
            }
        });
    }

    clickOrgSelected(account){
        this.inputOrg.nativeElement.value = account.account_name;
        this.signUpV2data.account_id = account.account_id;
        this.searchedAccounts = [];
        this.searchedBuildings = [];
        this.searchBuildingLevels = [];
        this.inputBuilding.nativeElement.value = '';
        $('#selectLevel').material_select('destroy');
        setTimeout(() => {
            $('#selectLevel').prop('disabled', true).material_select();
        }, 500);
    }

    clickBldgSelected(location){
        this.inputBuilding.nativeElement.value = location.name;
        this.signUpV2data.building_id = location.location_id;
        this.searchedBuildings = [];
        this.searchBuildingLevels = location.sublocations;
        $('#selectLevel').material_select('destroy');
        setTimeout(() => {
            $('#selectLevel').material_select();
        }, 500);
    }

    submitSignUpV2(form, btn){
        if(form.valid){
            this.modalLoader.showLoader = true;
            this.modalLoader.showMessage = false;

            this.elems['modalSignup'].modal('close');
            this.elems['modalLoader'].modal('open');

            this.emailTaken = false;

            let 
            locationId = this.signUpV2data.building_id,
            levelId = ($('#selectLevel').length > 0) ? parseInt($('#selectLevel').val()) : 0;
            if(levelId > 0){
                locationId = levelId;
            }

            this.signupService.submitSignUpV2({
                first_name : this.signUpV2data.first_name,
                last_name : this.signUpV2data.last_name,
                email : this.signUpV2data.email,
                role_id : this.roleId,
                location_id : locationId,
                account_id : this.signUpV2data.account_id
            }).subscribe((res) => {
                this.modalLoader.showLoader = false;
                this.modalLoader.showMessage = true;
                if(res.status){
                    this.modalLoader.iconColor = 'green'
                    this.modalLoader.icon = 'check';
                    this.modalLoader.message = 'We will review your request and we\'ll get back to you. Thank you!';
                    this.elems['modalLoader'].modal('open');
                }else{
                    this.modalLoader.iconColor = 'red'
                    this.modalLoader.icon = 'close';
                    this.modalLoader.message = res.message;
                }
            });
        }
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

            this.modalLoader.iconColor = 'green'
            this.modalLoader.icon = 'check';
            this.resetFormElement(f);
            this.elems['modalLoader'].modal('open');

            this.auth.setToken(res.data.token);
            this.auth.setUserData(res.data.user);

            setTimeout(() => {
                let accountType = $('#accountType');
                if( parseInt(accountType.val()) == 1 || parseInt(accountType.val()) == 2 ){
                    this.router.navigate(['/setup-company']);
                }else{
                    this.router.navigate(['/login']);
                }
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
            /*userData['question_id'] = $('#securityQuestion').val();
            userData['security_answer'] = controls.security_answer.value;*/
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

        if(this.searchBuildingSubs){
            this.searchBuildingSubs.unsubscribe();
            this.searchAccountSubs.unsubscribe();
        }
    }

}
