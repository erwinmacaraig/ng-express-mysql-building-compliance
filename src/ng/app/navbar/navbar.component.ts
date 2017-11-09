import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/users';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
declare var $: any;
declare var Webcam: any;
declare var navigator: any;

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  providers : [UserService]
})
export class NavbarComponent implements OnInit {
	@ViewChild('formFile') formFile: NgForm; 

	public userData: Object;
	public userRoleID: Number = 0;
	public showUpgradePremium: boolean = true;
	public usersImageURL: String;
	public hasUserImage: boolean = false;
	public usersInitial: String = 'AA';

	showSendInviteLink = false;
	elems = {};

	constructor(
		private auth: AuthService,
		private userService: UserService
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
			'btnCapture' : webcamContainer.find('.btn-capture'),
			'changePhotoLink' : $('#changePhotoLink'),
			'modalCloseBtn' : modalSelectChangePhotoAction.find('.modal-close')
		};
	}

	showEvent(){
		$('.user-right-click-nav').click(function(){ $('.vertical-m').removeClass('fadeOutRightBig animated').addClass('fadeInRight animated'); });
	}

	closeEvent(){
		$('#closeRightNav').click(function(){ $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated'); });
	}


	submitSelectFile(){
		this.elems['btnSelectFile'].prop('disabled', true);
		this.elems['chooseBtnFile'].prop('disabled', true);
		this.elems['btnTakePhoto'].prop('disabled', true);
		this.elems['modalCloseBtn'].hide();

		let 
		file = this.elems['inputFile'][0].files,
		formData = new FormData();
		formData.append('user_id', this.userData['userId']);
		formData.append('file', file);
		this.userService.uploadProfilePicture(formData, (response) => {
			if(response.status){

			}else{

			}
		}); 

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
			this.submitSelectFile();
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

			this.elems['btnCapture'].show();
			this.elems['btnChoose'].hide();
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
			Webcam.freeze();
			Webcam.snap((data_uri) => {
				this.elems['imgHolder'].attr('src', data_uri);
			});

			this.elems['btnCancel'].prop('disabled', true);
			this.elems['btnChoose'].prop('disabled', true);
			this.elems['btnRetake'].prop('disabled', true);
			this.elems['modalCloseBtn'].hide();
			Webcam.freeze();
		});

		this.elems['btnCancel'].click(() => {
			Webcam.reset();
			this.elems['actionContainer'].show();
			this.elems['webcamContainer'].hide();
		});
	}

	changePhotoEvent(){

		let  modalOpts = {
            dismissible: false,
            startingTop: '0%', // Starting top style attribute
            endingTop: '5%',
            ready: () => {
        		navigator.getMedia = ( navigator.getUserMedia ||
		               navigator.webkitGetUserMedia ||
		               navigator.mozGetUserMedia ||
		               navigator.msGetUserMedia);

				navigator.getMedia({video: true}, () => {
					this.elems['btnTakePhoto'].prop('disabled', false).html('TAKE A PHOTO');
				}, () => {
					this.elems['btnTakePhoto'].prop('disabled', true).html('NO CAMERA FOUND');
				});

				this.elems['btnSelectFile'].prop('disabled', false);
				this.elems['chooseBtnFile'].prop('disabled', false);
				this.elems['btnTakePhoto'].prop('disabled', false);
				this.elems['modalCloseBtn'].show();
				this.elems['btnCapture'].show();
				this.elems['btnChoose'].hide();
        	},
        	complete: () => {
        		this.elems['btnSelectFile'].html('SELECT FILE');
        		this.elems['imgSelectedFile'].hide();
        		this.elems['chooseBtnFile'].hide();
        		this.elems['btnCancel'].click();
        		this.elems['actionContainer'].find('input[type="file"]')[0].value = "";
        		this.elems['inputFile'] = this.elems['actionContainer'].find('input[type="file"]');
        		Webcam.reset();
        	}
        };

		this.elems['modalSelectChangePhotoAction'].modal(modalOpts);

		this.elems['changePhotoLink'].click(() => {
			this.elems['modalSelectChangePhotoAction'].modal('open');
		});

		this.changePhotoSelectFileEvent();
		this.changePhotoWebCamEvent();
	}



}
