import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { Observable, Subscription } from 'rxjs/Rx';
import { LocationsService } from '../../services/locations';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ProductService  } from '../../services/products.service';
import { MessageService } from '../../services/messaging.service';

declare var $: any;

@Component({
	selector : 'app-compliance-package-component',
	templateUrl : './compliance.package.component.html',
	styleUrls : [ './compliance.package.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService]
})
export class CompliancePackageComponent implements OnInit, OnDestroy{

	selectLocation = 0;

	packages = [];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];
	subs;

	locations = <any>[];

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private productService: ProductService,
        private encryptDecrypt : EncryptDecryptService,
        private messageService : MessageService
		){

		this.subs = this.messageService.getMessage().subscribe((message) => {
			if(message.cart){
	    		this.cart = message.cart;
	    	}

	    	if(message.packages){
	    		this.packages = message.packages;
	    	}

	    	if(message.locations){
	    		this.locations = message.locations;
	    	}
	    });


	}

	ngOnInit(){
		this.messageService.sendMessage({ 'getData' : true });
	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '0px');
		$('.package-container').css({
			'width' : '96%',
			'margin' : '0 auto',
			'padding-top' : '3%'
		});
	}

	isInCart(prodId){
		let response = false;
		for(let i in this.cart.items){
			if( this.cart.items[i] !== null ){
				if(this.cart.items[i]['item'].product_id == prodId){
					response = true;
				}
			}
		}
		return response;
	}

	addToCart(prodId){
		if(this.selectLocation > 0){
			this.messageService.sendMessage({
				'addToCart' : true, 'productId' : prodId, 'qty' : 1, 'locationId' : this.selectLocation
			});
		}
	}

	removeFromCart(prodId){
		this.messageService.sendMessage({
			'removeFromCart' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
	}

} 