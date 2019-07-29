import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { AccountsDataProviderService  } from '../../services/accounts';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { CourseService } from '../../services/course';
import { LocationsService } from '../../services/locations';
import * as Rx from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as moment from 'moment';
import { DatepickerOptions } from 'ng2-datepicker';
import { Subscription } from 'rxjs/Subscription';
import { ExportToCSV } from '../../services/export.to.csv';

declare var $: any;
@Component({
  selector: 'app-all-users',
  templateUrl: './all.users.component.html',
  styleUrls: ['./all.users.component.css'],
  providers: [UserService, AuthService, DashboardPreloaderService, EncryptDecryptService, CourseService, AccountsDataProviderService, LocationsService, ExportToCSV]
})
export class AllUsersComponent implements OnInit, OnDestroy {

	userData = <any> {};
    listData = [];
    adminTeamMembers = [];
	selectedToArchive = { name: '' };
	showModalLoader = false;
	copyOfList = [];
	selectedFromList = [];
    public total_records = 0;

	filters = [
        { value : 1, name : 'Building Manager' },
        { value : 2, name : 'Tenant Responsible' }        
    ];

	loadingTable = false;
    private paramSub:Rx.Subscription;
	pagination = {
		pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
	};
    multipleLocations = [];
	searchMemberInput;

    options: DatepickerOptions = {
        displayFormat: 'MMM D[,] YYYY',
        minDate: moment().toDate()
    };

    datepickerModel : Date;
    isShowDatepicker = false;
    datepickerModelFormatted = '';
    selectedPeep = {
        name: ''
    };

    selectedToInvite = [];

    emTrainings = [];

    allAreSelected = false;
    sendInviteToAll = false;
    sendInviteToAllNonCompliant = false;

    isOnlineTrainingAvailable = false;

    isFRP = false;
    locations = <any> [];
    locationPagination = {
        pages : 0, total : 0, currentPage : 0, prevPage : 0, selection : []
    };
    isAdministrationsShow = false;
    showArchived = false;
    subscriptionType = 'free';
    routeSub: Subscription;

	constructor(
		private userService : UserService,
		private authService : AuthService,
		private dashboardService : DashboardPreloaderService,
		private encDecrService : EncryptDecryptService,
		private router : Router,
        private courseService : CourseService,
        private accountService : AccountsDataProviderService,        
        private route : ActivatedRoute,
        private exportToCSV: ExportToCSV
		){
        this.userData = this.authService.getUserData();
        this.datepickerModel = moment().add(1, 'days').toDate();
        this.datepickerModelFormatted = moment(this.datepickerModel).format('MMM. DD, YYYY');
        this.isAdministrationsShow = true;
	}

	ngOnInit(){
        
        this.subscriptionType = this.userData['subscription']['subscriptionType'];
        if (this.userData['account_has_online_training'] == 1) {
            this.isOnlineTrainingAvailable = true;
        }
        this.routeSub = this.route.paramMap.subscribe((paramMap: ParamMap) => {
            this.showArchived = false;
            this.dashboardService.show();
            if (paramMap.has('archived')) {
                this.showArchived = true;
                this.listAdminUsers(this.showArchived);
                
            } else {
                this.listAdminUsers();
            }
            setTimeout(() => {
                $('.row.filter-container select').material_select();
            }, 100);

        });        
        
        
	}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
        });
        $('#modalMobility select').material_select();
        this.filterByEvent();
		this.locationChangeEvent();
		this.sortByEvent();
		this.bulkManageActionEvent();
        this.searchMemberEvent();
        
	}

    locationChangeEvent(){
        let __this = this;
        $('select.location').on('change', function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('select.location').val();
            __this.dashboardService.show();
            __this.listData = [];
            const choosen = [];
            if(parseInt(selected, 10) == 0) {
                __this.listData = __this.adminTeamMembers;
            } else {
                for (let warden of __this.adminTeamMembers) {
                    if (parseInt(warden['building_id'], 10) == parseInt(selected, 10)) {
                        __this.listData.push(warden);
                    }
                }
            }
            __this.dashboardService.hide();
         
        });
    }

	filterByEvent(){
        let __this = this;
		$('#filter-roles').change(function(e){
            e.preventDefault();
            e.stopPropagation();
            let selected = $('#filter-roles').val();
            console.log(selected);
            __this.listData = [];
            const choosen = [];
            
            if(parseInt(selected, 10) == 0) {
                __this.listData = __this.adminTeamMembers;
            } else {
                for (let warden of __this.adminTeamMembers) {                    
                    if (choosen.indexOf(warden['location_id']) == -1) {                       
                        if (warden['role_ids'].indexOf(parseInt(selected, 10)) !== -1) {
                            choosen.push(warden['location_id']);
                            __this.listData.push(warden);                            
                        }
                    }
                }
            }
        });
	}

	sortByEvent(){
		$('select.sort-by').on('change', () => {
			let selected = $('select.sort-by').val();
			
			if(selected == 'user-name-asc'){
				this.listData.sort((a, b) => {
					if(a.first_name < b.first_name) return -1;
				    if(a.first_name > b.first_name) return 1;
				    return 0;
				});
			}else if(selected == 'user-name-desc'){
				this.listData.sort((a, b) => {
					if(a.first_name > b.first_name) return -1;
				    if(a.first_name < b.first_name) return 1;
				    return 0;
				});
			}else{
				this.listData = this.copyOfList;
			}
		});
	}

	searchMemberEvent(){
        this.searchMemberInput = Rx.Observable.fromEvent(document.querySelector('#searchMemberInput'), 'input');
        this.searchMemberInput.debounceTime(800)
            .map(event => event.target.value)
            .subscribe((value) => {
                this.listData = [];
                const choosen = [];
                if (value.length == 0) {
                 this.listData = this.adminTeamMembers;   
                } else {
                    let searchKey = value.toLowerCase();
                    for (let user of this.adminTeamMembers) {
                        if (user['name'].toLowerCase().search(searchKey) !== -1) {
                            choosen.push(user['location_id']);
                            this.listData.push(user);
                        }
                        if (choosen.indexOf(user['location_id']) == -1) {
                            
                        }
                    }
                }
            });
	}

	ngOnDestroy(){
        this.routeSub.unsubscribe();
    }

	onSelectFromTable(event, list){
		let selected = event.target.value;
		if(selected == 'view'){
			this.router.navigate(["/teams/view-user/", list.id_encrypted]);
		}else if(selected == 'archive' || selected == 'restore'){
			event.target.value = "0";
			this.showModalLoader = false;
			this.selectedToArchive = list;
            event.target.value = 0;
			$('#modalArchive').modal('open');
		}else if(selected == 'peep'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobility').modal('open');
        }else if(selected == 'healthy'){
            this.selectedPeep = list;
            event.target.value = 0;
            $('#modalMobilityHealty').modal('open');
        }else if(selected == 'invite'){
            this.selectedToInvite = [];
            this.selectedToInvite.push(list);
            event.target.value = 0;
            $('#modalSendInvitation').modal('open');
        }
	}

	archiveClick(){
		this.showModalLoader = true;

        let cb = (response) => {
            this.showModalLoader = false;
            $('#modalArchive').modal('close');
            this.dashboardService.show();
            this.selectedToArchive = { name: ''};
            this.listAdminUsers();
        };

        if(!this.showArchived){
		    this.userService.archiveUsers([ this.selectedToArchive['user_id'] ], cb);
        }else{
            this.userService.unArchiveUsers([ this.selectedToArchive['user_id'] ], cb);
        }
	}

	selectAllCheckboxEvent(event){
		let checkboxes = $('table tbody input[type="checkbox"]');
		if(event.target.checked){
			checkboxes.prop('checked', true);
            this.allAreSelected = true;
		}else{
			checkboxes.prop('checked', false);
            this.allAreSelected = false;
            this.selectedFromList = [];
		}

		checkboxes.each((indx, elem) => {
			let id = $(elem).attr('id'),
				index = id.replace('location-', '');
			for(let i in this.listData){
				if(i == index){
					this.singleCheckboxChangeEvent(this.listData[i], { target : { checked : elem.checked } } );
				}
			}
		});
	}

	singleCheckboxChangeEvent(list, event){
		let copy = JSON.parse(JSON.stringify(this.selectedFromList));
		if(event.target.checked){
            list.isselected = true;
			this.selectedFromList.push(list);
		}else{
			let temp = [];
			for(let i in this.selectedFromList){
				if(this.selectedFromList[i]['user_id'] != list['user_id']){
					temp.push( this.selectedFromList[i] );
				}
			}
			this.selectedFromList = temp;
		}
		
	}

	bulkManageActionEvent(){
		$('select.bulk-manage').on('change', () => {
			let sel = $('select.bulk-manage').val();
			if(sel == 'archive'){
				if(this.selectedFromList.length > 0){
					$('#modalArchiveBulk').modal('open');
				}
			}else if(sel == 'invite-selected'){
                if(!this.allAreSelected){
                    this.selectedToInvite = [];
                    for(let user of this.selectedFromList){
                        this.selectedToInvite.push(user);
                    }
                    if(this.selectedToInvite.length > 0){
                        $('#modalSendInvitation').modal('open');
                    }
                }else{
                    this.sendInviteToAll = true;
                    $('#modalSendInvitation').modal('open');
                }
                
            }else if(sel == 'invite-all-non-compliant'){
                this.sendInviteToAllNonCompliant = true;
                $('#modalSendInvitation').modal('open');
            }else if(sel == 'invite-all'){
                this.sendInviteToAll = true;
                $('#modalSendInvitation').modal('open');
            }

            $('select.bulk-manage').val("0").material_select();

		});
	}

	bulkArchiveClick(){
		this.showModalLoader = true;
		let arrIds = [];

		for(let i in this.selectedFromList){
			arrIds.push(this.selectedFromList[i]['user_id']);
		}

        let cb = (response) => {
            $('#allLocations').prop('checked', false);
            this.showModalLoader = false;
            $('#modalArchiveBulk').modal('close');
            this.dashboardService.show();
            this.selectedFromList = [];
            this.listAdminUsers();
        };

        if(!this.showArchived){
		    this.userService.archiveUsers(arrIds, cb);
        }else{
            this.userService.unArchiveUsers(arrIds, cb);
        }

	}  
    clickMultipleLocation(locations){
        this.multipleLocations = locations;
        $('#modalSelectMultipleLocations').modal('open');
    }

    submitSelectFromMultipleLocations(form){
        if(form.valid){

            $('#modalSelectMultipleLocations').modal('close');
            for(let loc of this.multipleLocations){
                if(loc.location_id == form.value.location_id){
                    if(loc.sublocations_count > 0){
                        this.router.navigate(['/location/view/',  this.encDecrService.encrypt(loc.location_id) ]);
                    }else{
                        this.router.navigate(['/location/view-sublocation/',  this.encDecrService.encrypt(loc.location_id) ]);
                    }
                }
            }
        }
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

    showDatePicker(){
        this.isShowDatepicker = true;
    }

    modalPeepFormSubmit(f, event){
        event.preventDefault();

        if(f.valid){
            let paramData = JSON.parse(JSON.stringify(f.value));
            paramData['duration_date'] = moment(this.datepickerModel).format('YYYY-MM-DD');
            paramData['user_id'] = this.selectedPeep['user_id'];

            if(this.selectedPeep['mobility_impaired_details'] && this.selectedPeep['mobility_impaired_details'].length > 0){
                paramData['mobility_impaired_details_id'] = this.selectedPeep['mobility_impaired_details'][0]['mobility_impaired_details_id'];
            }
            paramData['is_permanent'] = ($('select[name="is_permanent"]').val() == null) ? 0 : $('select[name="is_permanent"]').val();

            this.showModalLoader = true;

            this.userService.sendMobilityImpaireInformation(paramData, (response) => {

                for(let user of this.listData){
                    if(user['user_id'] == this.selectedPeep['user_id']){
                        user['mobility_impaired'] = 1;
                        user['mobility_impaired_details'] = response.data;
                    }
                }

                f.reset();
                $('#modalMobility').modal('close');
                this.showModalLoader = false;

            });
        }
    }

    markUserAsHealthy(){
        this.showModalLoader = true;

        let paramData = {
            user_id : this.selectedPeep['user_id'],
            mobility_impaired : 0
        };
        this.userService.markAsHealthy(paramData, (response) => {

            for(let user of this.listData){
                if(user['user_id'] == this.selectedPeep['user_id']){
                    user['mobility_impaired'] = 0;
                    user['mobility_impaired_details'] = [];
                }
            }
  
            $('#modalMobilityHealty').modal('close');
            this.showModalLoader = false;

        });
    }

    clickCancelSendInvitation(){
        this.sendInviteToAllNonCompliant = false;
        this.sendInviteToAll = false;
    }

    clickSendInvitation(){
        let form = {
            all : false,
            non_compliant : false,
            ids : []
        };

        form.all = (this.allAreSelected) ? true : (this.sendInviteToAll) ? true : false;
        form.non_compliant = (this.sendInviteToAllNonCompliant) ? true : false;

        for(let user of this.selectedToInvite){
            form.ids.push(user.user_id);
        }

        this.showModalLoader = true;
        this.courseService.sendTrainingInvitation(form, (response) => {
            $('#modalSendInvitation').modal('close');
            this.showModalLoader = false;
        });
    }


    private listAdminUsers(archived:boolean = false) {
        this.dashboardService.show();
        this.accountService.generateAdminUserList(archived).subscribe((response) => {
            this.listData = [];
            this.adminTeamMembers = [];
            for (let user of response.account_users) {
                user['id_encrypted'] = this.encDecrService.encrypt(user['user_id']);
                user['enc_location_id'] = this.encDecrService.encrypt(user['location_id']);
                user['isselected'] = false;

                this.listData.push(user);
                this.adminTeamMembers.push(user);
            }
            this.total_records = this.adminTeamMembers.length;
            this.locations = response.buildings;
            setTimeout(() => {
                $('.row.filter-container select.location').material_select();
            },500);
            this.dashboardService.hide();
        }, (error) => {
            this.dashboardService.hide();
            console.log(error);
        });
    }

}