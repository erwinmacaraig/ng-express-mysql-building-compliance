import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../../services/users';
import { AuthService } from '../../services/auth.service';
import { SignupService } from '../../services/signup.service';
import { Observable } from 'rxjs/Rx';
import { LocationsService } from '../../services/locations';
import { ProductService  } from '../../services/products.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';

declare var $: any;

@Component({
	selector : 'app-example-component',
	templateUrl : './example.component.html',
	styleUrls : [ './example.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService]
})
export class ExampleComponent implements OnInit, OnDestroy{

	allProducts = <any>[];
	cart = {
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
		private productService: ProductService,
        private signupServices: SignupService,
        private encryptDecrypt : EncryptDecryptService
		){
	}

	ngOnInit(){
		this.productService.getAll((response) => {
			this.allProducts = response.data;
		});

		this.productService.getCart((response) => {
			this.cart = response.data;
			this.makeCartAsArray();
		});
	}

	ngAfterViewInit(){
		window['removeAllCart'] = () => {
			this.productService.removeAllFromCart((response) => {
				this.cart = response.cart;
				this.makeCartAsArray();
			});
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
		this.productService.addToCart(prodId, (response) => {
			this.cart = response.cart;
			this.makeCartAsArray();
		});
	}

	removeFromCart(prodId){
		this.productService.removeFromCart(prodId, (response) => {
			this.cart = response.cart;
			this.makeCartAsArray();
		});
	}

	submitCheckout(btnSubmit, form, event){
		event.preventDefault();
		if(this.arrayCart.length > 0){
			form.submit();
		}
	}

	ngOnDestroy(){
		
	}

} 