import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { SignupService } from '../services/signup.service';
import { UserService } from '../services/users';
import { Subscription } from 'rxjs/Subscription';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [UserService]
})
export class DashboardComponent implements OnInit {
	private baseUrl: String;
	public userData: Object;
	public userRoles;
	showEmailVerification = false;
	showResponse = false;
  responseMessage = '';
  public confirmationProcessStep = 0;

  public showConfirmationProcessBar = false;
	routerSubs;
  isFRP = false;
  isTRP = false;

  queryParamSub: Subscription;
  constructor(
    
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private signupServices: SignupService,
    private userService: UserService
    ) {
    this.baseUrl = environment.backendUrl;
    this.subscribeAndCheckUserHasAccountToSetup(router);
    this.userData = this.auth.getUserData();
  }

  subscribeAndCheckUserHasAccountToSetup(router){
    this.routerSubs = router.events.subscribe((val) => {
      if(val instanceof NavigationEnd){
        if( this.userData ){
          this.userRoles = this.userData['roles'];

          for(let i in this.userRoles){
            if( this.userRoles[i]['role_id'] == 1 ){
              this.isFRP = true;
            }
            if( this.userRoles[i]['role_id'] == 2 ){
              this.isTRP = true;
            }

            if( this.userRoles[i]['role_id'] == 1 || this.userRoles[i]['role_id'] == 2 ){
              if(this.userData['accountId'] < 1){
                router.navigate(['/setup-company']);
              }
            }
          }

          if(val.url == '/' || val.url == '/dashboard'){
            /*if(this.isTRP && val.url == '/'){
              router.navigate(['/teams/list-wardens']);
            }else if(this.isFRP && (val.url == '/dashboard' || val.url == '/') ){
              router.navigate(['/dashboard/main']);
            }else{
              router.navigate(['/dashboard/user']);
            }*/
            if(this.isFRP && (val.url == '/dashboard' || val.url == '/') ){
              router.navigate(['/dashboard/main']);
            }else{
              router.navigate(['/dashboard/user']);
            }
          }


        }
      }
    });
  }

  resendEmailVerification(){
    this.showResponse = true;
    this.responseMessage = 'Re-sending email for verification';
    this.signupServices.resendEmailVerification(this.userData['userId'], (response) => {
      this.responseMessage = response.message;
      setTimeout(() => {
        this.showResponse = false;
      }, 3000);
    });
  }

  ngOnInit() {
    this.queryParamSub = this.route.queryParamMap
    .subscribe(params => {
      if (params.has('confirmation')){
        this.showConfirmationProcessBar = true;
        this.auth.setUserDataItem('confirmation_process', true);
      }
      if (params.has('step')) {
        this.confirmationProcessStep = +params.get('step');
      }       
      
    });


    this.userService.checkUserVerified( this.userData['userId'] , (response) => {
      if(response.status === false && response.message == 'not verified'){
        localStorage.setItem('showemailverification', 'true');
        this.showEmailVerification = true;
        setTimeout(() => {
          $('.alert-email-verification').removeAttr('style').css('opacity', '1');
        },1000);
      } else {
        localStorage.removeItem('showemailverification');
      }
    });
  }

}
