import { CanActivate } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { RouterStateSnapshot } from '@angular/router';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import * as moment from 'moment';
import * as ng2JWT from 'angular2-jwt';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
              private router: Router){}


  canActivate(route: ActivatedRouteSnapshot,
              state: RouterStateSnapshot):
              Observable<boolean> |
              Promise<boolean> |
              boolean
  {
    if (this.authService.getToken()) {
      if( ng2JWT.tokenNotExpired('currentUser') ){
        return true;
      }
    }
    window.location.href = 'https://portal.evacconnect.com/login';
    // this.router.navigate(['/login']);
    return false;
  }
}