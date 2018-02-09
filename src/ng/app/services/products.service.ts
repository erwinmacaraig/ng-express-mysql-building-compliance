import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable, ReplaySubject, BehaviorSubject, Subscription, Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Injectable()
export class ProductService {

	private headers: Object;
	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
		this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	public getAll(callBack){
		this.http.get(this.baseUrl+"/products/get-all", this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public getCart(callBack){
		this.http.get(this.baseUrl+"/products/get-cart", this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public updateCart(formData, callBack){
		this.http.post(this.baseUrl+"/product/update-cart", formData, this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public addToCart(formData, callBack){
		this.http.post(this.baseUrl+"/product/add-to-cart", formData, this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public removeFromCart(prodId, callBack){
		this.http.get(this.baseUrl+"/product/remove-from-cart/"+prodId, this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public removeAllFromCart(callBack){
		this.http.get(this.baseUrl+"/product/remove-all-from-cart/", this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public checkoutProduct(callBack){
		this.http.post(this.baseUrl+"/product/checkout", this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	public getPackagesAndProducts(callBack){
		this.http.get(this.baseUrl+"/packages-products", this.options)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}
	
}	