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
import { WardenInvitationFormComponent } from './signup/warden-invite/warden-invite.component';
import { NoemailComponent } from './noemail/noemail.component';

import { AuthGuard } from './services/auth-guard.service';
import { PersonInfoResolver} from './services/person-info.resolver';
import { PersonDataProviderService } from './services/person-data-provider.service';
import { EmailSuccessVerficiationComponent } from './email-success-verficiation/email-success-verficiation.component';
import { WardenSignupComponent } from './warden-signup/warden-signup.component';

import { CustomHttpDataProviderComponent } from './custom-http-data-provider/custom-http-data-provider.component';
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

import { LocationListComponent } from './location/list/location-list.component';
import { ViewSingleLocation } from './location/view.single/view-single.component';
import { LocationComponent } from './location/location.component';
import { SublocationComponent } from './location/sublocation/sublocation.component';
import { VerificationComponent } from './location/verification/verification.component';

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

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent,
      children : [
        { path : '', component : SignupSelectRoleComponent  },
        { path : 'user', component : SignupUserInfoComponent  },
        { path: 'warden-signup', component: WardenSignupComponent },
        { path: 'warden-profile-completion/:token', component: WardenInvitationFormComponent }
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
  //
  { path: 'setup-location', canActivate: [AuthGuard], component: SetupLocationComponent },
  { path: 'setup-company', canActivate: [AuthGuard], component : SetupCompanyComponent },
  { path: 'signout', component: SignoutComponent },
  { path: 'custom-resolver', component: CustomHttpDataProviderComponent },
  /*{ path: '**', redirectTo: '/dashboard'},*/
  { path: 'location', component: LocationComponent, children: [
    { path: 'list', component: LocationListComponent },
    { path: 'search', component: SearchLocationComponent },
    { path: 'view/:encrypted', component: ViewSingleLocation },
    { path: 'view-sublocation/:encrypted', component: SublocationComponent },
    { path: 'verify-access', component: VerificationComponent },
    { path : 'compliance', component : ComplianceComponent,
      children : [
        { path : 'view', component : ViewComplianceComponent }
      ]
    }
  ]},
  {
    path: 'locations-ui', component : LocationsUiComponent,
    children : [
      { path : 'add-single-location', component : AddSingleLocationComponent },
      { path : 'add-multiple-location', component : AddMultipleLocationComponent },
      { path : 'add-multiple-next-location', component : AddMultipleNextLocationComponent },
      { path : 'view-location-list', component : ViewLocationListComponent },
      { path : 'view-location-single', component : ViewLocationSingleComponent },
      { path : 'view-location-multiple', component : ViewLocationMultipleComponent }
    ]
  },
  {
    path : 'view-location/:encrypted', canActivate: [AuthGuard], component : ViewSingleLocation
  },
  {
    path : 'teams', canActivate: [AuthGuard], component : TeamsComponent,
    children : [
      { path : 'add-wardens', component : TeamsAddWardenComponent },
      { path : 'mobility-impaired', component : MobilityImpairedComponent },
      { path : 'mobility-impaired-archived', component : MobilityImpairedArchivedComponent },
      { path : 'add-mobility-impaired', component : AddMobilityImpairedComponent },
      { path : 'list-wardens', component : ListWardensComponent },
      { path : 'list-archived-wardens', component : ListArchivedWardensComponent },
      { path : 'all-users', component : AllUsersComponent },
      { path : 'all-archived-users', component : AllUsersArchivedComponent },
      { path : 'add-user', component : AddUserComponent },
      { path : 'view-user/:encrypted', component : ViewUserComponent },
      { path : 'view-warden', component : ViewWardenComponent },
      { path : 'view-gen-occupant', component : ViewGeneralOccupantComponent },
      { path : 'view-chief-warden', component : ViewChiefWardenComponent }
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
