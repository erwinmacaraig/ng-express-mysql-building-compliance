import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { AuthService } from '../../services/auth.service';
import { LocationsService } from '../../services/locations';
import { UserService } from '../../services/users';
import { CourseService } from '../../services/course';
import { DatepickerOptions } from 'ng2-datepicker';
import * as enLocale from 'date-fns/locale/en';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
  selector: 'app-view-user-component',
  templateUrl: './view.user.component.html',
  styleUrls: ['./view.user.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService, CourseService]
})
export class ViewUserComponent implements OnInit, OnDestroy {
	@ViewChild('formMobility') formMobility : NgForm;
	@ViewChild("durationDate") durationDate: ElementRef;
	@ViewChild("formProfile") formProfile: NgForm;
	@ViewChild("formCredential") formCredential : NgForm;
	userData = {};
	encryptedID = '';
	decryptedID = '';
	viewData = {
		user : {
			profilePic : '',
			last_login : '',
			mobility_impaired_details : {}
		},
		role_text : '',
		eco_roles : [],
		locations : [],
		trainings : [],
		certificates : [],
		badge_class : ''
	};
	showRemoveWardenButton = false;
	showModalRemoveWardenLoader = false;
	errorMessageRemoveWarden = '';

	options: DatepickerOptions = {
	    locale: enLocale,
	    displayFormat: 'MMM D[,] YYYY',
	    minDate: new Date(Date.now()),
	    maxDate: new Date(Date.now())
	};

	datepickerModel : Date;
	isShowDatepicker = false;
	datepickerModelFormatted = '';
	showModalLoader = false;

	selectedPeep = {};

	showModalProdfileLoader = false;

	showModalCredentialsLoader = false;
	isPasswordEquals = false;

	locations = [];

	constructor(
		private auth: AuthService,
        private preloaderService: DashboardPreloaderService,
        private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private courseService : CourseService,
        private userService: UserService
		){

		this.userData = this.auth.getUserData();
		this.datepickerModel = new Date();
    	this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

		this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.decryptedID = this.encryptDecrypt.decrypt(params['encrypted']);

			
			this.loadProfile();
		});

		this.locationService.getLocationsHierarchyByAccountId(this.userData['accountId'], (response) => {
			this.locations = response.locations;
		});
	}

	loadProfile(callBack?){
		this.userService.getUserLocationTrainingsEcoRoles(this.decryptedID, (response) => {
			this.viewData.user = response.data.user;
			this.viewData.role_text = response.data.role_text;
			this.viewData.eco_roles = response.data.eco_roles;
			this.viewData.locations = response.data.locations;
			this.viewData.trainings = response.data.trainings;
			this.viewData.certificates = response.data.certificates;

			for(let i in this.viewData.trainings){
				this.viewData.trainings[i]['certificates'] = {
					pass : 0,
					status : 'expired',
					expiry_date_formatted : ''
				};
				for(let x in this.viewData.certificates){
					this.viewData.certificates[x]['expiry_date_formatted'] = moment( this.viewData.certificates[x]['expiry_date'] ).format('DD/MM/YYYY');

					if(
						this.viewData.trainings[i]['training_requirement_id'] ==
						this.viewData.certificates[x]['training_requirement_id']
						){
						this.viewData.trainings['certificates'] = this.viewData.certificates[x];
					}
				}
			}


			if(this.viewData.user.last_login.length > 0 ){
				this.viewData.user['last_login'] = moment(this.viewData.user['last_login']).format('MMM. DD, YYYY hh:mm A');
			}

			this.preloaderService.hide();

			setTimeout(() => {
				$('.left-panel select').material_select();
			},300);

			if(callBack){
				callBack();
			}
		});
	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});


		this.gridEvent();
		this.renderGrid();

		this.preloaderService.show();
		

		$('#modalMobility select[name="is_permanent"]').off('change').on('change', () => {
            if($('#modalMobility select[name="is_permanent"]').val() == '1'){
                this.isShowDatepicker = false;
                $('#durationDate').prop('disabled', true);
                this.durationDate.nativeElement.value = "no date available";
                this.formMobility.controls.duration_date.disable();
            }else{
                this.durationDate.nativeElement.value = "";
                this.formMobility.controls.duration_date.markAsPristine();
                this.formMobility.controls.duration_date.enable();

                $('#durationDate').prop('disabled', false);
            }

            $('#modalMobility select[name="is_permanent"]').material_select('update');
        });

		this.selectLocationEvent();
		setTimeout(() => { 
			Materialize.updateTextFields();
		}, 1000);
		setTimeout(() => { 
			$('#selectLocation').trigger('change');
		}, 100);

		this.selectActionEvent();
		
	}

	getRoleName(roleId){
		if(roleId == 1){
			return 'Building Manager';
		}else if(roleId == 2){
			return 'Tenant';
		}else{
			let emRoles = this.viewData.eco_roles;
			for(let role of emRoles){
				if(role.em_roles_id == roleId){
					return role.role_name;
				}
			}
		}
	}

	selectLocationEvent(){
		let selectLocation = $('#selectLocation');
		selectLocation.off('change').on('change', () => {
			let locId = selectLocation.val(),
				selectedLoc = <any>{},
				emRoles = this.viewData.eco_roles;

			for(let loc of this.viewData.locations){
				if(loc.location_id == locId){
					selectedLoc = loc;
				}
			}

			if(selectedLoc.em_roles_id !== null && selectedLoc.em_roles_id > 0){
				this.viewData.role_text = this.getRoleName(selectedLoc.em_roles_id);
			}else{
				if(selectedLoc.location_role_id == 1 || selectedLoc.location_role_id == 2){
					this.viewData.role_text = this.getRoleName(selectedLoc.location_role_id);
				}
			}

			setTimeout(() => { 
				Materialize.updateTextFields();
			}, 100);

		});
	}

	gridEvent(){
		window.addEventListener("load", this.renderGrid, false);
		window.addEventListener("resize", this.renderGrid, false);
	}

	renderGrid(){
		let containerWidth = document.querySelector('#gridContainer')['offsetWidth'];
		let blocks = document.querySelectorAll('#gridContainer .grid-item');
		let pad = 30, cols = Math.floor( containerWidth / 300 ), newleft, newtop;
		
		for(let x = 1; x < blocks.length; x++){
			blocks[x]['style'].left = null;
			blocks[x]['style'].top = null;
		}

		setTimeout(() => {
			for(let i = 1; i < blocks.length; i++){
				if(i % cols == 0){
					newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
					blocks[i]['style'].top = newtop+"px";
				}else{
					if(blocks[i-cols]){
						newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
						blocks[i]['style'].top = newtop+"px";
					}
					newleft = (blocks[i-1]['offsetLeft'] + blocks[i-1]['offsetWidth']) + pad;
					blocks[i]['style'].left = newleft+"px";
				}
			}
		}, 100);
	}

	getInitials(fullName){
		if(fullName){
			let initials = fullName.match(/\b\w/g) || [];
			initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
			return initials;
		}
		return 'AA';
	}

	clickRemoveWarden(){
		$('#modalRemoveWarden').modal('open');
		this.errorMessageRemoveWarden = '';
		this.showModalRemoveWardenLoader = false;
	}

	yesRemoveWarden(){
		this.showModalRemoveWardenLoader = true;
		this.userService.removeUserFromLocation(this.decryptedID, (response) => {
			if(response.status){
				$('#modalRemoveWarden').modal('close');
				setTimeout(() => {
					this.showModalRemoveWardenLoader = false;
					this.router.navigate(["/teams/all-users"]);
				}, 300);
			}
		})
	}

	viewPEEP(){
		let peep = <any> this.viewData.user;
		$('#modalMobility select[name="is_permanent"]').val('0').trigger('change');
        this.datepickerModelFormatted = 'no date available';

        if(peep['mobility_impaired_details'].length > 0){
            for(let i in peep['mobility_impaired_details'][0]){
                if( this.formMobility.controls[i] && i != 'duration_date' ){
                    this.formMobility.controls[i].setValue(peep['mobility_impaired_details'][0][i]);
                }
            }

            $('#modalMobility select[name="is_permanent"]').val(peep['mobility_impaired_details'][0]['is_permanent']);

            if(peep['mobility_impaired_details'][0]['is_permanent'] == 0){
                this.datepickerModel = moment(peep['mobility_impaired_details'][0]['duration_date']).toDate();
                this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
            }else{
                $('#modalMobility select[name="is_permanent"]').val('1').trigger('change');
            }
        }

        this.selectedPeep = peep;
        
        $('#modalMobility').modal('open');
	}

	showDatePicker(){
		this.isShowDatepicker = true;
	}

	onChangeDatePicker(event){
		if(!moment(this.datepickerModel).isValid()){
			this.datepickerModel = new Date();
			this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
		}else{
			this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
		}
		this.isShowDatepicker = false;
	}

	modalPeepFormSubmit(f, event){
        event.preventDefault();

        if(f.valid){
            let paramData = JSON.parse(JSON.stringify(f.value));
            paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
            if('user_id' in this.selectedPeep){
                paramData['user_id'] = this.selectedPeep['user_id'];
            }else if('user_invitations_id' in this.selectedPeep){
                paramData['user_invitations_id'] = this.selectedPeep['user_invitations_id'];
            }

            if(this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }
            
            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val()

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {
            	this.loadProfile(() => {
            		f.reset();
            		setTimeout(() => {
						this.showModalLoader = false;
						$('#modalMobility').modal('close');

						setTimeout(() => { 
							$('#selectLocation').trigger('change');
						}, 100);

					},500);
            	});
            });
        }
    }

    selectActionEvent(){
    	let selectAction = $('#selectAction');
    	selectAction.off('change').on('change', () => {
    		let val = selectAction.val();

    		if(val == 'profile'){
    			this.showUpdateUserInfo();
    		}else if(val == 'credential'){
    			this.showModalCredentials();
    		}else if(val == 'location'){
    			$('#modalAssignLocations').modal('open');
    		}

    		selectAction.val('0').material_select('update');

    	});
    }

    showUpdateUserInfo(){
    	$('#modalUpdateProfile').modal('open');

    	let user = <any>this.viewData.user;
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
    			this.loadProfile(() => {
            		setTimeout(() => {
						this.showModalProdfileLoader = false;
						$('#modalUpdateProfile').modal('close');

						setTimeout(() => { 
							$('#selectLocation').trigger('change');
						}, 100);

					},500);
            	});
    		});
    	}
    }

    showModalCredentials(){
    	$('#modalCredentials').modal('open');
    	this.formCredential.reset();
    	let user = <any>this.viewData.user;
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
    			this.loadProfile(() => {
            		setTimeout(() => {
						this.showModalCredentialsLoader = false;
						$('#modalCredentials').modal('close');
						
						setTimeout(() => { 
							$('#selectLocation').trigger('change');
						}, 100);

					},500);
            	});
    		});
    	}
    }

    ngOnDestroy(){

    }
}