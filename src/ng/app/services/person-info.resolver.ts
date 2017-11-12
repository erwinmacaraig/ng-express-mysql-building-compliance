import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Person } from '../models/person.model';
import { PersonDataProviderService } from './person-data-provider.service';

@Injectable()
export class PersonInfoResolver implements Resolve<Person> {
  constructor(private personDataProviderService: PersonDataProviderService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Person> {
    return this.personDataProviderService.getPersonInfo();
  }
}

@Injectable()
export class FRPListResolver implements Resolve<any> {
  constructor(private personDataProviderService: PersonDataProviderService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    let account = 0;
    if (route.queryParams['account']) {
      account = route.queryParams['account'];
    }
    return this.personDataProviderService.listAllFRP(account);
  }
}

@Injectable()
export class TRPListResolver implements Resolve<any> {
  constructor(private personDataProviderService: PersonDataProviderService) { }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    let account = 0;
    let location = 0;
    if (route.queryParams['account']) {
      account = route.queryParams['account'];
    }
    if (route.queryParams['location']) {
      location = route.queryParams['location'];
    }
    return this.personDataProviderService.listAllTRP(location, account);
  }
}
