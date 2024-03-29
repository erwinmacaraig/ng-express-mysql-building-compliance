import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
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

		this.baseUrl = environment.backendUrl;
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

	searhByName(name, callBack, params = {}){
        let opt = this.options;
        opt['params'] = params;
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

	submitQueryResponses(responses='', configId = 0, completed=0, status='In Progress', toUpdate = true) {
       return this.http.post(this.baseUrl + '/accounts/process-query-notified-user-responses/', {
			      query_responses: responses,
				    configId: configId,
						completed: completed,
						strStatus: status,
            update_token: toUpdate
			 });
  }

  listWardensOnNotificationFinalScreen(buildingId = '0') {
    const httpParams = new HttpParams().set('building', buildingId);
    this.options['params'] = httpParams;
    return this.http.get(`${this.baseUrl}/accounts/notification-all-wardens/`, this.options);
  }

  listPeepOnNotificationFinalScreen(buildingId = '0') {
    const httpParams = new HttpParams().set('building', buildingId);
    this.options['params'] = httpParams;
    return this.http.get(`${this.baseUrl}/accounts/notification-all-peep/`, this.options);
	}

	execNotificationAction(action='', token_id: number | string) {
		return this.http.post(`${this.baseUrl}/accounts/notification-actions/`, {
			action: action,
			notification_token_id: token_id.toString()
		});
	}

	generateSummaryListItem(building=0, role=0) {
		return this.http.post(`${this.baseUrl}/accounts/generate-notification-summary-list/`, {
			building: building,
			role: role,
		});
	}
	performNotificationSummaryAction(reqBody = {}) {
		return this.http.post(`${this.baseUrl}/accounts/perform-notification-summ-action`, reqBody);
	}

	getTaggedLocation(account_id=0) {
		return this.http.get<{
			buildings: Array<object>,
			locations: Array<object>
		}>(this.baseUrl + '/accounts/location-listing/', this.options)
	}

	getAccountRoleInLocation(locationIds=[]) {
		const assignedLocations = JSON.stringify(locationIds);
		const httpParams = new HttpParams().set('assignedLocations', assignedLocations);
		this.options['params'] = httpParams;
		return this.http.get<{account_roles:  object[]}>(`${this.baseUrl}/accounts/location/roles`, this.options);
	}

	acceptResignationFromConfirmation(userId=0, locationId = 0, configId = 0) {
		return this.http.post<{message: string}>(`${this.baseUrl}/accounts/accept-resignation-confirmation/`, {
			location_id: locationId,
			user_id: userId,
			notification_token_id: configId
		});

  }

  rejectResignationFromConfirmation(userId=0, locationId = 0, configId = 0) {
    return this.http.post<{message: string}>(`${this.baseUrl}/accounts/reject-resignation-confirmation/`, {
      location_id: locationId,
			user_id: userId,
			notification_token_id: configId
    });
	}
	
	listPeepForConfirmation(postBody:object={}) {
		return this.http.post<{
			building: object[],
			account_users: object[],
			emergency_users: object[]
		}>(`${this.baseUrl}/team/build-trp-peep-list/`, postBody);
	}

	permanentlyDeleteAccount(accountId=0) {
		return this.http.post<{
			message: string,
			status: string
		}>(`${this.baseUrl}/accounts/delete/`, {
			account:  accountId
		});
	}

	generateMyWardenList(archivedUsers?) {
		if (archivedUsers) {
			const httpParams = new HttpParams().set('archived', '1');
			this.options['params'] = httpParams;
			return this.http.get<{warden: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-warden-list/`, this.options);
		} else {
			return this.http.get<{warden: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-warden-list/`);
		}
		
	}

	generateMyGOFRList(archivedUsers?) {
		if (archivedUsers) {
			const httpParams = new HttpParams().set('archived', '1');
			this.options['params'] = httpParams;
			return this.http.get<{gofr: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-occupants-list/`, this.options);
		} else {
			return this.http.get<{gofr: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-occupants-list/`);
		}
		
	}

	generateAdminUserList(archivedUsers?) {
		if (archivedUsers) {
			this.options['params'] = {};
			const httpParams = new HttpParams().set('archived', '1');
			this.options['params'] = httpParams;
			return this.http.get<{account_users: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-admin-list/`, this.options);
		} else {
			return this.http.get<{account_users: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-admin-list/`);
		}
	}

	generatePeepList() {
		return this.http.get<{users: Object[], buildings: Object[]}>(`${this.baseUrl}/team/get-my-peep-list/`);
	}

}
