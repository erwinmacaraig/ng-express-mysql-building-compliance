import { Injectable } from '@angular/core';

@Injectable()
export class DashboardPreloaderService {

	color = 'red';
	size = '';
	colors: Object = {};
	sizes: Object = {};
	text = 'Loading...';

	constructor() {
		this.colors = {
			red : 'spinner-red-only',
			blue : 'spinner-blue-only',
			green : 'spinner-green-only'
		};

		this.sizes = {
			small: 'small', 
			large: 'big',
			default: ''
		};
	}

	setColor(color){
		this.color = this.colors[color];
	}

	setSize(size){
		this.size = this.sizes[size];
	}

	getOverlayHTML(){
		return `<div class="preloader-overlay" style="
				    position: fixed;
				    top: 0;
				    left: 0;
				    width: 100%;
				    background-color: #fcfcfc;
				    height: 100vh;
				    z-index: 20;
				    padding: 6% 3%;
				    text-align: center;
				">`+this.getPreloaderHTML()+`</div>`;
	}

	getPreloaderHTML(){
		return `<div class="preloader-wrapper `+this.size+` active">
              <div class="spinner-layer spinner-`+this.color+`-only">
                <div class="circle-clipper left">
                  <div class="circle"></div>
                </div><div class="gap-patch">
                  <div class="circle"></div>
                </div><div class="circle-clipper right">
                  <div class="circle"></div>
                </div>
              </div>
            </div> <br/> <strong>`+this.text+`</strong>`;
	}

	createElement(){
		var d = document.createElement("div");
		d.innerHTML = this.getOverlayHTML();
		return d;
	}

	show(){
		if(document.querySelectorAll('div.preloader-overlay').length > 0){
			document.querySelector('div[preloader]').innerHTML = '';
		}

		document.querySelector('div[preloader]').appendChild(this.createElement());
	}

	hide(){
		if(document.querySelectorAll('div.preloader-overlay').length > 0){
			document.querySelector('div[preloader]').innerHTML = '';
		}
	}

}