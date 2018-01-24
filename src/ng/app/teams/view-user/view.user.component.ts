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
import { DatepickerOptions } from 'ng2-datepicker';
import * as enLocale from 'date-fns/locale/en';

declare var $: any;
declare var Materialize: any;
declare var moment: any;
@Component({
  selector: 'app-view-user-component',
  templateUrl: './view.user.component.html',
  styleUrls: ['./view.user.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService]
})
export class ViewUserComponent implements OnInit, OnDestroy {
	@ViewChild('f') formMobility : NgForm;
	@ViewChild("durationDate") durationDate: ElementRef;
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

	constructor(
		private auth: AuthService,
        private preloaderService: DashboardPreloaderService,
        private locationService: LocationsService,
        private encryptDecrypt: EncryptDecryptService,
        private route: ActivatedRoute,
        private router: Router,
        private userService: UserService
		){

		this.userData = this.auth.getUserData();
		this.datepickerModel = new Date();
    	this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

		this.route.params.subscribe((params) => {
			this.encryptedID = params['encrypted'];
			this.decryptedID = this.encryptDecrypt.decrypt(params['encrypted']);

			this.userService.getUserLocationTrainingsEcoRoles(this.decryptedID, (response) => {
				this.viewData.user = response.data.user;
				this.viewData.role_text = response.data.role_text;
				this.viewData.eco_roles = response.data.eco_roles;
				this.viewData.locations = response.data.locations;
				this.viewData.trainings = response.data.trainings;

				/*for(let i in this.viewData.eco_roles){
					if(this.viewData.eco_roles[i]['is_warden_role'] == 1){
						this.showRemoveWardenButton = true;
					}

					if( this.viewData.eco_roles[i]['role_name'].toLowerCase().indexOf('chief warden') > -1 ){
						this.viewData.badge_class = 'chief-warden';
					}else{

						if( this.viewData.eco_roles[i]['role_name'].toLowerCase().indexOf('warden') > -1 && this.viewData.eco_roles[i]['is_warden_role'] == 1){
							this.viewData.badge_class = 'warden';
						}

					}
				}*/

				if(this.viewData.user.last_login.length > 0 ){
					this.viewData.user['last_login'] = moment(this.viewData.user['last_login'], ["YYYY-MM-DD HH:mm:ss"]).format('MMM. DD, YYYY hh:mm A');
				}

				/*if(this.viewData.user['mobility_impaired_details']['user_id']){
					for(let i in this.viewData.user['mobility_impaired_details']){
						if( this.formMobility.controls[i] ){
							this.formMobility.controls[i].setValue(this.viewData.user['mobility_impaired_details'][i]);
						}
					}

					this.datepickerModel = moment(this.viewData.user['mobility_impaired_details']['duration_date'], ['YYYY-MM-DD']).toDate();
    				this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
				}*/

				this.preloaderService.hide();

				setTimeout(() => {
					$('select').material_select();
				},300);
			});
		});
	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});


		this.gridEvent();
		this.renderGrid();

		this.preloaderService.show();
		

		$('#modalMobility select[name="is_permanent"]').on('change', () => {
			if($('#modalMobility select[name="is_permanent"]').val() == '1'){
				this.isShowDatepicker = false;
				$('#durationDate').prop('disabled', true);
			}else{
				$('#durationDate').prop('disabled', false);
			}
		});

		this.selectLocationEvent();
		setTimeout(() => { 
			Materialize.updateTextFields();
		}, 1000);
		setTimeout(() => { 
			$('#selectLocation').trigger('change');
		}, 100);
		
	}

	selectLocationEvent(){
		let selectLocation = $('#selectLocation');
		selectLocation.on('change', () => {
			let locId = selectLocation.val(),
				selectedLoc = <any>{},
				emRoles = this.viewData.eco_roles;

			for(let loc of this.viewData.locations){
				if(loc.location_id == locId){
					selectedLoc = loc;
				}
			}

			if(selectedLoc.location_role_id == 1){
				this.viewData.role_text = 'Building Manager';
			}else if(selectedLoc.location_role_id == 2){
				this.viewData.role_text = 'Tenant';
			}else{
				let roleId = 8;
				if(selectedLoc.em_roles_id !== null && selectedLoc.em_roles_id > 0){
					roleId = selectedLoc.em_roles_id;
				}

				for(let role of emRoles){
					if(role.em_roles_id == roleId){
						this.viewData.role_text = role.role_name;
					}
				}
			}

			setTimeout(() => { 
				Materialize.updateTextFields();
			}, 100);

		});
	}

	public gridEvent(){
		window.addEventListener("load", this.renderGrid, false);
		window.addEventListener("resize", this.renderGrid, false);
	}

	public renderGrid(){
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

	public getInitials(fullName){
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

	public yesRemoveWarden(){
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

	ngOnDestroy(){}

	viewPEEP(){
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
			/*let paramData = JSON.parse(JSON.stringify(f.value));
			paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
			paramData['location_id'] = this.viewData.location['location_id'];
			paramData['user_id'] = this.viewData.user['user_id'];
			paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val()

			this.showModalLoader = true;

			this.userService.sendMobilityImpaireInformation(paramData, (response) => {

				this.viewData.user.mobility_impaired_details = paramData;
				this.ngOnInit();
				$('#modalMobility').modal('close');
				this.showModalLoader = false;

			});*/
		}
	}
}