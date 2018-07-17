
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './auth/token.interceptor';
import { CommonModule } from '@angular/common';
import { ngfModule, ngf } from 'angular-file';
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
import { TenantInvitationFormComponent } from './signup/trp-invite/tenant-invite.component';
import { ProfileCompletionComponent } from './signup/profile-completion/profile-completion.component';


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
import { WardenLocationComponent } from './location/warden/warden.location.component';

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
import { TrainingProfile } from './trainings/training-profile/training.profile.component';

import { WardenBenchMarkingComponent } from './warden-benchmarking/warden-benchmarking.component';

import { ReportsComponent } from './reports/reports.component';
import { ChooseReportComponent } from './reports/choose.report/choose.report.component';
import { ReportsLocationsComponent  } from './reports/locations/reports.locations.component';
import { ReportsLocationsSummaryOfComplianceComponent  } from './reports/summary-of-compliance/summary.of.compliance.component';
import { ReportsLocationsComplianceComponent } from './reports/location-compliance/location.compliance.component';
import { ReportsLocationsStatementComplianceComponent } from './reports/statement-compliance/statement.compliance.component';
import { ReportsTeamsComponent } from './reports/teams/teams.component';
import { ReportsTrainingsComponent } from './reports/trainings/trainings.component';
import { ReportsActivityLogComponent } from './reports/activity-log/activit.log.component';
import { AssignCoursesComponent } from './assign-courses/assign.courses.component';
import { EpcMinutesMeetingComponent } from './compliance/epc-minutes-meeting/epc.minutes.meeting';

// ADMIN COMPONENTS HERE
import { AdminComponent } from './admin/admin.component';
import { ListAccountsComponent } from './admin/list-accounts/list-accounts.component';
import { AccountInfoComponent } from './admin/account-info/account-info.component';
import { AccountUsersListComponent } from './admin/account-users/account-users.component';
import { AddAccountUserComponent } from './admin/add-user/add-user.component';
import { NavComponent } from './admin/nav/nav.component';
import { LocationsInAccountComponent } from './admin/locations-in-accounts/locations-in-account.component';
import { UploadComplianceDocComponent } from './admin/upload-compliance-docs/upload-compliance-docs.component';
import { ComplianceSummaryViewComponent } from './admin/compliance-summary-view/compliance-summary-view.component';
import { AdminViewLocationComponent } from './admin/view-location/view-location.component';
import { TrainingValidationComponent } from './admin/training-validation/training-validation.component';
import { AdminReportsComponent } from './admin/reports/reports.component';

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
    TenantInvitationFormComponent,
    ProfileCompletionComponent,
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
    WardenLocationComponent,
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
    TrainingProfile,
    WardenBenchMarkingComponent,

    ReportsComponent,
    ChooseReportComponent,
    ReportsLocationsComponent,
    ReportsLocationsSummaryOfComplianceComponent,
    ReportsLocationsComplianceComponent,
    ReportsLocationsStatementComplianceComponent,
    ReportsTeamsComponent,
    ReportsTrainingsComponent,
    ReportsActivityLogComponent,
    AssignCoursesComponent,
    EpcMinutesMeetingComponent,
    // ADMIN COMPONENTS
    AdminComponent,
    ListAccountsComponent,
    AccountInfoComponent,
    AccountUsersListComponent,
    AddAccountUserComponent,
    NavComponent,
    LocationsInAccountComponent,
    UploadComplianceDocComponent,
    ComplianceSummaryViewComponent,
    AdminViewLocationComponent,
    TrainingValidationComponent,
    AdminReportsComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyDiE9BDUZGheckC5U_yQqbQlVrEBENs9HA',
      // apiKey : 'AIzaSyDmkSaP4MEhSdZxmndpExIbDEaJ3_kZpTk',
      libraries: ['places']
    }),
    // todo: move to location module
    ReactiveFormsModule,
    NgDatepickerModule,
    CommonModule,
    ngfModule
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
