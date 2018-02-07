import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { Observable } from 'rxjs/Rx';
import { LocationsService } from '../../services/locations';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $: any;

@Component({
	selector : 'app-evacuation-diagram-package-component',
	templateUrl : './evacuation.diagram.package.component.html',
	styleUrls : [ './evacuation.diagram.package.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class EvacuationDiagramPackageComponent implements OnInit, OnDestroy{

	@ViewChild('quantityInput') quantityInput : ElementRef;

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private encryptDecrypt : EncryptDecryptService
		){
	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		$('select').material_select();
		$('.workspace.container').css('padding', '0px');
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
	}

	addQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		this.quantityInput.nativeElement.value = q + 1;
	}

	subtractQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		if(q > 5){
			this.quantityInput.nativeElement.value = q - 1;
		}
	}

} 