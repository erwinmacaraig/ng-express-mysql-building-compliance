import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/users';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MessageService } from '../services/messaging.service';
import { EncryptDecryptService } from '../services/encrypt.decrypt';

import * as moment from 'moment';
declare var $: any;
declare var Webcam: any;
declare var navigator: any;

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css'],
    providers : [UserService, EncryptDecryptService]
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('formFile') formFile: NgForm;

    public userData = <any> {
    name: '',
    };
    public encryptedUserId;
    public userRoles;
    public showUpgradePremium: boolean = true;
    public usersImageURL: String;
    public hasUserImage: boolean = false;
    public usersInitial: String = 'AA';

    public mySubscription: Subscription;
    public username: string;
    public evac_role: string;
    public showLinks = {
    locations : false,
    training : false,
    team : false,
    report : false,
    resources : false
    };

    showSendInviteLink = false;
    elems = {};
    public hasAccountRole = false;
    showShopLink = false;

    locationLinkForFrp = false;
    isAdmin = false;
    subscriptionType = 'free';
    isFRP = false;
    isTRP = false;

    constructor(
        private auth: AuthService,
        private userService: UserService,
        private messageService: MessageService,
        private encryptDecrypt: EncryptDecryptService
        ) {
        this.userData = this.auth.getUserData();        
        this.usersImageURL = 'assets/images/camera_upload_hover.png';
        const role = this.auth.getHighestRankRole();
        if(this.userData.evac_role == 'admin'){
            this.isAdmin = true;
        }
        if (role <= 2 ) {
            this.hasAccountRole = true;
        }
        if (role == 1) {
            this.isFRP = true;
        } 
        if (role == 2) {
            this.isTRP = true;
        }

    }

    public getInitials(fullName){
        if(fullName){
            let initials = fullName.match(/\b\w/g) || [];
            initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
            return initials;
        }
        return 'AA';
    }

    ngOnInit() {
        
        this.subscriptionType = this.userData['subscription']['subscriptionType'];
        this.username = this.userData['name'];
        this.usersInitial = this.getInitials(this.username);
        this.userRoles = this.userData['roles'];
        this.evac_role = this.userData['evac_role'];
        this.encryptedUserId = this.encryptDecrypt.encrypt(this.userData['userId']);
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

        this.showLinks = {
            locations : true,
            training : true,
            team : true,
            report : true,
            resources : false
        }

        let trpFrp = false;
        for(let i in this.userRoles){
            if(this.userRoles[i]['role_id'] == 1 || this.userRoles[i]['role_id'] == 2){
                this.showSendInviteLink = true;
                this.showShopLink = true;
                this.locationLinkForFrp = true;
                trpFrp = true;
            }
        }

        if(!trpFrp){
            this.showLinks.report = false;
            this.showLinks.resources = true;
        }

        if('profilePic' in this.userData){
            if(this.userData['profilePic'].length > 5){
                this.usersImageURL = this.userData['profilePic'];
                this.hasUserImage = true;
            }
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
            'modalCloseBtn' : modalSelectChangePhotoAction.find('.modal-close'),
            'rowLoader' : modalSelectChangePhotoAction.find('.row-loader')
        };
    }

    showEvent(){
        $('.user-right-click-nav').click(function(){ $('.vertical-m').removeClass('fadeOutRightBig animated').addClass('fadeInRight animated'); });
    }

    closeEvent(){
        $('#closeRightNav').click(function(){ $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated'); });
        $('body').off('click.closeonclick').on('click.closeonclick', '.close-on-click', function(){
            $('.vertical-m').removeClass('fadeInRight animated').addClass('fadeOutRightBig animated');
        });
    }

    filterUrl(url:String){
        return url.replace('unsafe:', '').trim();
    }

    uploadResponseHandler(response, callBack){
        if(response.status){
            let userData = this.userData;
            userData['profilePic'] = response.data.url;
            this.auth.setUserData(userData);

            this.hasUserImage = true;
            this.usersImageURL = response.data.url;

            this.elems['rowLoader'].find('.preloader-wrapper').show();
            this.elems['rowLoader'].find('.p-icon').html('Uploading...').hide();
            callBack();
            this.elems['modalCloseBtn'].trigger('click');
            this.messageService.sendMessage({'profilePic': this.usersImageURL});
        }else{
            this.elems['rowLoader'].find('.preloader-wrapper').hide();
            this.elems['rowLoader'].find('.p-icon').html(response.message).show();
            setTimeout(() => {
                this.elems['rowLoader'].find('.preloader-wrapper').show();
                this.elems['rowLoader'].find('.p-icon').html('Uploading...').hide();

                callBack();
            }, 2000);
        }
    }

    submitSelectFile(){

        if(this.elems['inputFile'][0].files.length == 0){
            return false;
        }

        this.elems['rowLoader'].show();
        this.elems['modalCloseBtn'].hide();
        this.elems['btnSelectFile'].hide();
        this.elems['chooseBtnFile'].hide();
        this.elems['btnTakePhoto'].hide();

        let
        file = this.elems['inputFile'][0].files[0],
        formData = new FormData();
        formData.append('user_id', this.userData['userId']);
        formData.append('file', file, file.name);
        
        this.userService.uploadProfilePicture(formData).subscribe((response) => {
            let showBtns = () => {
                this.elems['rowLoader'].hide();
                this.elems['modalCloseBtn'].show();
                this.elems['btnSelectFile'].show();
                this.elems['chooseBtnFile'].show();
                this.elems['btnTakePhoto'].show();
            };

            this.uploadResponseHandler(response, showBtns);
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

    b64toBlob(b64Data, contentType, sliceSize?) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    submitWebCam(){
        // this.elems['imgHolder']
        this.elems['rowLoader'].show();
        this.elems['modalCloseBtn'].hide();
        this.elems['btnCancel'].hide();
        this.elems['btnChoose'].hide();
        this.elems['btnRetake'].hide();

        let
        src = this.elems['imgHolder'].attr('src'),
        block = src.split(";"),
        contentType = block[0].split(":")[1],
        realData = block[1].split(",")[1],
        blob = this.b64toBlob(realData, contentType),
        file = blob,
        formData = new FormData();
        formData.append('user_id', this.userData['userId']);
        formData.append('file', file, this.userData['userId']+''+moment().valueOf()+'.jpg');
        
        this.userService.uploadProfilePicture(formData).subscribe((response) => {
            let showBtns = () => {
                this.elems['rowLoader'].hide();
                this.elems['modalCloseBtn'].show();
                this.elems['btnCancel'].show();
                this.elems['btnChoose'].show();
                this.elems['btnRetake'].show();
            };

            this.uploadResponseHandler(response, showBtns);
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


            this.elems['modalCloseBtn'].hide();
            Webcam.freeze();
            this.submitWebCam();
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

    ngAfterViewInit() {
        this.mySubscription = this.messageService.getMessage().subscribe((message) => {

            if(message.person_first_name){
                this.username = message.person_first_name + ' ' + message.person_last_name;
                this.usersInitial = this.getInitials(this.username);
            }
            if (message.profilePic) {
                this.usersImageURL = message.profilePic;
                this.auth.setUserDataItem('profilePic', this.usersImageURL);    
            }

        });

        $('body').off('click.closerightnav').on('click.closerightnav', '.links .li-nav', () => {
            $('#closeRightNav').trigger('click');
        });
    }

    ngOnDestroy() {
        if (this.mySubscription) {
            this.mySubscription.unsubscribe();
        }
    }


}
