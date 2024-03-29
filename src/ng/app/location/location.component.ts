import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../services/users';
import { AuthService } from '../services/auth.service';
import { SignupService } from '../services/signup.service';
import { Router, NavigationEnd } from '@angular/router';




declare var $: any;
@Component({
    selector: 'app-location',
    templateUrl: './location.component.html',
    styleUrls: ['./location.component.css'],
    providers: [UserService]
})
export class LocationComponent implements OnInit, OnDestroy {
    showEmailVerification = false;
    showResponse = false;
    responseMessage = '';
    public userData: Object;
    public thisRouteUrl = '';
    public showLocationNavigation = true;
    public endNav= '';
    constructor(
        private userService: UserService, 
        private auth: AuthService, 
        private router: Router,
        private signupServices: SignupService,
        
        ) {
        this.userData = this.auth.getUserData();
        this.router.events.subscribe((event) => {
            let parts = [];
            if(event instanceof NavigationEnd ){
                this.thisRouteUrl = event.url;
                parts = this.thisRouteUrl.split('/');
                this.endNav = parts[parts.length - 1]; 
                console.log(this.endNav);               
                this.ngAfterViewInit();
            }
        });
    }

    ngOnInit() {
        this.userService.checkUserVerified( this.userData['userId'] , (response) => {
            console.log(response);
            if (response.status === false && response.message === 'not verified') {
                this.showEmailVerification = true;
                setTimeout(() => {
                    $('.alert-email-verification').removeAttr('style').css('opacity', '1');
                }, 1000);
            } else {
                localStorage.removeItem('showemailverification');
            }
        });

        

    }

    ngOnDestroy() {}

    ngAfterViewInit(){
        if(this.thisRouteUrl.indexOf('/location/') > -1){
            $('li.nav-list-locations').addClass('active');
            $('div.archived').remove();
            $('div.archived+.back-to').remove();
            $('.right-top-container').html('');
            if('roles' in this.userData){
                let roles = this.userData['roles'],
                    frp = false,
                    trp = false,
                    warden = false,
                    genOcc = false,
                    chiefWarden = false,
                    otherWarden = false;

                for(let i in roles){
                    if(roles[i]['role_id'] == 1){
                        frp = true;
                    }else if(roles[i]['role_id'] == 2){
                        trp = true;
                    }else if(roles[i]['role_id'] == 8){
                        genOcc = true;
                    }else if(roles[i]['role_id'] == 9){
                        warden = true;
                    }else if(roles[i]['role_id'] == 11){
                        chiefWarden = true;
                    }else{
                        otherWarden = true;
                    }
                }

                if(frp || trp){
                    this.showLocationNavigation = true;
                }else{
                    this.showLocationNavigation = false;
                }

            }
        }
    }

    resendEmailVerification() {
        this.showResponse = true;
        this.responseMessage = 'Re-sending email for verification';
        this.signupServices.resendEmailVerification(this.userData['userId'], (response) => {
            this.responseMessage = response.message;
            setTimeout(() => {
                this.showResponse = false;
            }, 3000);
        });
    }

}
