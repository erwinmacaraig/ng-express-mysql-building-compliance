import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class AccountsDataProviderService {

	private headers: Object;
  	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    	this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	getByUserId(user_id, callBack){
		this.http.get(this.baseUrl+"/accounts/get-by-user/"+user_id, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	getById(id, callBack){
		this.http.get(this.baseUrl+"/accounts/get/"+id, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	getAll(callBack){
		this.http.get(this.baseUrl+"/accounts/get-all", this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	saveAccountInvitationCode(opt, callBack){
		this.http.post(this.baseUrl+"/accounts/save-account-code", opt, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	getRelatedAccounts(account_id, callBack){
		this.http.get(this.baseUrl+"/accounts/get-realated-accounts/"+account_id, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	sendUserInvitation(opt, callBack){
		this.http.post(this.baseUrl+"/accounts/send-user-invitation/", opt, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	searhByName(name, callBack){
		this.http.get(this.baseUrl+"/accounts/search/"+name, this.options)
	      .subscribe(res => {
	        callBack(res);
	      }, err => {
	        callBack( JSON.parse(err.error) );
	      });
	}

	update(formData){
		return this.http.post(this.baseUrl+"/accounts/create", formData, this.options);
	}

    isOnlineTrainingValid(callBack){
        this.http.get(this.baseUrl+"/accounts/is-online-training-valid", this.options)
          .subscribe(res => {
            callBack(res);
          }, err => {
            callBack( JSON.parse(err.error) );
          });
    }

  searchForBuildings(buildingName = '') {
    const httpParams = new HttpParams().set('bldgName', buildingName);
    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/accounts/search-building/', this.options);
  }

  createConfig(configStr = '') {
    return this.http.post(this.baseUrl + '/accounts/create-notification-config/', {
      config: configStr
    });
  }

  listNotificationConfig() {
    return this.http.get(`${this.baseUrl}/accounts/list-notification-config/`, this.options);
  }

  generateNotifiedUsersList(configId = '') {
     const httpParams = new HttpParams().set('config_id', configId);
     this.options['params'] = httpParams;
     return this.http.get(`${this.baseUrl}/accounts/list-notified-users/`, this.options);
	}

	submitQueryResponses(responses='', notification_token_id = 0, completed=0, status='In Progress') {
       return this.http.post(this.baseUrl + '/accounts/process-query-notified-user-responses/', {
			      query_responses: responses,
				    notification_token_id: notification_token_id,
						completed: completed,
						strStatus: status
			 });
	}

}
