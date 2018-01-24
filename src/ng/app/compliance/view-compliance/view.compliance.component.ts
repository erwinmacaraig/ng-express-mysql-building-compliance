import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { DashboardPreloaderService } from '../../services/dashboard.preloader';
import { Observable } from 'rxjs/Rx';

declare var $: any;

@Component({
	selector : 'app-view-compliance',
	templateUrl : './view.compliance.component.html',
	styleUrls : [ './view.compliance.component.css' ],
    providers : [AuthService, UserService, SignupService, DashboardPreloaderService]
})
export class ViewComplianceComponent implements OnInit, OnDestroy{

	userData = {};

	diagramTitle = '';
	diagramDescription = '';
	diagramClass = 'green darken-1 epm-icon';

	previewTemplate = 1;

	selectedCompliance = '';

	timer = Observable.interval(10);
	subscribeTime;

	constructor(
		private router : Router,
		private authService : AuthService,
		private userService: UserService, 
        private signupServices: SignupService,
        private dashboard : DashboardPreloaderService
		){

		this.userData = this.authService.getUserData();
	}

	ngOnInit(){
		
	}

	ngAfterViewInit(){
		$('.workspace.container').css('position', 'relative');
		this.dashboard.show();

		setTimeout(() => {

			$('.row-diagram-details').css('left', ( $('.row-table-content').width() ) + 'px' );

			this.dashboard.hide();

			this.clickSelectComplianceFromList('epm');
		},500);
	}

	clickSelectComplianceFromList(compliance){
		this.selectedCompliance = compliance;
		let attr = compliance.toLowerCase().split(' ').join('_'),
			allTr = $("tr[compliance]"),
			tr = $("tr[compliance='"+attr+"']");

		allTr.removeClass('active');
		tr.addClass('active');

		if(attr == 'epm'){
			this.diagramTitle = 'Evacuation Procedures Manual';
			this.diagramDescription = 'The Emergency Procedures Manual provides specific procedures and guidelines for dealing with various types of emergency.';
			this.diagramClass = 'light-green epm-icon';

		}else if(attr == 'epc'){
			this.diagramTitle = 'Emergency Planning Committee';
			this.diagramDescription = 'The Emergency Planning Committee develops the emergency plan, emergency response procedures and takes an active role in forming the Emergency Control Organisation (ECO).';
			this.diagramClass = 'light-blue meeting-icon';

		}else if(attr == 'evacution_exercise'){
			this.diagramTitle = 'Evacuation Exercise';
			this.diagramDescription = 'A method of practicing how a building would be evacuated in the event of emergencies. AS3745 requires all facilities to participate in at least one evacuation exercise each year to test the emergency plan’s effectiveness.';
			this.diagramClass = 'teal evacuation-icon';

		}else if(attr == 'evac_diagram'){
			this.diagramTitle = 'Evacuation Diagrams';
			this.diagramDescription = 'Floor plan of a facility which helps occupants in locating nearest emergency evacuation path to assembly area.';
			this.diagramClass = 'light-blue lighten-2 diagram-icon';

		}else if(attr == 'chief_warden_training'){
			this.diagramTitle = 'Chief Warden Training';
			this.diagramDescription = 'This training covers skills and knowledge necessary to effectively perform the duties of a Chief Warden as per the requirements of AS3745.';
			this.diagramClass = 'orange training-icon';

		}else if(attr == 'warden_training'){
			this.diagramTitle = 'Warden Training';
			this.diagramDescription = 'AS3745 requires Wardens to complete required warden training on skills and knowledge specific to their duties.';
			this.diagramClass = 'teal accent-3 training-icon';

		}else if(attr == 'fire_safety_advisor'){
			this.diagramTitle = 'Fire Safety Advisor';
			this.diagramDescription = "A Fire Safety Advisor's main role is to render qualified advice to all tenants, managers, and building owners on all applicable aspects of emergency procedures.";
			this.diagramClass = 'indigo training-icon';

		}else if(attr == 'general_occupant_training'){
			this.diagramTitle = 'General Occupant Training';
			this.diagramDescription = "A person that resides in a building or facility. General occupants need to understand the nature of potential emergencies and what actions to take if emergencies do occur.";
			this.diagramClass = 'deep-purple training-icon';

		}else if(attr == 'warden_list'){
			this.diagramTitle = 'Warden List';
			this.diagramDescription = "Warden List should be regularly reviewed and assessed for any significant changes so that new measures to mitigate emergencies can be developed.";
			this.diagramClass = 'green training-icon';

		}

	}

	showDiagramDetails(){

		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '-'+( tableW )+'px' );
		$('.row-diagram-details').css('left', '0px' );
		setTimeout(() => { $('.row-diagram-details').show(); }, 200);

		/*if(this.subscribeTime){
			this.subscribeTime.unsubscribe();
		}
		this.subscribeTime = this.timer.subscribe((v) => {
			
			let tableLeft = $('.row-table-content').position().left,
				diagramLeft = $('.row-diagram-details').position().left;

			if( diagramLeft > 0 ){
				$('.row-table-content').css('left', (tableLeft - 500) + 'px' );
				$('.row-diagram-details').css('left', (diagramLeft - 500) + 'px' );
			}else{
				$('.row-diagram-details').show();
				this.subscribeTime.unsubscribe();
			}
		});*/
	}

	hideDiagramDetails(){
		let tableLeft = $('.row-table-content').position().left,
			tableW = $('.row-table-content').width(),
			diagramLeft = $('.row-diagram-details').position().left;

		$('.row-table-content').css('left', '0px' );
		$('.row-diagram-details').css('left', (tableW + diagramLeft) + 'px' );
		setTimeout(() => { $('.row-diagram-details').hide(); }, 400);
	}

	ngOnDestroy(){

	}

} 