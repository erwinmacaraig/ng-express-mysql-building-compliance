import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, ElementRef, ViewChild } from '@angular/core';
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
	selector : 'app-product-favorites-component',
	templateUrl : './product.favorites.component.html',
	styleUrls : [ './product.favorites.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class ProductsFavoritesComponent implements OnInit, OnDestroy{

	@ViewChild('quantityInput') quantityInput : ElementRef;

	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;

	locations = <any>[];

	favorites = <any>[];

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private messageService : MessageService,
        private encryptDecrypt : EncryptDecryptService
		){

		this.subs = this.messageService.getMessage().subscribe((message) => {
	    	if(message.cart){
	    		this.cart = message.cart;
	    	}

	    	if(message.products){
	    		this.allProducts = message.products;
	    	}

	    	if(message.locations){
	    		this.locations = message.locations;
	    	}

	    	if(message.favorites){
	    		this.favorites = message.favorites;
	    	}
	    });

	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		this.messageService.sendMessage({
			'getData' : true
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

	addToCart(product, btn){
		let prodId = product.product_id;
		
		btn.disabled = true;

		let cb = () => {
			btn.disabled = false;
		};

		this.messageService.sendMessage({
			'addToCart' : true, 'productId' : prodId, 'locationId' : product.location_id, 'qty' : parseInt(product.quantity), 
			'accountId' : product.account_id, 'callBack' : cb
		});
	}

	removeFromCart(prodId, btn){
		btn.disabled = true;

		let cb = () => {
			btn.disabled = false;
		};

		this.messageService.sendMessage({
			'removeFromCart' : true, 'productId' : prodId, 'callBack' : cb
		});
	}

	removeFavorite(prodId, btn){
		btn.disabled = true;

		let cb = () => {
			btn.disabled = false;
		};

		this.messageService.sendMessage({
			'removeFavorite' : true, 'productId' : prodId, 'callBack' : cb
		});
	}

	addQuantity(product, btn){

		if(product.product_type != 'package'){
			btn.disabled = true;

			let cb = () => {
				btn.disabled = false;
			};

			if(this.isInCart(product.product_id)){
				this.messageService.sendMessage({
					'updateCart' :  true, 'productId' : product.product_id, 'qty' : parseInt(product.quantity) + 1, 
					'locationId' : product.location_id, 'accountId' : product.account_id, 'callBack' : cb
				});
			}


			this.messageService.sendMessage({
				'updateFavorite' :  true, 'productId' : product.product_id, 'quantity' : parseInt(product.quantity) + 1, 
				'locationId' : product.location_id, 'accountId' : product.account_id, 'callBack' : cb
			});

			this.quantityInput.nativeElement.value = parseInt(product.quantity) + 1;
		}
	}

	subtractQuantity(product, btn){
		if(product.quantity > 0 && product.product_type != 'package'){
			btn.disabled = true;

			let cb = () => {
				btn.disabled = false;
			};

			if(this.isInCart(product.product_id)){
				this.messageService.sendMessage({
					'updateCart' :  true, 'productId' : product.product_id, 'qty' : parseInt(product.quantity) - 1, 
					'locationId' : product.location_id, 'accountId' : product.account_id, 'callBack' : cb
				});
			}

			this.messageService.sendMessage({
				'updateFavorite' : true, 'productId' : product.product_id, 'quantity' : parseInt(product.quantity) - 1, 
				'locationId' : product.location_id, 'accountId' : product.account_id, 'callBack' : cb
			});

			this.quantityInput.nativeElement.value = parseInt(product.quantity) - 1;
		}
	}

	getLocationName(locationId){
		for(let i in this.locations){
			if(this.locations[i]['location_id'] == locationId){
				return this.locations[i]['name'];
			}
		}
	}

	ngOnDestroy(){
		this.subs.unsubscribe();
	}

} 