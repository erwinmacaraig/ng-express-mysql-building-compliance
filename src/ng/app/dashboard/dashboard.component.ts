import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { Router, NavigationEnd, ActivatedRoute  } from '@angular/router';
import { SignupService } from '../services/signup.service';
import { UserService } from '../services/users';
import { Subscription } from 'rxjs/Subscription';
import { EncryptDecryptService } from '../services/encrypt.decrypt';

declare var $: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [UserService, EncryptDecryptService]
})
export class DashboardComponent implements OnInit, OnDestroy {
	private baseUrl: String;
	public userData: Object;
  public userRoles;
  public emergencyRole = '';
	showEmailVerification = false;
	showResponse = false;
  responseMessage = '';
  public confirmationProcessStep = 0;

  public showConfirmationProcessBar = false;
	routerSubs;
  isFRP = false;
  isTRP = false;
  has_account_role = false;

  queryParamSub: Subscription;
  constructor(    
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private signupServices: SignupService,
    private userService: UserService,
    private encryptDecrypt: EncryptDecryptService
    ) {
    this.baseUrl = environment.backendUrl;
    // this.subscribeAndCheckUserHasAccountToSetup(router);
    this.userData = this.auth.getUserData();
  }

  /*subscribeAndCheckUserHasAccountToSetup(router){
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
          }
          if(val.url == '/' || val.url == '/dashboard'){            
            if(this.isFRP && (val.url == '/dashboard' || val.url == '/') ){
              router.navigate(['/dashboard/main']);
            }else{
              router.navigate(['/dashboard/user']);
            }
          }


        }
      }
    });
  }*/

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
      console.log(params);
      if (params.has('confirmation')){
        this.showConfirmationProcessBar = true;
        this.auth.setUserDataItem('confirmation_process', true);
      } else {
        this.showConfirmationProcessBar = false;
      }
      if (params.has('step')) {
        this.confirmationProcessStep = +params.get('step');
      }
      if (params.has('r')) {
        this.emergencyRole = decodeURIComponent(params.get('r'));
        this.auth.setUserDataItem('confirmation_process_role', this.emergencyRole);
        console.log('emergency role from url',  this.emergencyRole);
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

    // first check account roles
    this.userRoles = this.userData['roles'];
    for(let i in this.userRoles){
      if( this.userRoles[i]['role_id'] == 1 ){
        this.has_account_role = true
      }
      if( this.userRoles[i]['role_id'] == 2 ){
        this.has_account_role = true;
      }            
    }
    
    // checks how many buildings
    if (this.has_account_role) {
      if ((this.userData['buildings'] as number[]).length > 1) {
        // go to location listing
        this.router.navigate(['/location', 'list']);
      } else {
        // go directly to compliance
        this.router.navigate(['/location', 'compliance', 'view', this.encryptDecrypt.encrypt(this.userData['buildings'][0])]); 
      }
    } else {
      this.router.navigate(['/trainings', 'new-training']);
    }

  }

  ngOnDestroy() {
    if (this.queryParamSub) {
      this.queryParamSub.unsubscribe();
    }
  }

}
