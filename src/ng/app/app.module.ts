import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './auth/token.interceptor';

// services section
import { AuthService } from './services/auth.service';
import { AuthGuard } from './services/auth-guard.service';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignoutComponent } from './signout/signout.component';
import { PersonInfoComponent } from './dashboard/person-info/person-info.component';
import { CompanyInformationComponent } from './dashboard/company_information/company.information.component';
import { SendInviteComponent } from './dashboard/send-invite/send.invite';
import { SetupCompanyComponent } from './setupcompany/setup.company.component';

import { SignupService } from './services/signup.service';
import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
import { AccountValidationCriteriaComponent } from './account-validation-criteria/account-validation-criteria.component';
import { NoemailComponent } from './noemail/noemail.component';

//Locations Template Components
import { LocationsUiComponent } from './locations-ui/locations.ui';
import { AddSingleLocationComponent } from './locations-ui/add.single.location/add.single.location';
import { AddMultipleLocationComponent } from './locations-ui/add.multiple.location/add.multiple.location';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    ForgotpasswordComponent,
    ChangepasswordComponent,
    NavbarComponent,
    DashboardComponent,
    SignoutComponent,
    CompanyInformationComponent,
    SetupCompanyComponent,
    PersonInfoComponent,
    EmailSuccessVerficiationComponent,
    WardenSignupComponent,
    SignupSelectRoleComponent,
    SignupUserInfoComponent,
    SendInviteComponent,
    CustomHttpDataProviderComponent,
    AccountValidationCriteriaComponent,
    NoemailComponent,

    LocationsUiComponent,
    AddSingleLocationComponent,
    AddMultipleLocationComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    SignupService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
