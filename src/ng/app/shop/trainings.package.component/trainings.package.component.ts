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
	categories = <any>[];

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

	accounts = <any>[];

	btnDisabled = [];
	btnDisabled2 = [];
	selectedCategoryName = '';
	showingProducts = [];

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

	    		this.btnDisabled.forEach((btn) => {
	    			btn.disabled = false;
	    		});

	    		this.btnDisabled = [];
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

	    		this.btnDisabled2.forEach((btn) => {
	    			btn.disabled = false;
	    		});

	    		this.btnDisabled2 = [];
	    	}

	    	if(message.accounts){
	    		this.accounts = message.accounts;
	    	}
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
					'accountId' : parseInt(currntElem.val())
				});
			}

		});
	}

	selectLocationZoom(){
		$('#selectLocation').css({
			'box-shadow' : '0px 2px 8px 0px #afafaf',
			'transform' : 'scale(1.2)'
		});
		setTimeout(() => {
			$('#selectLocation').css({ 'box-shadow' : '', 'transform' : '' });
		}, 2000);
	}

	selectCategory(catName){
		this.showingProducts = [];
		for(let prod of this.allProducts){
			if(prod.category == catName){
				this.showingProducts.push(prod);
				this.selectedCategoryName = catName;
			}
		}
	}

	generateTrainingsProducts(){
		this.trainingsProducts = [];
		for(let prod of this.allProducts){
			if(prod.product_type == 'trainings'){
				this.trainingsProducts.push(prod);

				if(prod.category !== null){
	    			if(this.categories.indexOf( prod.category ) == -1){
	    				this.categories.push(prod.category);
	    			}
    			}

			}
		}

		if(this.categories.length > 0){
			this.selectCategory(this.categories[0]);

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

	addToCart(prodId, btn){
		let selElem = $('select[product-id="'+prodId+'"]'),
			accountTargetId = selElem.val();

		if(this.selectLocation > 0 && accountTargetId > 0){
			btn.disabled = true;
			this.btnDisabled.push(btn);

			this.messageService.sendMessage({
				'addToCart' : true, 'productId' : prodId, 'locationId' : this.selectLocation, 'qty' : 1, 'accountId' : parseInt(accountTargetId)
			});
		}else{
			if(this.selectLocation < 1){
				this.selectLocationZoom();
			}
			if(accountTargetId < 1){
				selElem.css('border', '1px solid #F44336');
				setTimeout(() => {
					selElem.css('border', '0px');
				}, 2000);
			}
			
		}
	}

	buyNow(prodId, btn){
		let selElem = $('select[product-id="'+prodId+'"]'),
			accountTargetId = selElem.val();

		this.addToCart(prodId, btn);

		if(this.selectLocation > 0 && accountTargetId > 0){
			setTimeout(() => {
				this.router.navigate(["/shop/cart"]);
			}, 1000);
		}else{
			if(this.selectLocation < 1){
				this.selectLocationZoom();
			}
			if(accountTargetId < 1){
				selElem.css('border', '1px solid #F44336');
				setTimeout(() => {
					selElem.css('border', '0px');
				}, 2000);
			}
		}
		
		
	}

	removeFromCart(prodId, btn){
		btn.disabled = true;
		this.btnDisabled.push(btn);
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

	addToFavorites(prodId, packageElem, btn){

		let selElem = $('select[product-id="'+prodId+'"]'),
			accountTargetId = selElem.val();

		if(accountTargetId > 0 && this.selectLocation > 0){
			btn.disabled = true;
			this.btnDisabled2.push(btn);
			this.messageService.sendMessage({
				'addToFavorites' : true, 'accountId' : accountTargetId,
				'productId' : prodId, 'quantity' : 1, 'locationId' : this.selectLocation
			});
		}else{
			if(this.selectLocation < 1){
				this.selectLocationZoom();
			}
			if(accountTargetId < 1){
				selElem.css('border', '1px solid #F44336');
				setTimeout(() => {
					selElem.css('border', '0px');
				}, 2000);
			}
		}

	}

	removeFavorite(prodId, btn){
		btn.disabled = true;
		this.btnDisabled2.push(btn);
		this.messageService.sendMessage({
			'removeFavorite' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
	}

} 