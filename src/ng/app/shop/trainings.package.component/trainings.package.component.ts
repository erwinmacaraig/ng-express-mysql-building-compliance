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
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ComplianceService } from '../../services/compliance.service';
import { MessageService } from '../../services/messaging.service';

declare var $: any;

@Component({
	selector : 'app-trainings-package-component',
	templateUrl : './trainings.package.component.html',
	styleUrls : [ './trainings.package.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class TrainingsPackageComponent implements OnInit, OnDestroy{

	trainingsProducts = <any>[];

	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;

	locations = <any>[];

	favorites = <any>[];

	selectLocation = 0;

	userData = {};

	users = <any>[];

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

		this.userData = this.authService.getUserData();

		this.subs = this.messageService.getMessage().subscribe((message) => {
	    	if(message.cart){
	    		this.cart = message.cart;
	    	}

	    	if(message.products){
	    		this.allProducts = message.products;
	    		this.generateTrainingsProducts();
	    	}

	    	if(message.locations){
	    		this.locations = message.locations;
	    	}

	    	if(message.favorites){
	    		this.favorites = message.favorites;
	    	}
	    });

	    this.userService.getUsersByAccountId(this.userData['accountId'], (response) => {
	    	this.users = response.data;
	    });

	}

	ngOnInit(){

	}

	ngAfterViewInit(){
		$('.workspace.container').css('padding', '0px');
		$('.package-container').css({
			'width' : '96%',
			'margin' : '0 auto',
			'padding-top' : '3%'
		});

		this.messageService.sendMessage({
			'getData' : true
		});

		$('body').on('change', 'select[product-id]', (event) => {
			let currntElem = $(event.currentTarget),
				prodId = currntElem.attr('product-id');
			
			if(this.isInCart(prodId)){
				this.messageService.sendMessage({
					'updateCart' : true, 'productId' : prodId, 'locationId' : this.selectLocation, 'qty' : 1,
					'targetUserId' : parseInt(currntElem.val())
				});
			}

		});
	}

	generateTrainingsProducts(){
		this.trainingsProducts = [];
		for(let prod of this.allProducts){
			if(prod.product_type == 'trainings'){
				this.trainingsProducts.push(prod);
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
		let selElem = $('select[product-id="'+prodId+'"]'),
			userTargetId = selElem.val();

		if(this.selectLocation > 0 && userTargetId > 0){
			this.messageService.sendMessage({
				'addToCart' : true, 'productId' : prodId, 'locationId' : this.selectLocation, 'qty' : 1, 'targetUserId' : parseInt(userTargetId)
			});
		}
	}

	removeFromCart(prodId){
		this.messageService.sendMessage({
			'removeFromCart' : true, 'productId' : prodId
		});
	}

	isInFavorites(prodId){
		let response = false;
		for(let i in this.favorites){
			if( this.favorites[i] !== null ){
				if(this.favorites[i].product_id == prodId){
					response = true;
				}
			}
		}
		return response;
	}

	addToFavorites(prodId, packageElem){

		let selectedUser = packageElem.querySelector('select').value;

		if(selectedUser > 0 && this.selectLocation > 0){
			this.messageService.sendMessage({
				'addToFavorites' : true, 'targetUserId' : selectedUser,
				'productId' : prodId, 'quantity' : 1, 'locationId' : this.selectLocation
			});
		}

	}

	removeFavorite(prodId){
		this.messageService.sendMessage({
			'removeFavorite' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
	}

} 