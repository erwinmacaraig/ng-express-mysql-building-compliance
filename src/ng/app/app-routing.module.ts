import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ForgotpasswordComponent } from './forgotpassword/forgotpassword.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';

const appRoutes: Routes = [
  { path: 'login', component: LoginComponent},
  { path: 'signup', component: SignupComponent},
  { path: 'forgot-password', component: ForgotpasswordComponent},
  { path: 'change-password/:user_id/:fullname/:token', component: ChangepasswordComponent},
  { path: '', component: LoginComponent },
  { path: '**', redirectTo: '/login'},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {

}
