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
	rowPackages = [];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];
	subs;

	locations = <any>[];

	btnDisabled = [];

	fsaProduct = {
		product_image : ''
	};

	selectedPackage = {};

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
			if(message.products){
				for(let prod of message.products){
					if(prod.product_type == 'addon' && prod.product_title.toLowerCase() == 'fsa support'){
						if(prod.product_image == null){
							prod.product_image = '';
						}
	    				this.fsaProduct = prod;
	    			}
				}
				
			}

			if(message.cart){
	    		this.cart = message.cart;

	    		this.btnDisabled.forEach((btn) => {
	    			btn.disabled = false;
	    		});

	    		this.btnDisabled = [];
	    	}

	    	if(message.packages){
	    		this.packages = message.packages;

	    		let c = 0,
	    			temp = [];
	    		for(let pack of this.packages){
	    			if(!pack.noTitleContainer){
	    				pack['noTitleContainer'] = false;
	    			}

	    			pack['backgroundClasses'] = 'teal accent-4';

	    			if(pack.product_title.toLowerCase() == 'premium warden management'){
	    				pack['backgroundClasses'] = 'grey';
	    				pack['icon'] = 'building_shop.png';
	    			}

	    			if(pack.product_title.toLowerCase() == 'self managed compliance'){
	    				pack['backgroundClasses'] = ' light-blue darken-1';
	    				pack['icon'] = 'self_compliance.png';
	    				pack['addFSA'] = true;
	    			}

	    			if(pack.product_title.toLowerCase() == 'value compliance'){
	    				pack['btnReplacement'] = {
	    					link : '',
	    					text : 'Contact Us'
	    				}

	    				pack['noTitleContainer'] = true;
	    			}

	    			pack['marginTop'] = '';
	    			pack['height'] = '';

	    			if( c % 2 == 0 ){
	    				pack['marginTop'] = '5%';
	    			}else{
	    				pack['height'] = '600px';
	    			}

	    			temp.push(pack);
	    			
	    			c++;

	    			if(temp.length == 3){
	    				this.rowPackages.push({ packages : temp });
	    				temp = [];
	    			}
	    		}

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

		$('#modalFSA').modal({
			dismissible: true
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

	addToCart(prodId, btn, addOnIds?, cb?){
		if(this.selectLocation > 0){
			btn.disabled = true;
			this.btnDisabled.push(btn);
			addOnIds = (addOnIds) ? addOnIds : [];

			if(addOnIds.length > 0){
				for(let id of addOnIds){
					this.messageService.sendMessage({
						'addToCart' : true, 'productId' : prodId, 'qty' : 1, 'locationId' : this.selectLocation,
						'addOns' : [
							{
								product_id : id, location_id : this.selectLocation, qty : 1
							}
						],
						'callBack' : (cb) ? cb : undefined
					});
				}
			}else{
				this.messageService.sendMessage({
					'addToCart' : true, 'productId' : prodId, 'qty' : 1, 'locationId' : this.selectLocation, 'callBack' : (cb) ? cb : undefined
				});
			}

		}else{
			$('#selectLocation').css({
				'box-shadow' : '0px 2px 8px 0px #afafaf',
				'transform' : 'scale(1.2)'
			});
			setTimeout(() => {
				$('#selectLocation').css({ 'box-shadow' : '', 'transform' : '' });
			}, 2000);
		}
	}

	clickSubscribe(packge, btnAdd){
		if(packge.addFSA && this.selectLocation > 0){
			if(!$('#checkAddFsa').prop('checked')){
				this.selectedPackage = packge;
				$('#modalFSA').modal('open');
			}else{
				this.addToCart(packge.product_id, btnAdd, [this.fsaProduct['product_id']], () => {
					this.router.navigate(["/shop/cart"]);
				});
			}
		}else if(this.selectLocation > 0){
			this.addToCart(packge.product_id, btnAdd, [], () => {
				this.router.navigate(["/shop/cart"]);
			});
		}else{
			$('#selectLocation').css({
				'box-shadow' : '0px 2px 8px 0px #afafaf',
				'transform' : 'scale(1.2)'
			});
			setTimeout(() => {
				$('#selectLocation').css({ 'box-shadow' : '', 'transform' : '' });
			}, 2000);
		}
	}

	addFSAClickEvent(action, btn){
		let addOns = [];
		if(action == 'add'){
			addOns.push(this.fsaProduct['product_id']);
		}

		this.addToCart(this.selectedPackage['product_id'], btn, addOns, () => {
			$('#modalFSA').modal('close');
			setTimeout(() => {
				this.router.navigate(["/shop/cart"]);
			}, 200);
		});
	}

	removeFromCart(prodId, btn){
		btn.disabled = true;
		this.btnDisabled.push(btn);

		this.messageService.sendMessage({
			'removeFromCart' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
	}

} 