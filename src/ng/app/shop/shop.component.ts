import { Component, OnInit, OnDestroy, AfterViewInit, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router, NavigationStart, NavigationEnd, ActivatedRoute} from '@angular/router';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';
import { LocationsService } from '../services/locations';
import { AccountsDataProviderService } from '../services/accounts';
import { EncryptDecryptService } from '../services/encrypt.decrypt';
import { ProductService  } from '../services/products.service';
import { Observable, ReplaySubject, BehaviorSubject, Subscription } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { MessageService } from '../services/messaging.service';
import { DashboardPreloaderService } from '../services/dashboard.preloader';

declare var $: any;

@Component({
	selector : 'app-shop-component',
	templateUrl : './shop.component.html',
	styleUrls : [ './shop.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService, ProductService, DashboardPreloaderService, AccountsDataProviderService]
})
export class ShopComponent implements OnInit, OnDestroy{

	packages = <any>[];
	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;
	routesubs;

	locations = <any>[];

	userData = {};

	favorites = <any>[];

	accounts = <any>[];

	constructor(
		private router : Router,
		private route: ActivatedRoute,
		private authService : AuthService,
		private userService: UserService,
		private locationService: LocationsService,
        private signupServices: SignupService,
        private productService: ProductService,
        private encryptDecrypt : EncryptDecryptService,
        private preloaderService: DashboardPreloaderService,
        private messageService : MessageService,
        private accountService : AccountsDataProviderService
		){

		this.userData = this.authService.getUserData();

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

		this.productService.getFavorites(this.userData['userId'], (response) => {
			this.favorites = response.data;
			this.messageService.sendMessage({
				'favorites' : this.favorites
			});
		});

		this.productService.getPackagesAndProducts((response) => {
			this.packages = response.data;
			this.messageService.sendMessage({
				'packages' : this.packages
			});
		});

		this.locationService.getParentLocationsForListing(this.userData['accountId'], (response) => {
			this.locations = response.locations;
			this.messageService.sendMessage({
				'locations' : this.locations
			});
			this.preloaderService.hide();
		});

		this.accountService.getRelatedAccounts(this.userData['accountId'], (responseAccounts) => {
			this.accounts = responseAccounts.data;
			this.messageService.sendMessage({
				'accounts' : this.accounts
			});
		});

		this.routesubs = this.router.events.subscribe((e) => {
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
				this.addToCart({
					'product_id' : res.productId,
					'quantity' : (res.qty) ? parseInt(res.qty) : 1,
					'location_id' : res.locationId,
					'account_id' : (res.accountId) ? res.accountId : 0,
					'add_on_items' : (res.addOns) ?  res.addOns : []
				}, () => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.updateCart){
				this.updateCart({
					'product_id' : res.productId,
					'quantity' : (res.qty) ? parseInt(res.qty) : 1,
					'account_id' : (res.accountId) ? res.accountId : 0,
					'location_id' : res.locationId
				}, () => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.removeFromCart){
				this.removeFromCart(res.productId, () => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.getData){
				this.messageService.sendMessage({
					'cart' : this.cart, 'products' : this.allProducts, 'packages' : this.packages, 
					'locations' : this.locations, 'favorites' : this.favorites, 'accounts' : this.accounts
				});
			}

			if(res.addToFavorites){
				this.addToFavorites({
					'product_id' : res.productId,
					'quantity' : (res.quantity) ? res.quantity : 1,
					'location_id' : (res.locationId) ? res.locationId : 0,
					'account_id' : (res.accountId) ? res.accountId : 0,
					'user_id' : this.userData['userId'],
					'add_on_items' : (res.addOns) ?  res.addOns : []
				}, () => {
					this.messageService.sendMessage({
						'favorites' : this.favorites
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.removeFavorite){
				this.removeFromFavorites({
					'product_id' : res.productId,
					'user_id' : this.userData['userId']
				}, () => {
					this.messageService.sendMessage({
						'favorites' : this.favorites
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.updateFavorite){
				this.updateFavorite({
					'product_id' : res.productId,
					'quantity' : (res.quantity) ? res.quantity : 1,
					'location_id' : (res.locationId) ? res.locationId : 0,
					'account_id' : (res.accountId) ? res.accountId : 0,
					'user_id' : this.userData['userId']
				}, () => {
					this.messageService.sendMessage({
						'favorites' : this.favorites
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.removeDiagramsFromCart){
				this.removeDiagramsFromCart(() => {
					this.messageService.sendMessage({
						'cart' : this.cart
					});

					if(res.callBack){ res.callBack(); }
				});
			}

			if(res.removeDiagramsInFavorites){
				this.removeDiagramsInFavorites(() => {
					this.messageService.sendMessage({
						'favorites' : this.favorites
					});

					if(res.callBack){ res.callBack(); }
				});
			}

		});
	}

	ngOnInit(){
	}

	ngAfterViewInit(){
		this.preloaderService.show();
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

	addToCart(data, callBack){
		this.productService.addToCart(data, (response) => {
			this.cart = response.cart;
			this.makeCartAsArray();

			callBack();
		});
	}

	updateCart(data, callBack){
		this.productService.updateCart(data, (response) => {
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

	removeDiagramsFromCart(callBack){
		this.productService.removeDiagramsFromCart((response) => {
			this.cart = response.cart;
			this.makeCartAsArray();

			callBack();
		});
	}

	addToFavorites(data, callBack){
		this.productService.addToFavorites(data, (response) => {
			this.favorites = response.data;
			callBack();
		});
	}

	removeFromFavorites(data, callBack){
		this.productService.removeFavorite(data, (response) => {
			this.favorites = response.data;
			callBack();
		});
	}

	removeDiagramsInFavorites(callBack){
		this.productService.removeDiagramsInFavorites((response) => {
			this.favorites = response.data;
			callBack();
		});
	}

	updateFavorite(data, callBack){
		this.productService.updateFavorite(data, (response) => {
			this.favorites = response.data;
			callBack();
		});
	}

	ngOnDestroy(){
		this.subs.unsubscribe();
		this.routesubs.unsubscribe();
	}

} 