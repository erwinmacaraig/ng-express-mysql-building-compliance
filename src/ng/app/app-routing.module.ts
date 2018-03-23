import { NgModule } from '@angular/core';
import { Routes, Resolve } from '@angular/router';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { FrpTrpDashboardComponent } from './dashboard/frp.trp/frp.trp.component';
import { UserDashboardComponent  } from './dashboard/user/user.component';

import { SignoutComponent } from './signout/signout.component';
import { PersonInfoComponent } from './dashboard/person-info/person-info.component';
import { CompanyInformationComponent } from './dashboard/company_information/company.information.component';
import { SendInviteComponent } from './dashboard/send-invite/send.invite';
import { SetupCompanyComponent } from './setupcompany/setup.company.component';
import { SignupSelectRoleComponent } from './signup/select.role/select.role.component';
import { SignupUserInfoComponent } from './signup/user.info/user.info.component';
import { WardenInvitationFormComponent } from './signup/warden-invite/warden-invite.component';
import { TenantInvitationFormComponent } from './signup/trp-invite/tenant-invite.component';
import { NoemailComponent } from './noemail/noemail.component';

import { AuthGuard } from './services/auth-guard.service';
import { PersonInfoResolver} from './services/person-info.resolver';
import { PersonDataProviderService } from './services/person-data-provider.service';
import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';

import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';

import { SearchLocationComponent } from './location/search/search-location.component';
import { LocationListComponent } from './location/list/location-list.component';
import { ViewSingleLocation } from './location/view.single/view-single.component';
import { LocationComponent } from './location/location.component';
import { SublocationComponent } from './location/sublocation/sublocation.component';
import { VerificationComponent } from './location/verification/verification.component';
import { ArchivedLocationListComponent } from './location/archived.list/archived.list.component';
import { WardenLocationComponent } from './location/waden/warden.location.component';

import { SetupLocationComponent } from './location/setup-location/setup-location.component';

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

import { TrainingsComponent } from './trainings/trainings.component';
import { MyTrainingsComponent } from './trainings/my-training/mytraining.component';
import { TeamTrainingComponent } from './trainings/team-training/team.training.component';
import { TrainingInviteComponent } from './trainings/training-invite/training.invite.component';
import { TrainingProfile } from './trainings/training-profile/training.profile.component';

import { ReportsComponent } from './reports/reports.component';
import { ChooseReportComponent } from './reports/choose.report/choose.report.component';
import { ReportsLocationsComponent  } from './reports/locations/reports.locations.component';
import { ReportsLocationsSummaryOfComplianceComponent  } from './reports/summary-of-compliance/summary.of.compliance.component';
import { ReportsLocationsComplianceComponent } from './reports/location-compliance/location.compliance.component';
import { ReportsLocationsStatementComplianceComponent } from './reports/statement-compliance/statement.compliance.component';
import { ReportsTeamsComponent } from './reports/teams/teams.component';
import { ReportsTrainingsComponent  } from './reports/trainings/trainings.component';
import { ReportsActivityLogComponent } from './reports/activity-log/activit.log.component';
import { AssignCoursesComponent } from './assign-courses/assign.courses.component';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent,
      children : [
        { path : '', component : SignupSelectRoleComponent  },
        { path : 'user', component : SignupUserInfoComponent  },
        { path: 'warden-signup', component: WardenSignupComponent },
        { path: 'warden-profile-completion/:token', component: WardenInvitationFormComponent },
        { path: 'tenant-profile-completion/:token', component: TenantInvitationFormComponent }
      ]
  },
  { path: 'no-email', component: NoemailComponent },
  { path: 'success-valiadation', component: EmailSuccessVerficiationComponent },
  { path: 'forgot-password', component: ForgotpasswordComponent},
  { path: 'change-user-password/:token', component: ChangepasswordComponent},
  { path: '', canActivate: [AuthGuard], component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent, children: [
      { path: 'main', component : FrpTrpDashboardComponent },
      { path: 'user', component : UserDashboardComponent },
      { path: 'person-info', component: PersonInfoComponent, resolve: { personInfo: PersonInfoResolver } },
      { path: 'company-information', component: CompanyInformationComponent },
      { path : 'send-invite', component : SendInviteComponent }
    ]
  },
  //
  { path: 'setup-location', canActivate: [AuthGuard], component: SetupLocationComponent },
  { path: 'setup-company', canActivate: [AuthGuard], component : SetupCompanyComponent },
  { path: 'signout', component: SignoutComponent },
  { path: 'custom-resolver', component: CustomHttpDataProviderComponent },
  /*{ path: '**', redirectTo: '/dashboard'},*/
  { path: 'location', component: LocationComponent, children: [
    { path: 'list', component: LocationListComponent },
    { path: 'archived/list', component: ArchivedLocationListComponent },
    { path: 'search', component: SearchLocationComponent },
    { path: 'view/:encrypted', component: ViewSingleLocation },
    { path: 'view-sublocation/:encrypted', component: SublocationComponent },
    { path: 'verify-access', component: VerificationComponent },
    { path : 'compliance', component : ComplianceComponent,
      children : [
        { path : 'view/:encrypted', component : ViewComplianceComponent }
      ]
    },
    { path : 'warden', component : WardenLocationComponent }
  ]},
  {
    path : 'view-location/:encrypted', canActivate: [AuthGuard], component : ViewSingleLocation
  },
  {
    path : 'teams', canActivate: [AuthGuard], component : TeamsComponent,
    children : [
      { path : 'add-wardens', component : TeamsAddWardenComponent },
      { path : 'add-wardens/:location_id', component : TeamsAddWardenComponent },
      { path : 'mobility-impaired', component : MobilityImpairedComponent },
      { path : 'mobility-impaired-archived', component : MobilityImpairedArchivedComponent },
      { path : 'add-mobility-impaired', component : AddMobilityImpairedComponent },
      { path : 'list-wardens', component : ListWardensComponent },
      { path : 'list-archived-wardens', component : ListArchivedWardensComponent },
      { path : 'all-users', component : AllUsersComponent },
      { path : 'all-archived-users', component : AllUsersArchivedComponent },
      { path : 'add-user', component : AddUserComponent },
      { path : 'add-user/:role/:location_id', component : AddUserComponent },
      { path : 'view-user/:encrypted', component : ViewUserComponent },
      { path : 'view-warden', component : ViewWardenComponent },
      { path : 'view-gen-occupant', component : ViewGeneralOccupantComponent },
      { path : 'view-chief-warden', component : ViewChiefWardenComponent }
    ]
  },
  {
    path : 'shop', canActivate: [AuthGuard], component : ShopComponent,
    children : [
      { path : 'compliance-package', component : CompliancePackageComponent },
      { path : 'trainings-package', component : TrainingsPackageComponent },
      { path : 'evacuation-diagram-package', component : EvacuationDiagramPackageComponent },
      { path : 'cart', component : CartComponent },
      { path : 'example', component : ExampleComponent },
      { path : 'payment', component : PaymentComponent },
      { path : 'favorites', component : ProductsFavoritesComponent }
    ]
  },
  {
    path : 'payment-response/:ecnrypted', component : PaymentResponseComponent
  },
  {
    path : 'trainings', canActivate: [AuthGuard], component : TrainingsComponent,
    children : [
      { path : 'my-training', component : MyTrainingsComponent },
      { path : 'team-training', component : TeamTrainingComponent },
      { path : 'training-invite', component : TrainingInviteComponent },
      { path : 'my-training-profile/:encrypted', component: TrainingProfile }
    ]
  },
  {
    path : 'reports', component : ReportsComponent,
    children : [
      { path : 'choose', component : ChooseReportComponent },
      { path : 'locations', component : ReportsLocationsComponent },
      { path : 'summary-of-compliance/:locationId', component : ReportsLocationsSummaryOfComplianceComponent },
      { path : 'statement-compliance/:locationId', component : ReportsLocationsStatementComplianceComponent },
      { path : 'teams/:location', component : ReportsTeamsComponent },
      { path : 'trainings/:locationId', component : ReportsTrainingsComponent },
      { path : 'activity-log/:location', component : ReportsActivityLogComponent }
    ]
  },
  {
    path : 'assign-courses', canActivate: [AuthGuard], component : AssignCoursesComponent
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
