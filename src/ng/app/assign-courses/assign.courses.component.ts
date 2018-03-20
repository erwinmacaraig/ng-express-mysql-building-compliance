import { Component, OnInit, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationEnd  } from '@angular/router';
import { CourseService } from '../services/course';
import { AccountsDataProviderService } from '../services/accounts';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs/Rx';


declare var $: any;

@Component({
  selector: 'app-assign-courses-component',
  templateUrl: './assign.courses.component.html',
  styleUrls: ['./assign.courses.component.css'],
  providers: [CourseService, AccountsDataProviderService, UserService, AuthService]
})
export class AssignCoursesComponent implements OnInit {

	accounts = [];
	courses = [];
	trainingRequirements = [];
	courseUserRelation = [];
	usersShowing = <any> {};

	paginatedAccounts = <any> {};
	currentPage = [];

	fetchingUsers = <any>{};

	currentPageSelected = 1;

	mutationOversable = <any>{};

	allFormsContainer = {};

	isAuth = undefined;

	userData = {
		userId : 0
	};

	checkingAuth = true;

	constructor(
		private courseService : CourseService,
		private accountService : AccountsDataProviderService,
		private userService : UserService,
		private elemRef : ElementRef,
		private router : Router,
		private authService : AuthService
	) {
		this.userData = this.authService.getUserData();

		this.accountService.getAll((response) => {
			this.accounts = response.data;
			this.paginatedAccounts = this.turnDataToPagination(this.accounts, 10);

			console.log( this.paginatedAccounts );

			setTimeout(() => {
				this.pageChange(1);
			},300);
		});

		this.courseService.getCourses((response) => {
			this.courses = response.data;
		});

		this.courseService.getTrainingRequirements((response) => {
			this.trainingRequirements = response.data;
		});

		this.courseService.getCourseUserRelation((response) => {
			this.courseUserRelation = response.data;
		});

		if(this.isAuth === undefined){
			this.userService.checkUserIsAdmin(this.userData.userId, (response) => {
				this.isAuth = true;
				if(response.status === false){
					this.router.navigate(['/login']);
				}else{
					this.checkingAuth = false;
				}
			});
		}

	}

	turnDataToPagination(data, dataPerPage:number){
		let total = data.length,
			divided = Math.floor(total / dataPerPage),
			returnData = {},
			arrayNumbers = [];

		let counter = 0,
			indexNumb = 1,
			lastIndex = 0,
			dataContainer = [];

		for(let i in data){
			let iParsed = parseInt(i);
			counter++;

			dataContainer.push(data[i]);

			if(counter >= dataPerPage){
				returnData[indexNumb] = dataContainer;
				counter = 0;
				dataContainer = [];
				indexNumb++;
			}

			if( total == (iParsed + 1) ){
				returnData[ divided + 1 ] = dataContainer;
			}
			
		}

		for(let i in returnData){
			arrayNumbers.push({
				number : i
			});
		}

		return {
			'arrayNumbers' : arrayNumbers,
			'paginated' : returnData,
			'totalPage' : (divided + 1)
		};
	}

	ngOnInit() {
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

	pageChange(type){
		switch (type) {
			case "back":

				if(this.currentPageSelected > 1){
					this.currentPageSelected = this.currentPageSelected - 1;
				}else if(this.currentPageSelected == 1){
					this.currentPageSelected = this.paginatedAccounts.totalPage;
				}

				break;

			case "forward":
				
				if(this.currentPageSelected == this.paginatedAccounts.totalPage){
					this.currentPageSelected = 1;
				}else if(this.currentPageSelected < this.paginatedAccounts.totalPage){
					this.currentPageSelected = this.currentPageSelected + 1;
				}

				break;
			
			default:

				this.currentPageSelected = type;
				break;
		}


		this.currentPage = this.paginatedAccounts.paginated[ this.currentPageSelected ];
		this.fetchingUsers = <any>{};

		for(let i in this.currentPage){
			let acc = this.currentPage[i];
			this.fetchingUsers[ acc.account_id ] = true;
			this.usersShowing[ acc.account_id ] = [];

			this.allFormsContainer[ acc.account_id ] = {
				'account_id' : acc.account_id,
				'training_requirement_id' : 0,
				'course_id' : 0,
				'user_ids' : [],
			};

			this.userService.getUsersByAccountIdNoneAuth(acc.account_id, (accRes) =>{

				this.fetchingUsers[ acc.account_id ] = false;
				this.usersShowing[ acc.account_id ] = accRes.data;

			});

		}
	}

	ngAfterViewInit(){
		let getFormDataFromEvent = (event) => {
			let elem = event.currentTarget,
				container = $(elem).parents('.container-box'),
				accntId = container.attr('account-id');

			return this.allFormsContainer[ accntId ];
		};

		$('body').on('change.selecttraining', 'select[name="training_requirement_id"]', (event) => {
			let elem = $(event.currentTarget),
				values = getFormDataFromEvent(event);

			values.training_requirement_id = parseInt(elem.val());

			this.allFormsContainer[values.account_id] = values;

			console.log(this.allFormsContainer);
		});

		$('body').on('change.selectcourse', 'select[name="course_id"]', (event) => {
			let elem = $(event.currentTarget),
				values = getFormDataFromEvent(event);

			values.course_id = parseInt(elem.val());

			this.allFormsContainer[values.account_id] = values;

			console.log(this.allFormsContainer);
		});

		$('body').on('change.selectusers', 'select.select-users', (event) => {
			let elem = $(event.currentTarget),
				optionSelected = elem.find('option:selected'),
				values = getFormDataFromEvent(event);

			values.user_ids = [];

			let selected = [];
			optionSelected.each((index, elem) => {
				let val = $(elem).attr('value'),
					split = val.split(' ');

				selected.push(split[1]);
			});

			values.user_ids = selected;

			this.allFormsContainer[values.account_id] = values;

			console.log(this.allFormsContainer);
		});

		$('body').on('change.alluserselect', '.all-check', (event) => {
			let elem = event.currentTarget,
				container = $(elem).parents('.container-box'),
				accntId = container.attr('account-id');

			if(elem.checked){
				container.find('.select-users option').attr('selected', true);
			}else{
				container.find('.select-users option').attr('selected', false);
			}

			container.find('.select-users').material_select('destroy');

			container.find('.select-users').trigger('change.selectusers');
		});
	}

	submitAction(accntId, btn){
		let data = this.allFormsContainer[accntId],
			errs = 0;
		
		if(data.training_requirement_id == 0){
			errs++;
		}

		if(data.course_id == 0){
			errs++;
		}

		if(data.user_ids.length == 0){
			errs++;
		}

		if(errs == 0){
			btn.disabled = true;
			btn.innerHTML = 'Sending';

			this.courseService.saveAccountCourses(data, (response) => {
				btn.innerHTML = 'Success';
				setTimeout(() => {
					btn.innerHTML = 'Submit';
					btn.disabled = false;
				}, 1000);
			});
		}
	}

	disableAction(accntId, btn){
		let data = this.allFormsContainer[accntId],
			errs = 0;
		
		if(data.training_requirement_id == 0){
			errs++;
		}

		if(data.course_id == 0){
			errs++;
		}

		if(data.user_ids.length == 0){
			errs++;
		}

		console.log(data);

		if(errs == 0){
			btn.disabled = true;
			btn.innerHTML = 'Sending';

			this.courseService.disableUsersFromCourses(data, (response) => {
				btn.innerHTML = 'Success';
				setTimeout(() => {
					btn.innerHTML = 'Disable';
					btn.disabled = false;
				}, 1000);
			});
		}

		
	}

	ngOnDestroy(){
		$('body').off('change.selectcourse');
		$('body').off('change.selecttraining');
		$('body').off('change.selectusers');
		$('body').off('change.alluserselect');
		this.mutationOversable.disconnect();
		this.isAuth = false;
	}

}
