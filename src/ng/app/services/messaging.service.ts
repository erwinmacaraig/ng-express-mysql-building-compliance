/**
 * This component will allow any component to send data and
 * information with other component in the application
 */

 import { Injectable } from '@angular/core';
 import { Observable } from 'rxjs/Observable';
 import { Subject } from 'rxjs/Subject';

 @Injectable()
 export class MessageService {
  private subject = new Subject<any>();

  constructor() {}

  /*
   * Sends data of type object
   * to any component thru this service
   */
  sendMessage(data: any) {
    this.subject.next(data);
  }

  clearMessage() {
    this.subject.next();
  }

  /*
   * Get message thru an observable
   *
   *
   */
  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }



 }
