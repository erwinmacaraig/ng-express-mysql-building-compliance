import { NgModule } from '@angular/core';
import { Routes, Resolve } from '@angular/router';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignoutComponent } from './signout/signout.component';
import { PersonInfoComponent } from './dashboard/person-info/person-info.component';
import { CompanyInformationComponent } from './dashboard/company_information/company.information.component';
import { SendInviteComponent } from './dashboard/send-invite/send.invite';
import { SetupCompanyComponent } from './setupcompany/setup.company.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { NoemailComponent } from './noemail/noemail.component';

import { AuthGuard } from './services/auth-guard.service';
import { PersonInfoResolver, TRPListResolver, FRPListResolver } from './services/person-info.resolver';
import { PersonDataProviderService } from './services/person-data-provider.service';
import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';

import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
import { AccountValidationCriteriaComponent } from './account-validation-criteria/account-validation-criteria.component';

//Locations Template Components
import { LocationsUiComponent } from './locations-ui/locations.ui';
import { AddSingleLocationComponent } from './locations-ui/add.single.location/add.single.location';
import { AddMultipleLocationComponent } from './locations-ui/add.multiple.location/add.multiple.location';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent,
      children : [
        { path : '', component : SignupSelectRoleComponent  },
        { path : 'user', component : SignupUserInfoComponent  },
        { path: 'warden-signup', component: WardenSignupComponent }
      ]
  },
  { path: 'no-email', component: NoemailComponent },
  { path: 'success-valiadation', component: EmailSuccessVerficiationComponent },
  { path: 'forgot-password', component: ForgotpasswordComponent},
  { path: 'change-user-password/:token', component: ChangepasswordComponent},
  { path: '', canActivate: [AuthGuard], component: DashboardComponent },
  { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent, children: [
      { path: 'person-info', component: PersonInfoComponent, resolve: { personInfo: PersonInfoResolver } },
      { path: 'company-information', component: CompanyInformationComponent },
      { path : 'send-invite', component : SendInviteComponent }
    ]
  },
  { path : 'setup-company', canActivate: [AuthGuard], component : SetupCompanyComponent },
  { path: 'signout', component: SignoutComponent },
  { path: 'custom-resolver', component: CustomHttpDataProviderComponent },
  { path: 'validation-criteria', canActivate: [AuthGuard], component: AccountValidationCriteriaComponent },
  /*{ path: '**', redirectTo: '/dashboard'},*/
  { 
    path: 'locations-ui', component : LocationsUiComponent,
    children : [
      { path : 'add-single-location', component : AddSingleLocationComponent },
      { path : 'add-multiple-location', component : AddMultipleLocationComponent }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  providers: [
    AuthGuard,
    PersonDataProviderService,
    PersonInfoResolver
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {

}
