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
import { MessageService } from '../../services/messaging.service';

declare var $: any;

@Component({
	selector : 'app-evacuation-diagram-package-component',
	templateUrl : './evacuation.diagram.package.component.html',
	styleUrls : [ './evacuation.diagram.package.component.css' ],
    providers : [AuthService, UserService, SignupService, EncryptDecryptService]
})
export class EvacuationDiagramPackageComponent implements OnInit, OnDestroy{

	@ViewChild('quantityInput') quantityInput : ElementRef;

	diagramsProducts = <any>[];

	showingDiagram = {
		product_id : 0,
		product_title : '',
		product_desc : '',
		product_code : '',
		product_image : '',
		amount : <number>0.00,
		quantity : 5
	};

	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;

	showDiagramsImage = false;
	imgObservable = Observable;
	imgSubs;

	selectObservable = Observable;
	selectSubs;

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
	    		this.generateDiagramProducts();
	    		if(this.diagramsProducts[0]){
	    			this.showingDiagram = this.diagramsProducts[0];
	    		}
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
		this.imgSubs = this.imgObservable.interval(100).subscribe(() => {
			if($('#imgTag').length > 0){

				$('#imgTag').on("load", () => {
					this.showDiagramsImage = true;
				});

				this.showDiagramsImage = true;
				this.imgSubs.unsubscribe();
			}
		});

		this.selectSubs = this.selectObservable.interval(100).subscribe(() => {
			if($('select').length > 0){
				$('select').material_select();
				this.selectSubs.unsubscribe();
			}
		});
	}

	ngAfterViewInit(){
		
		$('.workspace.container').css('padding', '0px');

		this.messageService.sendMessage({
			'getData' : true
		});

		if(this.diagramsProducts[0]){
			this.showingDiagram = this.diagramsProducts[0];
		}

	}

	addQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		this.quantityInput.nativeElement.value = q + 1;
		this.showingDiagram.quantity = this.quantityInput.nativeElement.value;

		if( this.isInCart(this.showingDiagram.product_id) ){
			let locId = parseInt($('#selectLocation').val());
			if(locId){
				this.messageService.sendMessage({
					'updateCart' : true, 'productId' : this.showingDiagram.product_id, 'qty' : this.showingDiagram.quantity, 'locationId' : locId
				});
			}
		}
	}

	subtractQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		if(q > 5){
			this.quantityInput.nativeElement.value = q - 1;
			this.showingDiagram.quantity = this.quantityInput.nativeElement.value;

			if( this.isInCart(this.showingDiagram.product_id) ){

				let locId = parseInt($('#selectLocation').val());
				if(locId){
					this.messageService.sendMessage({
						'updateCart' : true, 'productId' : this.showingDiagram.product_id, 'qty' : this.showingDiagram.quantity, 'locationId' : locId
					});
				}

			}
		}
	}

	generateDiagramProducts(){
		this.diagramsProducts = [];
		for(let prod of this.allProducts){
			prod.amount = parseFloat(prod.amount).toFixed(2);
			prod.quantity = 5;
			if(prod.product_type == 'diagram'){
				this.diagramsProducts.push(prod);
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
		let locId = parseInt($('#selectLocation').val());

		if(locId){
			this.messageService.sendMessage({
				'addToCart' : true, 'productId' : prodId, 'qty' : this.showingDiagram.quantity, 'locationId' : locId
			});
		}

	}

	removeFromCart(prodId){
		this.messageService.sendMessage({
			'removeFromCart' : prodId
		});
	}

	moveSlide(leftOrRight){
		let prev = {},
			next = {},
			isDone = false;

		for(let i in this.diagramsProducts){
			if(this.diagramsProducts[i]['product_id'] == this.showingDiagram.product_id && isDone === false){
				if(parseInt(i) == 0){
					prev = this.diagramsProducts[ parseInt(this.diagramsProducts.length) - 1  ];
				}else{
					prev = this.diagramsProducts[ parseInt(i) - 1  ];
				}

				if(parseInt(i) == parseInt(this.diagramsProducts.length) - 1){
					next = this.diagramsProducts[0];
				}else{
					next = this.diagramsProducts[ parseInt(i) + 1 ];
				}

				switch (leftOrRight) {
					case "left":
						this.showingDiagram = <any>prev;
						isDone = true;
						break;
					
					default:
						this.showingDiagram = <any>next;
						isDone = true;
						break;
				}

				this.showDiagramsImage = false;
			}
		}
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

	addToFavorites(prodId){
		this.messageService.sendMessage({
			'addToFavorites' : true,
			'productId' : prodId, 'quantity' : this.showingDiagram.quantity
		});
	}

	removeFavorite(prodId){
		this.messageService.sendMessage({
			'removeFavorite' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
		this.imgSubs.unsubscribe();
		this.selectSubs.unsubscribe();
	}

} 