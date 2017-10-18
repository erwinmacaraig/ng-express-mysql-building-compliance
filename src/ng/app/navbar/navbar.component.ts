import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

declare var $: any;
declare var Webcam: any;

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
	}

	showEvent(){
		$('#usersRightNavLink').click(function(){ $('.vertical-m').removeClass('fadeOutRightBig animated').addClass('fadeInRight animated'); });
	}

	closeEvent(){
		$('#closeRightNav').click(function(){ $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated'); });
	}

	changePhotoEvent(){
		let changePhotoLink = $('#changePhotoLink'),
			modalSelectChangePhotoAction = $('#modalSelectChangePhotoAction'),
			btnSelectFile = $('#btnSelectFile'),
			btnTakePhoto = $('#btnTakePhoto'),
			actionContainer = modalSelectChangePhotoAction.find('.action-content'),
			divWebcam = modalSelectChangePhotoAction.find('div[webcam]'),
			webcamContainer = modalSelectChangePhotoAction.find('.webcam-content'),
			btnCapture = webcamContainer.find('.btn-capture'),
			btnRetake = webcamContainer.find('.btn-retake'),
			btnCancel = webcamContainer.find('.btn-cancel'),
			btnChoose = webcamContainer.find('.btn-choose'),
			btnChooseFile = modalSelectChangePhotoAction.find('.btn-choose-file-select'),
			webcamDiv = webcamContainer.find('div[webcam]'),
			imgHolder = webcamContainer.find('img[holder]'),
			imgSelectedFile = modalSelectChangePhotoAction.find('.image-select-file'),
			img = changePhotoLink.find('img'),
			inputFile = actionContainer.find('input[type="file"]'),
			myAccountPhoto = $('#myAccountPhoto'),
			myAccountPhotoSRC = myAccountPhoto.attr('src'),
			chooseBtnFile = modalSelectChangePhotoAction.find('.btn-choose-file-select');

		modalSelectChangePhotoAction.modal({
			startingTop: '0%',
        	endingTop: '5%',
        	complete: function() {
        		btnSelectFile.html('SELECT FILE');
        		imgSelectedFile.hide();
        		chooseBtnFile.hide();
        		btnCancel.click();
        		inputFile[0].files = null;
        		Webcam.reset();
        	}
		});

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

		changePhotoLink.click(function(){
			modalSelectChangePhotoAction.modal('open');
		});

		btnTakePhoto.click(function(){
			Webcam.reset();
			Webcam.set({
				width: 300,
				height: 225,
				image_format: 'jpeg',
				jpeg_quality: 90
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



}
