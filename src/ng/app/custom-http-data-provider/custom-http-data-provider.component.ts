import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { SignupService } from '../services/signup.service';

@Component({
  selector: 'app-custom-http-data-provider',
  templateUrl: './custom-http-data-provider.component.html',
  styleUrls: ['./custom-http-data-provider.component.css']
})
export class CustomHttpDataProviderComponent implements OnInit, OnDestroy {
  private subscription;
  constructor(private router: Router,
     private activatedRoute: ActivatedRoute,
     private http: HttpClient,
     platformLocation: PlatformLocation,
     private signupService: SignupService) {

    // forwarders
    if (this.activatedRoute.snapshot.queryParams['code']) {
      const code = this.activatedRoute.snapshot.queryParams['code'];
      this.subscription = this.signupService.getPersonInvitationCode(code).subscribe((data) => {
        this.signupService.setInvitationCode(data['data']);
        this.router.navigate(['/signup/user'], {queryParams: {role_id: this.activatedRoute.snapshot.queryParams['role_id']}});
      },
      (err: HttpErrorResponse) => {
        if (err.error instanceof Error) {
          console.log('An error occurred:', err.error.message);
        } else {
          console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        }
        router.navigate(['/login']);
      });
    }


     }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
