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

	allProducts = <any>[];
	cart = <any>{
		items : {},
		totalPrice : 0
	};
	arrayCart = [];

	subs;

	selectObservable = Observable;
	selectSubs;

	locations = <any>[];
	favorites = <any>[];

	totalQuantity = 5;
	totalAddedQuantity = 0;
	totalAmount = 0.00;

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

		/*this.selectSubs = this.selectObservable.interval(100).subscribe(() => {
			if($('select').length > 0){
				$('#selectLocation').material_select();
				this.selectSubs.unsubscribe();
			}
		});*/
	}

	ngAfterViewInit(){
		
		$('.workspace.container').css('padding', '0px');

		this.messageService.sendMessage({
			'getData' : true
		});
	}

	selectLocationZoom(){
		$('#selectLocation').css({
			'box-shadow' : '0px 2px 8px 0px #afafaf',
			'transform' : 'scale(1.2)'
		});
		window.scroll(0, 0);
		setTimeout(() => {
			$('#selectLocation').css({ 'box-shadow' : '', 'transform' : '' });
		}, 2000);
	}

	onChageSelectDiagram(selectDiagram){
		let selProdId = selectDiagram.value;

		for(let i in this.diagramsProducts){
			let prod = this.diagramsProducts[i];
			prod.quantity = 0;
		}

		if(selProdId > 0){
			this.totalAddedQuantity = this.totalQuantity;
			for(let i in this.diagramsProducts){
				let prod = this.diagramsProducts[i];
				if(prod.product_id == selProdId){
					prod.quantity = this.totalQuantity;
				}
			}
		}else{
			this.totalAddedQuantity = 0;
		}

		this.updateTotalAmount();
	}

	updateItemToCart(btn){
		let locId = parseInt($('#selectLocation').val()),
			diagId = parseInt($('#selectDiagram').val());
			// pdfOnly = ($('#pdf').prop('checked')) ? 1 : 0;
		if(locId > 0 && this.totalAddedQuantity == this.totalQuantity){

			btn.disabled = true;
			this.removeDiagramsFromCart(() => {
				this.addToCart(btn, ()=>{
					btn.disabled = false;
				});
			});

		}else if(locId < 1 || isNaN(locId)){
			this.selectLocationZoom();
		}
	}

	addQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		this.quantityInput.nativeElement.value = q + 1;
		this.totalQuantity = this.quantityInput.nativeElement.value;

		if($('#selectDiagram').val() > 0){
			this.totalAddedQuantity = this.totalQuantity;
		}
	}

	subtractQuantity(){
		let q = parseInt(this.quantityInput.nativeElement.value);
		if(q > 5){
			this.quantityInput.nativeElement.value = q - 1;
			this.totalQuantity = this.quantityInput.nativeElement.value;
		}

		if($('#selectDiagram').val() > 0){
			this.totalAddedQuantity = this.totalQuantity;
		}
	}

	addTotalQuantity(prod, inp){
		let q = parseInt(inp.value);
		if(this.totalQuantity > this.totalAddedQuantity){
			inp.value = q + 1;
			prod.quantity = q + 1;
			this.totalAddedQuantity++;
			this.updateTotalAmount();
		}
	}

	subtractTotalQuantity(prod, inp){
		let q = parseInt(inp.value);
		if(this.totalAddedQuantity > 0 && q > 0){
			inp.value = q - 1;
			prod.quantity = q - 1;
			this.totalAddedQuantity--;
			this.updateTotalAmount();
		}
	}

	updateTotalAmount(){
		this.totalAmount = 0;
		for(let i in this.diagramsProducts){
			let prod = this.diagramsProducts[i],
				amount = parseFloat(prod.amount),
				qty = prod.quantity;

			if(qty > 0){
				this.totalAmount = this.totalAmount + (amount * qty);
			}

		}
	}

	removeDiagramsFromCart(cb){
		this.messageService.sendMessage({
			'removeDiagramsFromCart' : true, 'callBack' : cb
		});
	}

	generateDiagramProducts(){
		this.diagramsProducts = [];
		for(let prod of this.allProducts){
			prod.amount = parseFloat(prod.amount).toFixed(2);
			prod.quantity = 0;
			if(prod.product_type == 'diagram'){
				this.diagramsProducts.push(prod);
			}
		}
	}

	isInCart(){
		let response = false;
		for(let i in this.cart.items){
			if( this.cart.items[i] !== null ){
				if(this.cart.items[i]['item'].product_type == 'diagram'){
					response = true;
				}
			}
		}
		return response;
	}

	isProdInCart(prodId){
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

	addToCart(btn, callBack){
		let locId = parseInt($('#selectLocation').val()),
			diagId = parseInt($('#selectDiagram').val());
			// pdfOnly = ($('#pdf').prop('checked')) ? 1 : 0;

		if(locId > 0 && this.totalAddedQuantity == this.totalQuantity){
			btn.disabled = true;

			let cb = () => {
				btn.disabled = false;
				callBack();
			};

			let prodToAdd = [],
				count = 0;

			for(let i in this.diagramsProducts){
				let prod = this.diagramsProducts[i],
					amount = parseFloat(prod.amount),
					qty = prod.quantity;

				if(qty > 0){
					prodToAdd.push({
						prodId : prod.product_id, quantity : qty, locId : locId
					});
					count++;
				}
			}

			if(prodToAdd.length > 0){
				let addOns = [];
				for(let i in prodToAdd){
					if(parseInt(i) > 0){
						addOns.push({
							product_id : prodToAdd[i]['prodId'], location_id : prodToAdd[i]['locId'], qty : prodToAdd[i]['quantity']
						});
					}
				}

				this.messageService.sendMessage({
					'addToCart' : true, 'productId' : prodToAdd[0].prodId,
					'qty' : prodToAdd[0].quantity, 'locationId' : locId,
					'addOns' : addOns, 'callBack' : cb
				});
			}
			
		}else{
			this.selectLocationZoom();
		}
	}

	getCartProduct(prodId){
		let response = {};
		for(let i in this.cart.items){
			if( this.cart.items[i] !== null ){
				if(this.cart.items[i]['item'].product_id == prodId){
					response = this.cart.items[i]['item'];
				}
			}
		}
		return response;
	}

	buyNow(btn){
		let locId = parseInt($('#selectLocation').val());

		if(locId < 1 || isNaN(locId)){
			this.selectLocationZoom();
		}else if(  this.totalAddedQuantity > 0 ){
			btn.disabled = true;
			this.removeDiagramsFromCart(() => {
				this.addToCart(btn, () => {
					this.router.navigate(["/shop/cart"]);
				});
			});
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

	addToFavorites(btn){
		let locId = parseInt($('#selectLocation').val()),
			diagId = parseInt($('#selectDiagram').val());/*,
			pdfOnly = ($('#pdf').prop('checked')) ? 1 : 0;*/

		if(locId && this.totalAddedQuantity == this.totalQuantity){
			btn.disabled = true;
			let thisClass = this;
			let callBack = () => {
				for(let i in thisClass.diagramsProducts){
					let prod = thisClass.diagramsProducts[i],
						amount = parseFloat(prod.amount),
						qty = prod.quantity;

					if(qty > 0){

						thisClass.messageService.sendMessage({
							'addToFavorites' : true, 'locationId' : locId,
							'productId' : prod.product_id, 'quantity' : qty, 'callBack' : () => {
								btn.disabled = false;
							}
						});

					}
				}
			};

			this.messageService.sendMessage({
				'removeDiagramsInFavorites' : true,
				'callBack' : callBack
			});
			
		}else{
			this.selectLocationZoom();
		}

	}

	removeFavorite(prodId, btn){
		btn.disabled = true;
		let cb = () => {
			btn.disabled = false;
		};
		this.messageService.sendMessage({
			'removeFavorite' : true, 'productId' : prodId
		});
	}

	ngOnDestroy(){
		$('.workspace.container').css('padding', '');
		this.subs.unsubscribe();
		// this.selectSubs.unsubscribe();
	}

} 