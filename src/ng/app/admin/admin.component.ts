import { Component, OnInit, OnDestroy} from '@angular/core';
import { HttpClient, HttpRequest, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-admin-component',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})

export class AdminComponent implements OnInit, OnDestroy {
  userData = <any> {};
  constructor(
    private auth: AuthService,
    private router: Router) {}

  ngOnInit() {
    this.userData = this.auth.getUserData();
    if(this.userData.evac_role != 'admin'){
        this.router.navigate(['/signout']);
    }
  }

  ngOnDestroy() {}

}
