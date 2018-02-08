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
import { ComplianceService } from '../../services/compliance.service';
import { MessageService } from '../../services/messaging.service';

declare var $: any;

@Component({
	selector : 'app-cart-component',
	templateUrl : './cart.component.html',
	styleUrls : [ './cart.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class CartComponent implements OnInit, OnDestroy{

	@ViewChild('quantityInput') quantityInput : ElementRef;

	complianceProducts = <any>[];

	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private encryptDecrypt : EncryptDecryptService,
        private messageService : MessageService
		){


		this.subs = this.messageService.getMessage().subscribe((message) => {
	    	if(message.cart){
	    		this.cart = message.cart;
	    		this.makeCartAsArray();
	    	}else if(message.products){
	    		this.allProducts = message.products;
	    	}
	    });
	}

	ngOnInit(){
		this.messageService.sendMessage({
			'getData' : true
		});
	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '0px');
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
	}

	updateTotalPrice(){
		this.cart.totalPrice = 0;
		for(let i in this.cart.items ){
			let item = this.cart.items[i];
			this.cart.totalPrice = this.cart.totalPrice + (item.price * item.qty);
		}

		this.cart.totalPrice = this.cart.totalPrice.toFixed(2);
	}

	addQuantity(cart){
		let q = parseInt(this.quantityInput.nativeElement.value);
		this.quantityInput.nativeElement.value = q + 1;
		cart.qty = this.quantityInput.nativeElement.value;
		this.updateTotalPrice();
	}

	subtractQuantity(cart){
		let q = parseInt(this.quantityInput.nativeElement.value);
		if(q > 0){
			this.quantityInput.nativeElement.value = q - 1;
			cart.qty = this.quantityInput.nativeElement.value;
		}
		this.updateTotalPrice();
	}

	makeCartAsArray(){
		this.arrayCart = [];
		for(let i in this.cart.items){
			if( this.cart.items[i] !== null ){
				this.arrayCart.push(this.cart.items[i]);
			}
		}
	}

	removeFromCart(prodId){
		this.messageService.sendMessage({
			'removeFromCart' : prodId
		});
	}

} 