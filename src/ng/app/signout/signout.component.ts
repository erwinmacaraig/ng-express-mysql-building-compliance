import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signout',
  templateUrl: './signout.component.html',
  styleUrls: ['./signout.component.css']
})
export class SignoutComponent implements OnInit {

	constructor(private auth: AuthService, private router: Router) { }

	ngOnInit() {
		this.auth.removeToken();
		this.auth.removeUserData();
		localStorage.removeItem('showemailverification');
		setTimeout(()=>{ this.router.navigate(['/login']) }, 300);
	}

}
