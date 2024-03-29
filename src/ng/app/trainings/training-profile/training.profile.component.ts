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
import { ComplianceService } from './../../services/compliance.service';
import { DomSanitizer } from '@angular/platform-browser';
import { AdminService } from './../../services/admin.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { environment } from '../../../environments/environment';
declare var $: any;
declare var Materialize: any;
declare var moment: any;
declare var user_course_relation: any;

@Component({
  selector: 'app-view-training-profile',
  templateUrl: './training.profile.component.html',
  styleUrls: ['./training.profile.component.css'],
  providers: [DashboardPreloaderService, EncryptDecryptService, UserService, CourseService, ComplianceService, AdminService]
})
export class TrainingProfile implements OnInit, OnDestroy {
  @ViewChild('formMobility') formMobility : NgForm;
  @ViewChild("durationDate") durationDate: ElementRef;
  @ViewChild("formProfile") formProfile: NgForm;
  @ViewChild("formCredential") formCredential : NgForm;
  @ViewChild('modalSearchLocation') modalSearchLocation: ElementRef;
  userData = {};
  encryptedID = '';
  decryptedID = '';
  viewData = {
    user : {
      profilePic : '',
      last_name: '',
      first_name: '',
      last_login : '',
      mobility_impaired_details : {},
      mobility_impaired: 0,
      mobile_number: '',
      email: ''
    },
    role_text : '',
    eco_roles : [],
    locations : [],
    trainings : [],
    certificates : [],
    role_texts: [],
    badge_class : '',
    valid_trainings: [],
    required_trainings: [],
    all_trainings: []
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

	toEditLocations = [];

  showLocationSelection = false;
  seenRequiredTrainings = [];
  toggle = false;
  selectedCourse;
  private baseUrl;
  courses = [];

  selectedLocationData = {};
  showSelectLocation = false;

  buildings = [];
  levels = [];
  locationsCopy = [];
  formLocValid = false;
  searchModalLocationSubs;

  isFrp = false;
  isTrp = false;
  private paramSub: Subscription;
	constructor(
    private auth: AuthService,
    private preloaderService: DashboardPreloaderService,
    private locationService: LocationsService,
    private encryptDecrypt: EncryptDecryptService,
    private route: ActivatedRoute,
    private router: Router,
    private courseService : CourseService,
    private userService: UserService,
    private elemRef: ElementRef,
    private sanitizer: DomSanitizer,
    private complianceService: ComplianceService,
    private platformLocation: PlatformLocation,
    private adminService: AdminService
  ) {

    this.baseUrl = environment.backendUrl;
		this.datepickerModel = new Date();
    this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');

    this.userData = this.auth.getUserData();
    for(let role of this.userData['roles']){
      if(role.role_id == 1){
        this.isFrp = true;
      }
      if(role.role_id == 2){
        this.isTrp = true;
      }
    }

	}

	loadProfile(callBack?) {
		this.userService.getUserLocationTrainingsEcoRoles(this.decryptedID).subscribe((response) => {
			// this.viewData.user = {...response.data.user };
			this.viewData.role_text = response.data.role_text;
			this.viewData.eco_roles = response.data.eco_roles;
			this.viewData.trainings = response.data.trainings;
      this.viewData.certificates = response.data.certificates;
      this.viewData.valid_trainings = response.data.valid_trainings;
      this.viewData.required_trainings = response.data.required_trainings;



      // console.log(this.viewData.all_trainings);
      this.viewData.locations = [];
      /* Filter out locations so locations will contain locations with EM Role */
      /*
      for(let i = 0; i < response.data.locations.length; i++) {
        if (response.data.locations[i]['em_roles_id'] !== null) {
          this.viewData.locations.push(response.data.locations[i]);
        }

        if (response.data.locations[i]['training_requirement_name']) {
          for (let j = 0; j < response.data.locations[i]['training_requirement_name'].length; j++) {
            if (this.seenRequiredTrainings.indexOf(response.data.locations[i]['training_requirement_name'][i]) === -1) {
              this.seenRequiredTrainings.push(response.data.locations[i]['training_requirement_name'][i]);
            }
          }
        }
      }
      */
     let temp = [];
        for (let loc of response.data.locations) {
            if (temp.indexOf(loc['location_id']) == -1) {
                this.viewData.locations.push(loc);
                temp.push(loc['location_id']);
            }
        }
        temp = [];
        this.viewData.role_texts = [];
        for (let loc of response.data.locations) {
            if (temp.indexOf(loc['role_id']) == -1) {
                this.viewData.role_texts.push(loc['role_name']);
                temp.push(loc['role_id']);
            }
        }




      // console.log(this.seenRequiredTrainings);
			for(let x in this.viewData.certificates){
				this.viewData.certificates[x]['expiry_date_formatted'] = moment( this.viewData.certificates[x]['expiry_date'] ).format('DD/MM/YYYY');
			}

			this.toEditLocations = JSON.parse( JSON.stringify(response.data.locations) );


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

  ngOnInit() {
    this.paramSub = this.route.params.subscribe((params) => {
      this.encryptedID = params['encrypted'];
      this.decryptedID = this.encryptDecrypt.decrypt(params['encrypted']);
      this.loadProfile();
    });

    this.viewData.role_text = this.userData['roles'].join(", ");

    this.adminService.getAllLocationsOnAccount(this.userData['accountId']).subscribe((response:any) => {
        this.buildings = response.data.buildings;
        this.levels = response.data.levels;
    });
  }

	ngAfterViewInit(){

		$('.modal').modal({
			dismissible: false
		});

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
		}, 1000);

    this.selectActionEvent();
    this.onKeyUpSearchModalLocationEvent();
    $('.trainings-navigation .active').removeClass('active');
    $('.trainings-navigation .team-training').addClass('active');

    $('.workspace.container').css('padding', '0%');

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
      let option = selectLocation.find('option:selected'),
                index = option.attr('index'),
                selectedLoc =  <any> this.viewData.locations[index];

      if(selectedLoc){
                this.viewData.role_text = selectedLoc.role_name;

                setTimeout(() => {
                    Materialize.updateTextFields();
                }, 100);
            }

      setTimeout(() => {
        Materialize.updateTextFields();
      }, 100);

    });
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
    			this.toEditLocations = JSON.parse( JSON.stringify(this.viewData.locations) );
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

    assignNewClickEvent(){
    	this.toEditLocations.push({
    		location_id : 0,
    		location_role_id : 0,
    		em_roles_id : 0
    	});
    }

    removeAssigned(index){
      this.toEditLocations[index]['deleted'] = true;
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

        if (parseInt(this.selectedLocationData['role_id'], 10) === 1 ||
            parseInt(this.selectedLocationData['role_id'], 10) === 11 ||
            parseInt(this.selectedLocationData['role_id'], 10) === 15 ||
            parseInt(this.selectedLocationData['role_id'], 10) === 16 ||
            parseInt(this.selectedLocationData['role_id'], 10) === 18
           ) {
          for (let loc of this.locations) {
            if (count <= maxDisplay) {
                let $li = $(`
                    <li class="list-division" id="${loc.location_id}">
                        <div class="name-radio-plus">
                            <div class="input">
                                <input required type="radio" name="selectLocation" value="${loc.location_id}" id="check-${loc.location_id}">
                                <label for="check-${loc.location_id}">${loc.name}</label>
                                <span hidden class="parent-id">${loc.parent_id}</span>
                            </div>
                        </div>
                    </li>`);

                ulModal.append($li);
                count++;
            }
          }
        } else {
          for (const loc of this.locations) {
            if (count <= maxDisplay) {
              const $lh = $(`<lh lh-id="${loc['parent_location_id']}"><h6>${loc['parent_location_name']}</h6></lh>`);
              ulModal.append($lh);
              if ('sublocations' in loc) {
                for (const subloc of loc.sublocations) {
                  const $li = $(`
                      <li class="list-division" id="${subloc.id}">
                          <div class="name-radio-plus">
                              <div class="input">
                                  <input required type="radio"
                                  name="selectLocation"
                                  value="${subloc.id}" id="check-${subloc.id}" lh-target="${loc['parent_location_id']}">
                                  <label for="check-${subloc.id}">${subloc.name}</label>
                                  <span hidden class="parent-id">${loc.parent_location_id}</span>
                              </div>
                          </div>
                      </li>`);
                  ulModal.append($li);
                }
              }
              count++;
            }
          }
        }
    }

    onChangeSelectRole(location, roleId){
        this.selectedLocationData = location;

        let rolesForBuildingsOnly = [1,11,15,16,18];

        if( rolesForBuildingsOnly.indexOf( parseInt(roleId) ) > -1 ){
            this.locations = this.buildings;
        }else{
            this.locations = this.levels;
        }

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

    clickSelectLocation(loc){
      this.selectedLocationData = loc;

      this.onChangeSelectRole(loc, loc.role_id);
      this.buildLocationsListInModal();
      this.showSelectLocation = true;
        $('#modalAssignLocations').scrollTop(0);
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
            parentId = radio.parent().find('span.parent-id').text();

            if(lhTarget){
                let parentName = $('lh[lh-id="'+lhTarget+'"]').text();
                locationName = parentName + ', '+locationName;
                parentId = lhTarget;
            }

            this.selectedLocationData['location_id'] = selectedLocationId;
            this.selectedLocationData['parent_id'] = parentId;
            this.selectedLocationData['name'] = locationName;

            console.log(this.selectedLocationData);
            console.log(this.toEditLocations);
            this.cancelLocationModal();
        }
    }

    cancelLocationModal(){
      this.showSelectLocation = false;
      this.modalSearchLocation.nativeElement.value = "";
    }

    onKeyUpSearchModalLocationEvent(){
        this.searchModalLocationSubs = Observable.fromEvent(this.modalSearchLocation.nativeElement, 'keyup')
            .debounceTime(500)
            .subscribe((event) => {

            let value = event['target'].value,
                result = [];
            let seenSubLocIndex = [];
            const seenIndex = [];
            let findRelatedName;
            this.formLocValid = false;

            if (parseInt(this.selectedLocationData['role_id'], 10) === 1 ||
                parseInt(this.selectedLocationData['role_id'], 10) === 11 ||
                parseInt(this.selectedLocationData['role_id'], 10) === 15 ||
                parseInt(this.selectedLocationData['role_id'], 10) === 16 ||
                parseInt(this.selectedLocationData['role_id'], 10) === 18
            ) {
              findRelatedName = (data, mainParent?) => {
                for(let i in data){
                    if(data[i]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1){
                        result.push(data[i]);
                    }
                }
                return result;
              };
            } else {
              findRelatedName = (data, mainParent?) => {
                for ( let i = 0; i < data.length; i++) {
                  if (data[i]['parent_location_name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                    result.push(data[i]);
                  }
                }
                for ( let i = 0; i < data.length; i++) {
                    seenSubLocIndex = [];
                    for (let s = 0; s < data[i]['sublocations'].length; s++) {
                      if (data[i]['sublocations'][s]['name'].toLowerCase().indexOf(value.toLowerCase()) > -1) {
                        if (seenIndex.indexOf(i)) {
                          seenIndex.push(i);
                        }
                        seenSubLocIndex.push(data[i]['sublocations'][s]);
                        data[i]['sublocations'] = seenSubLocIndex;
                      }
                    }
                  }
                  for (let si = 0; si < seenIndex.length; si++) {
                    result.push(data[seenIndex[si]]);
                  }
                return result;
              };
            }

            if(value.length > 0){
                result = [];
                findRelatedName( JSON.parse(JSON.stringify(this.locationsCopy)) );
                this.locations = result;
            }else{
                this.locations = JSON.parse(JSON.stringify(this.locationsCopy));
            }
            this.buildLocationsListInModal();
        });
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

            $('#modalAssignLocations button').attr('disabled', true);
            $('#modalAssignLocations input').attr('disabled', true);
            $('#modalAssignLocations a').attr('disabled', true);

            this.userService.userLocationRoleAssignments({
                user_id : this.decryptedID, assignments : JSON.stringify(this.toEditLocations)
            }, (response) => {

                $('#modalAssignLocations button').attr('disabled', false);
                $('#modalAssignLocations input').attr('disabled', false);
                $('#modalAssignLocations a').attr('disabled', false);

                if(response.status){
                    this.loadProfile(function(){
                      $('#modalAssignLocations').modal('close');
                    });
                }

            });
        }
    }

    // todo
    submitAssignLocation(f: NgForm) {

    }

    ngOnDestroy(){
      this.paramSub.unsubscribe();
        $('.workspace.container').css('padding', '');
    }

    emailThisCertificate(userId=0, certId=0) {
      this.userService.emailCertificate(userId, certId).subscribe(() => {
        alert('Certificate sent successfully!');
      },
      (e) => {
        alert('There was a problem sending certificate.');
      });
    }

    formatDate(dt: string): string {
      return moment(dt).format('DD/MM/YYYY')
    }

    public loadTrainingCourse(course: object = {}) {
      this.toggle = true;
      user_course_relation = course['course_user_relation_id'] || 0;
      this.selectedCourse = course;
      this.selectedCourse['formatted_launcher_url'] =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.baseUrl + '/' + this.selectedCourse['course_launcher']);
      this.complianceService.initializeLRS(user_course_relation).subscribe((data) => {
        setTimeout(() => {
        console.log(this.selectedCourse);
          $('.modal').modal({
            dismissible : false,
            startingTop : '0%',
            endingTop: '5%'
          });
          $('#training').modal('open');
        }, 600);
      }, (error) => {
          alert('There was an error loading course. Try again later');
      });
    }

    public onCloseCourseModule(course: object = {}) {
      this.courseService.logOutTrainingCourse(user_course_relation).subscribe((res) => {
        if (res.lesson_status == 'completed' || res.lesson_status == 'passed') {
          this.complianceService.getAllRegisteredCourses().subscribe((data) => {
            console.log(data);
            if (data['courses'].length > 0) {
              this.courses = data['courses'];
              console.log('At onCloseCourseModule', this.courses);
            }
          }, (error) => {
            console.log('At onCloseCourseModule', error);
            this.courses = [];
          });
        }
      });
    }
}
