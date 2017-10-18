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

import { AuthGuard } from './services/auth-guard.service';
import { PersonInfoResolver } from './services/person-info.resolver';
import { PersonDataProviderService } from './services/person-data-provider.service';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent},
  { path: 'forgot-password', component: ForgotpasswordComponent},
  { path: 'change-password/:user_id/:fullname/:token', component: ChangepasswordComponent},
  { path: '', canActivate: [AuthGuard], component: DashboardComponent },
  { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent, children: [
    { path: 'person-info', component: PersonInfoComponent, resolve: { personInfo: PersonInfoResolver } }
    ]
  },
  { path: 'signout', component: SignoutComponent },
  { path: '**', redirectTo: '/'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  providers: [AuthGuard, PersonDataProviderService, PersonInfoResolver],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {

}
