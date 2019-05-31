import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PlatformLocation } from '@angular/common';
import { Observable } from 'rxjs/Rx';
import { AuthService } from './auth.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';


@Injectable()
export class LocationsService {

    private headers: Object;
    private options: Object;
    private baseUrl: String;
    public dataStore: Object;

    constructor(private http: HttpClient, platformLocation: PlatformLocation, private authService: AuthService) {
        this.headers = new HttpHeaders({ 'Content-type' : 'application/json' });
        this.options = { headers : this.headers };
        
		this.baseUrl = environment.backendUrl;
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

    searchBuildings(key, params = {}){
        let opt = this.options;
        opt['params'] = params;
        return this.http.get<any>(this.baseUrl + '/location/search-buildings?key='+key, opt);
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

    getParentLocationsForListing(accountid, callBack, params={}){
        let opt = this.options;
        opt['params'] = params;
        this.http.get(this.baseUrl + '/location/get-parent-locations-by-account-id/', opt)
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
            console.log(JSON.parse(err.error));
            if (err.error == 'Not Authenticated') {
                this.authService.logout();
            }
            callBack( JSON.parse(err.error) );
        }, () => {
            console.log('Request done - getting parent locations for listing paginated');
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

    getLevelsOfBuilding(buildingId = 0) {
        return this.http.post<Array<{
            parent_id: number,
            name: string,
            unit: string,
            street: string,
            city: string,
            state: string,
            postal_code: string,
            country: string,
            formatted_address: string,
            lat: string,
            lng: string,
            time_zone: string,
            location_id: number,
            order: number,
            is_building: number,
            location_directory_name: string,
            archive: number,
            google_place_id: string,
            google_photo_url: string,
            admin_verified: string,
            admin_verified_date: string,
            admin_id: number,
            online_training: number
        }>>(this.baseUrl + '/location/get-building-levels/', {building: buildingId});
    }
    
    public getLocationInformation(locationId=0) {
        return this.http.post<{
            parent_id: number,
            name: string,
            unit: string,
            street: string,
            city: string,
            state: string,
            postal_code: string,
            country: string,
            formatted_address: string,
            lat: string,
            lng: string,
            time_zone: string,
            location_id: number,
            order: number,
            is_building: number,
            location_directory_name: string,
            archive: number,
            google_place_id: string,
            google_photo_url: string,
            admin_verified: string,
            admin_verified_date: string,
            admin_id: number,
            online_training: number
        }>(this.baseUrl + '/location/get-info/', {location: locationId})
    }

    public taggedLocationsForTRPInBuilding(user=0, building=0) {
        return this.http.post<Array<{
            parent_id: number,
            name: string,
            unit: string,
            street: string,
            city: string,
            state: string,
            postal_code: string,
            country: string,
            formatted_address: string,
            lat: string,
            lng: string,
            time_zone: string,
            location_id: number,
            order: number,
            is_building: number,
            location_directory_name: string,
            archive: number,
            google_place_id: string,
            google_photo_url: string,
            admin_verified: string,
            admin_verified_date: string,
            admin_id: number,
            online_training: number
        }>>(this.baseUrl + '/location/list-levels-for-trp', {user: user, building: building});
    }

    public updateLocationDetails(details={}) {
        return this.http.post(`${this.baseUrl}/location/location-details-update`, details);
    }

    public generateArchivedLocationList() {
        return this.http.get<{
            message: string,
            archives: Object[]
        }>(`${this.baseUrl}/location/list-archived-locations/`);
    }

    public permanentlyDeleteLocation(locationId) {
        return this.http.post(`${this.baseUrl}/location/delete/`, {location_id: locationId});
    }
}
