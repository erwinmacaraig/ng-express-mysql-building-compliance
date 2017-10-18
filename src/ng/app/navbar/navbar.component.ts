import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

declare var $: any;

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
			btnUserPhoto = webcamContainer.find('.btn-use-photo'),
			btnRetake = webcamContainer.find('.btn-retake'),
			btnCancel = webcamContainer.find('.btn-cancel'),
			img = changePhotoLink.find('img'),
			inputFile = actionContainer.find('input[type="file"]');

		modalSelectChangePhotoAction.modal({
			startingTop: '0%',
        	endingTop: '5%',
        	complete: function() {
        		
        	}
		});

		inputFile.on('change', function(){
			let file = inputFile[0].files[0];
			btnSelectFile.html(file.name);
		});

		btnSelectFile.click(function() {
			inputFile.click();
		});

		changePhotoLink.click(function(){
			modalSelectChangePhotoAction.modal('open');
		});

		btnTakePhoto.click(function(){
			actionContainer.hide();
			webcamContainer.show();
		});
	}



}
