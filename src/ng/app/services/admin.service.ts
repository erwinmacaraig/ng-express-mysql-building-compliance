import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var $: any;

@Injectable()
export class AdminService {
  private headers: Object;
  private options: Object;
  private baseUrl: String;

  constructor(private http: HttpClient, platformLocation: PlatformLocation) {
    this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
    this.options = { headers : this.headers };
    this.baseUrl = (platformLocation as any).location.origin;
  }

   getAccountListingForAdmin(page = 0, query = '', criteria = '') {
    let httpParams = new HttpParams().set('page_num', page.toString());

    if (query.length > 0) {
      // httpParams = httpParams.set('search_key', query);
      httpParams = new HttpParams().set('search_key', query);
    }
    if (criteria.length > 0) {
      httpParams = new HttpParams().set('criteria', 'all');
    }

    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/admin/accounts/list/', this.options);
  }

  getAccountInfo(accountId = 0) {
    return this.http.get(this.baseUrl + `/admin/account-information/${accountId}/`, this.options);
  }

  getAllAccountUsers(accountId: number = 0, page: number = 0, query = '') {
    let httpParams = new HttpParams().set('page_num', page.toString());
    if (query.length > 0) {
      httpParams = httpParams.set('search_key', query);
    }
    return this.http.get(this.baseUrl + `/admin/account-users/${accountId}/`, {'params':  httpParams});
  }

  getAllLocationsOnAccount(accountId: number = 0) {
    return this.http.get(this.baseUrl + `/admin/location-listing/${accountId}/`, this.options);
  }

  submitNewUsers(users: string) {
    return this.http.post(this.baseUrl + '/admin/add-new-user/', {'users': users}, this.options);
  }

  uploadComplianceDocs(formData) {
    return this.http.post(this.baseUrl + '/admin/upload/compliance-documents/', formData );
  }

  taggedLocationsOnAccount(accountId: number = 0) {
    return this.http.get(this.baseUrl + `/admin/account-locations/${accountId}/`, this.options);
  }

  getKPIS() {
    return this.http.get(this.baseUrl + `/admin/compliance/kpis/`, this.options);
  }

  getDocumentList(account: number = 0, location: number = 0, kpi: number = 0) {
    const httpParams = new HttpParams().set('account', account.toString())
                     .set('location', location.toString())
                     .set('kpi', kpi.toString());
    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/admin/list/compliance-documents/', this.options);
  }

  FSA_EvacExer_Status(account: string = '0', location: string = '0', kpi: string = '0', ctrl: string = 'get', stat?: string) {
    let httpParams = new HttpParams()
                       .set('building_id', location)
                       .set('account_id', account)
                       .set('compliance_kpis_id', kpi)
                       .set('ctrl',  ctrl);

    if (stat) {
      httpParams = httpParams.set('compliance_status', stat);
    }

    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/admin/compliance/FSA-EvacExer/', this.options);
  }

  getLocationDetails(location: number | string) {
    return this.http.get(this.baseUrl + `/admin/get/location-details/${location}/`, this.options);
  }

  getAccountSublocations(parent: number | string) {
    return this.http.get(this.baseUrl + `/admin/account-sublocations/${parent}/`, this.options);
  }

  searchLocationByName(name: string, params?) {
    let httpParams = {};

    httpParams['name'] = name;

    if(params){
        for(let i in params){
            httpParams[i] = params[i];
        }
    }

    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + '/admin/location/search/', this.options);
  }

  getLocationLevelUsers(parent_location_id: string) {
    const httpParams = new HttpParams().set('location', parent_location_id);
    this.options['params'] = httpParams;
    return this.http.get(this.baseUrl + `/admin/training-validation-location-users/`, this.options);
  }

  getTrainingRequirementList() {
    return this.http.get(`${this.baseUrl}/admin/list/training-requirements/`, this.options);
  }

  validateUserTrainings(users: string) {
    return this.http.post(`${this.baseUrl}/admin/validate-training/`, {users: users}, this.options);
  }

  getAccountTrainings(id){
      return this.http.get(`${this.baseUrl}/admin/account/trainings/`+id, this.options);
  }

  getHierarchyLocationsOnAccount(accountId){
      return this.http.get(`${this.baseUrl}/admin/account/location-heirarchy/`+accountId, this.options);
  }

  setAccountUserTraining(userId, courseId, trid) {
    return this.http.post(`${this.baseUrl}/admin/assign-user-training/`,
    {'userId': userId, 'courseId': courseId, 'trid': trid}
    , this.options);
  }

  setTrainingToAccountRoles(accountId, courseId, trid, role) {
    return this.http.post(`${this.baseUrl}/admin/assign-account-roles-training/`,
      {'accountId': accountId,
       'courseId': courseId,
       'trid': trid,
       'role': role
      }, this.options
    );
  }

  createTrainingRecordForAccount(account, course, role, trid) {
    return this.http.post(`${this.baseUrl}/admin/create-training-for-account/`,
      {
        account: account,
        course: course,
        role: role,
        trid: trid
      },
      this.options
    );
  }

  toggleOnlineTrainingAccess(reqBody = {}) {
    return this.http.post(`${this.baseUrl}/admin/assign-default-training/`,reqBody, this.options);
  }

  generateAdminReport(form: Object) {
      return this.http.post(`${this.baseUrl}/admin/generate-admin-report`, form);
  }

  createAccount(reqBody = {}) {
    return this.http.post(`${this.baseUrl}/admin/new/account/`, reqBody);
  }

}

