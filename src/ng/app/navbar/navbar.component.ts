import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

declare var $: any;
declare var Webcam: any;
declare var navigator: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

	public userData: Object;
	public userRoleID: Number = 0;
	public showUpgradePremium: boolean = true;
	public usersImageURL: String;
	public hasUserImage: boolean = false;
	public usersInitial: String = 'AA';

	showSendInviteLink = false;
	elems = {};

	constructor(
		private auth: AuthService
	) {
	    this.userData = this.auth.getUserData();
	    this.usersImageURL = 'assets/images/camera_upload_hover.png';
	}

	public getInitials(fullName){
		let initials = fullName.match(/\b\w/g) || [];
		initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
		return initials;
	}

	ngOnInit() {
		this.usersInitial = this.getInitials(this.userData['name']);
		this.userRoleID = this.userData['roleId'];
		this.showEvent();
		this.closeEvent();
		this.setElements();
		this.changePhotoEvent();

		// Burger click event
		$('.burger-link').click(function(){
			let $burgerContainer = $('.burger-content');
			if($burgerContainer.hasClass('active')){
				$burgerContainer.removeClass('animated slideInDown').addClass('animated slideOutUp');
				setTimeout(function(){
					$burgerContainer.removeClass('active').addClass('inactive');
				}, 1000);
			}else{
				$burgerContainer.removeClass('inactive animated slideOutUp').addClass('active animated slideInDown');
				setTimeout(function(){
					$burgerContainer.removeClass('inactive').addClass('active');
				}, 1000);
			}
		});

		if(this.userRoleID == 1 || this.userRoleID == 2){
			this.showSendInviteLink = true;
		}

	}

	setElements(){
		let modalSelectChangePhotoAction = $('#modalSelectChangePhotoAction'),
			webcamContainer = modalSelectChangePhotoAction.find('.webcam-content');
		this.elems = {
			'modalSelectChangePhotoAction' : modalSelectChangePhotoAction,
			'btnSelectFile' : $('#btnSelectFile'),
			'actionContainer' : modalSelectChangePhotoAction.find('.action-content'),
			'inputFile' : modalSelectChangePhotoAction.find('.action-content').find('input[type="file"]'),
			'imgSelectedFile' : modalSelectChangePhotoAction.find('.image-select-file'),
			'chooseBtnFile' : modalSelectChangePhotoAction.find('.btn-choose-file-select'),
			'btnTakePhoto' : $('#btnTakePhoto'),
			'webcamContainer' : webcamContainer,
			'imgHolder' : webcamContainer.find('img[holder]'),
			'btnRetake' : webcamContainer.find('.btn-retake'),
			'btnCancel' : webcamContainer.find('.btn-cancel'),
			'btnChoose' : webcamContainer.find('.btn-choose'),
			'btnCapture' : webcamContainer.find('.btn-capture')
		};
	}

	showEvent(){
		$('.user-right-click-nav').click(function(){ $('.vertical-m').removeClass('fadeOutRightBig animated').addClass('fadeInRight animated'); });
	}

	closeEvent(){
		$('#closeRightNav').click(function(){ $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated'); });
	}

	changePhotoSelectFileEvent(){
		
		this.elems['inputFile'].on('change', () => {
			let file = this.elems['inputFile'][0].files[0],
				reader = new FileReader();
	        reader.onload = (e) => {
	            this.elems['imgSelectedFile'].attr('src', reader.result);
	        }
	        reader.readAsDataURL(file);
	        this.elems['imgSelectedFile'].show();
	        this.elems['chooseBtnFile'].show();
		});

		this.elems['btnSelectFile'].click(() => {
			this.elems['inputFile'].click();
		});

		this.elems['chooseBtnFile'].click(() => {
			this.elems['btnSelectFile'].prop('disabled', true);
			this.elems['chooseBtnFile'].prop('disabled', true);
			this.elems['btnTakePhoto'].prop('disabled', true);
		});
	}

	changePhotoWebCamEvent(){

		this.elems['btnTakePhoto'].click(() => {
			Webcam.reset();
			Webcam.set({
				width: 300,
				height: 225,
				image_format: 'jpeg',
				jpeg_quality: 90
			});

			Webcam.on('error', () => {
				alert();
			});

			Webcam.attach( 'div[webcam]' );
			this.elems['actionContainer'].hide();
			this.elems['webcamContainer'].show();
		});

		this.elems['btnCapture'].click(() => {
			Webcam.freeze();
			this.elems['btnCapture'].hide();
			this.elems['btnChoose'].show();
		});

		this.elems['btnRetake'].click(() => {
			Webcam.unfreeze();
			this.elems['btnCapture'].show();
			this.elems['btnChoose'].hide();
		});

		this.elems['btnChoose'].click(() => {
			Webcam.snap((data_uri) => {
				this.elems['imgHolder'].attr('src', data_uri);
			});
		});

		this.elems['btnCancel'].click(function(){
			Webcam.reset();
			this.elems['actionContainer'].show();
			this.elems['webcamContainer'].hide();
		});
	}

	changePhotoEvent(){
		let changePhotoLink = $('#changePhotoLink'),
			modalSelectChangePhotoAction = $('#modalSelectChangePhotoAction'),
			btnSelectFile = $('#btnSelectFile'),
			btnTakePhoto = $('#btnTakePhoto'),
			actionContainer = modalSelectChangePhotoAction.find('.action-content'),
			webcamContainer = modalSelectChangePhotoAction.find('.webcam-content'),
			btnCancel = webcamContainer.find('.btn-cancel'),
			btnChooseFile = modalSelectChangePhotoAction.find('.btn-choose-file-select'),
			imgSelectedFile = modalSelectChangePhotoAction.find('.image-select-file'),
			inputFile = actionContainer.find('input[type="file"]'),
			myAccountPhotoSRC = $('#myAccountPhoto').attr('src'),
			chooseBtnFile = modalSelectChangePhotoAction.find('.btn-choose-file-select');

		modalSelectChangePhotoAction.modal({
			startingTop: '0%',
        	endingTop: '5%',
        	ready: function(){
        		navigator.getMedia = ( navigator.getUserMedia ||
		               navigator.webkitGetUserMedia ||
		               navigator.mozGetUserMedia ||
		               navigator.msGetUserMedia);

				navigator.getMedia({video: true}, function() {
					btnTakePhoto.prop('disabled', false).html('TAKE A PHOTO');
				}, function() {
					btnTakePhoto.prop('disabled', true).html('NO CAMERA FOUND');
				});
        	},
        	complete: function() {
        		btnSelectFile.html('SELECT FILE');
        		imgSelectedFile.hide();
        		chooseBtnFile.hide();
        		btnCancel.click();
        		actionContainer.find('input[type="file"]')[0].value = "";
        		inputFile = actionContainer.find('input[type="file"]');
        		Webcam.reset();
        	}
		});

		changePhotoLink.click(function(){
			modalSelectChangePhotoAction.modal('open');
		});

		this.changePhotoSelectFileEvent();
		this.changePhotoWebCamEvent();
	}



}
