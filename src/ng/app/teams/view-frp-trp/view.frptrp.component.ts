import { Component, OnInit, ViewEncapsulation, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';


declare var $: any;
@Component({
  selector: 'app-tview-frptrp-component',
  templateUrl: './view.frptrp.component.html',
  styleUrls: ['./view.frptrp.component.css']
})
export class ViewFrpTrpComponent implements OnInit, OnDestroy {

	constructor(){
		console.log( );
	}

	ngOnInit(){}

	ngAfterViewInit(){
		$('.modal').modal({
			dismissible: false
		});

		$('select').material_select();

		$('.workspace.container').css({
			'padding' : '0px'
		});

		this.gridEvent();
	}

	public gridEvent(){
		window.addEventListener("load", this.renderGrid, false);
		window.addEventListener("resize", this.renderGrid, false);
	}

	public renderGrid(){
		let containerWidth = document.querySelector('#gridContainer')['offsetWidth'];
		let blocks = document.querySelectorAll('#gridContainer .grid-item');
		let pad = 30, cols = Math.floor( containerWidth / 300 ), newleft, newtop;
		
		for(let x = 1; x < blocks.length; x++){
			blocks[x]['style'].left = null;
			blocks[x]['style'].top = null;
		}

		setTimeout(() => {
			for(let i = 1; i < blocks.length; i++){
				if(i % cols == 0){
					newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
					blocks[i]['style'].top = newtop+"px";
				}else{
					if(blocks[i-cols]){
						newtop = (blocks[i-cols]['offsetTop'] + blocks[i-cols]['offsetHeight']) + pad;
						blocks[i]['style'].top = newtop+"px";
					}
					newleft = (blocks[i-1]['offsetLeft'] + blocks[i-1]['offsetWidth']) + pad;
					blocks[i]['style'].left = newleft+"px";
				}
			}
		}, 100);
	}

	ngOnDestroy(){}
}