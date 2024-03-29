import { Injectable } from '@angular/core';
import { HttpRequest,
         HttpHandler,
         HttpEvent,
         HttpInterceptor
       } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs/Observable';
import * as moment from 'moment';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(public auth: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler):
            Observable<HttpEvent<any>> {


    let unix = moment().toISOString();
    request = request.clone({
      setHeaders: {
        Authorization: 'Bearer '+this.auth.getToken(),
        timestamp : unix
      }
    });

    return next.handle(request);
  }

}
