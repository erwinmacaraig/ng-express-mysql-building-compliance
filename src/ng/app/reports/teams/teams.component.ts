import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/messaging.service';
import { EncryptDecryptService } from '../../services/encrypt.decrypt';
import { ReportService } from '../../services/report.service';

declare var $: any;

@Component({
  selector : 'app-teams-compliance-component',
  templateUrl : './teams.component.html',
  styleUrls : [ './teams.component.css' ],
  providers : [ ReportService, EncryptDecryptService ]
})

export class ReportsTeamsComponent implements OnInit, OnDestroy {

  userData = {};
  reportData = [];
  private sub: any;
  public locationIdDecrypted;
  constructor (
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private encryptDecrypt: EncryptDecryptService,
    private reportService: ReportService
  ) {

		this.userData = this.authService.getUserData();

	}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.locationIdDecrypted = this.encryptDecrypt.decrypt(params['location']);
      console.log(`Decrypted location id ${this.locationIdDecrypted}`);
        this.reportService.generateTeamReportingOnLocation(this.locationIdDecrypted)
        .subscribe((response) => {
          console.log(response);
          this.reportData = response['data'];
        }, (e) => {
          console.log(e);
        });
    });
  }

	ngAfterViewInit(){
		$('select').material_select();
	}

	ngOnDestroy(){

	}

}
