import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class UserService {

	private headers: Object;
  	private options: Object;
	private baseUrl: String;

	constructor(private http: HttpClient, platformLocation: PlatformLocation) {
		this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    	this.options = { headers : this.headers };
		this.baseUrl = (platformLocation as any).location.origin;
	}

	uploadProfilePicture(formData, callBack){
		this.http.post(this.baseUrl+"/users/upload-profile-picture", formData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	checkUserVerified(userId, callBack){
		this.http.post(this.baseUrl+"/users/check-is-verified", { user_id : userId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getRoles(userId, callBack){
		this.http.get(this.baseUrl+"/users/get-roles/"+userId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getUsersByAccountId(accountId, callBack){
		this.http.get(this.baseUrl+"/users/get-users-by-account-id/"+accountId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getUserLocationTrainingsEcoRoles(locationAcoountUserId, callBack){
		this.http.get(this.baseUrl+"/users/get-user-locations-trainings-ecoroles/"+locationAcoountUserId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	archiveLocationUser(locAccntUserId, callBack){
		this.http.post(this.baseUrl+"/users/archive-location-account-user", { location_account_user_id : locAccntUserId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getArchivedUsersByAccountId(accountId, callBack){
		this.http.get(this.baseUrl+"/users/get-archived-users-by-account-id/"+accountId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	unArchiveLocationUser(locAccntUserId, callBack){
		this.http.post(this.baseUrl+"/users/unarchive-location-account-user", { location_account_user_id : locAccntUserId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	createBulkUsers(arrUsers, callBack){
		this.http.post(this.baseUrl+"/users/create-bulk-users", { users : JSON.stringify(arrUsers) })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	removeUserAsWarden(userId, callBack){
		this.http.post(this.baseUrl+"/users/remove-user-as-warden", { user_id : userId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getMyWardenTeam(data, callBack){
		this.http.post(this.baseUrl+"/users/get-my-warden-team", data)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	requestAsWarden(requestData, callBack){
		this.http.post(this.baseUrl+"/users/request-as-warden", requestData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getWardenRequest(userId, callBack){
		this.http.post(this.baseUrl+"/users/get-warden-request", { user_id : userId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

}
