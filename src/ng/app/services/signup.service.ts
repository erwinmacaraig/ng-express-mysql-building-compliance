import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { InvitationCode } from '../models/invitation-code';

declare var $: any;

@Injectable()
export class SignupService {

	private headers: Object;
  private options: Object;
  private baseUrl: String;
  private invitation_code: InvitationCode;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	sendUserData(data, callBack){
		this.http.post(this.baseUrl+"/register", data, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	sendCompanyInfoSetupData(data, callBack){
		this.http.post(this.baseUrl+"/accounts/create/setup", data, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
  }

  public getPersonInvitationCode(code: string): Observable<InvitationCode> {
    return this.http.get<InvitationCode>(
      this.baseUrl + '/person-invi-code', {params: new HttpParams().set('code', code)}
    );
  }

  public setInvitationCode(code: InvitationCode): void {
    this.invitation_code = new InvitationCode(code.invitation_code_id, code.code,
    code.first_name, code.last_name, code.email, code.location_id, code.account_id, code.role_id,
    code.was_used);
  }

  public invalidateInvitationCode() {
    this.invitation_code = undefined;
  }

  public getInvitationCode(): InvitationCode {
    return this.invitation_code;
  }

  getSecurityQuestions(callBack){
    this.http.get(this.baseUrl+"/get-security-questions",  this.options)
        .subscribe(res => {
          callBack(res);
        }, err => {
          callBack( JSON.parse(err.error) );
        });
  }

  resendEmailVerification(userID, callBack){
    this.http.post(this.baseUrl+"/register/resend-email-verification", { user_id : userID })
    .subscribe(res => {
      callBack(res);
    }, err => {
      callBack( JSON.parse(err.error) );
    });
  }

  retrieveWardenInvitationInfo(token: string) {
    return this.http.get(this.baseUrl + '/team/invitation-filled-form/' + token + '/bulk', this.options);
  }

  signWardenUp(wardenProfile: object) {
    return this.http.post<any>(this.baseUrl + '/team/process-warden-invitation', wardenProfile);
  }

  retrieveTenantInvitationInfo(token: string) {
    return this.http.get(this.baseUrl + '/tenant/invitation-filled-form/' + token + '/', this.options);
  }

  signTenantUp(tenantProfile: object) {
    return this.http.post<any>(this.baseUrl + '/tenant/process-invitation-form/', tenantProfile);
  }
}
