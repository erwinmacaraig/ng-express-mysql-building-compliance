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
