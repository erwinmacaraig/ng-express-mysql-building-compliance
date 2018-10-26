import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class LocationsService {

    private headers: Object;
    private options: Object;
    private baseUrl: String;
    public dataStore: Object;

    constructor(private http: HttpClient, platformLocation: PlatformLocation) {
        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
        this.baseUrl = (platformLocation as any).location.origin;
    }

    getByInIds(ids, callBack) {
        this.http.post(this.baseUrl + '/location/get-by-ids', { 'ids' : ids.join(',') }, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getById(id,  callBack, data?) {
        if(data){
            this.options['params'] = {};
            for(let i in data){
                this.options['params'][i] = data[i];
            }
        }
        this.http.get(this.baseUrl + '/location/get/' + id, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getByIdWithQueries(form, callBack) {
        this.options['params'] = form;
        this.http.get(this.baseUrl + '/location/get-with-queries', this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getDeepLocationsById(id, callBack) {
        this.http.get(this.baseUrl + '/location/get-deep-by-id/' + id, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getByAccountId(accountid, callBack) {
        this.http.get(this.baseUrl + '/location/get-by-account/' + accountid, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getLocationsByUserIdAndAccountId(opt, callBack){
        this.http.get(this.baseUrl+"/location/get-by-userid-accountid/"+opt.user_id+'/'+opt.account_id, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    searchForLocation(location: Object): Observable<any> {
        return this.http.post<any>(this.baseUrl + '/location/search-db-location/', location);
    }

    searchBuildings(key){
        return this.http.get<any>(this.baseUrl + '/location/search-buildings?key='+key);
    }

    searchLevels(key){
        return this.http.get<any>(this.baseUrl + '/location/search-levels?key='+key);
    }

    locationDataStore(location) {
        this.dataStore = location;
    }
    getDataStore(key?: string) {
        if (this.dataStore instanceof Array) {
            return this.dataStore;
        }
        if ( this.dataStore && (key in this.dataStore)) {
            return this.dataStore[key];
        }
        return '';
    }

    createSingleLocation(location: Object): Observable<any> {
        return this.http.post<any>(this.baseUrl + '/location/create', location);
    }

    createSubLocation(sublocation: Object): Observable<any>{
        return this.http.post<any>(this.baseUrl + '/sublocation/create', sublocation);
    }

    archiveLocation(oParam: Object): Observable<any>{
        return this.http.post<any>(this.baseUrl + '/location/archive', oParam);
    }

    archiveMultipleLocation(oParam: Object): Observable<any>{
        return this.http.post<any>(this.baseUrl + '/location/archive-multiple', oParam);
    }

    getParentLocationsForListing(accountid, callBack){
        this.http.get(this.baseUrl + '/location/get-parent-locations-by-account-id/', this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getParentLocationsForListingPaginated(formData, callBack){
        this.http.post(this.baseUrl + '/location/get-parent-locations-by-account-id-paginated', formData, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getArchivedParentLocationsForListing(accountid, callBack){
        this.http.get(this.baseUrl + '/location/get-archived-parent-locations-by-account-id/', { params : { account_id : accountid } })
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    getLocationsHierarchyByAccountId(accountid, callBack){
        this.http.get(this.baseUrl + '/location/get-locations-hierarchy-by-account-id', { params : { account_id : accountid } } )
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    checkUserVerified(param, callBack){
        this.http.post(this.baseUrl + '/location/check-user-verified', param, this.options)
        .subscribe(res => {
            callBack(res);
        }, err => {
            callBack( JSON.parse(err.error) );
        });
    }

    checkUserVerifiedInLocation() {
        return this.http.get<any>(this.baseUrl + '/location/user-verification', this.options);
    }

    assignSublocations(sublocations: number[]) {
        const subs = JSON.stringify(sublocations);
        return this.http.post<any>(this.baseUrl + '/location/assign-location', {
            'locIds': subs
        }, this.options);
    }

    getSublocationsOfParent(parentId){
        return this.http.get<any>(this.baseUrl + '/location/get-sublocations-of-parent/'+parentId, this.options);
    }

    updateLocation(formData){
        return this.http.post<any>(this.baseUrl + '/location/update', formData, this.options);
    }

    searchLocationHierarchy(key, isBuilding?){
        let url = this.baseUrl + '/location/search-locations-hierarchy/'+key;
        if(isBuilding){
            url+= '?building=true';
        }
        return this.http.get<any>(url, this.options);
    }

    addAccountToLocation(accountId, locationId){
        return this.http.post<any>(this.baseUrl + '/location/add-account', { location_id : locationId, account_id : accountId }, this.options);
    }

    removeAccountFromLocation(accountId, locationId){
        return this.http.post<any>(this.baseUrl + '/location/remove-account', { location_id : locationId, account_id : accountId }, this.options);
    }

    createBuildingAddAccount(form){
        return this.http.post<any>(this.baseUrl + '/location/create-building-add-account', form, this.options);
    }

    requestAddLocationToUser(form){
        return this.http.post(this.baseUrl + '/location/request/add-location-to-user', form, this.options);
    }
}
