import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';
import { LocationsService } from '../services/locations';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { ProductService  } from '../services/products.service';
import { Observable, ReplaySubject, BehaviorSubject, Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { MessageService } from '../services/messaging.service';

declare var $: any;

@Component({
	selector : 'app-shop-component',
	templateUrl : './shop.component.html',
	styleUrls : [ './shop.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService]
})
export class ShopComponent implements OnInit, OnDestroy{

	wishList = [];

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
        private productService: ProductService,
        private encryptDecrypt : EncryptDecryptService,
        private messageService : MessageService
		){

		this.productService.getAll((response) => {
			this.allProducts = response.data;
			this.messageService.sendMessage({
				'products' : this.allProducts
			});
		});

		this.productService.getCart((response) => {
			this.cart = response.data;
			this.makeCartAsArray();
			this.messageService.sendMessage({
				'cart' : this.cart
			});
		});

		this.router.events.subscribe((e) => {
			if(e instanceof NavigationEnd){
				$('.shop-navigation .active').removeClass('active');
				switch (e.url) {
					case "/shop/compliance-package":
						$('.compliance-package').addClass('active');

						break;

					case "/shop/trainings-package":
						$('.trainings-package').addClass('active');

						break;

					case "/shop/evacuation-diagram-package":
						$('.evacuation-diagrams-package').addClass('active');
						break;
				}
			}
		});

		this.subs = this.messageService.getMessage().subscribe(res => {
			if(res.addToCart){
				this.addToCart(res.addToCart, () => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});
				});
			}

			if(res.removeFromCart){
				this.removeFromCart(res.removeFromCart, () => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});
				});
			}

			if(res.getData){
				this.messageService.sendMessage({
					'cart' : this.cart, 'products' : this.allProducts
				});
			}
		});
	}

	ngOnInit(){
	}

	ngAfterViewInit(){
	}

	makeCartAsArray(){
		this.arrayCart = [];
		for(let i in this.cart.items){
			if( this.cart.items[i] !== null ){
				this.arrayCart.push(this.cart.items[i]);
			}
		}
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

	addToCart(prodId, callBack){
		this.productService.addToCart(prodId, (response) => {
			this.cart = response.cart;
			this.makeCartAsArray();

			callBack();
		});
	}

	removeFromCart(prodId, callBack){
		this.productService.removeFromCart(prodId, (response) => {
			this.cart = response.cart;
			this.makeCartAsArray();

			callBack();
		});
	}

	ngOnDestroy(){
		
	}

} 