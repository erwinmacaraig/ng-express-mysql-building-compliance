import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../../environments/environment';
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
    
	this.baseUrl = environment.backendUrl;
	}

	requestLocationUpdate(postBody={}){
		return this.http.post(this.baseUrl + '/eco-user/request-update-location', postBody);
	}

	requestAccountUserLocationUpdate(postBody={}) {
		return this.http.post<{message: string, assigned_locations: object[]}>(`${this.baseUrl}/account-user/request-update-location`, postBody);
	}

	checkUserIsAdmin(userId, callBack){
		this.http.get(this.baseUrl+"/users/is-admin/"+userId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	update(formData, callBack){
		this.http.post(this.baseUrl+"/users/update", formData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	sendInfoGraphic() {
		return this.http.get<{message: string}>(this.baseUrl + '/mail-info-graphic', this.options);
	}

	uploadProfilePicture(formData){
		/*
		this.http.post(this.baseUrl+"/users/upload-profile-picture", formData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
		*/
		return this.http.post(this.baseUrl+"/users/upload-profile-picture", formData); 
	}

	checkUserVerified(userId, callBack){
		this.http.post(this.baseUrl+"/users/check-is-verified", { user_id : userId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getRoles(userId){
		return this.http.get(this.baseUrl+"/users/get-roles/"+userId);
	}

	queryUsers(queries, callBack){
		let params = '',
			count = 0;
		if(typeof queries == 'object'){
			for(let i in queries){
				if( count == 0 ){
					params += '?'+i+'='+queries[i];
				}else{
					params += '&'+i+'='+queries[i];
				}
				count++;
			}
		}

		this.http.get(this.baseUrl+"/users/query"+params,)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getUsersByAccountId(accountId, callBack){
		this.http.get(this.baseUrl+"/users/get-users-by-account-id/"+accountId,)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getUsersByAccountIdNoneAuth(accountId, callBack){
		this.http.get(this.baseUrl+"/users/get-users-by-account-none-auth/"+accountId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getUserLocationTrainingsEcoRoles(userId, callBack){
		this.http.get(this.baseUrl+"/users/get-user-locations-trainings-ecoroles/"+userId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	archiveUsers(userIds, callBack){
		this.http.post(this.baseUrl+"/users/archive-users", { user_ids : userIds })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	unArchiveUsers(userIds, callBack){
		this.http.post(this.baseUrl+"/users/unarchive-users", { user_ids : userIds })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	archiveInvitedUsers(invitedUserIds, callBack){
		this.http.post(this.baseUrl+"/users/archive-invited-users", { ids : invitedUserIds })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	unArchiveInvitedUsers(invitedUserIds, callBack){
		this.http.post(this.baseUrl+"/users/unarchive-invited-users", { ids : invitedUserIds })
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

	removeUserFromLocation(locAccUserId, callBack){
		this.http.post(this.baseUrl+"/users/remove-user-from-location", { location_account_user_id : locAccUserId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	getMyWardenTeam(data){
		return this.http.post(this.baseUrl+"/users/get-my-warden-team", data);
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

	resignAsChiefWarden(userId, callBack){
		this.http.post(this.baseUrl+"/users/resign-as-chief-warden", { user_id : userId })
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	resignAsWarden(formData, callBack){
		this.http.post(this.baseUrl+"/users/resign-as-warden", formData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

	sendMobilityImpaireInformation(formData, callBack){
		this.http.post(this.baseUrl+"/users/mobility-impaired-info", formData)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( JSON.parse(err.error) );
		});
	}

    markAsHealthy(formData, callBack){
        this.http.post(this.baseUrl+"/users/mobility-as-healthy", formData)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

	getTenantsInLocation(locId, callBack){
		this.http.get(this.baseUrl+"/users/get-tenants/"+locId)
		.subscribe(res => {
			callBack(res);
		}, err => {
			callBack( false );
		});
    }

    sendTRPInvitation(trpInfo: object = {}) {
        const body = {};
        body['tenancy_name'] = ('account_name' in trpInfo) ? trpInfo['account_name'] : '';
        body['email'] = ('email' in trpInfo) ? trpInfo['email'] : '';
        body['first_name'] = ('key_contact_name' in trpInfo) ? trpInfo['key_contact_name'] : '';
        body['last_name'] = ('key_contact_lastname' in trpInfo) ? trpInfo['key_contact_lastname'] : '';
        body['location_id'] = ('location_id' in trpInfo) ? trpInfo['location_id'] : 0;

        return this.http.post<any>(this.baseUrl + '/users/send-trp-invitation/', body);

    }

    getAllLocationsForUser() {
        return this.http.get(this.baseUrl + '/users/get-all-locations/', this.options);
    }

    emailCertificate(userId = 0, certId = 0) {
        return this.http.post<any>(this.baseUrl + '/users/email-certificate/',{
            'userId': userId,
            'certId': certId
        });
    }

    getEmUserDashboardInfo() {
        return this.http.get(this.baseUrl + '/users/em/dashboard/', this.options);
    }

    userLocationRoleAssignments(formData, callBack){
        this.http.post(this.baseUrl+"/users/location-role-assignment", formData)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    changePassword(formData){
        return this.http.post(this.baseUrl+"/users/change-password", formData);
    }

    updateNotificationSettings(formData){
        return this.http.post(this.baseUrl+"/users/update-notification-settings", formData);
    }

    getNotificationToken(userId = 0) {
        return this.http.get(this.baseUrl + '/users/get-notification-token/'+userId, this.options);
	}
	
	userInfo(userId=0) {
		return this.http.post<{
			user_id: number,
			first_name: string,
			last_name: string,
			email: string,
			phone_number: string,
			mobile_number: string,
			mobility_impaired: number, 
			evac_role: string
		}>(this.baseUrl + '/users/user-info/', {user: userId});
	}

	updateLocationAccountUser(location_account_user_id = 0, level_location = 0) {
		return this.http.post<{message: string}>(this.baseUrl + '/users/update-trp-assigned-location', {
			location_account_user: location_account_user_id,
			level_location: level_location
		});
	}

	getTrainingData(userId=0, emergencyRoles=[]) {
		const roles = JSON.stringify(emergencyRoles);
		return this.http.post<{
			message: string,
			required_trainings: Array<object>,
			valid_trainings: Array<object>
			invalid_trainings: Array<object>
		}>(this.baseUrl + '/users/training-info', {
			user: userId,
			roles: roles
		});
	}

    getEmRoles() {
        return this.http.get(this.baseUrl + '/users/emroles', this.options);
	}

	userTrainingInfo(userId=0) {
		let httpParams: HttpParams = new HttpParams().set('userId', userId.toString());
		this.options['params'] = httpParams;
		return this.http.get<{
			message: string,
			userInfoTraining: Array<object>,
			userInfoOtherTraining: Array<object>,
			emRolesLocation: Array<object>,
			certificates: Array<object>,
			myEmRoleIds: Array<object>,
			overWriteNonWardenRoleTrainingModules: boolean,
			isWardenRoleArray: Array<number>,
			nonWardenRolesArray: Array<number>
		}>(this.baseUrl + '/users/all-training-info', this.options);
	}

    computeUserRewardPoints(uid = 0) {
        return this.http.get<{message: string, total_points: number}>(this.baseUrl + '/users/get-reward-points/' + uid, this.options);
	}
	
	verifyAsWarden(configId=0) {
		const httpParams = new HttpParams().set('configId', configId.toString());
		this.options['params'] = httpParams;
		return this.http.get<{
			message: string,
			config: object,
			token: object
		}>(this.baseUrl+'/accounts/verify-as-warden', this.options);

	}

	updateWardenProfile(profile={}) {
		return this.http.post(`${this.baseUrl}/users/update-warden-profile/`, profile);
	}

	generateConfirmationWardenList(postBody={}) {
		return this.http.post<{list: object[], building: object[]}>(`${this.baseUrl}/team/build-eco-team-list/`, postBody);
	}

	permanentlyDeleteUser(userId=0) {
		return this.http.post(`${this.baseUrl}/users/delete-permanently/`, {user: userId});
	}

	getGofrInLocation(locId){
		return this.http.get<{message: string, data: Object[]}>(this.baseUrl+"/users/get-gofr/"+locId);
		
	}
	listUserAccountLocations() {
		return this.http.get<{
			trp_locations: number[],
			frp_locations: number[],
			locations: object[]
		}>(`${this.baseUrl}/users/location-listing/`);
	}
}
