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

	locations = <any>[];

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
	    	}

	    	if(message.products){
	    		this.allProducts = message.products;
	    	}

	    	if(message.locations){
	    		this.locations = message.locations;
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

	addQuantity(cart){
		let allow = false;
		if(cart.item.product_type == 'diagram'){
			allow = true;
		} 

		if(allow){
			this.messageService.sendMessage({
				'updateCart' : true, 'productId' : cart.item.product_id, 'qty' : parseInt(cart.qty) + 1, 'locationId' : cart.item.location_id, 'accountId' : cart.item.account_id
			});

			this.quantityInput.nativeElement.value = parseInt(cart.qty) + 1;
		}

	}

	subtractQuantity(cart){
		let allow = false;
		if(cart.item.product_type == 'diagram' ){
			allow = true;
		}

		if(allow){

			this.messageService.sendMessage({
				'updateCart' : true, 'productId' : cart.item.product_id, 'qty' : parseInt(cart.qty) - 1, 'locationId' : cart.item.location_id, 'accountId' : cart.item.account_id
			});

			this.quantityInput.nativeElement.value = parseInt(cart.qty) - 1;
		}
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
			'removeFromCart' : true, 'productId' : prodId
		});
	}

	checkDiagramItems(){
		let response = true,
			hasDiagram = false,
			diagramQty = 0;
		for(let cart of this.arrayCart){
			if(cart.item.product_type == 'diagram'){
				hasDiagram = true;
				diagramQty += diagramQty + cart.qty
			}
		}

		if(diagramQty < 5 && hasDiagram == true){
			response = false;
		}

		return response;
	}

	goToPayment(){
		if(this.arrayCart.length > 0){
			if(this.checkDiagramItems()){
				this.router.navigate(["/shop/payment"]);
			}else{
				$('#diagramErrorMessage').show();
			}
		}
	}

	getLocationName(locationId){
		for(let i in this.locations){
			if(this.locations[i]['location_id'] == locationId){
				return this.locations[i]['name'];
			}
		}
	}

} 