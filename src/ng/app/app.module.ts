
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './auth/token.interceptor';
import { CommonModule } from '@angular/common';
import { ngfModule, ngf } from 'angular-file';
// services section
import { AuthService } from './services/auth.service';
import { AuthGuard } from './services/auth-guard.service';
import { CanDeactivateGuard } from './services/can-deactivate.guard.service';
import { SignupService } from './services/signup.service';
import { MessageService } from './services/messaging.service';
import { LocationsService } from './services/locations';
import { AlertService } from './services/alert.service';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { NavbarComponent } from './navbar/navbar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { StayAndGoComponent } from './dashboard/stay-go/stay_go.component';
import { AlertComponent } from './alert/alert.component';
import { RoleConfirmComponent } from './confirmation/role-confirmed/role-confirmed.component';
import { RoleResignedComponent } from './confirmation/role-resigned/role-resigned.component';

import { FrpTrpDashboardComponent } from './dashboard/frp.trp/frp.trp.component';
import { UserDashboardComponent  } from './dashboard/user/user.component';
import { SecurityPrivacyComponent } from './dashboard/security-privacy/security.privacy';
import { SignoutComponent } from './signout/signout.component';
import { PersonInfoComponent } from './dashboard/person-info/person-info.component';

import { WardenInvitationFormComponent } from './signup/warden-invite/warden-invite.component';
import { TenantInvitationFormComponent } from './signup/trp-invite/tenant-invite.component';
import { ProfileCompletionComponent } from './signup/profile-completion/profile-completion.component';


import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
import { NoemailComponent } from './noemail/noemail.component';
import { LocationSignupComponent } from './signup/location.signup/location.signup';



import { SublocationComponent } from './location/sublocation/sublocation.component';

// ******* LOCATIONS ***********
import { ReactiveFormsModule } from '@angular/forms';
import { LocationListComponent } from './location/list/location-list.component';
import { ViewSingleLocation } from './location/view.single/view-single.component';
import { LocationComponent } from './location/location.component';
import { BuildingActivityComponent } from './location/activity/building-activity.component';
import { SummaryOfChangesComponent } from './location/changes-summary/summary-changes.component';

import { VerificationComponent } from './location/verification/verification.component';


import { ImportCsvButtonComponent } from './import-csv/import-csv';

import { TeamsComponent } from './teams/teams.component';
import { TeamsAddWardenComponent } from './teams/add-wardens/add-wardens.component';
import { MobilityImpairedComponent } from './teams/mobility-impaired/mobility.impaired.component';
import { MobilityImpairedArchivedComponent } from './teams/mobility-impaired-archived/mobility.impaired.archived.component';
import { AddMobilityImpairedComponent } from './teams/add-mobility-impaired/add.mobility.impaired.component';
import { ListWardensComponent } from './teams/list-wardens/list.wardens.component';

import { AllUsersComponent } from './teams/all-users/all.users.component';
import { AllUsersArchivedComponent } from './teams/all-users-archived/all.users.archived.component';
import { AddUserComponent } from './teams/add-user/add.user.component';
import { ViewUserComponent } from './teams/view-user/view.user.component';
import { ViewWardenComponent } from './teams/view-warden/view.warden.component';
import { ViewChiefWardenComponent } from './teams/view-chief-warden/view.chief.warden.component';
import { ViewGeneralOccupantComponent } from './teams/view-gen-occupant/view.gen.occupant.component';
import { NgDatepickerModule } from 'ng2-datepicker';
import { ListGeneralOccupantComponent } from './teams/list-gen-occ/list.gen.occ.component';
import { TeamsAddGeneralOccupantComponent } from './teams/add-gen-occ/add.gen.occ.component';
import { ViewAccountRoleComponent } from './teams/view-account-role/view-account-role.component';

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

// TRAINING
import { TrainingsComponent } from './trainings/trainings.component';
import { MyTrainingsComponent } from './trainings/my-training/mytraining.component';
import { TeamTrainingComponent } from './trainings/team-training/team.training.component';
import { TrainingInviteComponent } from './trainings/training-invite/training.invite.component';
import { TrainingProfile } from './trainings/training-profile/training.profile.component';
import { NewTrainingComponent } from './trainings/new-training/new-training.component';
import { TrainingCertificate } from './trainings/certificate/certificate.component';

import { WardenBenchMarkingComponent } from './warden-benchmarking/warden-benchmarking.component';

import { ReportsComponent } from './reports/reports.component';
import { ChooseReportComponent } from './reports/choose.report/choose.report.component';
import { ReportsLocationsComponent  } from './reports/locations/reports.locations.component';
import { ReportsLocationsSummaryOfComplianceComponent  } from './reports/summary-of-compliance/summary.of.compliance.component';
import { ReportsLocationsComplianceComponent } from './reports/location-compliance/location.compliance.component';
import { ReportsLocationsStatementComplianceComponent } from './reports/statement-compliance/statement.compliance.component';
import { ReportsTeamsComponent } from './reports/teams/teams.component';
import { ReportsTrainingsComponent } from './reports/trainings/trainings.component';
import { WardenReportsComponent } from './reports/warden/warden.component';
import { ReportsActivityLogComponent } from './reports/activity-log/activit.log.component';
import { AssignCoursesComponent } from './assign-courses/assign.courses.component';
import { EpcMinutesMeetingComponent } from './compliance/epc-minutes-meeting/epc.minutes.meeting';

// NOTIFICATION
import { NotificationModule } from './notification/notification.module';
/*
import { NotificationListComponent } from './notification/list/notification-list.component';
import { NotificationConfigurationComponent } from './notification/configuration/notification-config.component';
import { NotifiedUsersListComponent } from './notification/notified-users-list/notified-users-list.component';
import { NotificationQueryComponent } from './notification/queries/notification-queries.component';
import { NotificationWardenListComponent } from './notification/warden-list/warden-list.component';
import { NotificationPEEPListComponent } from './notification/peep-list/peep-list.component';
import { WardenNotificationComponent } from './notification/warden-notification/warden-notification';
import { SummaryViewComponent } from './notification/summary-view/summary.view.component';
import { NotifiedTrpUpdateProfileComponent } from './notification/notified-trp-update-profile/notified-trp-update-profile.component';
import { NotifiedTRPTrainingsComponent } from './notification/notified-trp-training/notified-trp-training.component';
*/

import { NotifiedWardenListComponent } from './notification/notified-warden-list/notified-warden-list.component';
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
import { AdminViewUserComponent } from './admin/view-user/view.user.component';
import { TrainingValidationComponent } from './admin/training-validation/training-validation.component';
import { AddAccountLocationComponent } from './admin/add-location/add-location.component';
import { AccountTrainingComponent } from './admin/account-training/account-training.component';
import { AdminReportsComponent } from './admin/reports/reports.component';
import { AdminAddAccountComponent } from './admin/add-account/add-account.component';
import { PaperAttendanceComponent } from './admin/paper-attendance/paper-attendance.component';
import {  PeepFormComponent } from './peep.form/peep.form';
import { RewardProgramConfigComponent } from './admin/rewards/config/reward-program-config.component';
import { ListRewardConfigComponent } from './admin/rewards/list/list-reward-config.component';
import { RedeemersComponent } from './admin/rewards/redeemers/redeemers.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ArchiveComponent } from './admin/archives/archives.component'

import { BreadCrumbsComponent } from './breadcrumbs/breadcrumbs';

@NgModule({
  declarations: [
    BreadCrumbsComponent,
    SafeHtmlPipe,
    AppComponent,
    LoginComponent,
    SignupComponent,
    ForgotpasswordComponent,
    ChangepasswordComponent,
    NavbarComponent,
    DashboardComponent,
    SecurityPrivacyComponent,
    FrpTrpDashboardComponent,
    UserDashboardComponent,
    WardenInvitationFormComponent,
    TenantInvitationFormComponent,
    ProfileCompletionComponent,
    SignoutComponent,
    PersonInfoComponent,
    EmailSuccessVerficiationComponent,
    WardenSignupComponent,
    SignupSelectRoleComponent,
    SignupUserInfoComponent,
    CustomHttpDataProviderComponent,
    NoemailComponent,
    LocationSignupComponent,
    SublocationComponent,

    // LOCATION
    LocationListComponent,
    ViewSingleLocation,
    LocationComponent,
    VerificationComponent,
    BuildingActivityComponent,
    SummaryOfChangesComponent,

    // ViewSublocationComponent
    ImportCsvButtonComponent,
    TeamsComponent,
    TeamsAddWardenComponent,
    MobilityImpairedComponent,
    MobilityImpairedArchivedComponent,
    AddMobilityImpairedComponent,
    ListWardensComponent,
    AllUsersComponent,
    AddUserComponent,
    ViewUserComponent,
    ViewWardenComponent,
    ViewGeneralOccupantComponent,
    ViewChiefWardenComponent,
    AllUsersArchivedComponent,
    ListGeneralOccupantComponent,
    TeamsAddGeneralOccupantComponent,
    ViewAccountRoleComponent,

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
    NewTrainingComponent,
    WardenBenchMarkingComponent,
    TrainingCertificate,

    ReportsComponent,
    ChooseReportComponent,
    ReportsLocationsComponent,
    ReportsLocationsSummaryOfComplianceComponent,
    ReportsLocationsComplianceComponent,
    ReportsLocationsStatementComplianceComponent,
    ReportsTeamsComponent,
    ReportsTrainingsComponent,
    WardenReportsComponent,
    ReportsActivityLogComponent,
    AssignCoursesComponent,
    EpcMinutesMeetingComponent,
    // NOTIFICATION

   NotifiedWardenListComponent,
    // ADMIN COMPONENTS
    AdminComponent,
    ArchiveComponent,
    ListAccountsComponent,
    AccountInfoComponent,
    AccountUsersListComponent,
    AddAccountUserComponent,
    NavComponent,
    LocationsInAccountComponent,
    UploadComplianceDocComponent,
    ComplianceSummaryViewComponent,
    AdminViewLocationComponent,
    AdminViewUserComponent,
    TrainingValidationComponent,
    AccountTrainingComponent,
    AdminReportsComponent,
    AdminAddAccountComponent,
    PaperAttendanceComponent,
    PeepFormComponent,
    AlertComponent,
    AddAccountLocationComponent,
    RewardProgramConfigComponent,
    ListRewardConfigComponent,
    RedeemersComponent,
    RoleConfirmComponent,
    RoleResignedComponent,
    StayAndGoComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    NgMultiSelectDropDownModule.forRoot(),
    ReactiveFormsModule,
    NgDatepickerModule,
    CommonModule,
    ngfModule,
    NotificationModule,
  ],
  providers: [
    AuthService,
    AuthGuard,
    LocationsService,
    MessageService,
    SignupService,
    CanDeactivateGuard,
    AlertService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
