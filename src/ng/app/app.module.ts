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
import { SignupService } from './services/signup.service';
import { MessageService } from './services/messaging.service';
import { LocationsService } from './services/locations';

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


import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
import { NoemailComponent } from './noemail/noemail.component';

// todo: integrate
// Locations Template Components
import { LocationsUiComponent } from './locations-ui/locations.ui';
import { AddSingleLocationComponent } from './locations-ui/add.single.location/add.single.location';
import { AddMultipleLocationComponent } from './locations-ui/add.multiple.location/add.multiple.location';
import { AddMultipleNextLocationComponent } from './locations-ui/add.multiple.next.location/add.multiple.next.location';
import { ViewLocationListComponent } from './locations-ui/view.location.list/view.location.list';
import { ViewLocationSingleComponent } from './locations-ui/view.location.single/view.location.single';
import { ViewLocationMultipleComponent } from './locations-ui/view.location.multiple/view.location.multiple';

// import { ViewSublocationComponent } from './locations-ui/view.sublocation/view.sublocation';
import { SearchLocationComponent } from './location/search/search-location.component';


import { SublocationComponent } from './location/sublocation/sublocation.component';


// todo: move to locations module
import { ReactiveFormsModule } from '@angular/forms';
import { AgmCoreModule } from '@agm/core';
import { SetupLocationComponent } from './location/setup-location/setup-location.component';
import { LocationListComponent } from './location/list/location-list.component';
import { ViewSingleLocation } from './location/view.single/view-single.component';
import { LocationComponent } from './location/location.component';
import { VerificationComponent } from './location/verification/verification.component';

import { TeamsComponent } from './teams/teams.component';
import { TeamsAddWardenComponent } from './teams/add-wardens/add-wardens.component';
import { MobilityImpairedComponent } from './teams/mobility.impaired/mobility.impaired.component';
import { AddMobilityImpairedComponent } from './teams/add.mobility.impaired/add.mobility.impaired';
import { ListWardensComponent } from './teams/list.wardens/list.wardens';


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
    NoemailComponent,
    // todo: integrate
    LocationsUiComponent,
    AddSingleLocationComponent,
    AddMultipleLocationComponent,
    AddMultipleNextLocationComponent,
    ViewLocationListComponent,
    ViewLocationSingleComponent,
    ViewLocationMultipleComponent,
    SublocationComponent,
    SearchLocationComponent,
    // todo: move to location module
    SetupLocationComponent,
    LocationListComponent,
    ViewSingleLocation,
    LocationComponent,
    VerificationComponent,
    // ViewSublocationComponent
    
    TeamsComponent,
    TeamsAddWardenComponent,
    MobilityImpairedComponent,
    AddMobilityImpairedComponent,
    ListWardensComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyD4QEsIs8QgjTj0bOIizxUZqIk7zVgFxzk',
      libraries: ['places']
    }),
    // todo: move to location module
    ReactiveFormsModule
  ],
  providers: [
    AuthService,
    AuthGuard,
    LocationsService,
    MessageService,
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
