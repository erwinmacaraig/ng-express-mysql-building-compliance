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

	constructor(
		private auth: AuthService
	) {
		this.userData = this.auth.getUserData();
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
	}

	showEvent(){
		$('.user-right-click-nav').click(function(){ $('.vertical-m').removeClass('fadeOutRightBig animated').addClass('fadeInRight animated'); });
	}

	closeEvent(){
		$('#closeRightNav').click(function(){ $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated'); });
	}

	changePhotoSelectFileEvent(){
		let modalSelectChangePhotoAction = $('#modalSelectChangePhotoAction'),
			btnSelectFile = $('#btnSelectFile'),
			actionContainer = modalSelectChangePhotoAction.find('.action-content'),
			inputFile = actionContainer.find('input[type="file"]'),
			imgSelectedFile = modalSelectChangePhotoAction.find('.image-select-file'),
			chooseBtnFile = modalSelectChangePhotoAction.find('.btn-choose-file-select');

		inputFile.on('change', function(){
			let file = inputFile[0].files[0],
				reader = new FileReader();
	        reader.onload = function (e) {
	            imgSelectedFile.attr('src', reader.result);
	        }
	        reader.readAsDataURL(file);
	        imgSelectedFile.show();
	        chooseBtnFile.show();
		});

		btnSelectFile.click(function() {
			inputFile.click();
		});
	}

	changePhotoWebCamEvent(){
		let btnTakePhoto = $('#btnTakePhoto'),
			modalSelectChangePhotoAction = $('#modalSelectChangePhotoAction'),
			webcamContainer = modalSelectChangePhotoAction.find('.webcam-content'),
			actionContainer = modalSelectChangePhotoAction.find('.action-content'),
			imgHolder = webcamContainer.find('img[holder]'),
			btnRetake = webcamContainer.find('.btn-retake'),
			btnCancel = webcamContainer.find('.btn-cancel'),
			btnChoose = webcamContainer.find('.btn-choose'),
			btnCapture = webcamContainer.find('.btn-capture');

		btnTakePhoto.click(function(){
			Webcam.reset();
			Webcam.set({
				width: 300,
				height: 225,
				image_format: 'jpeg',
				jpeg_quality: 90
			});

			Webcam.on('error', function(){
				alert();
			});

			Webcam.attach( 'div[webcam]' );
			actionContainer.hide();
			webcamContainer.show();
		});

		btnCapture.click(function(){
			Webcam.freeze();
			btnCapture.hide();
			btnChoose.show();
		});

		btnRetake.click(function(){
			Webcam.unfreeze();
			btnCapture.show();
			btnChoose.hide();
		});

		btnChoose.click(function(){
			Webcam.snap(function(data_uri){
				imgHolder.attr('src', data_uri);
			});
		});

		btnCancel.click(function(){
			actionContainer.show();
			webcamContainer.hide();
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
        		inputFile[0].files = null;
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
