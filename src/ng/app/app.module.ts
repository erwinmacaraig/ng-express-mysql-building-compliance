import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './auth/token.interceptor';
import { CommonModule } from '@angular/common';

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

import { FrpTrpDashboardComponent } from './dashboard/frp.trp/frp.trp.component';
import { UserDashboardComponent  } from './dashboard/user/user.component';


import { SignoutComponent } from './signout/signout.component';
import { PersonInfoComponent } from './dashboard/person-info/person-info.component';
import { CompanyInformationComponent } from './dashboard/company_information/company.information.component';
import { SendInviteComponent } from './dashboard/send-invite/send.invite';
import { SetupCompanyComponent } from './setupcompany/setup.company.component';

import { WardenInvitationFormComponent } from './signup/warden-invite/warden-invite.component';

import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
import { NoemailComponent } from './noemail/noemail.component';


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
import { ArchivedLocationListComponent } from './location/archived.list/archived.list.component';

import { TeamsComponent } from './teams/teams.component';
import { TeamsAddWardenComponent } from './teams/add-wardens/add-wardens.component';
import { MobilityImpairedComponent } from './teams/mobility-impaired/mobility.impaired.component';
import { MobilityImpairedArchivedComponent } from './teams/mobility-impaired-archived/mobility.impaired.archived.component';
import { AddMobilityImpairedComponent } from './teams/add-mobility-impaired/add.mobility.impaired.component';
import { ListWardensComponent } from './teams/list-wardens/list.wardens.component';
import { ListArchivedWardensComponent } from './teams/list-wardens-archived/list.wardens.archived.component';
import { AllUsersComponent } from './teams/all-users/all.users.component';
import { AllUsersArchivedComponent } from './teams/all-users-archived/all.users.archived.component';
import { AddUserComponent } from './teams/add-user/add.user.component';
import { ViewUserComponent } from './teams/view-user/view.user.component';
import { ViewWardenComponent } from './teams/view-warden/view.warden.component';
import { ViewChiefWardenComponent } from './teams/view-chief-warden/view.chief.warden.component';
import { ViewGeneralOccupantComponent } from './teams/view-gen-occupant/view.gen.occupant.component';
import { NgDatepickerModule } from 'ng2-datepicker';

import { ComplianceComponent } from './compliance/compliance.component';
import { ViewComplianceComponent } from './compliance/view-compliance/view.compliance.component';

import { ShopComponent } from './shop/shop.component';
import { CompliancePackageComponent } from './shop/compliance.package.component/compliance.package.component';
import { TrainingsPackageComponent } from './shop/trainings.package.component/trainings.package.component';
import { EvacuationDiagramPackageComponent } from './shop/evacuation.diagram.package.component/evacuation.diagram.package.component';
import { ExampleComponent } from './shop/example.component/example.component';
import { PaymentResponseComponent } from './payment.response/payment.response.component';
import { CartComponent } from './shop/cart.component/cart.component';
import { PaymentComponent } from './shop/payment.component/payment.component';
import { ProductsFavoritesComponent } from './shop/products.favorites/product.favorites.component';

import { SafeHtmlPipe } from './pipes/safehtml';

import { TrainingsComponent } from './trainings/trainings.component';
import { MyTrainingsComponent } from './trainings/my-training/mytraining.component';
import { TeamTrainingComponent } from './trainings/team-training/team.training.component';
import { TrainingInviteComponent } from './trainings/training-invite/training.invite.component';

import { WardenBenchMarkingComponent } from './warden-benchmarking/warden-benchmarking.component';

import { ReportsComponent } from './reports/reports.component';
import { ReportsLocationsComponent  } from './reports/locations/reports.locations.component';
import { ReportsLocationsSummaryOfComplianceComponent  } from './reports/summary-of-compliance/summary.of.compliance.component';
import { ReportsLocationsComplianceComponent } from './reports/location-compliance/location.compliance.component';
import { ReportsLocationsStatementComplianceComponent } from './reports/statement-compliance/statement.compliance.component';
import { ReportsTeamsComponent } from './reports/teams/teams.component';
import { ReportsTrainingsComponent } from './reports/trainings/trainings.component';


@NgModule({
  declarations: [
    SafeHtmlPipe,
    AppComponent,
    LoginComponent,
    SignupComponent,
    ForgotpasswordComponent,
    ChangepasswordComponent,
    NavbarComponent,
    DashboardComponent,

    FrpTrpDashboardComponent,
    UserDashboardComponent,

    WardenInvitationFormComponent,
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

    SublocationComponent,
    SearchLocationComponent,
    // todo: move to location module
    SetupLocationComponent,
    LocationListComponent,
    ViewSingleLocation,
    LocationComponent,
    VerificationComponent,
    ArchivedLocationListComponent,
    // ViewSublocationComponent

    TeamsComponent,
    TeamsAddWardenComponent,
    MobilityImpairedComponent,
    MobilityImpairedArchivedComponent,
    AddMobilityImpairedComponent,
    ListWardensComponent,
    ListArchivedWardensComponent,
    AllUsersComponent,
    AddUserComponent,
    ViewUserComponent,
    ViewWardenComponent,
    ViewGeneralOccupantComponent,
    ViewChiefWardenComponent,
    AllUsersArchivedComponent,

    ComplianceComponent,
    ViewComplianceComponent,

    ShopComponent,
    CompliancePackageComponent,
    TrainingsPackageComponent,
    EvacuationDiagramPackageComponent,
    ExampleComponent,
    PaymentResponseComponent,
    CartComponent,
    PaymentComponent,
    ProductsFavoritesComponent,

    TrainingsComponent,
    MyTrainingsComponent,
    TeamTrainingComponent,
    TrainingInviteComponent,
    WardenBenchMarkingComponent,

    ReportsComponent,
    ReportsLocationsComponent,
    ReportsLocationsSummaryOfComplianceComponent,
    ReportsLocationsComplianceComponent,
    ReportsLocationsStatementComplianceComponent,
    ReportsTeamsComponent,
    ReportsTrainingsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    AgmCoreModule.forRoot({
      // apiKey: 'AIzaSyDiE9BDUZGheckC5U_yQqbQlVrEBENs9HA',
      apiKey : 'AIzaSyD4QEsIs8QgjTj0bOIizxUZqIk7zVgFxzk ',
      libraries: ['places']
    }),
    // todo: move to location module
    ReactiveFormsModule,
    NgDatepickerModule,
    CommonModule
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
