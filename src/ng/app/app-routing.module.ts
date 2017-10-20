import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SignoutComponent } from './signout/signout.component';
import { CompanyInformationComponent } from './dashboard/company_information/company.information.component';
import { SetupCompanyComponent } from './setupcompany/setup.company.component';

import { AuthGuard } from './services/auth-guard.service';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent},
  { path: 'forgot-password', component: ForgotpasswordComponent},
  { path: 'change-password/:user_id/:fullname/:token', component: ChangepasswordComponent},
  { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent,
    children: [
      { path:'company-information', component: CompanyInformationComponent }
    ]
  },
  { path : 'setup-company', canActivate: [AuthGuard], component : SetupCompanyComponent },
  { path: 'signout', component: SignoutComponent },
  { path: '**', redirectTo: '/dashboard'}
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  providers: [AuthGuard],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {

}
