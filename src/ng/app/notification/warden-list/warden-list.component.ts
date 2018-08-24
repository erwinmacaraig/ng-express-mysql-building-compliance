import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm, FormGroup, FormControl, Validators } from '@angular/forms';
import { PersonDataProviderService } from '../../services/person-data-provider.service';
import { AdminService } from '../../services/admin.service';
import { Subscription, Observable } from 'rxjs/Rx';
import { AccountsDataProviderService } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { HttpParams, HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
    selector: 'app-notification-warden-list',
    templateUrl: './warden-list.component.html',
    styleUrls: ['./warden-list.component.css'],
    providers: [EncryptDecryptService, AccountsDataProviderService, DashboardPreloaderService, UserService, AdminService, LocationsService]
})
export class NotificationWardenListComponent implements OnInit, AfterViewInit, OnDestroy {

    private userId = 0;
    private location_id = 0;
    private configId = 0;
    private notification_token_id = 0;
    private building_id = 0;
    public wardens = [];
    public encryptedToken = '';

    mutationOversable = <any>{};
    selectedUser = <any> {};


    @ViewChild("formProfile") formProfile: NgForm;
    selectedIndex = -1;
    showModalProdfileLoader = false;

    @ViewChild("formCredential") formCredential: NgForm;
    isPasswordEquals = false;
    showModalCredentialsLoader = false;


    @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
    showSelectLocation = false;
    locations = <any> [];
    locationsBackup = <any> [];
    locationsCopy = <any> [];
    toEditLocations = <any> [];
    ecoRoles = <any> [];
    selectedLocationData = <any> {};
    showLocationLoading = false;
    formLocValid = false;
    buildings = <any>[];
    levels = <any>[];

    public sublocations = [];
    private baseUrl: String;
    addUserForm: FormGroup;
    first_name_field: FormControl;
    last_name_field: FormControl;
    email_field: FormControl;
    role_field: FormControl;
    location_field: FormControl;
    mobile_contact_field: FormControl;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private cryptor: EncryptDecryptService,
        private accountService: AccountsDataProviderService,
        private elemRef : ElementRef,
        private userService: UserService,
        private preloader: DashboardPreloaderService,
        private personDataService: PersonDataProviderService,
        private locationsService: LocationsService,
        private adminService: AdminService,
        private platformLocation: PlatformLocation,
        public http: HttpClient,
        private locationService: LocationsService,
        private router: Router
        ) {

        this.personDataService.buildECORole().subscribe((ecoroles) => {
            this.ecoRoles = ecoroles;
        });
        this.baseUrl = (platformLocation as any).location.origin;
    }

    generateRandomChars(length){
        let chars = 'ABCDEFGHIJKKLMNOPQRSTUVWXYZ0987654321',
        len = (typeof length == 'number') ? length : 15,
        responseCode = '';

        for(let i=0; i<=len; i++){
           responseCode += chars[ Math.floor(Math.random() * chars.length) ];
        }

        return responseCode;
    }

    ngOnInit() {
        this.route.params.subscribe((params) => {
            const token = this.cryptor.decryptUrlParam(params['token']);
            this.encryptedToken = params['token'];
            const parts: Array<string> = token.split('_');
            this.userId = +parts[0];
            this.location_id = +parts[1];
            this.configId = +parts[2];
            this.notification_token_id = +parts[3];
            this.building_id = +parts[4];

            const userId = +this.authService.userDataItem('userId');
            if (isNaN(this.building_id) ||
                isNaN(this.userId) ||
                isNaN(this.location_id) ||
                isNaN(this.notification_token_id) ||
                isNaN(this.configId) ||
                userId != this.userId
              ) {

              this.authService.removeToken();
              this.router.navigate(['/success-valiadation'],
                { queryParams: { 'verify-notified-user': 0}});
            }
            this.generateWardenList();

            this.locationsService.getSublocationsOfParent(this.building_id).subscribe((response) => {
                this.sublocations.push(response['building']);
                this.sublocations =  this.sublocations.concat(response['data']);
            }, (error) => {
                console.log(error);
            });
        });

        this.addUserForm = new FormGroup({
          first_name_field: new FormControl(null, Validators.required),
          last_name_field: new FormControl(null, Validators.required),
          email_field: new FormControl(null, [Validators.required, Validators.email], this.forbiddenEmails.bind(this)),
          role_field: new FormControl(null, Validators.required),
          location_field: new FormControl(null, Validators.required),
          mobile_contact_field: new FormControl()
        });

        this.mutationOversable = new MutationObserver((mutationsList) => {
            mutationsList.forEach((mutation) => {
                if(mutation.target.nodeName != '#text'){
                    let target = $(mutation.target);
                    if(target.find('select.to-materialize:not(.initialized)').length > 0){

                        target.find('select.to-materialize:not(.initialized)').material_select();

                    }
                }
            });
        });

        this.mutationOversable.observe(this.elemRef.nativeElement, { childList: true, subtree: true });
    }

    private generateWardenList() {
        this.preloader.show();
        this.accountService.listWardensOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
            this.wardens = response['data'];
            for (const warden of this.wardens) {
                warden['encrypted_user_id'] = this.cryptor.encrypt(warden['user_id']);
            }
            this.preloader.hide();
        }, (error) => {
            console.log(error);
            this.preloader.hide();
        });
    }

    ngAfterViewInit() {
        this.selectActionEvent();
        $('.modal').modal({
            dismissible: false
        });
    }

    selectActionEvent(){
        var __this = this;
        $('body').off('change.select-action').on('change.select-action', '.select-action', function(){
            let
            selectElem = $(this),
            val = selectElem.val(),
            index = selectElem.attr('index'),
            warden = __this.wardens[index];

            if(warden){
                __this.selectedUser = warden;
                __this.selectedIndex = index;

                if(val == 'profile'){
                    __this.showUpdateUserInfo();
                }else if(val == 'credential'){
                    __this.showModalCredentials();
                }else if(val == 'location'){

                    __this.showLocationLoading = true;

                    __this.locationsService.getSublocationsOfParent(__this.building_id).subscribe((response) => {
                        __this.locations = response.data;
                        for(let loc of __this.locations){
                            loc['id'] = __this.generateRandomChars(20);
                        }
                        __this.locationsBackup = JSON.parse( JSON.stringify( __this.locations ) );
                        __this.locationsCopy = JSON.parse( JSON.stringify( __this.locations ) );
                    });

                    __this.userService.getUserLocationTrainingsEcoRoles(warden.user_id, (response) => {
                        __this.toEditLocations = response.data.locations;

                        __this.showLocationLoading = false;
                    });

                    $('#modalAssignLocations').modal('open');
                }else if(val == 'markaspeep'){
                    __this.router.navigate(
                        ['/dashboard/notification-warden-list/', __this.encryptedToken ], 
                        { queryParams: { id: __this.cryptor.encrypt(''+warden.user_id), formodal : 'true' } 
                    });
                    $('#modalPeep').modal('open');
                }

                selectElem.val('0').material_select();
            }
        });
    }

    removeAssigned(index){
        this.toEditLocations[index]['deleted'] = true;
    }

    assignNewClickEvent(){
        this.toEditLocations.push({
            location_id : 0,
            role_id : 0,
            id : this.generateRandomChars(20)
        });

        setTimeout(() => {
            $('#modalAssignLocations').scrollTop( $('#modalAssignLocations .button-container').position().top );
        }, 200);
    }

    forbiddenEmails(control: FormControl): Promise<any> | Observable<any> {
        const httpParams = new HttpParams().set('user_email', control.value);
        return new Promise((resolve, reject) => {
            this.http.get(this.baseUrl + '/admin/check-user-email/', {'params': httpParams}).subscribe((response) => {
                if (response['forbidden']) {
                    resolve({
                        emailIsForbidden: true
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    showUpdateUserInfo(){
        $('#modalUpdateProfile').modal('open');

        let user = <any>this.selectedUser;
        this.formProfile.controls.user_id.setValue(user.user_id);
        this.formProfile.controls.first_name.setValue(user.first_name);
        this.formProfile.controls.last_name.setValue(user.last_name);

        if(user.mobile_number.length > 0){
            this.formProfile.controls.mobile_number.setValue(user.mobile_number);
        }else{
            this.formProfile.controls.mobile_number.setValue(user.phone_number);
        }
    }

    submitUpdateProfile(formProfile:NgForm){
        if(formProfile.valid){

            this.showModalProdfileLoader = true;

            this.userService.update(formProfile.value, (response) => {
                this.showModalProdfileLoader = false;
                this.wardens[this.selectedIndex]["first_name"] = response.data.first_name;
                this.wardens[this.selectedIndex]["last_name"] = response.data.last_name;
                this.wardens[this.selectedIndex]["mobile_number"] = response.data.mobile_number;
                $('#modalUpdateProfile').modal('close');
            });
        }
    }

    showModalCredentials(){
        $('#modalCredentials').modal('open');
        this.formCredential.reset();
        let user = <any>this.selectedUser;
        this.formCredential.controls.user_id.setValue(user.user_id);
        this.formCredential.controls.email.setValue(user.email);

        $('#modalCredentials #confirmPassword').off('keyup').on('keyup', (elem) => {
            if(elem.value == $('#modalCredentials #inpPassword').val()){
                this.isPasswordEquals = true;
            }
        });
    }

    submitCredential(formCredential:NgForm){
        if(formCredential.valid){

            this.showModalCredentialsLoader = true;

            this.userService.update(formCredential.value, (response) => {
                this.showModalCredentialsLoader = false;
                $('#modalCredentials').modal('close');
            });
        }
    }

    submitSelectLocationModal(formLoc, event){
        event.preventDefault();
        let locationFound = false;
        if(this.formLocValid){
            let
            radio = $(formLoc).find('input[type="radio"]:checked'),
            lhTarget = radio.attr('lh-target'),
            selectedLocationId = radio.val(),
            locationName = radio.parent().find('label').text(),
            parentName = radio.attr('parent-name'),
            parentId = radio.parent().find('span.parent-id').text();

            this.selectedLocationData['location_id'] = selectedLocationId;
            this.selectedLocationData['parent_id'] = parentId;
            this.selectedLocationData['name'] = parentName+','+locationName;

            // console.log(this.selectedLocationData);
            console.log(this.toEditLocations);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
        this.showSelectLocation = false;
        this.modalSearchLocation.nativeElement.value = "";
    }

    onChangeSelectRole(location, roleId){
        this.selectedLocationData = location;

        let rolesForBuildingsOnly = [1,11,15,16,18];

        this.locations = JSON.parse( JSON.stringify(this.locationsBackup) );

        this.locationsCopy = JSON.parse( JSON.stringify(this.locations) );

        location.role_id = roleId;

        if(
            (this.selectedLocationData['is_building'] == 1 && rolesForBuildingsOnly.indexOf( parseInt(roleId) ) == -1) ||
            (this.selectedLocationData['is_building'] == 0 && rolesForBuildingsOnly.indexOf( parseInt(roleId) ) > -1)
            ){
            this.selectedLocationData['location_id'] = 0;
        }

        this.buildLocationsListInModal();
    }

    buildLocationsListInModal(){
        const ulModal = $('#modalAssignLocations ul.locations');
        ulModal.html('');
        $('body').off('click.radio').on('click.radio', 'input[type="radio"][name="selectLocation"]', () => {
            $('#modalAssignLocations')[0].scrollTop = 0;
            this.formLocValid = true;
        });

        console.log( this.selectedLocationData );

        let maxDisplay = 25,
            count = 1;

        for (let loc of this.locations) {
            if (count <= maxDisplay) {
                let $li = $(`
                    <li class="list-division" id="${loc.location_id}">
                        <div class="name-radio-plus">
                            <div class="input">
                                <input required type="radio" name="selectLocation" value="${loc.location_id}" parent-name="${loc.parent_name}" id="check-${loc.location_id}">
                                <label for="check-${loc.location_id}">${loc.name}</label>
                                <span hidden class="parent-id">${loc.parent_id}</span>
                            </div>
                        </div>
                    </li>`);

                ulModal.append($li);
                count++;
            }
        }
    }

    clickSelectLocation(loc){
        this.selectedLocationData = loc;

        this.onChangeSelectRole(loc, loc.role_id);
        this.buildLocationsListInModal();
        this.showSelectLocation = true;
    }

    saveLocationAssignments(event){
        event.preventDefault();
        let toSaveData = this.toEditLocations,
            error = 0;
        for(let data of toSaveData){
            if(data.location_id == 0 && !data.deleted || data.role_id == 0 && !data.deleted){
                error++;
            }
        }

        if(error == 0){
            this.showLocationLoading = true;

            this.userService.userLocationRoleAssignments({
                user_id : this.selectedUser.user_id, assignments : JSON.stringify(this.toEditLocations)
            }, (response) => {

                this.accountService.listWardensOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
                    this.wardens = response['data'];
                    for (const warden of this.wardens) {
                        warden['encrypted_user_id'] = this.cryptor.encrypt(warden['user_id']);
                    }
                    $('#modalAssignLocations').modal('close');
                }, (error) => {
                    $('#modalAssignLocations').modal('close');
                });

            });
        }
    }

    archiveClick(warden){
        $('#modalArchive').modal('open');
        this.selectedUser = warden;
    }

    confirmArchive(){
        this.userService.update({
            user_id : this.selectedUser["user_id"],
            archived : 1
        }, (response) => {

            this.accountService.listWardensOnNotificationFinalScreen(this.building_id.toString()).subscribe((response) => {
                this.wardens = response['data'];
                for (const warden of this.wardens) {
                    warden['encrypted_user_id'] = this.cryptor.encrypt(warden['user_id']);
                }
                $('#modalArchive').modal('close');
            }, (error) => {
                $('#modalArchive').modal('close');
            });

        });
    }

    showAddUserForm() {
      $('#modalAddUser').modal('open');
    }
    cancelAddUserModal() {
        this.addUserForm.reset();
        $('#modalAddUser').modal('close');
    }

    createUser() {
        const values = [];
        values.push({
            'first_name': this.addUserForm.get('first_name_field').value,
            'last_name': this.addUserForm.get('last_name_field').value,
            'email': this.addUserForm.get('email_field').value,
            'eco_role_id': this.addUserForm.get('role_field').value,
            'mobile_number': this.addUserForm.get('mobile_contact_field').value,
            'account_location_id': this.addUserForm.get('location_field').value
        });
        this.userService.createBulkUsers(values, (response) => {
            this.generateWardenList();
            this.addUserForm.reset();
            $('#modalAddUser').modal('close');
        });
    }

    ngOnDestroy() {
    }

}
